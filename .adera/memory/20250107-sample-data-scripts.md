# Sample Data Generation Scripts - Complete Implementation

**Date**: 2025-01-07  
**Status**: ✅ COMPLETE  
**Type**: Database Setup & Testing Infrastructure

## 📋 Overview

Created comprehensive, idempotent SQL scripts to populate the Adera Hybrid App database with realistic Ethiopian context-based sample data for robust testing.

## 🎯 Deliverables

### 1. Schema Alterations Script
**File**: `supabase/01-schema-alterations.sql`

- Ensures all required columns exist in tables
- Adds missing fields: `profile_picture`, `wallet_balance`, `is_hub`, `hub_capacity`, etc.
- Creates performance indexes
- Idempotent: Safe to run multiple times
- Includes verification checks

### 2. Complete Data Erasure Script
**File**: `supabase/02-complete-data-erasure.sql`

- Completely erases ALL data from all tables
- Clears both `public` schema and `auth` schema
- Disables triggers during deletion to avoid cascading issues
- Includes verification to confirm all tables are empty
- ⚠️ DESTRUCTIVE - use only for fresh start

### 3. Sample Data Population Script
**File**: `supabase/03-sample-data-population.sql`

Creates:
- **14 Customers** with varying activity levels:
  - 5 heavy users (8-12 transactions each)
  - 5 medium users (4-7 transactions each)
  - 3 light users (1-3 transactions each)
  - 1 new user (0 transactions)
- **4 Drivers** for delivery operations
- **32 Partners**:
  - 2 Adera Sorting Hubs (internal logistics centers)
  - 30 Partner shops across Addis Ababa
- **6 Staff Members** (3 per hub)
- **300-450 Products** distributed across shops
- All users have password: `MBet4321`

### 4. Parcels & Transactions Script
**File**: `supabase/04-sample-parcels-transactions.sql`

Creates:
- **~100-150 Parcels** with realistic status distribution
- Complete **parcel event logs** for tracking history
- **Payment records** for all transactions
- **Notifications** for all users
- Proper relationships between senders, drivers, partners, and recipients

## 📊 Data Characteristics

### Ethiopian Context
- **Realistic Names**: Abebe Kebede, Tigist Alemu, Dawit Haile, etc.
- **Addis Ababa Locations**: Coordinates within bounds (lat: 8.9-9.1, lon: 38.7-38.9)
- **Local Shop Names**: Bole Minimarket, Piazza General Store, Merkato Electronics Hub, etc.
- **Ethiopian Phone Format**: +251911234XXX
- **Local Business Categories**: Grocery, Pharmacy, Electronics, Fashion, Hardware, etc.

### Parcel Status Distribution
- **Delivered** (6): ~40% - Completed transactions
- **At pickup partner** (5): ~20% - Ready for recipient
- **Dispatched** (4): ~15% - En route to pickup point
- **At hub** (3): ~10% - Being sorted
- **In transit to hub** (2): ~10% - Driver has picked up
- **At dropoff** (1): ~5% - Waiting for driver pickup
- **Created** (0): ~0% - All paid and in system

### Payment Method Distribution
- Wallet: ~25%
- Telebirr: ~25%
- Chapa: ~25%
- COD: ~25%

## 🏪 Shop Image Mapping

Sample shop images located in: `ReferenceResources/SamplePartnersShopsPics-X/`

**Mapping**:
- `hub1.jpeg` → Adera Sorting Hub 1
- `hub2.jpg` → Adera Sorting Hub 2
- `s1.jpg` through `s30.jpg` → 30 partner shops

## 📚 Documentation Created

### 1. README-SAMPLE-DATA-SETUP.md
Comprehensive guide covering:
- File overview and purpose
- Step-by-step execution instructions
- Complete user credentials list
- Storage bucket setup (4 buckets with RLS policies)
- Image upload methods (manual, CLI, JavaScript)
- Verification queries
- Testing scenarios for all roles
- Troubleshooting guide

### 2. EXECUTION-ORDER.md
Quick reference guide with:
- Exact execution order
- Estimated execution times
- Expected outputs for each script
- Verification checklist
- Common issues and solutions
- Data distribution statistics
- Security reminders

## 🔧 Technical Implementation

### Key Features
1. **Idempotent Scripts**: Safe to run multiple times without errors
2. **Realistic Relationships**: All foreign keys properly linked
3. **Complete Event Logs**: Full parcel lifecycle tracking
4. **Distributed Data**: Realistic patterns across users and time
5. **Performance Optimized**: Includes necessary indexes
6. **Error Handling**: Graceful handling of conflicts and duplicates

### Database Functions Used
- `gen_random_uuid()` - UUID generation
- `crypt()` - Password hashing (for auth users)
- `RANDOM()` - Randomized data distribution
- `POINT()` - Geographic coordinates
- `jsonb_build_object()` - JSON metadata

