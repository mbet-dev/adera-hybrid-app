import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import { createStorageAdapter } from './storageAdapter';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[auth] Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

// Create platform-specific storage adapter
const storageAdapter = createStorageAdapter();

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== 'undefined',
    flowType: 'pkce',
    // Enhanced session management settings
    storageKey: 'adera-auth-token',
    // More tolerant session settings
    debug: process.env.NODE_ENV === 'development',
  },
  // Global settings for better session management
  global: {
    headers: {
      'x-client-info': 'adera-hybrid-app',
    },
  },
});

export default supabase;
