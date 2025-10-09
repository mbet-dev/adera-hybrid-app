# Supabase Setup Instructions

## 1. Database Schema Setup

To set up your Supabase database with the Adera schema:

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your Adera project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Schema**
   - Copy the contents of `supabase/schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

## 2. Environment Variables

Update your `.env.local` file with your actual Supabase credentials:

```bash
# Get these from: Project Settings > API
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Get this from: Project Settings > API > service_role (keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 3. Authentication Setup

Your authentication is already configured in the `@adera/auth` package. The system supports:

- **Email/Password Authentication**
- **Role-based Access Control** (customer, partner, driver, staff, admin)
- **Row Level Security** policies
- **Automatic profile creation**

## 4. Storage Setup (Optional)

For file uploads (profile pictures, product images, parcel photos):

1. Go to **Storage** in your Supabase dashboard
2. Create the following buckets:
   - `avatars` (public)
   - `products` (public)
   - `parcels` (private)
   - `shops` (public)

## 5. Real-time Setup

Real-time subscriptions are already configured for:
- Parcel status updates
- Order status changes
- New notifications
- Driver location updates

## 6. Testing the Setup

Once you've completed the above steps:

1. **Test Database Connection**
   ```bash
   cd apps/adera-ptp
   npx expo start
   ```

2. **Test Authentication**
   - Try signing up a new user
   - Check if user appears in the `users` table
   - Test role-based navigation

3. **Test Real-time**
   - Create a parcel and watch for status updates
   - Check notifications system

## 7. Sample Data (Optional)

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

## 8. Production Checklist

Before going live:

- [ ] Enable RLS on all tables ✅ (already done)
- [ ] Set up proper backup schedules
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Test all authentication flows
- [ ] Verify payment gateway webhooks
- [ ] Test real-time subscriptions under load
