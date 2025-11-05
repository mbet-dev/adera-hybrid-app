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
  
  // Use refs to track state updates and prevent unnecessary re-renders
  const stateRef = React.useRef({
    session: null,
    user: null,
    profile: null,
    authState: AuthState.LOADING,
    lastUpdate: Date.now(),
    pendingUpdates: false
  });
  
  // Batch state updates to prevent cascading re-renders
  const batchStateUpdate = React.useCallback((updates) => {
    if (stateRef.current.pendingUpdates) return;
    stateRef.current.pendingUpdates = true;
    
    // Use RAF to batch updates in the next frame
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        const now = Date.now();
        if (now - stateRef.current.lastUpdate < 100) {
          // Debounce rapid updates
          setTimeout(() => {
            stateRef.current.pendingUpdates = false;
            batchStateUpdate(updates);
          }, 100);
          return;
        }
        
        Object.entries(updates).forEach(([key, value]) => {
          if (key === 'session') setSession(value);
          if (key === 'user') setUser(value);
          if (key === 'profile') setUserProfile(value);
          if (key === 'authState') setAuthState(value);
          stateRef.current[key] = value;
        });
        
        stateRef.current.lastUpdate = now;
        stateRef.current.pendingUpdates = false;
      });
    } else {
      // Fallback for non-web platforms
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'session') setSession(value);
        if (key === 'user') setUser(value);
        if (key === 'profile') setUserProfile(value);
        if (key === 'authState') setAuthState(value);
        stateRef.current[key] = value;
      });
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

  useEffect(() => {
    let isMounted = true;
    
    // Reset abort flag on mount
    if (typeof window !== 'undefined') {
      window._profileFetchAborted = false;
    }

    const initializeAuth = async () => {
      try {
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
            if (!cachedProfile) {
              setAuthState(AuthState.AUTHENTICATED);
              // Don't set default role here - let fetchUserProfile set it from database
              setUserProfile({ id: session.user.id, role: null });
            }
            fetchUserProfile(session.user.id);
          } else {
            setAuthState(AuthState.UNAUTHENTICATED);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) setAuthState(AuthState.UNAUTHENTICATED);
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
        
        // Prevent rapid state updates
        if (typeof window !== 'undefined') {
          if (window._lastAuthUpdate && Date.now() - window._lastAuthUpdate < 100) {
            console.log('[AuthProvider] Debouncing rapid auth update');
            return;
          }
          window._lastAuthUpdate = Date.now();
        }
        
        if (session?.user) {
          console.log('[AuthProvider] ✅ User authenticated:', event, 'email:', session.user.email);
          
          // Batch state updates
          batchStateUpdate({
            session: session,
            user: session.user,
            profile: { id: session.user.id, role: null },
            authState: AuthState.AUTHENTICATED
          });
          
          // Handle side effects after state update
          await ensureUserProfileExists(session.user, session.user.user_metadata);
          await touchLastLogin(session.user.id);
          fetchUserProfile(session.user.id);
          
          if (event === 'SIGNED_IN') {
            addNotification(`Welcome back! You've signed in successfully.`, NOTIFICATION_TYPES.SUCCESS);
          }
        } else {
          console.log('[AuthProvider] 🚪 User signed out, event:', event);
          
          // Batch state updates for sign out
          batchStateUpdate({
            session: null,
            user: null,
            profile: null,
            authState: AuthState.UNAUTHENTICATED
          });
          
          console.log('[AuthProvider] Auth state set to UNAUTHENTICATED');
        }
      }
    );

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
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

  const fetchUserProfile = async (userId, retryCount = 0) => {
    // Clear any existing fetch timer
    if (typeof window !== 'undefined' && window._authStateTimer) {
      clearTimeout(window._authStateTimer);
      window._authStateTimer = null;
    }
    
    // Check if profile fetch has been aborted (during sign out)
    if (typeof window !== 'undefined' && window._profileFetchAborted) {
      console.log('[AuthProvider] Profile fetch aborted');
      return;
    }

    try {
      console.log('[AuthProvider] fetchUserProfile: Starting for userId:', userId, 'retry:', retryCount);
      
      // First try to get the profile from local storage cache
      let cachedProfile = null;
      try {
        const cachedData = localStorage.getItem(`@adera/profile/${userId}`);
        if (cachedData) {
          cachedProfile = JSON.parse(cachedData);
          const cacheAge = Date.now() - (cachedProfile._timestamp || 0);
          if (cacheAge < 5 * 60 * 1000) { // 5 minutes cache
            console.log('[AuthProvider] Using cached profile');
            setUserProfile(cachedProfile);
            setAuthState(AuthState.AUTHENTICATED);
            return;
          }
        }
      } catch (e) {
        console.warn('[AuthProvider] Error reading profile cache:', e);
      }

      // Try to get profile from users table first (legacy system)
      const { data: legacyProfile, error: legacyError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (legacyError && legacyError.code !== 'PGRST116') {
        console.error('[AuthProvider] Error fetching user profile from users:', legacyError);
      }

      let profile;
      if (legacyProfile) {
        console.log('[AuthProvider] Found legacy profile with role:', legacyProfile.role);
        
        // Check if profile is meaningfully different before updating
        const newProfile = {
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
        
        // Compare with current profile
        const currentProfile = stateRef.current.profile;
        const hasChanged = !currentProfile ||
          currentProfile.role !== newProfile.role ||
          currentProfile.email !== newProfile.email ||
          currentProfile.full_name !== newProfile.full_name ||
          currentProfile.phone !== newProfile.phone ||
          currentProfile.language !== newProfile.language ||
          currentProfile.avatar_url !== newProfile.avatar_url ||
          currentProfile.email_confirmed !== newProfile.email_confirmed;
          
        if (hasChanged) {
          profile = newProfile;
        } else {
          console.log('[AuthProvider] Profile unchanged, skipping update');
          return;
        }

        // Cache the profile
        try {
          localStorage.setItem(`@adera/profile/${userId}`, JSON.stringify(profile));
        } catch (e) {
          console.warn('[AuthProvider] Error caching profile:', e);
        }

      } else if (!profile) {
        // If no profile found and within retry limit, wait and retry
        if (retryCount < 2) {
          const delay = (retryCount + 1) * 2000;
          console.log(`[AuthProvider] Profile not found, retrying in ${delay}ms...`);
          
          return new Promise((resolve) => {
            window._authStateTimer = setTimeout(() => {
              if (!window._profileFetchAborted) {
                resolve(fetchUserProfile(userId, retryCount + 1));
              }
            }, delay);
          });
        }

        // Last resort: create minimal profile
        console.warn('[AuthProvider] Creating minimal profile with default customer role');
        profile = {
          id: userId,
          role: 'customer',
          email: user?.email,
          language: 'en',
          _timestamp: Date.now()
        };

        // Cache the minimal profile
        try {
          localStorage.setItem(`@adera/profile/${userId}`, JSON.stringify(profile));
        } catch (e) {
          console.warn('[AuthProvider] Error caching minimal profile:', e);
        }
      }

      // Check again for abort before setting state
      if (!window._profileFetchAborted) {
        console.log('[AuthProvider] Setting user profile with role:', profile.role);
        setUserProfile(profile);
        setAuthState(AuthState.AUTHENTICATED);
      }

    } catch (error) {
      console.error('[AuthProvider] Error in fetchUserProfile:', error);
      
      if (retryCount < 2 && !window._profileFetchAborted) {
        const delay = (retryCount + 1) * 3000;
        console.log(`[AuthProvider] Network error, retrying in ${delay}ms...`);
        
        return new Promise((resolve) => {
          window._authStateTimer = setTimeout(() => {
            if (!window._profileFetchAborted) {
              resolve(fetchUserProfile(userId, retryCount + 1));
            }
          }, delay);
        });
      }
      
      // Keep user authenticated with minimal profile
      if (!window._profileFetchAborted) {
        console.warn('[AuthProvider] Falling back to minimal profile after retries');
        const minimalProfile = {
          id: userId,
          role: 'customer',
          email: user?.email,
          language: 'en',
          _timestamp: Date.now()
        };
        
        setUserProfile(minimalProfile);
        setAuthState(AuthState.AUTHENTICATED);
        
        // Cache the minimal profile
        try {
          localStorage.setItem(`@adera/profile/${userId}`, JSON.stringify(minimalProfile));
        } catch (e) {
          console.warn('[AuthProvider] Error caching fallback profile:', e);
        }
      }
    }
  };

  const signIn = async (email, password) => {
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
      
      // Pass metadata from the user object itself upon sign-in
      await ensureUserProfileExists(data.user, data.user.user_metadata);
      await touchLastLogin(data.user.id);
      // Fetch profile to populate role for routing ASAP
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
      
      // 0. Abort any pending profile fetch
      if (typeof window !== 'undefined') {
        window._profileFetchAborted = true;
        if (window._authStateTimer) {
          clearTimeout(window._authStateTimer);
          window._authStateTimer = null;
        }
      }
      
      // 1. Clear Supabase auth state first
      console.log('[AuthProvider] Calling supabase.auth.signOut()');
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) {
        console.error('[AuthProvider] ❌ Sign out error from Supabase:', signOutError);
        throw signOutError;
      }

      // 2. Clear storage based on platform
      try {
        console.log('[AuthProvider] Clearing storage (preserving theme/language)');
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          try {
            // Web storage handling
            const preserveKeys = [
              '@adera/preferences/themeMode',
              '@adera/preferences/language',
              '@adera/lastUsedLocale'
            ];
            
            // Save preferences from localStorage if available
            if (window.localStorage) {
              // Get all keys
              const keys = [];
              for (let i = 0; i < localStorage.length; i++) {
                keys.push(localStorage.key(i));
              }
              
              // Remove all non-preserved keys
              keys.forEach(key => {
                if (!preserveKeys.includes(key) && !key.startsWith('@supabase.auth.refreshToken')) {
                  localStorage.removeItem(key);
                }
              });
            }

            // Clear sessionStorage if available
            if (window.sessionStorage) {
              sessionStorage.clear();
            }
          } catch (webStorageError) {
            console.warn('[AuthProvider] Web storage clearing error:', webStorageError);
          }
        } else {
          // React Native AsyncStorage handling
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const keys = await AsyncStorage.getAllKeys();
            const preserveKeys = [
              '@adera/preferences/themeMode',
              '@adera/preferences/language'
            ];
            
            // Get keys to remove (excluding preserved keys)
            const keysToRemove = keys.filter(key => !preserveKeys.includes(key));
            if (keysToRemove.length > 0) {
              await AsyncStorage.multiRemove(keysToRemove);
            }
          } catch (asyncStorageError) {
            console.warn('[AuthProvider] AsyncStorage clearing error:', asyncStorageError);
          }
        }
      } catch (storageError) {
        console.warn('[AuthProvider] Storage clearing error:', storageError);
      }

      // 3. Clear auth state
      setAuthState(AuthState.UNAUTHENTICATED);
      setSession(null);
      setUser(null);
      setUserProfile(null);
      setNotifications([]);

      // 4. Platform specific cleanup
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          // Clear any queued timers
          const existingTimers = window._aderaTimers || [];
          existingTimers.forEach(timer => {
            if (timer) clearTimeout(timer);
          });
          window._aderaTimers = [];
        } catch (timerError) {
          console.warn('[AuthProvider] Timer cleanup error:', timerError);
        }
      }

      // Add success notification
      addNotification('Signed out successfully', NOTIFICATION_TYPES.SUCCESS);
      console.log('[AuthProvider] ✅ Sign out complete');
      
      return { success: true };
    } catch (error) {
      console.error('[AuthProvider] ❌ Sign out exception:', error);
      
      // Ensure cleanup even on error
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
