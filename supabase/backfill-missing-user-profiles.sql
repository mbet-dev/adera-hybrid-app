-- ============================================
-- BACKFILL SCRIPT: Create missing user profiles
-- ============================================
-- This script creates user profiles in public.users for users that exist
-- in auth.users but not in public.users
-- ============================================

-- First, let's see which users are missing
SELECT 
  'Users in auth.users but not in public.users:',
  COUNT(*) as missing_count
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Create user profiles for missing users
-- This uses the same logic as the trigger function
INSERT INTO public.users (
  id,
  email,
  phone,
  role,
  first_name,
  last_name,
  is_verified,
  is_active,
  created_at,
  updated_at,
  profile_picture,
  address,
  city,
  country,
  postal_code,
  date_of_birth,
  language_preference,
  notification_preference,
  account_status,
  last_login
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'phone', NULL) as phone,
  COALESCE(
    (au.raw_user_meta_data->>'role')::user_role,
    'customer'::user_role
  ) as role,
  COALESCE(au.raw_user_meta_data->>'first_name', NULL) as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', NULL) as last_name,
  COALESCE(au.email_confirmed_at IS NOT NULL, false) as is_verified,
  true as is_active,
  COALESCE(au.created_at, NOW()) as created_at,
  NOW() as updated_at,
  COALESCE(au.raw_user_meta_data->>'profile_picture', NULL) as profile_picture,
  COALESCE(au.raw_user_meta_data->>'address', NULL) as address,
  COALESCE(au.raw_user_meta_data->>'city', NULL) as city,
  COALESCE(au.raw_user_meta_data->>'country', 'Ethiopia') as country,
  COALESCE(au.raw_user_meta_data->>'postal_code', NULL) as postal_code,
  CASE 
    WHEN au.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
    THEN TO_DATE(au.raw_user_meta_data->>'date_of_birth', 'YYYY-MM-DD')
    ELSE NULL
  END as date_of_birth,
  COALESCE(au.raw_user_meta_data->>'language_preference', 'en') as language_preference,
  COALESCE(au.raw_user_meta_data->>'notification_preference', 'email') as notification_preference,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN 'active'
    ELSE 'pending'
  END as account_status,
  NULL as last_login
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO UPDATE
SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Verify the backfill
SELECT 
  'After backfill - Users in auth.users:',
  COUNT(*) as auth_users_count
FROM auth.users
UNION ALL
SELECT 
  'After backfill - Users in public.users:',
  COUNT(*) as public_users_count
FROM public.users;

-- Show any remaining missing users (should be 0)
SELECT 
  'Remaining missing users:',
  COUNT(*) as remaining_missing
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- If there are still missing users, show them
SELECT 
  au.id,
  au.email,
  au.created_at,
  au.email_confirmed_at,
  'Still missing from public.users' as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

