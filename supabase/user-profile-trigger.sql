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
BEGIN
  -- On new user signup (INSERT)
  IF TG_OP = 'INSERT' THEN
    user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
    user_role := COALESCE(user_metadata->>'role', 'customer');
    
    IF user_role NOT IN ('customer', 'partner', 'driver', 'staff', 'admin') THEN
      user_role := 'customer';
    END IF;
    
    INSERT INTO public.users (
      id, email, phone, role, first_name, last_name, is_verified, is_active
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(user_metadata->>'phone', NULL),
      user_role::user_role,
      COALESCE(user_metadata->>'first_name', NULL),
      COALESCE(user_metadata->>'last_name', NULL),
      false, -- Not verified on creation
      true   -- Active by default
    )
    ON CONFLICT (id) DO NOTHING; -- If user already exists, do nothing. The UPDATE part will handle verification.

  -- On user email confirmation (UPDATE)
  ELSIF TG_OP = 'UPDATE' AND NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- First, ensure the user profile exists. If not, create it.
    -- This is a fallback for edge cases where the INSERT trigger might have failed.
    INSERT INTO public.users (id, email, is_verified, is_active)
    VALUES (NEW.id, NEW.email, true, true)
    ON CONFLICT (id) DO UPDATE
    SET is_verified = true, updated_at = NOW();

    -- Then, create the welcome notification
    INSERT INTO public.notifications (user_id, title, body, type)
    SELECT
      NEW.id,
      'Welcome to Adera! 🇪🇹',
      CASE 
        WHEN u.role = 'customer' THEN 'Start sending and receiving parcels across Addis Ababa!'
        WHEN u.role = 'partner' THEN 'Welcome to the Adera partner network! Set up your pickup/dropoff point.'
        WHEN u.role = 'driver' THEN 'Ready to start delivering? Check your task list for available deliveries.'
        ELSE 'Welcome to Adera! Your account is now active.'
      END,
      'system'
    FROM public.users u
    WHERE u.id = NEW.id;
  END IF;
  
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
