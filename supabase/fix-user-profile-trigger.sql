-- ============================================
-- FIX SCRIPT: User Profile Trigger - No ALTER TABLE Version
-- ============================================
-- This version does NOT require table ownership permissions
-- It only fixes RLS policies, permissions, and the trigger function
-- Idempotent: Safe to run multiple times
-- ============================================

-- STEP 1: Check users table structure (informational only)
-- ============================================
-- Note: We cannot alter table structure without ownership permissions
-- The trigger function will handle providing explicit id values, which overrides any default
-- PostgreSQL allows explicit values even when a column has a DEFAULT

DO $$
DECLARE
  v_id_default TEXT;
  v_phone_nullable BOOLEAN;
  v_missing_columns TEXT[];
  v_col TEXT;
BEGIN
  -- Check id default
  SELECT column_default INTO v_id_default
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'id';
  
  IF v_id_default IS NOT NULL AND (v_id_default LIKE '%gen_random_uuid%' OR v_id_default LIKE '%uuid_generate%') THEN
    RAISE NOTICE 'Note: id column has default %, but trigger will provide explicit id from auth.users (this is OK)', v_id_default;
  END IF;
  
  -- Check if phone is nullable
  SELECT is_nullable = 'YES' INTO v_phone_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name = 'phone';
  
  IF NOT v_phone_nullable THEN
    RAISE WARNING 'Warning: phone column is NOT NULL. If trigger inserts NULL, this may cause errors.';
  END IF;
  
  -- Check for missing optional columns
  v_missing_columns := ARRAY[]::TEXT[];
  FOR v_col IN SELECT unnest(ARRAY['profile_picture', 'city', 'country', 'postal_code', 'date_of_birth', 'language_preference', 'notification_preference', 'account_status', 'last_login'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = v_col
    ) THEN
      v_missing_columns := array_append(v_missing_columns, v_col);
    END IF;
  END LOOP;
  
  IF array_length(v_missing_columns, 1) > 0 THEN
    RAISE NOTICE 'Optional columns missing (trigger will skip these): %', array_to_string(v_missing_columns, ', ');
  END IF;
END $$;

-- STEP 2: Fix RLS Policies to allow trigger function to work
-- ============================================

-- CRITICAL: The trigger runs as supabase_auth_admin role with SECURITY DEFINER
-- But RLS policies still apply! The policy 'users_own_data' uses auth.uid() = id
-- When the trigger runs, there's no authenticated user, so auth.uid() is NULL
-- This causes the policy to block the insert.

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS users_supabase_auth_admin_insert ON public.users;
DROP POLICY IF EXISTS users_supabase_auth_admin_all ON public.users;
DROP POLICY IF EXISTS users_supabase_auth_admin_select ON public.users;
DROP POLICY IF EXISTS users_supabase_auth_admin_update ON public.users;

-- Create comprehensive policy for supabase_auth_admin to do everything
-- This allows the trigger (running as supabase_auth_admin) to INSERT, SELECT, UPDATE
-- The policy must allow all operations without checking auth.uid()
CREATE POLICY users_supabase_auth_admin_all ON public.users
  FOR ALL
  TO supabase_auth_admin
  USING (true)
  WITH CHECK (true);

-- Note: RLS should already be enabled on the users table
-- If you need to enable it manually, run: ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- (This may require table ownership, but RLS is typically already enabled)

-- STEP 3: Grant necessary permissions (if we have permission to grant)
-- ============================================
-- Note: These grants may fail if you don't have permission to grant to supabase_auth_admin
-- That's OK - the permissions might already exist or be set by a superuser
-- The critical fix is the RLS policy above

DO $$
BEGIN
  -- Try to grant permissions, but don't fail if we can't
  BEGIN
    GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
    RAISE NOTICE 'Granted schema usage to supabase_auth_admin';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not grant schema usage (may already be granted or require higher privileges): %', SQLERRM;
  END;
  
  BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO supabase_auth_admin;
    RAISE NOTICE 'Granted permissions on users table to supabase_auth_admin';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not grant permissions on users table (may already be granted): %', SQLERRM;
  END;
  
  BEGIN
    GRANT SELECT, INSERT, UPDATE ON public.notifications TO supabase_auth_admin;
    RAISE NOTICE 'Granted permissions on notifications table to supabase_auth_admin';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not grant permissions on notifications table (may already be granted): %', SQLERRM;
  END;
  
  BEGIN
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
    RAISE NOTICE 'Granted sequence permissions to supabase_auth_admin';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not grant sequence permissions (may not be needed): %', SQLERRM;
  END;
END $$;

-- STEP 4: Recreate the trigger function with better error handling
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_metadata JSONB;
  user_role TEXT;
  existing_user RECORD;
  v_error_text TEXT;
BEGIN
  -- On new user signup (INSERT)
  IF TG_OP = 'INSERT' THEN
    user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    user_role := COALESCE(user_metadata->>'role', 'customer');
    
    -- Validate role
    IF user_role NOT IN ('customer', 'partner', 'driver', 'staff', 'admin') THEN
      user_role := 'customer';
    END IF;
    
    -- Check if user already exists (race condition protection)
    BEGIN
      SELECT id INTO existing_user FROM public.users WHERE id = NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        existing_user := NULL;
    END;
    
    IF existing_user IS NULL THEN
      -- Create new user profile
      -- Note: Only insert columns that exist in the table
      -- Explicit id value overrides any DEFAULT constraint
      BEGIN
        -- Try full insert first with core columns that should exist
        INSERT INTO public.users (
          id, 
          email, 
          role, 
          first_name, 
          last_name, 
          is_verified, 
          is_active, 
          created_at, 
          updated_at,
          phone
        ) VALUES (
          NEW.id,  -- Explicit id from auth.users (overrides DEFAULT)
          NEW.email,
          user_role::user_role,
          COALESCE(user_metadata->>'first_name', NULL),
          COALESCE(user_metadata->>'last_name', NULL),
          false,
          true,
          COALESCE(NEW.created_at, NOW()),
          NOW(),
          COALESCE(NULLIF(user_metadata->>'phone', ''), NULL)
        );
        
        -- Log success
        RAISE LOG 'Successfully created user profile for % (id: %) with role %', NEW.email, NEW.id, user_role;
      EXCEPTION
        WHEN undefined_column THEN
          -- Column doesn't exist - try minimal insert with only core columns
          v_error_text := SQLERRM;
          RAISE WARNING 'Column error for user % (id: %): %. Attempting minimal insert...', NEW.email, NEW.id, v_error_text;
          
          BEGIN
            INSERT INTO public.users (id, email, role, is_verified, is_active, created_at, updated_at)
            VALUES (NEW.id, NEW.email, user_role::user_role, false, true, COALESCE(NEW.created_at, NOW()), NOW());
            RAISE LOG 'Created minimal user profile for % (id: %)', NEW.email, NEW.id;
          EXCEPTION
            WHEN OTHERS THEN
              v_error_text := SQLERRM;
              RAISE WARNING 'Failed to create even minimal user profile for % (id: %): %', NEW.email, NEW.id, v_error_text;
              -- Don't re-raise - allow auth.users insert to succeed
          END;
        WHEN OTHERS THEN
          -- Log other errors
          v_error_text := SQLERRM;
          RAISE WARNING 'Failed to create user profile for % (id: %): %', NEW.email, NEW.id, v_error_text;
          -- Don't re-raise - allow auth.users insert to succeed even if profile creation fails
      END;
    ELSE
      -- User already exists, just update metadata if needed
      BEGIN
        UPDATE public.users 
        SET 
          email = NEW.email,
          updated_at = NOW()
        WHERE id = NEW.id;
        
        RAISE LOG 'User profile already exists for % (id: %), updated email', NEW.email, NEW.id;
      EXCEPTION
        WHEN OTHERS THEN
          v_error_text := SQLERRM;
          RAISE WARNING 'Failed to update user profile for % (id: %): %', NEW.email, NEW.id, v_error_text;
      END;
    END IF;

  -- On user email confirmation (UPDATE)
  ELSIF TG_OP = 'UPDATE' AND NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Ensure the user profile exists (fallback for edge cases)
    BEGIN
      INSERT INTO public.users (id, email, role, is_verified, is_active, created_at, updated_at, phone)
      VALUES (
        NEW.id,
        NEW.email,
        COALESCE((NEW.raw_user_meta_data->>'role'), 'customer')::user_role,
        true,
        true,
        COALESCE(NEW.created_at, NOW()),
        NOW(),
        COALESCE(NULLIF((NEW.raw_user_meta_data->>'phone'), ''), NULL)
      ) ON CONFLICT (id) DO UPDATE
      SET
        email = NEW.email,
        is_verified = true,
        updated_at = NOW();
    EXCEPTION
      WHEN OTHERS THEN
        v_error_text := SQLERRM;
        RAISE WARNING 'Failed to create/update user profile on email confirmation for % (id: %): %', NEW.email, NEW.id, v_error_text;
    END;

    -- Get user role for welcome notification
    BEGIN
      SELECT role INTO user_role FROM public.users WHERE id = NEW.id;
      user_role := COALESCE(user_role, 'customer');
    EXCEPTION
      WHEN OTHERS THEN
        user_role := 'customer';
    END;

    -- Create welcome notification
    BEGIN
      INSERT INTO public.notifications (user_id, title, body, type, created_at)
      SELECT 
        NEW.id,
        'Welcome to Adera! 🇪🇹',
        CASE 
          WHEN user_role = 'customer' THEN 'Start sending and receiving parcels across Addis Ababa!'
          WHEN user_role = 'partner' THEN 'Welcome to the Adera partner network! Set up your pickup/dropoff point.'
          WHEN user_role = 'driver' THEN 'Ready to start delivering? Check your task list for available deliveries.'
          ELSE 'Welcome to Adera! Your account is now active.'
        END,
        'system',
        NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE user_id = NEW.id 
        AND title = 'Welcome to Adera! 🇪🇹'
        AND type = 'system'
      );
    EXCEPTION
      WHEN OTHERS THEN
        v_error_text := SQLERRM;
        RAISE WARNING 'Failed to create welcome notification for % (id: %): %', NEW.email, NEW.id, v_error_text;
    END;
    
    RAISE LOG 'Email confirmed for user % (id: %) with role %', NEW.email, NEW.id, user_role;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error with full context
    v_error_text := SQLERRM;
    RAISE WARNING 'Error in handle_new_user trigger for user % (id: %), operation %: %', 
      COALESCE(NEW.email, 'unknown'), 
      COALESCE(NEW.id::text, 'unknown'), 
      TG_OP, 
      v_error_text;
    -- Return NEW to allow auth.users insert/update to succeed
    -- The trigger failure shouldn't prevent user creation
    RETURN NEW;
END;
$$;

-- STEP 5: Recreate the trigger
-- ============================================

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created_or_confirmed ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created_or_confirmed
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: Verify trigger is enabled
-- ============================================

-- Note: Trigger is enabled by default when created
-- If you need to enable it manually, run: ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created_or_confirmed;
-- (This may require special permissions, but triggers are typically enabled by default)

-- STEP 7: Test the setup (optional - creates a test log entry)
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'User profile trigger fix completed successfully!';
  RAISE NOTICE 'Trigger: on_auth_user_created_or_confirmed';
  RAISE NOTICE 'Function: handle_new_user()';
  RAISE NOTICE 'RLS Policy: users_supabase_auth_admin_all';
  RAISE NOTICE 'Next step: Test by creating a new user via signup';
  RAISE NOTICE 'Note: If columns are missing, the trigger will create a minimal profile with core fields only';
END $$;
