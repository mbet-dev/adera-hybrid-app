# User Profile Trigger Migration

## Overview
This migration ensures that the user profile trigger is properly applied to automatically create user profiles in the `public.users` table when users sign up or confirm their email.

## Migration File
`supabase/migrations/20250109000000_user_profile_trigger.sql`

## What This Migration Does

1. **Creates/Replaces the Trigger Function**: `handle_new_user()`
   - Handles new user signups (INSERT on auth.users)
   - Handles email confirmations (UPDATE on auth.users when email_confirmed_at changes)
   - Creates user profile with all metadata from signup
   - Creates welcome notification upon email confirmation

2. **Creates the Trigger**: `on_auth_user_created_or_confirmed`
   - Fires on INSERT or UPDATE of auth.users table
   - Automatically creates user profile in public.users table

3. **Grants Permissions**: 
   - Grants necessary permissions to supabase_auth_admin role
   - Allows trigger to insert/update in public.users and public.notifications

## How to Apply

### Option 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20250109000000_user_profile_trigger.sql`
4. Paste and run the SQL script
5. Verify the trigger was created:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created_or_confirmed';
   ```

### Option 2: Via Supabase CLI (Recommended)
```bash
# Make sure you're in the project root
cd /path/to/adera-hybrid-app

# Apply the migration
supabase migration up

# Or apply a specific migration
supabase migration up --target 20250109000000
```

### Option 3: Manual Application
If you've already run the `user-profile-trigger.sql` file manually, this migration is idempotent and can be safely run again. It will:
- Replace the existing function if it exists
- Drop and recreate the trigger
- Re-grant permissions

## Verification

After applying the migration, verify it's working:

1. **Check Trigger Exists**:
   ```sql
   SELECT tgname, tgrelid::regclass, tgenabled 
   FROM pg_trigger 
   WHERE tgname = 'on_auth_user_created_or_confirmed';
   ```

2. **Check Function Exists**:
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'handle_new_user';
   ```

3. **Test User Creation**:
   - Sign up a new user via the app
   - Check that a record is created in `public.users` table
   - Verify the record has the correct role and metadata

4. **Test Email Confirmation**:
   - Confirm the email via the confirmation link
   - Check that `is_verified` is set to `true` in `public.users`
   - Check that `account_status` is set to `'active'`
   - Verify a welcome notification was created

## Important Notes

- **Existing Users**: This migration does not backfill existing users. If you have users in `auth.users` without corresponding records in `public.users`, you'll need to create them manually or run a separate backfill script.

- **Seeded Data**: If you've seeded data using SQL scripts that bypassed the trigger, those records will remain as-is. The trigger will only apply to new signups going forward.

- **Production**: Always test migrations in a development/staging environment before applying to production.

## Troubleshooting

### Trigger Not Firing
1. Check if the trigger is enabled:
   ```sql
   SELECT tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created_or_confirmed';
   ```
   Should return 'O' (enabled). If it returns 'D' (disabled), enable it:
   ```sql
   ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created_or_confirmed;
   ```

2. Check permissions:
   ```sql
   SELECT grantee, privilege_type 
   FROM information_schema.role_table_grants 
   WHERE table_name = 'users' AND grantee = 'supabase_auth_admin';
   ```

### User Profile Not Created
1. Check trigger logs:
   ```sql
   SELECT * FROM pg_stat_user_tables WHERE relname = 'users';
   ```

2. Check for errors in Supabase logs:
   - Go to Logs → Postgres Logs
   - Look for errors related to `handle_new_user`

3. Verify RLS policies allow the trigger to insert:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

## Rollback

If you need to rollback this migration:

```sql
-- Drop the trigger
DROP TRIGGER IF EXISTS on_auth_user_created_or_confirmed ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();
```

**Note**: Rolling back will prevent new user profiles from being created automatically. You'll need to create them manually or restore the trigger.