### Business Rules Enforced
- Drivers have NO wallet/earnings (salaried employees)
- Partners have wallet for earnings tracking
- Customers have wallet with random balances (0-1000 ETB)
- Hubs operate 24/7, shops have normal hours
- All parcels require payment before creation
- Sequential parcel status transitions

## 🎯 Testing Coverage

### Customer Scenarios
- Heavy user with transaction history
- New user with no history
- Various wallet balances
- Different payment methods

### Driver Scenarios
- Multiple assigned parcels
- Various parcel statuses
- Complete delivery flows

### Partner Scenarios
- Shop with products
- Dropoff and pickup operations
- Hub sorting operations
- Earnings tracking

### Staff Scenarios
- Hub management
- Parcel sorting
- Driver assignment

## 🔐 Security Considerations

### Test Environment
- All users pre-verified (email confirmation disabled)
- Simple password for testing: `MBet4321`
- Public storage buckets for easy testing
- Relaxed RLS policies for development

### Production Checklist
- [ ] Enable email confirmation
- [ ] Enforce strong passwords
- [ ] Tighten RLS policies
- [ ] Secure storage buckets
- [ ] Rotate service keys
- [ ] Remove/anonymize test data

## 📦 Storage Bucket Configuration

### Buckets Required
1. **shop-logos** (Public)
   - Partner shop logos
   - 5MB limit
   - JPEG, PNG, WebP

2. **product-images** (Public)
   - Product photos
   - 5MB limit
   - JPEG, PNG, WebP

3. **parcel-photos** (Private)
   - Parcel condition photos
   - 10MB limit
   - JPEG, PNG

4. **user-avatars** (Public)
   - User profile pictures
   - 2MB limit
   - JPEG, PNG

### RLS Policies
- Partners can upload shop logos
- Shop owners can upload product images
- Authenticated users can upload parcel photos
- Users can upload their own avatars
- Public read access where appropriate

## 🐛 Known Limitations

1. **Auth Users**: Scripts create application data only. Auth users must be created separately via:
   - Supabase Dashboard (manual)
   - Supabase Admin API (programmatic)
   - App signup flow (user-driven)

2. **Password Hashing**: Supabase handles password hashing. The `crypt()` function in scripts is a placeholder.

3. **Image URLs**: Database contains image filenames. Actual images must be uploaded to storage buckets separately.

4. **SMS Notifications**: Not implemented (provider not configured yet)

5. **Real-time Features**: Supabase Realtime channels not configured in sample data

## ✅ Verification Queries

```sql
-- User distribution
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Shop types
SELECT is_hub, COUNT(*) FROM shops GROUP BY is_hub;

-- Parcel statuses
SELECT status, COUNT(*) FROM parcels GROUP BY status;

-- Payment methods
SELECT payment_method, COUNT(*) FROM payments GROUP BY payment_method;

-- Products per shop
SELECT s.name, COUNT(p.id) as products
FROM shops s
LEFT JOIN products p ON s.id = p.shop_id
WHERE s.is_hub = false
GROUP BY s.name
ORDER BY products DESC;
```

## 📝 Files Created

```
supabase/
├── 01-schema-alterations.sql          (Schema updates)
├── 02-complete-data-erasure.sql       (Data cleanup)
├── 03-sample-data-population.sql      (Users, shops, products)
├── 04-sample-parcels-transactions.sql (Parcels, payments)
├── README-SAMPLE-DATA-SETUP.md        (Comprehensive guide)
└── EXECUTION-ORDER.md                 (Quick reference)
```

## 🚀 Next Steps

1. **Run Scripts**: Execute in order on Supabase SQL Editor
2. **Create Storage Buckets**: Set up 4 buckets with RLS policies
3. **Upload Images**: Upload 32 shop images to storage
4. **Test Logins**: Verify all user roles can authenticate
5. **Test Flows**: Run through customer, driver, partner, staff scenarios
6. **Verify Data**: Run verification queries to confirm data integrity

## 🎓 Lessons Learned

1. **Idempotency is Critical**: Scripts must handle existing data gracefully
2. **Realistic Data Matters**: Ethiopian context makes testing more relevant
3. **Complete Relationships**: All foreign keys must be properly linked
4. **Documentation is Key**: Comprehensive guides prevent confusion
5. **Verification is Essential**: Always include checks to confirm success

## 📞 Support Resources

- Main documentation: `docs/software-docs/`
- Business rules: `.windsurf/rules/erm-adera-business-rule.md`
- Project context: `.adera/erm-Adera-App-Context-aha-expo.md`
- Memory bank: `.adera/memory/`

---

**Status**: ✅ Ready for testing  
**Impact**: Enables comprehensive app testing with realistic data  
**Maintenance**: Update scripts as schema evolves
