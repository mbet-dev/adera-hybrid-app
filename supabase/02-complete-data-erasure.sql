-- ============================================
-- ADERA HYBRID APP - COMPLETE DATA ERASURE
-- ============================================
-- ⚠️ WARNING: This script will DELETE ALL DATA from all tables
-- This is IRREVERSIBLE - use only for fresh start/testing
-- Idempotent: Safe to run multiple times
-- ============================================

DO $$
DECLARE
  table_counts TEXT := '';
  count_val INTEGER;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE '🗑️  STARTING DATA ERASURE';
  RAISE NOTICE '================================================';
  
  -- Disable triggers temporarily to avoid cascading issues
  SET session_replication_role = replica;
  
  -- ============================================
  -- 1. DELETE ALL APPLICATION DATA
  -- ============================================
  
  -- Delete notifications (no foreign key dependencies)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    DELETE FROM public.notifications;
    RAISE NOTICE '✅ Deleted all notifications';
  END IF;
  
  -- Delete payments
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    DELETE FROM public.payments;
    RAISE NOTICE '✅ Deleted all payments';
  END IF;
  
  -- Delete order items
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    DELETE FROM public.order_items;
    RAISE NOTICE '✅ Deleted all order items';
  END IF;
  
  -- Delete orders
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    DELETE FROM public.orders;
    RAISE NOTICE '✅ Deleted all orders';
  END IF;
  
  -- Delete parcel events
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parcel_events') THEN
    DELETE FROM public.parcel_events;
    RAISE NOTICE '✅ Deleted all parcel events';
  END IF;
  
  -- Delete parcels
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parcels') THEN
    DELETE FROM public.parcels;
    RAISE NOTICE '✅ Deleted all parcels';
  END IF;
  
  -- Delete products
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    DELETE FROM public.products;
    RAISE NOTICE '✅ Deleted all products';
  END IF;
  
  -- Delete shops
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shops') THEN
    DELETE FROM public.shops;
    RAISE NOTICE '✅ Deleted all shops';
  END IF;
  
  -- Delete users (application table)
  DELETE FROM public.users;
  RAISE NOTICE '✅ Deleted all users from public.users';
  
  -- Delete profiles (if table exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    DELETE FROM public.profiles;
    RAISE NOTICE '✅ Deleted all profiles';
  ELSE
    RAISE NOTICE '⚠️ Skipped profiles (table does not exist)';
  END IF;
  
  -- ============================================
  -- 2. DELETE ALL AUTH DATA
  -- ============================================
  
  -- Delete auth identities
  DELETE FROM auth.identities;
  RAISE NOTICE '✅ Deleted all auth identities';
  
  -- Delete auth sessions
  DELETE FROM auth.sessions;
  RAISE NOTICE '✅ Deleted all auth sessions';
  
  -- Delete auth refresh tokens
  DELETE FROM auth.refresh_tokens;
  RAISE NOTICE '✅ Deleted all auth refresh tokens';
  
  -- Delete auth users (this is the main auth table)
  DELETE FROM auth.users;
  RAISE NOTICE '✅ Deleted all auth users';
  
  -- ============================================
  -- 3. RE-ENABLE TRIGGERS
  -- ============================================
  
  -- Re-enable triggers
  SET session_replication_role = DEFAULT;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '🔍 VERIFYING DATA ERASURE';
  RAISE NOTICE '================================================';
  
  -- ============================================
  -- 4. VERIFICATION
  -- ============================================
  
  -- Check each table (only if it exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    SELECT COUNT(*) INTO count_val FROM public.notifications;
    IF count_val > 0 THEN table_counts := table_counts || 'notifications: ' || count_val || ', '; END IF;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    SELECT COUNT(*) INTO count_val FROM public.payments;
    IF count_val > 0 THEN table_counts := table_counts || 'payments: ' || count_val || ', '; END IF;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
    SELECT COUNT(*) INTO count_val FROM public.order_items;
    IF count_val > 0 THEN table_counts := table_counts || 'order_items: ' || count_val || ', '; END IF;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    SELECT COUNT(*) INTO count_val FROM public.orders;
    IF count_val > 0 THEN table_counts := table_counts || 'orders: ' || count_val || ', '; END IF;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parcel_events') THEN
    SELECT COUNT(*) INTO count_val FROM public.parcel_events;
    IF count_val > 0 THEN table_counts := table_counts || 'parcel_events: ' || count_val || ', '; END IF;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parcels') THEN
    SELECT COUNT(*) INTO count_val FROM public.parcels;
    IF count_val > 0 THEN table_counts := table_counts || 'parcels: ' || count_val || ', '; END IF;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    SELECT COUNT(*) INTO count_val FROM public.products;
    IF count_val > 0 THEN table_counts := table_counts || 'products: ' || count_val || ', '; END IF;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shops') THEN
    SELECT COUNT(*) INTO count_val FROM public.shops;
    IF count_val > 0 THEN table_counts := table_counts || 'shops: ' || count_val || ', '; END IF;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    SELECT COUNT(*) INTO count_val FROM public.users;
    IF count_val > 0 THEN table_counts := table_counts || 'users: ' || count_val || ', '; END IF;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    SELECT COUNT(*) INTO count_val FROM public.profiles;
    IF count_val > 0 THEN table_counts := table_counts || 'profiles: ' || count_val || ', '; END IF;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    SELECT COUNT(*) INTO count_val FROM auth.users;
    IF count_val > 0 THEN table_counts := table_counts || 'auth.users: ' || count_val || ', '; END IF;
  END IF;
  
  -- ============================================
  -- 5. SUMMARY
  -- ============================================
  
  IF table_counts = '' THEN
    RAISE NOTICE '✅✅✅ SUCCESS: All tables are empty! Database is clean.';
  ELSE
    RAISE WARNING '⚠️ Some tables still have data: %', table_counts;
  END IF;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE '🗑️  DATA ERASURE COMPLETE';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'All application and auth data has been deleted.';
  RAISE NOTICE 'The database is now ready for fresh data population.';
  RAISE NOTICE '================================================';
END $$;
