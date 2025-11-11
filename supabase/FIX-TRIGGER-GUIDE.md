# Fix User Profile Trigger - Step by Step Guide

## Problem
Users are being created in `auth.users` but not in `public.users`. The trigger exists but isn't working.

## Root Causes
1. **RLS Policies**: The RLS policy `users_own_data` uses `auth.uid() = id`, but when the trigger runs (as `supabase_auth_admin`), there's no authenticated user context, so the policy blocks the insert.
2. **Missing Columns**: Some columns the trigger tries to insert may not exist in the users table.
3. **Permissions**: The `supabase_auth_admin` role may not have proper permissions.

## Solution

### Step 1: Run Diagnostic Script
First, run the diagnostic script to see what's wrong:

```sql
-- Run: supabase/diagnose-user-profile-trigger.sql
```

This will show you:
- If the trigger exists and is enabled
- If the function exists
- What columns are missing
- What RLS policies exist
- Which users are missing from public.users

### Step 2: Run Fix Script
Run the comprehensive fix script:

```sql
-- Run: supabase/fix-user-profile-trigger.sql
```

This script will:
1. ✅ Add all missing columns to the users table
2. ✅ Fix RLS policies to allow the trigger to work
3. ✅ Grant proper permissions to `supabase_auth_admin`
4. ✅ Recreate the trigger function with better error handling
5. ✅ Recreate the trigger

### Step 3: Backfill Missing Users
After fixing the trigger, backfill users that were created before the fix:

```sql
-- Run: supabase/backfill-missing-user-profiles.sql
```

This will create profiles for all users in `auth.users` that don't have profiles in `public.users`.

### Step 4: Verify the Fix
Test by creating a new user via signup. The user should automatically get a profile in `public.users`.

Check the logs:
- Go to Supabase Dashboard → Logs → Postgres Logs
- Look for messages from `handle_new_user` function
- You should see "Successfully created user profile for..." messages

### Step 5: Verify Counts Match
Run this to verify:

```sql
SELECT 
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.users) as public_users_count,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.users) as difference;
```

The difference should be 0 (or very close to 0 if you just created a test user).

## Key Changes Made

### 1. RLS Policy Fix
**Before:**
```sql
CREATE POLICY users_own_data ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY users_supabase_auth_admin_insert ON users FOR INSERT WITH CHECK (TRUE);
```

**After:**
```sql
CREATE POLICY users_supabase_auth_admin_all ON users
  FOR ALL
  TO supabase_auth_admin
  USING (true)
  WITH CHECK (true);
```

This allows the trigger (running as `supabase_auth_admin`) to perform all operations (INSERT, SELECT, UPDATE) on the users table.

### 2. Enhanced Error Handling
The trigger function now:
- Has better error handling with detailed logging
- Uses `RAISE WARNING` instead of silently failing
- Logs all errors to Postgres logs for debugging
- Still allows auth.users insert/update to succeed even if profile creation fails

### 3. Column Validation
The fix script ensures all required columns exist before the trigger runs.

## Troubleshooting

### If trigger still doesn't work:

1. **Check Trigger Status:**
   ```sql
   SELECT tgname, tgenabled, tgisinternal
   FROM pg_trigger 
   WHERE tgname = 'on_auth_user_created_or_confirmed';
   ```
   `tgenabled` should be 'O' (enabled).

2. **Check Function:**
   ```sql
   SELECT proname, prosecdef
   FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```
   `prosecdef` should be `true` (SECURITY DEFINER).

3. **Check RLS Policies:**
   ```sql
   SELECT policyname, roles, cmd, qual, with_check
   FROM pg_policies 
   WHERE tablename = 'users';
   ```
   Should see `users_supabase_auth_admin_all` policy.

4. **Check Permissions:**
   ```sql
   SELECT grantee, privilege_type
   FROM information_schema.role_table_grants 
   WHERE table_name = 'users' 
   AND grantee = 'supabase_auth_admin';
   ```
   Should have SELECT, INSERT, UPDATE.

5. **Check Postgres Logs:**
   - Go to Supabase Dashboard → Logs → Postgres Logs
   - Look for errors from `handle_new_user`
   - Look for "Failed to create user profile" warnings

### If you see errors in logs:

1. **Column doesn't exist:** Run the fix script again to add missing columns
2. **Permission denied:** Check that `supabase_auth_admin` has proper permissions
3. **RLS policy violation:** Check that the RLS policy allows `supabase_auth_admin` to insert
4. **Type mismatch:** Check that the role enum and other types match

## Expected Behavior After Fix

1. ✅ New user signs up → Profile created in `public.users` automatically
2. ✅ User confirms email → Profile updated, welcome notification created
3. ✅ All users in `auth.users` have profiles in `public.users`
4. ✅ Trigger logs show successful profile creation
5. ✅ No errors in Postgres logs

## Next Steps

After fixing:
1. Test with a new user signup
2. Verify the profile is created
3. Verify email confirmation updates the profile
4. Monitor logs for any issues
5. Backfill any remaining missing users

## Notes

- The fix script is **idempotent** - safe to run multiple times
- The trigger function uses `SECURITY DEFINER` to run as the function owner
- The RLS policy for `supabase_auth_admin` allows all operations
- Error handling ensures auth.users creation succeeds even if profile creation fails (but logs the error)

