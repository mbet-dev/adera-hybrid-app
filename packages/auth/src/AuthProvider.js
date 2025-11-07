import React, { createContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { AuthState, UserRole } from './types';
import { WebStabilityWrapper } from './WebStabilityWrapper';

export const AuthContext = createContext();


// Notification type constants
const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authState, setAuthState] = useState(AuthState.LOADING);
  const [notifications, setNotifications] = useState([]);
  const [profileError, setProfileError] = useState(null);
  
  // Use refs to track state and manage request cancellation
  const stateRef = React.useRef({
    session: null,
    user: null,
    profile: null,
    authState: AuthState.LOADING,
    currentUserId: null,
    profileFetchController: null,
    profileFetchTimeout: null,
    roleLoadTimeout: null
  });
  
  // Cancel any pending profile fetch
  const cancelProfileFetch = React.useCallback(() => {
    if (stateRef.current.profileFetchController) {
      stateRef.current.profileFetchController.abort();
      stateRef.current.profileFetchController = null;
    }
    if (stateRef.current.profileFetchTimeout) {
      clearTimeout(stateRef.current.profileFetchTimeout);
      stateRef.current.profileFetchTimeout = null;
    }
    if (stateRef.current.roleLoadTimeout) {
      clearTimeout(stateRef.current.roleLoadTimeout);
      stateRef.current.roleLoadTimeout = null;
    }
  }, []);
  
  // Invalidate cache for a specific user
  const invalidateProfileCache = React.useCallback((userId) => {
    if (!userId) return;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(`@adera/profile/${userId}`);
      } else {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        AsyncStorage.removeItem(`@adera/profile/${userId}`);
      }
    } catch (e) {
      console.warn('[AuthProvider] Error invalidating cache:', e);
    }
  }, []);

  // Function to add a notification
  const addNotification = (message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      dismissNotification(id);
    }, duration);
    return id;
  };

  // Function to dismiss a notification
  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Define fetchUserProfile before useEffect that uses it
  const fetchUserProfile = React.useCallback(async (userId, retryCount = 0) => {
    // Cancel any existing profile fetch
    cancelProfileFetch();
    
    // Verify this is still the current user
    if (stateRef.current.currentUserId !== userId) {
      console.log('[AuthProvider] User changed during fetch, aborting');
      return;
    }

    // Create new AbortController for this fetch
    const controller = new AbortController();
    stateRef.current.profileFetchController = controller;

    try {
      console.log('[AuthProvider] fetchUserProfile: Starting for userId:', userId, 'retry:', retryCount);
      
      // Get current user email from stateRef for timeout fallback
      const currentUserEmail = stateRef.current.user?.email || '';
      
      // Set timeout for role loading (10 seconds max)
      if (!retryCount) {
        stateRef.current.roleLoadTimeout = setTimeout(() => {
          if (stateRef.current.currentUserId === userId && !stateRef.current.profile?.role) {
            console.warn('[AuthProvider] Role loading timeout, using default customer role');
            const timeoutProfile = {
              id: userId,
              role: 'customer',
              email: currentUserEmail,
              language: 'en',
              _timestamp: Date.now()
            };
            setUserProfile(timeoutProfile);
            setAuthState(AuthState.AUTHENTICATED);
          }
        }, 10000);
      }
      
      // First try to get the profile from local storage cache
      let cachedProfile = null;
      try {
        const storage = typeof window !== 'undefined' && window.localStorage 
          ? window.localStorage 
          : require('@react-native-async-storage/async-storage').default;
        
        const cachedData = typeof window !== 'undefined' && window.localStorage
          ? localStorage.getItem(`@adera/profile/${userId}`)
          : await storage.getItem(`@adera/profile/${userId}`);
          
        if (cachedData) {
          cachedProfile = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
          const cacheAge = Date.now() - (cachedProfile._timestamp || 0);
          if (cacheAge < 5 * 60 * 1000) { // 5 minutes cache
            console.log('[AuthProvider] Using cached profile');
            // Verify user hasn't changed
            if (stateRef.current.currentUserId === userId && !controller.signal.aborted) {
              stateRef.current.profile = cachedProfile;
              setUserProfile(cachedProfile);
              setAuthState(AuthState.AUTHENTICATED);
              if (stateRef.current.roleLoadTimeout) {
                clearTimeout(stateRef.current.roleLoadTimeout);
                stateRef.current.roleLoadTimeout = null;
              }
            }
            return;
          }
        }
      } catch (e) {
        console.warn('[AuthProvider] Error reading profile cache:', e);
      }

      // Check if aborted before making network request
      if (controller.signal.aborted || stateRef.current.currentUserId !== userId) {
        return;
      }

      // Try to get profile from users table
      const { data: legacyProfile, error: legacyError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Check again if aborted or user changed
      if (controller.signal.aborted || stateRef.current.currentUserId !== userId) {
        return;
      }

      if (legacyError && legacyError.code !== 'PGRST116') {
        console.error('[AuthProvider] Error fetching user profile from users:', legacyError);
      }

      let profile;
      if (legacyProfile) {
        console.log('[AuthProvider] Found legacy profile with role:', legacyProfile.role);
        
        profile = {
          id: legacyProfile.id,
          email: legacyProfile.email,
          full_name: `${legacyProfile.first_name || ''} ${legacyProfile.last_name || ''}`.trim(),
          phone: legacyProfile.phone,
          role: legacyProfile.role || 'customer',
          language: legacyProfile.language || 'en',
          avatar_url: legacyProfile.avatar_url,
          email_confirmed: legacyProfile.is_verified,
          phone_confirmed: false,
          _timestamp: Date.now()
        };

        // Cache the profile
        try {
          const storage = typeof window !== 'undefined' && window.localStorage 
            ? window.localStorage 
            : require('@react-native-async-storage/async-storage').default;
          
          const profileStr = JSON.stringify(profile);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(`@adera/profile/${userId}`, profileStr);
          } else {
            await storage.setItem(`@adera/profile/${userId}`, profileStr);
          }
        } catch (e) {
          console.warn('[AuthProvider] Error caching profile:', e);
        }

      } else {
        // If no profile found and within retry limit, wait and retry
        if (retryCount < 2) {
          const delay = (retryCount + 1) * 2000;
          console.log(`[AuthProvider] Profile not found, retrying in ${delay}ms...`);
          
          stateRef.current.profileFetchTimeout = setTimeout(() => {
            if (!controller.signal.aborted && stateRef.current.currentUserId === userId) {
              fetchUserProfile(userId, retryCount + 1);
            }
          }, delay);
          return;
        }

        // Last resort: create minimal profile
        const currentUserEmail = stateRef.current.user?.email || '';
        console.warn('[AuthProvider] Creating minimal profile with default customer role');
        profile = {
          id: userId,
          role: 'customer',
          email: currentUserEmail,
          language: 'en',
          _timestamp: Date.now()
        };

        // Cache the minimal profile
        try {
          const storage = typeof window !== 'undefined' && window.localStorage 
            ? window.localStorage 
            : require('@react-native-async-storage/async-storage').default;
          
          const profileStr = JSON.stringify(profile);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(`@adera/profile/${userId}`, profileStr);
          } else {
            await storage.setItem(`@adera/profile/${userId}`, profileStr);
          }
        } catch (e) {
          console.warn('[AuthProvider] Error caching minimal profile:', e);
        }
      }

      // Final check before setting state
      if (!controller.signal.aborted && stateRef.current.currentUserId === userId) {
        console.log('[AuthProvider] Setting user profile with role:', profile.role);
        stateRef.current.profile = profile;
        setUserProfile(profile);
        setAuthState(AuthState.AUTHENTICATED);
        
        // Clear timeout
        if (stateRef.current.roleLoadTimeout) {
          clearTimeout(stateRef.current.roleLoadTimeout);
          stateRef.current.roleLoadTimeout = null;
        }
      }

    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError' || controller.signal.aborted) {
        console.log('[AuthProvider] Profile fetch aborted');
        return;
      }
      
      console.error('[AuthProvider] Error in fetchUserProfile:', error);
      
      // Check if user changed or aborted
      if (stateRef.current.currentUserId !== userId || controller.signal.aborted) {
        return;
      }
      
      if (retryCount < 2) {
        const delay = (retryCount + 1) * 3000;
        console.log(`[AuthProvider] Network error, retrying in ${delay}ms...`);
        
        stateRef.current.profileFetchTimeout = setTimeout(() => {
          if (!controller.signal.aborted && stateRef.current.currentUserId === userId) {
            fetchUserProfile(userId, retryCount + 1);
          }
        }, delay);
        return;
      }
      
      // Fallback to minimal profile
      const currentUserEmail = stateRef.current.user?.email || '';
      console.warn('[AuthProvider] Falling back to minimal profile after retries');
      const minimalProfile = {
        id: userId,
        role: 'customer',
        email: currentUserEmail,
        language: 'en',
        _timestamp: Date.now()
      };
      
      if (!controller.signal.aborted && stateRef.current.currentUserId === userId) {
        stateRef.current.profile = minimalProfile;
        setUserProfile(minimalProfile);
        setAuthState(AuthState.AUTHENTICATED);
        
        // Cache the minimal profile
        try {
          const storage = typeof window !== 'undefined' && window.localStorage 
            ? window.localStorage 
            : require('@react-native-async-storage/async-storage').default;
          
          const profileStr = JSON.stringify(minimalProfile);
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(`@adera/profile/${userId}`, profileStr);
          } else {
            await storage.setItem(`@adera/profile/${userId}`, profileStr);
          }
        } catch (e) {
          console.warn('[AuthProvider] Error caching fallback profile:', e);
        }
        
        // Clear timeout
        if (stateRef.current.roleLoadTimeout) {
          clearTimeout(stateRef.current.roleLoadTimeout);
          stateRef.current.roleLoadTimeout = null;
        }
      }
      setProfileError(error);
    } finally {
      // Clean up controller if this was the active fetch
      if (stateRef.current.profileFetchController === controller) {
        stateRef.current.profileFetchController = null;
      }
    }
  }, [cancelProfileFetch, invalidateProfileCache]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Cancel any existing profile fetch
        cancelProfileFetch();

        // First try to get cached profile if available
        let cachedProfile = null;
        if (typeof window !== 'undefined') {
          try {
            const sessionStr = localStorage.getItem('@supabase.auth.token');
            if (sessionStr) {
              const sessionData = JSON.parse(sessionStr);
              if (sessionData?.user?.id) {
                const cachedProfileStr = localStorage.getItem(`@adera/profile/${sessionData.user.id}`);
                if (cachedProfileStr) {
                  cachedProfile = JSON.parse(cachedProfileStr);
                  const cacheAge = Date.now() - (cachedProfile._timestamp || 0);
                  if (cacheAge < 5 * 60 * 1000) { // 5 minutes cache
                    console.log('[AuthProvider] Using cached profile during init');
                    if (isMounted) {
                      stateRef.current.currentUserId = sessionData.user.id;
                      setUserProfile(cachedProfile);
                      setAuthState(AuthState.AUTHENTICATED);
                    }
                  }
                }
              }
            }
          } catch (e) {
            console.warn('[AuthProvider] Error reading cached profile:', e);
          }
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('[AuthProvider] Session found, fetching user profile for:', session.user.email);
            stateRef.current.currentUserId = session.user.id;
            stateRef.current.user = session.user;
            
            if (!cachedProfile) {
              setAuthState(AuthState.AUTHENTICATED);
              // Set temporary profile with null role to trigger loading state
              setUserProfile({ id: session.user.id, role: null });
            }
            
            // Fetch fresh profile
            fetchUserProfile(session.user.id);
          } else {
            stateRef.current.currentUserId = null;
            stateRef.current.user = null;
            setAuthState(AuthState.UNAUTHENTICATED);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          stateRef.current.currentUserId = null;
          setAuthState(AuthState.UNAUTHENTICATED);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthProvider] ⚡ Auth state changed:', event, 'session:', session ? 'exists' : 'null');
        if (!isMounted) {
          console.log('[AuthProvider] Component unmounted, ignoring auth state change');
          return;
        }
        
        // Cancel any pending profile fetch when auth state changes
        cancelProfileFetch();
        
        if (session?.user) {
          const newUserId = session.user.id;
          const previousUserId = stateRef.current.currentUserId;
          
          console.log('[AuthProvider] ✅ User authenticated:', event, 'email:', session.user.email);
          
          // If switching users, invalidate old user's cache
          if (previousUserId && previousUserId !== newUserId) {
            console.log('[AuthProvider] User switched, invalidating previous user cache');
            invalidateProfileCache(previousUserId);
          }
          
          // Update current user ID
          stateRef.current.currentUserId = newUserId;
          
          // Update state immediately
          stateRef.current.user = session.user;
          setSession(session);
          setUser(session.user);
          setAuthState(AuthState.AUTHENTICATED);
          // Set temporary profile with null role to show loading state
          setUserProfile({ id: newUserId, role: null });
          
          // Handle side effects
          await ensureUserProfileExists(session.user, session.user.user_metadata);
          await touchLastLogin(newUserId);
          
          // Fetch fresh profile (will cancel any existing fetch)
          fetchUserProfile(newUserId);
          
          if (event === 'SIGNED_IN') {
            addNotification(`Welcome back! You've signed in successfully.`, NOTIFICATION_TYPES.SUCCESS);
          }
        } else {
          console.log('[AuthProvider] 🚪 User signed out, event:', event);
          
          // Invalidate cache for the user being signed out
          if (stateRef.current.currentUserId) {
            invalidateProfileCache(stateRef.current.currentUserId);
          }
          
          // Clear state
          stateRef.current.currentUserId = null;
          stateRef.current.user = null;
          stateRef.current.profile = null;
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setAuthState(AuthState.UNAUTHENTICATED);
          
          console.log('[AuthProvider] Auth state set to UNAUTHENTICATED');
        }
      }
    );

    return () => {
      isMounted = false;
      cancelProfileFetch();
      subscription?.unsubscribe();
    };
  }, [cancelProfileFetch, fetchUserProfile]);

  // [PATCH] Periodically refresh session every 5 minutes on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const refreshTimer = setInterval(() => {
        supabase.auth.refreshSession();
      }, 5 * 60 * 1000); // 5 min
      return () => clearInterval(refreshTimer);
    }
  }, []);

  const ensureUserProfileExists = async (authUser, metadata = {}) => {
    try {
      console.log('[AuthProvider] Ensuring user profile exists for:', authUser.email);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, is_verified')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('ensureUserProfileExists: select error', error);
        return;
      }

      if (!data) {
        // User profile doesn't exist, create it with metadata from signup
        const profileData = {
          id: authUser.id,
          email: authUser.email,
          is_verified: !!authUser.email_confirmed_at,
          is_active: true,
          first_name: metadata?.first_name,
          last_name: metadata?.last_name,
          phone: metadata?.phone,
          role: metadata?.role || 'customer',
        };
        
        console.log('[AuthProvider] Creating user profile with data:', profileData);
        
        const { error: insertError } = await supabase.from('users').insert(profileData);
        if (insertError) {
          console.error('ensureUserProfileExists: insert error', insertError);
          // If it's a duplicate key error, the trigger might have already created it
          if (insertError.code === '23505') {
            console.log('[AuthProvider] User profile already exists (duplicate key)');
          }
        } else {
          console.log('[AuthProvider] User profile created successfully');
        }
      } else {
        console.log('[AuthProvider] User profile already exists, verified:', data.is_verified);
      }
    } catch (e) {
      console.error('ensureUserProfileExists: unexpected error', e);
    }
  };

  const touchLastLogin = async (userId) => {
    try {
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (e) {
      // Non-fatal
    }
  };

  const signIn = async (email, password) => {
    // Cancel any pending profile fetch
    cancelProfileFetch();
    
    // First, try to refresh any existing session to ensure we have latest auth state
    try {
      await supabase.auth.refreshSession();
    } catch (refreshError) {
      // Ignore refresh errors, continue with sign in
      console.log('Session refresh before sign in:', refreshError?.message);
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      
      // Handle 'Email not confirmed' error specifically
      if (error.message.includes('Email not confirmed') || error.message.includes('EMAIL_NOT_CONFIRMED')) {
        throw new Error('EMAIL_NOT_CONFIRMED');
      }
      
      // Handle other common errors
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('INVALID_CREDENTIALS');
      }
      
      if (error.message.includes('Too many requests')) {
        throw new Error('TOO_MANY_REQUESTS');
      }
      
      throw error;
    }

    // Best-effort: ensure profile exists and update last login
    if (data?.user) {
      console.log('Sign in successful, user:', data.user.email, 'confirmed:', !!data.user.email_confirmed_at);
      
      // Update current user ID and user reference
      stateRef.current.currentUserId = data.user.id;
      stateRef.current.user = data.user;
      
      // Pass metadata from the user object itself upon sign-in
      await ensureUserProfileExists(data.user, data.user.user_metadata);
      await touchLastLogin(data.user.id);
      
      // Fetch profile to populate role for routing ASAP
      // Note: onAuthStateChange will also trigger, but this ensures immediate fetch
      fetchUserProfile(data.user.id);
    }
    return data;
  };

  const signUp = async (email, password, userData = {}) => {
    // Determine redirect URL based on platform
    const getRedirectUrl = () => {
      // Allow overriding via env (paste the exact Expo URL, e.g., exp://192.168.1.11:8081)
      if (process.env.EXPO_PUBLIC_APP_URL) {
        return `${process.env.EXPO_PUBLIC_APP_URL.replace(/\/?$/, '')}/auth/callback`;
      }
      try {
        const Linking = require('expo-linking');
        return Linking.createURL('auth/callback');
      } catch (e) {
        if (typeof window !== 'undefined' && window.location && window.location.origin) {
          return `${window.location.origin}/auth/callback`;
        }
        return 'adera://auth/callback';
      }
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo: getRedirectUrl(),
      },
    });

    if (error) throw error;

    // After successful signup, immediately try to create the user profile as a fallback
    if (data.user) {
      await ensureUserProfileExists(data.user, userData);
      // Add notification for successful signup and email sent
      addNotification(`Account created! A confirmation email has been sent to ${email}.`, NOTIFICATION_TYPES.INFO, 7000);
    }
    
    return data;
  };

  const signOut = async () => {
    try {
      console.log('[AuthProvider] 🚪 signOut: Starting sign out process');
      
      // 0. Cancel any pending profile fetch
      cancelProfileFetch();
      
      // 1. Invalidate cache for current user
      if (stateRef.current.currentUserId) {
        invalidateProfileCache(stateRef.current.currentUserId);
      }
      
      // 2. Clear Supabase auth state first
      console.log('[AuthProvider] Calling supabase.auth.signOut()');
      const { error: signOutError } = await supabase.auth.signOut();
      
      // 3. Clear local auth state and storage
      const { clearAuthState } = require('./clearAuthState');
      await clearAuthState();
      
      if (signOutError) {
        console.error('[AuthProvider] ❌ Sign out error from Supabase:', signOutError);
        throw signOutError;
      }

      // 4. Clear app storage but preserve preferences
      try {
        console.log('[AuthProvider] Clearing app storage (preserving theme/language)');
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          try {
            const preserveKeys = [
              '@adera/preferences/themeMode',
              '@adera/preferences/language',
              '@adera/lastUsedLocale'
            ];
            
            if (window.localStorage) {
              const keys = [];
              for (let i = 0; i < localStorage.length; i++) {
                keys.push(localStorage.key(i));
              }
              
              keys.forEach(key => {
                if (!preserveKeys.includes(key) && 
                    !key.startsWith('@supabase.auth.') && // Skip auth keys (already cleared)
                    !key.includes('@adera/profile/')) {  // Skip profile keys (already cleared)
                  localStorage.removeItem(key);
                }
              });
            }

            if (window.sessionStorage) {
              sessionStorage.clear();
            }
          } catch (webStorageError) {
            console.warn('[AuthProvider] Web storage clearing error:', webStorageError);
          }
        } else {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const keys = await AsyncStorage.getAllKeys();
          const preserveKeys = [
            '@adera/preferences/themeMode',
            '@adera/preferences/language'
          ];
          
          const keysToRemove = keys.filter(key => 
            !preserveKeys.includes(key) && 
            !key.startsWith('@supabase.auth.') && // Skip auth keys (already cleared)
            !key.includes('@adera/profile/') // Skip profile keys (already cleared)
          );
          
          if (keysToRemove.length > 0) {
            await AsyncStorage.multiRemove(keysToRemove);
          }
        }
      } catch (storageError) {
        console.warn('[AuthProvider] App storage clearing error:', storageError);
      }

      // 5. Clear auth state
      stateRef.current.currentUserId = null;
      stateRef.current.profile = null;
      setAuthState(AuthState.UNAUTHENTICATED);
      setSession(null);
      setUser(null);
      setUserProfile(null);
      setNotifications([]);

      // 6. Platform specific cleanup
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Aggressive web onboarding redirect for web after signout;
        setTimeout(() => {
          window.location.replace('/');
        }, 200);
      }

      // Add success notification
      addNotification('Signed out successfully', NOTIFICATION_TYPES.SUCCESS);
      console.log('[AuthProvider] ✅ Sign out complete');
      
      return { success: true };
    } catch (error) {
      console.error('[AuthProvider] ❌ Sign out exception:', error);
      
      // Ensure cleanup even on error
      cancelProfileFetch();
      stateRef.current.currentUserId = null;
      stateRef.current.profile = null;
      setAuthState(AuthState.UNAUTHENTICATED);
      setSession(null);
      setUser(null);
      setUserProfile(null);
      setNotifications([]);
      
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setUserProfile(data);
    return data;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' && window.location && window.location.origin
        ? `${window.location.origin}/reset-password`
        : `${process.env.EXPO_PUBLIC_SUPABASE_URL}/reset-password`,
    });

    if (error) throw error;
    // Add notification for password reset email sent
    addNotification(`Password reset email sent to ${email}. Check your inbox for instructions.`, NOTIFICATION_TYPES.INFO, 7000);
    return { success: true };
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { success: true };
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return;
    }

    setSession(data.session);
    setUser(data.session?.user ?? null);
  };

  const verifyOTP = async (phone, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) throw error;
    return data;
  };

  const sendOTP = async (phone) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw error;
    return { success: true };
  };


  const checkEmailConfirmationStatus = async () => {
    try {
      // First try to get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return { confirmed: false, error: sessionError };
      }
      
      if (session?.user) {
        // Check if email is confirmed
        const isConfirmed = !!session.user.email_confirmed_at;
        console.log('Email confirmation status:', isConfirmed, 'for user:', session.user.email);
        return { confirmed: isConfirmed, user: session.user };
      }
      
      return { confirmed: false };
    } catch (error) {
      console.error('Error checking email confirmation:', error);
      return { confirmed: false, error };
    }
  };

  const resendConfirmationEmail = async (email) => {
    // Determine redirect URL based on platform
    const getRedirectUrl = () => {
      if (process.env.EXPO_PUBLIC_APP_URL) {
        return `${process.env.EXPO_PUBLIC_APP_URL.replace(/\/?$/, '')}/auth/callback`;
      }
      try {
        const Linking = require('expo-linking');
        return Linking.createURL('auth/callback');
      } catch (e) {
        if (typeof window !== 'undefined' && window.location && window.location.origin) {
          return `${window.location.origin}/auth/callback`;
        }
        return 'adera://auth/callback';
      }
    };

    console.log('Resending confirmation email to:', email);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    });

    if (error) {
      console.error('Resend confirmation error:', error);
      throw error;
    }
    
    console.log('Confirmation email sent successfully');
    // Add notification for email resent
    addNotification(`Confirmation email resent to ${email}. Check your inbox.`, NOTIFICATION_TYPES.INFO, 7000);
    return { success: true };
  };

  const value = {
    session,
    user,
    userProfile,
    authState,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    isLoading: authState === AuthState.LOADING,
    role: userProfile?.role || null,
    notifications,
    dismissNotification,
    profileError,
    // Auth methods
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword,
    refreshSession,
    checkEmailConfirmationStatus,
    // OTP methods
    sendOTP,
    verifyOTP,
    resendConfirmationEmail,
  };

  // Wrap provider with stability wrapper for web platform
  const Wrapper = Platform.OS === 'web' ? WebStabilityWrapper : React.Fragment;

  return (
    <Wrapper>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </Wrapper>
  );
};

export default AuthProvider;
