-- ============================================
-- ADERA HYBRID APP - SCHEMA ALTERATIONS
-- ============================================
-- This script ensures all necessary columns and constraints exist
-- Idempotent: Safe to run multiple times
-- Run this BEFORE data population scripts
-- ============================================

-- Ensure profile_picture column exists in users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'profile_picture'
  ) THEN
    ALTER TABLE public.users ADD COLUMN profile_picture TEXT;
    RAISE NOTICE 'Added profile_picture column to users table';
  END IF;
END $$;

-- Ensure city column exists in users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.users ADD COLUMN city TEXT;
    RAISE NOTICE 'Added city column to users table';
  END IF;
END $$;

-- Ensure country column exists in users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'country'
  ) THEN
    ALTER TABLE public.users ADD COLUMN country TEXT DEFAULT 'Ethiopia';
    RAISE NOTICE 'Added country column to users table';
  END IF;
END $$;

-- Ensure postal_code column exists in users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE public.users ADD COLUMN postal_code TEXT;
    RAISE NOTICE 'Added postal_code column to users table';
  END IF;
END $$;

-- Ensure date_of_birth column exists in users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE public.users ADD COLUMN date_of_birth DATE;
    RAISE NOTICE 'Added date_of_birth column to users table';
  END IF;
END $$;

-- Ensure language_preference column exists in users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'language_preference'
  ) THEN
    ALTER TABLE public.users ADD COLUMN language_preference TEXT DEFAULT 'en';
    RAISE NOTICE 'Added language_preference column to users table';
  END IF;
END $$;

-- Ensure notification_preference column exists in users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'notification_preference'
  ) THEN
    ALTER TABLE public.users ADD COLUMN notification_preference TEXT DEFAULT 'email';
    RAISE NOTICE 'Added notification_preference column to users table';
  END IF;
END $$;

-- Ensure account_status column exists in users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'account_status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN account_status TEXT DEFAULT 'active';
    RAISE NOTICE 'Added account_status column to users table';
  END IF;
END $$;

-- Ensure last_login column exists in users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'last_login'
  ) THEN
    ALTER TABLE public.users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added last_login column to users table';
  END IF;
END $$;

-- Ensure wallet_balance column exists in users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'wallet_balance'
  ) THEN
    ALTER TABLE public.users ADD COLUMN wallet_balance DECIMAL(10,2) DEFAULT 0.00;
    RAISE NOTICE 'Added wallet_balance column to users table';
  END IF;
END $$;

-- Ensure is_hub column exists in shops table (for sorting facilities)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shops' 
    AND column_name = 'is_hub'
  ) THEN
    ALTER TABLE public.shops ADD COLUMN is_hub BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_hub column to shops table';
  END IF;
END $$;

-- Ensure hub_capacity column exists in shops table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shops' 
    AND column_name = 'hub_capacity'
  ) THEN
    ALTER TABLE public.shops ADD COLUMN hub_capacity INTEGER;
    RAISE NOTICE 'Added hub_capacity column to shops table';
  END IF;
END $$;

-- Ensure shop_location_pic column exists in shops table (for storefront photos)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'shops' 
    AND column_name = 'shop_location_pic'
  ) THEN
    ALTER TABLE public.shops ADD COLUMN shop_location_pic TEXT;
    RAISE NOTICE 'Added shop_location_pic column to shops table';
  END IF;
END $$;

-- Create index on is_hub for faster queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'shops' 
    AND indexname = 'idx_shops_is_hub'
  ) THEN
    CREATE INDEX idx_shops_is_hub ON shops(is_hub);
    RAISE NOTICE 'Created index idx_shops_is_hub';
  END IF;
END $$;

-- Create index on wallet_balance for faster queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND indexname = 'idx_users_wallet_balance'
  ) THEN
    CREATE INDEX idx_users_wallet_balance ON users(wallet_balance);
    RAISE NOTICE 'Created index idx_users_wallet_balance';
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Verify all columns exist
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check users table columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_picture') THEN
    missing_columns := array_append(missing_columns, 'users.profile_picture');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'wallet_balance') THEN
    missing_columns := array_append(missing_columns, 'users.wallet_balance');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'is_hub') THEN
    missing_columns := array_append(missing_columns, 'shops.is_hub');
  END IF;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Missing columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE '✅ All schema alterations verified successfully!';
  END IF;
END $$;
