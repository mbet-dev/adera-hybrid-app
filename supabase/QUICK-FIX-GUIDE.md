# Quick Fix Guide - User Profile Trigger

## Problem
Users are created in `auth.users` (57 records) but not in `public.users` (56 records). The trigger exists but isn't working.

## Root Cause
**RLS Policy Blocking Insert**: The RLS policy `users_own_data` uses `auth.uid() = id`, but when the trigger runs (as `supabase_auth_admin`), there's no authenticated user context, so `auth.uid()` returns NULL and the policy blocks the insert.

## Quick Fix (3 Steps)

### Step 1: Run Diagnostic (Optional but Recommended)
```sql
-- Run: supabase/diagnose-user-profile-trigger.sql
-- This will show you what's wrong (now fixed - no more error)
```

### Step 2: Run Fix Script (REQUIRED)
```sql
-- Run: supabase/fix-user-profile-trigger.sql
-- This fixes:
-- ✅ Adds missing columns
-- ✅ Removes DEFAULT from id column
-- ✅ Creates RLS policy for supabase_auth_admin
-- ✅ Grants proper permissions
-- ✅ Recreates trigger function with better error handling
-- ✅ Recreates trigger
```

### Step 3: Backfill Missing Users (REQUIRED)
```sql
-- Run: supabase/backfill-missing-user-profiles.sql
-- This creates profiles for the 1 missing user (and any others)
```

## Verify Fix

### 1. Check User Counts Match
```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM public.users) as public_users,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.users) as difference;
```
**Expected**: difference should be 0

### 2. Test New User Signup
- Sign up a new user via the app
- Check that a profile is automatically created in `public.users`
- Check Supabase Dashboard → Logs → Postgres Logs for "Successfully created user profile" messages

### 3. Check Trigger Status
```sql
SELECT tgname, tgenabled, tgisinternal
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created_or_confirmed';
```
**Expected**: `tgenabled` should be 'O' (enabled)

### 4. Check RLS Policy
```sql
SELECT policyname, roles, cmd
FROM pg_policies 
WHERE tablename = 'users' 
AND roles::text LIKE '%supabase_auth_admin%';
```
**Expected**: Should see `users_supabase_auth_admin_all` policy

## What the Fix Does

1. **Adds Missing Columns**: Ensures all columns the trigger needs exist
2. **Fixes ID Column**: Removes `DEFAULT gen_random_uuid()` so id comes from `auth.users`
3. **Creates RLS Policy**: Allows `supabase_auth_admin` to INSERT/SELECT/UPDATE without checking `auth.uid()`
4. **Grants Permissions**: Ensures `supabase_auth_admin` has proper permissions
5. **Improves Error Handling**: Better logging and error messages in trigger function

## Key Changes

### Before (Broken):
```sql
CREATE POLICY users_own_data ON users FOR ALL USING (auth.uid() = id);
-- This blocks trigger because auth.uid() is NULL when trigger runs
```

### After (Fixed):
```sql
CREATE POLICY users_supabase_auth_admin_all ON users
  FOR ALL TO supabase_auth_admin
  USING (true) WITH CHECK (true);
-- This allows trigger to work because it doesn't check auth.uid()
```

## Troubleshooting

### If trigger still doesn't work after fix:

1. **Check Postgres Logs**:
   - Go to Supabase Dashboard → Logs → Postgres Logs
   - Look for errors from `handle_new_user`
   - Look for "Failed to create user profile" warnings

2. **Check Permissions**:
   ```sql
   SELECT grantee, privilege_type
   FROM information_schema.role_table_grants 
   WHERE table_name = 'users' 
   AND grantee = 'supabase_auth_admin';
   ```
   Should have: SELECT, INSERT, UPDATE

3. **Manually Test Trigger** (Advanced):
   ```sql
   -- This simulates what the trigger does
   SET ROLE supabase_auth_admin;
   INSERT INTO public.users (id, email, role) 
   VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'test@example.com', 'customer');
   RESET ROLE;
   ```

## Expected Result

After running the fix:
- ✅ All users in `auth.users` have profiles in `public.users`
- ✅ New signups automatically create profiles
- ✅ Email confirmation updates profiles
- ✅ Welcome notifications are created
- ✅ No errors in Postgres logs

## Next Steps

1. Run the fix script
2. Run the backfill script
3. Verify counts match
4. Test with a new user signup
5. Monitor logs for any issues

---

**Note**: All scripts are idempotent - safe to run multiple times.

