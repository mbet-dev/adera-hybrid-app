# Supabase Setup Instructions for Adera Hybrid App

## Prerequisites

Before starting, ensure you have:
- A Supabase account (sign up at https://supabase.com)
- Node.js 18+ and pnpm installed
- Git repository cloned locally

---

## 1. Create Supabase Project

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Click "New Project"

2. **Configure Project**
   - **Name**: `adera-production` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose closest to Ethiopia (e.g., `eu-west-1` or `ap-south-1`)
   - **Pricing Plan**: Start with Free tier for development

3. **Wait for Setup**
   - Project creation takes 2-3 minutes
   - Note your project URL and keys

---

## 2. Database Schema Setup

### Step 2.1: Enable Required Extensions

1. **Go to Database > Extensions**
2. **Enable the following extensions**:
   - ✅ `uuid-ossp` - For UUID generation
   - ✅ `postgis` - For location/geography features
   - ✅ `pg_cron` (optional) - For scheduled jobs

### Step 2.2: Run Main Schema

1. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

2. **Execute Main Schema**
   - Copy the entire contents of `supabase/schema.sql`
   - Paste into the SQL editor
   - Click "Run" to execute
   - ✅ Verify: Should see "Success. No rows returned"

### Step 2.3: Run Functions Schema

1. **Create New Query**
   - Click "New query" again

2. **Execute Functions**
   - Copy the entire contents of `supabase/functions.sql`
   - Paste into the SQL editor
   - Click "Run" to execute
   - ✅ Verify: All functions created successfully

### Step 2.4: Configure QR Secret Key

1. **Go to Project Settings > Database**
2. **Scroll to "Custom Postgres Configuration"**
3. **Add custom config**:
   ```
   app.qr_secret_key = 'YOUR_RANDOM_SECRET_KEY_HERE'
   ```
   - Generate a strong random string (32+ characters)
   - Keep this secret secure!

---

## 3. Storage Buckets Setup

### Create Required Buckets

1. **Go to Storage** in Supabase dashboard
2. **Create the following buckets**:

#### Bucket: `avatars`
- **Name**: `avatars`
- **Public**: ✅ Yes
- **File size limit**: 2MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

#### Bucket: `products`
- **Name**: `products`
- **Public**: ✅ Yes
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

#### Bucket: `parcels`
- **Name**: `parcels`
- **Public**: ❌ No (private)
- **File size limit**: 3MB
- **Allowed MIME types**: `image/jpeg, image/png`

#### Bucket: `shops`
- **Name**: `shops`
- **Public**: ✅ Yes
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

### Configure Storage Policies

For each bucket, add appropriate RLS policies:

```sql
-- Example for avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

---

## 4. Environment Configuration

### Step 4.1: Get Supabase Credentials

1. **Go to Project Settings > API**
2. **Copy the following**:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long string)
   - **service_role key**: `eyJhbGc...` (KEEP SECRET!)

### Step 4.2: Configure Apps

#### For Adera-PTP:

```bash
cd apps/adera-ptp
cp .env.example .env.local
```

Edit `.env.local` and add:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
QR_SECRET_KEY=your-random-secret-key-here
```

#### For Adera-Shop:

```bash
cd apps/adera-shop
cp .env.example .env.local
```

Use the **SAME** Supabase credentials as adera-ptp.

---

## 5. Authentication Setup

### Step 5.1: Configure Auth Providers

1. **Go to Authentication > Providers**
2. **Enable Email Provider**:
   - ✅ Enable Email provider
   - ✅ Confirm email: Enabled
   - Email templates: Customize for Ethiopian context

3. **Configure Email Templates**:
   - Go to Authentication > Email Templates
   - Customize:
     - Confirmation email
     - Password reset
     - Magic link

### Step 5.2: Configure Auth Settings

1. **Go to Authentication > Settings**
2. **Site URL**: `https://your-domain.com` (or `exp://localhost:8081` for dev)
3. **Redirect URLs**: Add:
   - `exp://localhost:8081`
   - `https://your-domain.com/auth/callback`
   - Your production URLs

---

## 6. Real-time Configuration

Real-time is automatically enabled for all tables. To verify:

1. **Go to Database > Replication**
2. **Ensure the following tables are enabled**:
   - ✅ `parcels`
   - ✅ `parcel_events`
   - ✅ `orders`
   - ✅ `notifications`

---

## 7. Test the Setup

### Step 7.1: Test Database Connection

```bash
cd apps/adera-ptp
pnpm install
npx expo start
```

### Step 7.2: Test Authentication

1. Open the app (web or mobile)
2. Try signing up a new user
3. Check Supabase Dashboard > Authentication > Users
4. ✅ Verify: New user appears

### Step 7.3: Test Database Queries

In Supabase SQL Editor:

```sql
-- Check if user was created
SELECT * FROM users LIMIT 5;

-- Test tracking ID generation
SELECT generate_tracking_id();

-- Test delivery fee calculation
SELECT calculate_delivery_fee(5.5, 2.0, false, false);
```

---

## 8. Sample Data (Optional)

To populate your database with sample data for testing:

```sql
-- Insert a test partner user
INSERT INTO users (email, phone, role, first_name, last_name, business_name, location, is_verified)
VALUES (
  'partner@test.com',
  '+251911234567',
  'partner',
  'Test',
  'Partner',
  'Test Shop',
  ST_GeomFromText('POINT(38.7469 9.0579)', 4326), -- Addis Ababa coordinates
  true
);

-- Insert a test shop
INSERT INTO shops (owner_id, name, description, category, location, address, operating_hours, is_active, is_verified)
VALUES (
  (SELECT id FROM users WHERE email = 'partner@test.com'),
  'Test Convenience Store',
  'A sample convenience store for testing',
  'convenience',
  ST_GeomFromText('POINT(38.7469 9.0579)', 4326),
  'Bole, Addis Ababa',
  '{"monday": {"open": "08:00", "close": "20:00"}, "tuesday": {"open": "08:00", "close": "20:00"}}',
  true,
  true
);
```

---

## 9. Production Checklist

Before going live:

- [ ] ✅ Enable RLS on all tables (already done)
- [ ] ✅ Run all schema migrations (schema.sql + functions.sql)
- [ ] ✅ Configure QR secret key in database settings
- [ ] ✅ Create all storage buckets with proper policies
- [ ] ✅ Configure authentication providers and templates
- [ ] Set up automated database backups (daily recommended)
- [ ] Configure rate limiting on API endpoints
- [ ] Set up monitoring and alerts (Sentry, etc.)
- [ ] Test all authentication flows thoroughly
- [ ] Verify payment gateway webhooks are working
- [ ] Test real-time subscriptions under load
- [ ] Enable pg_cron for scheduled jobs (expire unpaid parcels)
- [ ] Set up CDN for image optimization
- [ ] Configure custom domain and SSL
- [ ] Review and update all RLS policies
- [ ] Test disaster recovery procedures

---

## 10. Troubleshooting

### Common Issues

**Issue**: "relation does not exist" errors
- **Solution**: Ensure schema.sql was executed successfully
- Check Database > Tables to verify all tables exist

**Issue**: "permission denied" errors
- **Solution**: Check RLS policies are correctly configured
- Verify user authentication is working

**Issue**: Functions not found
- **Solution**: Execute functions.sql in SQL Editor
- Check Database > Functions to verify they exist

**Issue**: Storage upload fails
- **Solution**: Verify storage buckets exist
- Check storage policies allow uploads

**Issue**: Real-time not working
- **Solution**: Enable replication for required tables
- Check Database > Replication settings

### Getting Help

- **Supabase Docs**: https://supabase.com/docs
- **Community Discord**: https://discord.supabase.com
- **GitHub Issues**: Report bugs in project repository

---

## Next Steps

After completing Supabase setup:

1. ✅ Configure payment gateways (TeleBirr, Chapa)
2. ✅ Set up maps integration (OpenStreetMap)
3. ✅ Configure push notifications (Expo + FCM)
4. ✅ Implement core features (parcel creation, tracking)
5. ✅ Test end-to-end user flows
6. ✅ Deploy to production

**You're now ready to build the Adera app!** 🚀🇪🇹
