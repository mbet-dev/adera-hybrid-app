# Adera Authentication Setup Guide

This guide provides step-by-step instructions to set up authentication for the Adera Hybrid App with Supabase.

## 🚀 Quick Setup Checklist

- [ ] Create Supabase project
- [ ] Run database schema
- [ ] Set up user profile trigger
- [ ] Configure authentication settings
- [ ] Set redirect URLs
- [ ] Test email confirmation flow

## 1. Database Setup

### Step 1: Create Database Schema
Run the following SQL files in your Supabase SQL editor in this order:

1. **Main Schema**: `supabase/schema.sql`
2. **Functions**: `supabase/functions.sql` 
3. **User Profile Trigger**: `supabase/user-profile-trigger.sql`

### Step 2: Verify Tables Created
Ensure these tables exist in your database:
- `users` (with RLS enabled)
- `shops`, `products`, `parcels`, `orders`, `payments`, `notifications`

## 2. Authentication Configuration

### Step 1: Configure Auth Settings
In your Supabase Dashboard → Authentication → Settings:

**General Settings:**
- ✅ Enable email confirmations
- ✅ Enable email change confirmations  
- ✅ Enable secure email change
- ⏱️ JWT expiry: 3600 seconds (1 hour)
- 🔄 Refresh token rotation: Enabled

**Email Templates:**
- Customize confirmation email template with Adera branding
- Add Ethiopian localization if needed

### Step 2: Set Redirect URLs
In Authentication → URL Configuration, add these redirect URLs:

**For Development:**
```
# Web Development
http://localhost:8081/auth/callback
http://localhost:8082/auth/callback
http://127.0.0.1:8081/auth/callback

# Native Development (Expo)
exp://localhost:8081/--/auth/callback
exp://localhost:8082/--/auth/callback
exp://192.168.1.100:8081/--/auth/callback  # Replace with your IP

# Universal Development
exp://localhost:*/--/auth/callback
http://localhost:*/auth/callback
```

**For Production:**
```
# Web Production
https://yourdomain.com/auth/callback
https://app.adera.et/auth/callback

# Native Production (after app store deployment)
com.adera.ptp://auth/callback
com.adera.shop://auth/callback

# Expo Production
exp://exp.host/@yourusername/adera-ptp/--/auth/callback
exp://exp.host/@yourusername/adera-shop/--/auth/callback
```

## 3. Environment Variables

### Step 1: Create Environment Files
Create `.env` files in both app directories:

**`apps/adera-ptp/.env`:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**`apps/adera-shop/.env`:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Set Database Secrets
In Supabase Dashboard → Settings → Vault, add:

```sql
-- QR Code secret for secure parcel verification
INSERT INTO vault.secrets (name, secret) 
VALUES ('qr_secret_key', 'your-super-secure-random-key-min-32-chars');
```

## 4. Row Level Security (RLS) Policies

The schema includes comprehensive RLS policies, but verify they're active:

```sql
-- Check RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = false;

-- Should return no rows if all tables have RLS enabled
```

## 5. Testing the Setup

### Step 1: Test User Registration
1. Start your development server: `pnpm dev`
2. Navigate to Sign Up screen
3. Register with a real email address
4. Check email for confirmation link
5. Click confirmation link
6. Verify user appears in both `auth.users` and `public.users` tables

### Step 2: Test Profile Creation
After email confirmation, verify:
- User record created in `public.users` table
- Welcome notification created in `notifications` table
- User can log in successfully
- Profile data loads correctly

### Step 3: Test Cross-Platform
- **Web**: Test in browser at `http://localhost:8081`
- **Native**: Test with Expo Go app using QR code
- **Email Confirmation**: Test on both platforms

## 6. Troubleshooting

### Issue: User created in auth but not in users table
**Solution**: Check if the trigger function is properly installed:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_confirmed';
```

### Issue: Email confirmation not working
**Solutions**:
1. Check redirect URLs are correctly configured
2. Verify email template is enabled
3. Check spam folder for confirmation emails
4. Ensure `detectSessionInUrl` is enabled for web

### Issue: Native app crashes on email confirmation
**Solutions**:
1. Verify deep link URL format: `exp://localhost:8081/--/auth/callback`
2. Check EmailConfirmationHandler is properly imported
3. Test with Expo development build for better error reporting

### Issue: Profile fetch errors
**Solutions**:
1. Check RLS policies allow user to read their own data
2. Verify user ID matches between auth.users and public.users
3. Check retry logic in AuthProvider is working

## 7. Production Deployment

### Step 1: Update Environment Variables
Replace development URLs with production URLs in:
- Supabase redirect URL configuration
- App environment variables
- Deep link schemes

### Step 2: Configure Custom Domain (Optional)
Set up custom domain for your Supabase project for branded emails.

### Step 3: Enable Additional Security
- Enable CAPTCHA for sign-ups if needed
- Configure rate limiting
- Set up monitoring and alerts

## 8. Security Best Practices

1. **Never expose service_role key** in client code
2. **Use environment variables** for all sensitive data
3. **Regularly rotate** QR code secret keys
4. **Monitor authentication logs** for suspicious activity
5. **Keep Supabase client libraries updated**

## 9. Support & Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo Authentication Guide](https://docs.expo.dev/guides/authentication/)
- [React Native Deep Linking](https://reactnative.dev/docs/linking)

---

## ✅ Verification Checklist

After completing setup, verify:

- [ ] Users can register successfully
- [ ] Email confirmation works on web and native
- [ ] User profiles are created automatically
- [ ] Login works after email confirmation
- [ ] Profile data loads correctly
- [ ] Welcome notifications are created
- [ ] RLS policies protect user data
- [ ] No console errors during auth flow

**Setup Complete!** 🇪🇹 Your Adera authentication system is ready for Ethiopian users.
