# Adera Sample Data - Execution Order

## 📋 Quick Reference

Execute these SQL scripts in **EXACT ORDER** in your Supabase SQL Editor:

```
1. ✅ 01-schema-alterations.sql
2. 🗑️ 02-complete-data-erasure.sql (Optional - only for fresh start)
3. 👥 03-sample-data-population.sql
4. 📦 04-sample-parcels-transactions.sql
```

## ⏱️ Estimated Execution Time

- **01-schema-alterations.sql**: ~5-10 seconds
- **02-complete-data-erasure.sql**: ~10-15 seconds
- **03-sample-data-population.sql**: ~30-45 seconds
- **04-sample-parcels-transactions.sql**: ~60-90 seconds

**Total**: ~2-3 minutes

## 🎯 What Each Script Does

### 1. Schema Alterations (REQUIRED)
- Adds missing columns to existing tables
- Creates indexes for performance
- Idempotent: Safe to run multiple times
- **Run this FIRST** even if you think schema is up-to-date

### 2. Data Erasure (OPTIONAL)
- ⚠️ **DESTRUCTIVE**: Deletes ALL data
- Clears both application and auth tables
- Only run if you want a completely fresh start
- **Skip this** if you want to keep existing data

### 3. Sample Data Population (REQUIRED)
- Creates 56 users (14 customers, 4 drivers, 32 partners, 6 staff)
- Creates 32 shops (2 hubs + 30 partner shops)
- Creates 300-450 products across shops
- All users have password: `MBet4321`

### 4. Parcels & Transactions (REQUIRED)
- Creates ~100-150 realistic parcel transactions
- Distributes parcels across various statuses
- Creates payment records
- Creates notifications
- Links all relationships correctly

## 🚀 Step-by-Step Execution

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor** (left sidebar)
3. Click **New Query**

### Step 2: Run Schema Alterations
```sql
-- Copy and paste contents of 01-schema-alterations.sql
-- Click "Run" or press Ctrl+Enter
```

**Expected Output:**
```
✅ All schema alterations verified successfully!
```

### Step 3: (Optional) Erase Existing Data
```sql
-- Copy and paste contents of 02-complete-data-erasure.sql
-- Click "Run" or press Ctrl+Enter
```

**Expected Output:**
```
✅✅✅ SUCCESS: All tables are empty! Database is clean.
🗑️  DATA ERASURE COMPLETE
```

### Step 4: Populate Sample Data
```sql
-- Copy and paste contents of 03-sample-data-population.sql
-- Click "Run" or press Ctrl+Enter
```

**Expected Output:**
```
✅ Created 14 customers
✅ Created 4 drivers
✅ Created 32 partners
✅ Created 6 staff members
✅ Created 2 sorting hubs
✅ Created 30 partner shops
✅ Created products for all shops
```

### Step 5: Create Parcels & Transactions
```sql
-- Copy and paste contents of 04-sample-parcels-transactions.sql
-- Click "Run" or press Ctrl+Enter
```

**Expected Output:**
```
✅ Created parcels for heavy users (5 customers)
✅ Created parcels for medium users (5 customers)
✅ Created parcels for light users (3 customers)
✅ Created welcome notifications for all users
📊 DATABASE POPULATION SUMMARY
Users: 56
Shops: 32 (including 2 hubs)
Products: ~350
Parcels: ~120
Payments: ~120
Notifications: 56
✅ DATA POPULATION COMPLETE!
```

## ✅ Verification Checklist

After running all scripts, verify:

```sql
-- 1. Check user counts by role
SELECT role, COUNT(*) as count FROM users GROUP BY role;
-- Expected: customer=14, driver=4, partner=32, staff=6

-- 2. Check shop counts
SELECT is_hub, COUNT(*) as count FROM shops GROUP BY is_hub;
-- Expected: true=2, false=30

-- 3. Check parcel statuses
SELECT status, COUNT(*) as count FROM parcels GROUP BY status ORDER BY status;
-- Expected: Various counts across status 0-6

-- 4. Check products exist
SELECT COUNT(*) as total_products FROM products;
-- Expected: 300-450

-- 5. Check payments match parcels
SELECT 
  (SELECT COUNT(*) FROM parcels) as parcels,
  (SELECT COUNT(*) FROM payments WHERE parcel_id IS NOT NULL) as payments;
-- Expected: Should be equal
```

## 🐛 Common Issues & Solutions

### Issue 1: "Column already exists" error
**Cause**: Schema alterations already applied
**Solution**: This is OK! The script is idempotent. Continue to next script.

### Issue 2: "Foreign key constraint violation"
**Cause**: Running scripts out of order
**Solution**: Start over from Step 1 (schema alterations)

### Issue 3: "User already exists" error
**Cause**: Data already populated
**Solution**: Either:
- Skip to next script (if partial data is OK)
- Run data erasure script first (for fresh start)

### Issue 4: No data appears in app
**Cause**: Auth users not created
**Solution**: 
- Scripts create application data only
- Auth users must be created separately (see README)
- Or users can sign up through the app

### Issue 5: "Permission denied" errors
**Cause**: RLS policies blocking operations
**Solution**: 
- Ensure you're running as service_role or postgres user
- Check RLS policies are correctly configured

## 📊 Expected Data Distribution

### Customers by Activity Level
- **Heavy users** (5): 8-12 parcels each = ~50 parcels
- **Medium users** (5): 4-7 parcels each = ~25 parcels
- **Light users** (3): 1-3 parcels each = ~6 parcels
- **New user** (1): 0 parcels

**Total**: ~80-120 parcels

### Parcel Status Distribution
- **Delivered** (status 6): ~40%
- **At pickup partner** (status 5): ~20%
- **Dispatched** (status 4): ~15%
- **At hub** (status 3): ~10%
- **In transit to hub** (status 2): ~10%
- **At dropoff** (status 1): ~5%

### Payment Method Distribution
- **Wallet**: ~25%
- **Telebirr**: ~25%
- **Chapa**: ~25%
- **COD**: ~25%

## 🎓 Next Steps

After successful data population:

1. **Set up Storage Buckets** (see README-SAMPLE-DATA-SETUP.md)
2. **Upload Shop Images** from `ReferenceResources/SamplePartnersShopsPics-X/`
3. **Test User Logins** with sample credentials
4. **Verify App Functionality** across all roles
5. **Check RLS Policies** are working correctly

## 📝 Important Notes

- All users have password: `MBet4321`
- All coordinates are within Addis Ababa bounds
- All shops have realistic Ethiopian names and locations
- All parcels have complete event histories
- All payments are marked as completed for testing
- All users are pre-verified (email confirmation disabled for testing)

## 🔒 Security Reminders

⚠️ **Before Production**:
- [ ] Change all test passwords
- [ ] Enable email confirmation
- [ ] Rotate service role keys
- [ ] Review and tighten RLS policies
- [ ] Remove or anonymize test data
- [ ] Set up proper backup procedures

---

**Ready to populate your database? Start with Step 1! 🚀**
