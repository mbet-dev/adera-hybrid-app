-- ============================================
-- DIAGNOSTIC SCRIPT: User Profile Trigger Issues
-- ============================================
-- Run this script to diagnose why the trigger isn't creating user profiles
-- ============================================

-- 1. Check if trigger exists and is enabled
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled,
  tgisinternal as is_internal
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created_or_confirmed';

-- 2. Check if trigger function exists
SELECT 
  proname as function_name,
  prosrc as function_source,
  prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Check users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. Check if users.id references auth.users
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'users'
  AND kcu.column_name = 'id';

-- 5. Check RLS policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- 6. Check if RLS is enabled on users table
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 7. Check permissions for supabase_auth_admin role
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND grantee = 'supabase_auth_admin';

-- 8. Check for missing columns that trigger tries to use
SELECT 
  CASE 
    WHEN column_name IS NULL THEN 'MISSING: ' || missing_col
    ELSE 'EXISTS: ' || column_name
  END as status
FROM (
  SELECT unnest(ARRAY[
    'id', 'email', 'phone', 'role', 'first_name', 'last_name', 
    'is_verified', 'is_active', 'created_at', 'updated_at',
    'profile_picture', 'address', 'city', 'country', 'postal_code', 
    'date_of_birth', 'language_preference', 'notification_preference', 
    'account_status', 'last_login'
  ]) as missing_col
) m
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
  AND c.table_name = 'users'
  AND c.column_name = m.missing_col;

-- 9. Count users in auth.users vs public.users
SELECT 
  'auth.users' as table_name,
  COUNT(*) as user_count
FROM auth.users
UNION ALL
SELECT 
  'public.users' as table_name,
  COUNT(*) as user_count
FROM public.users;

-- 10. Find users in auth.users but not in public.users
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  au.email_confirmed_at,
  CASE 
    WHEN pu.id IS NULL THEN 'MISSING in public.users'
    ELSE 'EXISTS in public.users'
  END as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC
LIMIT 10;

-- 11. Check if there are any constraint violations or issues
-- Note: Actual Postgres logs should be checked in Supabase Dashboard → Logs → Postgres Logs
-- This query checks for common issues that might prevent inserts

-- Check for NOT NULL constraint violations (columns that are NOT NULL but might receive NULL)
SELECT 
  column_name,
  is_nullable,
  column_default,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND is_nullable = 'NO'
AND column_default IS NULL
AND column_name NOT IN ('id', 'email', 'role'); -- These should have defaults or values

-- 12. Check if there are any check constraints that might block inserts
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_schema = 'public'
AND constraint_name IN (
  SELECT constraint_name 
  FROM information_schema.table_constraints 
  WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND constraint_type = 'CHECK'
);

-- 13. Test if we can manually insert as supabase_auth_admin (simulation)
-- Note: This is just to verify permissions, won't actually insert
SELECT 
  'Permission check: supabase_auth_admin can insert into users' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM information_schema.role_table_grants 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND grantee = 'supabase_auth_admin'
      AND privilege_type = 'INSERT'
    ) THEN '✅ INSERT permission granted'
    ELSE '❌ INSERT permission MISSING'
  END as result;

