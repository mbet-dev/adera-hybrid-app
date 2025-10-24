-- Adera Hybrid App - User Profile Management Trigger
-- Automatically creates or updates user profile in users table

-- ============================================
-- USER PROFILE MANAGEMENT TRIGGER FUNCTION
-- ============================================
-- This function is triggered on user creation or email confirmation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_metadata JSONB;
  user_role TEXT;
  existing_user RECORD;
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
    SELECT id INTO existing_user FROM public.users WHERE id = NEW.id;
    
    IF existing_user IS NULL THEN
      -- Create new user profile
      INSERT INTO public.users (
        id, email, phone, role, first_name, last_name, is_verified, is_active, created_at, updated_at
      ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(user_metadata->>'phone', NULL),
        user_role::user_role,
        COALESCE(user_metadata->>'first_name', NULL),
        COALESCE(user_metadata->>'last_name', NULL),
        false, -- Not verified on creation
        true,  -- Active by default
        NOW(),
        NOW()
      );
      
      -- Log the user creation
      RAISE LOG 'Created user profile for % with role %', NEW.email, user_role;
    ELSE
      -- User already exists, just update metadata if needed
      UPDATE public.users 
      SET 
        email = NEW.email,
        updated_at = NOW()
      WHERE id = NEW.id;
      
      RAISE LOG 'User profile already exists for %, updated email', NEW.email;
    END IF;

  -- On user email confirmation (UPDATE)
  ELSIF TG_OP = 'UPDATE' AND NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- First, ensure the user profile exists. If not, create it.
    -- This is a fallback for edge cases where the INSERT trigger might have failed.
    INSERT INTO public.users (
      id, email, phone, role, first_name, last_name, is_verified, is_active, created_at, updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE((NEW.raw_user_meta_data->>'phone'), NULL),
      COALESCE((NEW.raw_user_meta_data->>'role'), 'customer')::user_role,
      COALESCE((NEW.raw_user_meta_data->>'first_name'), NULL),
      COALESCE((NEW.raw_user_meta_data->>'last_name'), NULL),
      true,
      true,
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO UPDATE
    SET
      email = NEW.email,
      is_verified = true,
      updated_at = NOW();

    -- Get user role for personalized welcome message
    SELECT role INTO user_role FROM public.users WHERE id = NEW.id;
    user_role := COALESCE(user_role, 'customer');

    -- Create the welcome notification
    INSERT INTO public.notifications (user_id, title, body, type, created_at)
    VALUES (
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
    );
    
    RAISE LOG 'Email confirmed for user % with role %', NEW.email, user_role;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the transaction
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE THE TRIGGER
-- ============================================
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_or_confirmed ON auth.users;

-- Create trigger on auth.users table for INSERT or UPDATE
CREATE TRIGGER on_auth_user_created_or_confirmed
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
-- Grant necessary permissions for the trigger function
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT SELECT, INSERT, UPDATE ON public.users TO supabase_auth_admin;
GRANT INSERT ON public.notifications TO supabase_auth_admin;
