import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';
import { AuthState } from './types';

const PROFILE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Expo SecureStore wrapper for zustand persistence
const zustandStorage = {
  setItem: async (name, value) => {
    await SecureStore.setItemAsync(name, value);
  },
  getItem: async (name) => {
    const value = await SecureStore.getItemAsync(name);
    return value;
  },
  removeItem: async (name) => {
    await SecureStore.deleteItemAsync(name);
  },
};

const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Core state
      session: null,
      userProfile: null,
      authState: AuthState.LOADING,
      isInitialized: false,
      isProfileLoading: false, // New state for profile loading
      profileFetchTimestamp: 0, // Timestamp of the last successful profile fetch
      notifications: [],
      error: null,

      // Actions
      initialize: async () => {
        if (get().isInitialized) {
          console.log('[AuthStore] Already initialized.');
          return;
        }

        console.log('[AuthStore] Initializing auth...');
        set({ authState: AuthState.LOADING });

        // Listen for auth state changes
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
          console.log(`[AuthStore] onAuthStateChange event: ${event}`);
          get().handleAuthStateChange(session);
        });

        // Check initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('[AuthStore] Error getting initial session:', error);
        }
        // The onAuthStateChange listener will handle the session and profile fetching.
        // We just need to ensure the initial state is set correctly if no session is found.
        // The initial session check is now handled by the onAuthStateChange callback.
        // We only set isInitialized here.
        set({ isInitialized: true });
        
        // Return unsubscribe function for cleanup
        return () => {
          if (subscription) {
            subscription.unsubscribe();
          }
        };
      },

      handleAuthStateChange: async (session) => {
        const currentProfile = get().userProfile;
        const isProfileLoading = get().isProfileLoading;
        const profileFetchTimestamp = get().profileFetchTimestamp;
        const now = Date.now();

        if (session?.user) {
          // User is authenticated
          // Determine if a profile fetch is needed
          // 1. No current profile
          // 2. Profile ID doesn't match session user ID (new user or session change)
          // 3. Profile data is stale (older than PROFILE_REFRESH_INTERVAL)
          const needsProfileFetch =
            !currentProfile ||
            currentProfile.id !== session.user.id ||
            (now - profileFetchTimestamp > PROFILE_REFRESH_INTERVAL);

          set({ session, authState: AuthState.AUTHENTICATED, error: null });

          if (needsProfileFetch && !isProfileLoading) {
            await get().fetchUserProfile(session.user.id);
          }
        } else {
          // User is not authenticated
          set({
            session: null,
            userProfile: null,
            authState: AuthState.UNAUTHENTICATED,
            profileFetchTimestamp: 0, // Reset timestamp on sign out
          });
        }
      },

      fetchUserProfile: async (userId) => {
        if (get().isProfileLoading) {
          console.log('[AuthStore] Profile already loading, skipping fetch.');
          return;
        }
        set({ isProfileLoading: true });
        console.log(`[AuthStore] Fetching profile for user: ${userId}`);
        try {
          const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              console.warn('[AuthStore] User profile not found for id:', userId);
              const minimalProfile = { id: userId, role: 'customer', email: get().session?.user?.email };
              set({ userProfile: minimalProfile });
            } else {
              throw error;
            }
          } else {
            console.log('[AuthStore] User profile fetched successfully.');
            set({ userProfile: profile, profileFetchTimestamp: Date.now() });
          }
        } catch (error) {
          console.error('[AuthStore] Error fetching user profile:', error);
          set({ error: 'Failed to fetch user profile.' });
          const minimalProfile = { id: userId, role: 'customer', email: get().session?.user?.email };
          set({ userProfile: minimalProfile });
        } finally {
          set({ isProfileLoading: false });
        }
      },

      signIn: async (email, password) => {
        set({ authState: AuthState.LOADING });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          console.error('[AuthStore] Sign in error:', error.message);
          set({ error: error.message, authState: AuthState.UNAUTHENTICATED });
          get().addNotification(error.message, NOTIFICATION_TYPES.ERROR);
          throw error;
        }
        // onAuthStateChange will handle the rest
      },

      signUp: async (email, password, userData) => {
        set({ authState: AuthState.LOADING });
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: userData },
        });
        if (error) {
          console.error('[AuthStore] Sign up error:', error.message);
          set({ error: error.message, authState: AuthState.UNAUTHENTICATED });
          get().addNotification(error.message, NOTIFICATION_TYPES.ERROR);
          throw error;
        }
        get().addNotification('Confirmation email sent!', NOTIFICATION_TYPES.SUCCESS);
        // onAuthStateChange will handle the rest, or user needs to confirm email
        set({ authState: AuthState.UNAUTHENTICATED });
      },

      signOut: async () => {
        set({ authState: AuthState.LOADING });
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('[AuthStore] Sign out error:', error.message);
          // Still force clear the session on the client
        }
        // onAuthStateChange will clear the state
      },

      // Notification helpers
      addNotification: (message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
        const id = Date.now().toString();
        const notification = { id, message, type };
        set((state) => ({ notifications: [...state.notifications, notification] }));
        setTimeout(() => get().dismissNotification(id), duration);
      },

      dismissNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
    }),
    {
      name: 'adera-auth-storage',
  storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        // Persist only the session and userProfile. authState should not be persisted.
        session: state.session,
        userProfile: state.userProfile,
        profileFetchTimestamp: state.profileFetchTimestamp, // Persist timestamp to prevent immediate refetch on app restart
      }),
      version: 4, // Increment version due to storage change and state structure
    }
  )
);
