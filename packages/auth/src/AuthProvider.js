import React, { createContext, useEffect } from 'react';
import { useAuthStore } from './authStore';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { AuthState, UserRole } from './types';
import { WebStabilityWrapper } from './WebStabilityWrapper';
import { ProfileLoadTimeoutScreen } from './ProfileLoadTimeoutScreen';

export const AuthContext = createContext();


// Notification type constants
const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

const AuthProvider = ({ children }) => {
  const {
    session,
    user,
    userProfile,
    authState,
    notifications,
    setSession,
    setUser,
    setUserProfile,
    setAuthState,
    addNotification: storeAddNotification,
    dismissNotification: storeDismissNotification,
    clearAuth,
  } = useAuthStore();
  const [profileError, setProfileError] = React.useState(null);
  const [showTimeoutScreen, setShowTimeoutScreen] = React.useState(false);

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

  // Helper wrappers around store actions
  const addNotification = (message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    const id = Date.now().toString();
    storeAddNotification({ id, message, type, duration });
    setTimeout(() => {
      storeDismissNotification(id);
    }, duration);
    return id;
  };

  const dismissNotification = (id) => {
    storeDismissNotification(id);
  };

  // ---- END notification helpers ----

  // Timeout guard for profile loading
  const PROFILE_LOAD_TIMEOUT = 8000; // 8 seconds
  const startProfileTimeout = React.useCallback(() => {
    const timeoutId = setTimeout(() => {
      if (authState === AuthState.AUTHENTICATED && !userProfile?.role) {
        console.warn('[AuthProvider] Profile load timeout reached');
        setShowTimeoutScreen(true);
      }
    }, PROFILE_LOAD_TIMEOUT);
    return timeoutId;
  }, [authState, userProfile]);

  const clearProfileTimeout = React.useCallback((timeoutId) => {
    if (timeoutId) clearTimeout(timeoutId);
  }, []);

  // Define handleProfileRetry after fetchUserProfile to avoid hoisting issues
  // We'll declare it as a function that will be initialized after fetchUserProfile


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
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          // Web: Use localStorage synchronously
          const cachedData = localStorage.getItem(`@adera/profile/${userId}`);
          if (cachedData) {
            cachedProfile = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
          }
        } else {
          // Native: Use AsyncStorage asynchronously
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const cachedData = await AsyncStorage.getItem(`@adera/profile/${userId}`);
            if (cachedData) {
              cachedProfile = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
            }
          } catch (asyncError) {
            // Silently fail if AsyncStorage is not available
            console.warn('[AuthProvider] AsyncStorage not available:', asyncError);
          }
        }
          
        if (cachedProfile) {
          const cacheAge = Date.now() - (cachedProfile._timestamp || 0);
          if (cacheAge < 10 * 60 * 1000) { // 10 minutes cache
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
        // Silently fail cache read - not critical
        console.warn('[AuthProvider] Error reading profile cache:', e.message || e);
      }

      // Check if aborted before making network request
      if (controller.signal.aborted || stateRef.current.currentUserId !== userId) {
        return;
      }

      // Try to get profile from users table
      let profile, error;
      try {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        profile = result.data;
        error = result.error;
        
        // Check again if aborted or user changed
        if (controller.signal.aborted || stateRef.current.currentUserId !== userId) {
          return;
        }

        if (error && error.code !== 'PGRST116') {
          console.error('[AuthProvider] Error fetching user profile from users:', error);
        }

        if (profile) {
          console.log('[AuthProvider] Found legacy profile with role:', profile.role);
          
          profile = {
            id: profile.id,
            email: profile.email,
            full_name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            phone: profile.phone,
            role: profile.role || 'customer',
            language: profile.language || 'en',
            avatar_url: profile.avatar_url,
            email_confirmed: profile.is_verified,
            phone_confirmed: false,
            _timestamp: Date.now()
          };
          // Cache the profile
          try {
            const profileStr = JSON.stringify(profile);
            if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem(`@adera/profile/${userId}`, profileStr);
            } else {
              try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.setItem(`@adera/profile/${userId}`, profileStr);
              } catch (asyncError) {
                console.warn('[AuthProvider] Error caching profile (AsyncStorage):', asyncError);
              }
            }
          } catch (e) {
            console.warn('[AuthProvider] Error caching profile:', e);
          }
        }
      } catch (supabaseError) {
        console.error('[AuthProvider] Supabase query error:', supabaseError);
        error = supabaseError;
      }

      if (!profile) {
        // Handle network errors specifically
        if (error?.message?.includes('ERR_INSUFFICIENT_RESOURCES') || 
            error?.message?.includes('network') ||
            error?.message?.includes('fetch') ||
            error?.code === 'NETWORK_ERROR') {
          console.warn('[AuthProvider] Network error detected, will retry:', error);
          // Fall through to retry logic below
        }
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
          const profileStr = JSON.stringify(profile);
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(`@adera/profile/${userId}`, profileStr);
          } else {
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.setItem(`@adera/profile/${userId}`, profileStr);
            } catch (asyncError) {
              console.warn('[AuthProvider] Error caching minimal profile (AsyncStorage):', asyncError);
            }
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
        
        // Hide timeout screen if it was shown
        setShowTimeoutScreen(false);
      }

    } catch (error) {
      // Ignore abort errors
      if (error.name === 'AbortError' || controller.signal.aborted) {
        console.log('[AuthProvider] Profile fetch aborted');
        return;
      }
      
      // Check for network errors specifically
      const isNetworkError = 
        error?.message?.includes('ERR_INSUFFICIENT_RESOURCES') ||
        error?.message?.includes('network') ||
        error?.message?.includes('fetch') ||
        error?.message?.includes('Failed to fetch') ||
        error?.code === 'NETWORK_ERROR' ||
        error?.name === 'TypeError' && error.message.includes('NetworkError');
      
      if (isNetworkError) {
        console.warn('[AuthProvider] Network error in fetchUserProfile:', error);
        
        // Check if user changed or aborted
        if (stateRef.current.currentUserId !== userId || controller.signal.aborted) {
          return;
        }
        
        // Retry network errors up to 2 times
        if (retryCount < 2) {
          const delay = (retryCount + 1) * 3000; // 3s, 6s delays for network errors
          console.log(`[AuthProvider] Network error, retrying in ${delay}ms... (attempt ${retryCount + 1}/2)`);
          
          stateRef.current.profileFetchTimeout = setTimeout(() => {
            if (!controller.signal.aborted && stateRef.current.currentUserId === userId) {
              fetchUserProfile(userId, retryCount + 1);
            }
          }, delay);
          return;
        }
        
        // After retries, fall back to minimal profile
        console.warn('[AuthProvider] Network retries exhausted, using minimal profile');
      } else {
        console.error('[AuthProvider] Error in fetchUserProfile:', error);
      }
      
      // Check if user changed or aborted for non-network errors
      if (stateRef.current.currentUserId !== userId || controller.signal.aborted) {
        return;
      }
      
      // For non-network errors or exhausted network retries, retry a few times
      if (!isNetworkError && retryCount < 2) {
        const delay = (retryCount + 1) * 3000;
        console.log(`[AuthProvider] Error, retrying in ${delay}ms...`);
        
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
          const profileStr = JSON.stringify(minimalProfile);
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(`@adera/profile/${userId}`, profileStr);
          } else {
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.setItem(`@adera/profile/${userId}`, profileStr);
            } catch (asyncError) {
              console.warn('[AuthProvider] Error caching fallback profile (AsyncStorage):', asyncError);
            }
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
  }, [cancelProfileFetch, invalidateProfileCache, startProfileTimeout]);

  // Define handlers after fetchUserProfile to avoid hoisting issues
  const handleProfileRetry = React.useCallback(() => {
    setShowTimeoutScreen(false);
    if (stateRef.current.currentUserId) {
      fetchUserProfile(stateRef.current.currentUserId);
    }
  }, [fetchUserProfile]);

  const handleSignInAgain = React.useCallback(() => {
    setShowTimeoutScreen(false);
    clearAuth();
    // Navigation will be handled by App.js when authState changes
  }, [clearAuth]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Cancel any existing profile fetch
        cancelProfileFetch();

        // First try to get cached profile if available (non-blocking)
        let cachedProfile = null;
        try {
          if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
            const sessionStr = localStorage.getItem('supabase.auth.token');
            if (sessionStr) {
              try {
                const sessionData = JSON.parse(sessionStr);
                if (sessionData?.user?.id) {
                  const cachedProfileStr = localStorage.getItem(`@adera/profile/${sessionData.user.id}`);
                  if (cachedProfileStr) {
                    cachedProfile = JSON.parse(cachedProfileStr);
                    const cacheAge = Date.now() - (cachedProfile._timestamp || 0);
                    if (cacheAge < 10 * 60 * 1000) { // 10 minutes cache
                      console.log('[AuthProvider] Using cached profile during init');
                    } else {
                      cachedProfile = null; // Cache expired
                    }
                  }
                }
              } catch (parseError) {
                console.warn('[AuthProvider] Error parsing cached data:', parseError);
              }
            }
          } else {
            // Native: Try AsyncStorage (non-blocking, with timeout)
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              const sessionStr = await Promise.race([
                AsyncStorage.getItem('supabase.auth.token'),
                new Promise((resolve) => setTimeout(() => resolve(null), 1000))
              ]);
              
              if (sessionStr) {
                try {
                  const sessionData = JSON.parse(sessionStr);
                  if (sessionData?.user?.id) {
                    const cachedProfileStr = await Promise.race([
                      AsyncStorage.getItem(`@adera/profile/${sessionData.user.id}`),
                      new Promise((resolve) => setTimeout(() => resolve(null), 1000))
                    ]);
                    
                    if (cachedProfileStr) {
                      cachedProfile = JSON.parse(cachedProfileStr);
                      const cacheAge = Date.now() - (cachedProfile._timestamp || 0);
                      if (cacheAge < 10 * 60 * 1000) {
                        console.log('[AuthProvider] Using cached profile during init (native)');
                      } else {
                        cachedProfile = null;
                      }
                    }
                  }
                } catch (parseError) {
                  console.warn('[AuthProvider] Error parsing cached data (native):', parseError);
                }
              }
            } catch (asyncError) {
              // Silently fail - not critical
              console.warn('[AuthProvider] Error reading cache (native):', asyncError.message || asyncError);
            }
          }
        } catch (e) {
          // Silently fail cache read - not critical
          console.warn('[AuthProvider] Error reading cached profile:', e.message || e);
        }

        // Set cached profile if available
        if (cachedProfile && isMounted) {
          stateRef.current.currentUserId = cachedProfile.id;
          setUserProfile(cachedProfile);
          setAuthState(AuthState.AUTHENTICATED);
        }

        // Get session with timeout protection
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session fetch timeout after 5 seconds')), 5000)
        );

        let session, error;
        try {
          const result = await Promise.race([sessionPromise, sessionTimeout]);
          session = result.data.session;
          error = result.error;
        } catch (timeoutError) {
          console.warn('[AuthProvider] Session fetch timeout or error:', timeoutError);
          // Continue without session - set to unauthenticated
          if (isMounted) {
            setAuthState(AuthState.UNAUTHENTICATED);
          }
          return;
        }

        if (error) {
          console.warn('[AuthProvider] Session error (non-critical):', error);
          // Don't throw - set to unauthenticated instead
          if (isMounted) {
            setAuthState(AuthState.UNAUTHENTICATED);
          }
          return;
        }
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('[AuthProvider] Session found, fetching user profile for:', session.user.email);
            stateRef.current.currentUserId = session.user.id;
            stateRef.current.user = session.user;
            
            // If we have cached profile, use it immediately but still fetch fresh
            if (cachedProfile && cachedProfile.id === session.user.id) {
              // Already set above, just fetch fresh in background
              fetchUserProfile(session.user.id);
            } else {
              // No cache or different user - keep LOADING state until profile is fetched
              setAuthState(AuthState.LOADING);
              setUserProfile(null);
              // Start timeout guard for profile loading
              const timeoutId = startProfileTimeout();
              stateRef.current.roleLoadTimeout = timeoutId;
              fetchUserProfile(session.user.id);
            }
          } else {
            // No session - ensure clean state
            stateRef.current.currentUserId = null;
            stateRef.current.user = null;
            stateRef.current.profile = null;
            setUserProfile(null);
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
          // Keep LOADING state until profile with role is fetched
          setAuthState(AuthState.LOADING);
          setUserProfile(null);
          
          // Start timeout guard for profile loading
          const timeoutId = startProfileTimeout();
          stateRef.current.roleLoadTimeout = timeoutId;
          
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

  // Enhanced session management with activity tracking and graceful handling
  useEffect(() => {
    if (!session) return;

    let refreshTimer = null;
    let activityTimer = null;
    let inactivityWarningTimer = null;
    const INACTIVITY_WARNING_TIME = 25 * 60 * 1000; // 25 minutes
    const SESSION_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes (more frequent)
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes before warning

    // Track user activity to extend session
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let lastActivityTime = Date.now();

    const updateActivity = () => {
      lastActivityTime = Date.now();
    };

    // Add activity listeners (web only)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      activityEvents.forEach((event) => {
        window.addEventListener(event, updateActivity, { passive: true });
      });
    }

    // Periodic session refresh - more frequent and with error handling
    const scheduleRefresh = () => {
      if (refreshTimer) clearInterval(refreshTimer);
      
      refreshTimer = setInterval(async () => {
        try {
          // Only refresh if user has been active recently
          const timeSinceActivity = Date.now() - lastActivityTime;
          if (timeSinceActivity > INACTIVITY_TIMEOUT) {
            console.log('[AuthProvider] Session refresh skipped - user inactive');
            return;
          }

          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.warn('[AuthProvider] Session refresh error (non-critical):', error.message);
            // Don't force logout on refresh errors - let Supabase auto-refresh handle it
            // Only log errors but continue gracefully
          } else if (data?.session) {
            console.log('[AuthProvider] Session refreshed successfully');
            setSession(data.session);
            stateRef.current.session = data.session;
          }
        } catch (err) {
          console.warn('[AuthProvider] Session refresh exception (non-critical):', err);
          // Graceful degradation - continue without forcing logout
        }
      }, SESSION_REFRESH_INTERVAL);
    };

    // Schedule initial refresh
    scheduleRefresh();

    // Check for inactivity and show warning (optional - can be enhanced with UI)
    const checkInactivity = () => {
      if (inactivityWarningTimer) clearTimeout(inactivityWarningTimer);
      
      inactivityWarningTimer = setTimeout(() => {
        const timeSinceActivity = Date.now() - lastActivityTime;
        if (timeSinceActivity > INACTIVITY_WARNING_TIME && session) {
          console.log('[AuthProvider] User inactive - session may expire soon');
          // Optional: Show notification to user
          // addNotification('Your session will expire soon due to inactivity', 'warning');
        }
      }, INACTIVITY_WARNING_TIME);
    };

    checkInactivity();

    // Cleanup
    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
      if (activityTimer) clearInterval(activityTimer);
      if (inactivityWarningTimer) clearTimeout(inactivityWarningTimer);
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        activityEvents.forEach((event) => {
          window.removeEventListener(event, updateActivity);
        });
      }
    };
  }, [session]);

  // Refresh session & profile when app/tab regains focus
  useEffect(() => {
    if (!session) return;

    const handleFocus = async () => {
      try {
        refreshSession();
        if (stateRef.current.currentUserId) {
          fetchUserProfile(stateRef.current.currentUserId);
        }
      } catch (e) {
        console.warn('[AuthProvider] Focus refresh error:', e);
      }
    };

    let appStateSub = null;
    let visibilityHandler = null;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      visibilityHandler = () => {
        if (!document.hidden) handleFocus();
      };
      document.addEventListener('visibilitychange', visibilityHandler);
    } else {
      const { AppState } = require('react-native');
      appStateSub = AppState.addEventListener('change', (state) => {
        if (state === 'active') handleFocus();
      });
    }

    return () => {
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
      }
      if (appStateSub && appStateSub.remove) {
        appStateSub.remove();
      }
    };
  }, [session, refreshSession, fetchUserProfile]);

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
                    !key.startsWith('supabase.auth.') && // Skip auth keys (already cleared)
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
            !key.startsWith('supabase.auth.') && // Skip auth keys (already cleared)
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
      clearAuth();

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
      clearAuth();
      
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

  // Enhanced refreshSession with better error handling and retry logic
  async function refreshSession(retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        // Only retry on network errors or temporary failures
        const isRetryableError = 
          error.message?.includes('network') ||
          error.message?.includes('timeout') ||
          error.status === 408 || // Request Timeout
          error.status === 429 || // Too Many Requests
          (error.status >= 500 && error.status < 600); // Server errors

        if (isRetryableError && retryCount < MAX_RETRIES) {
          console.log(`[AuthProvider] Retrying session refresh (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
          return refreshSession(retryCount + 1);
        }

        // Non-retryable errors or max retries reached
        console.warn('[AuthProvider] Session refresh failed (non-critical):', error.message);
        
        // Don't force logout - let Supabase handle session expiration naturally
        // This allows for graceful degradation
        return { error };
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        stateRef.current.session = data.session;
        console.log('[AuthProvider] Session refreshed successfully');
        return { success: true, session: data.session };
      }

      return { success: false, error: 'No session data returned' };
    } catch (err) {
      console.warn('[AuthProvider] Session refresh exception (non-critical):', err);
      return { error: err };
    }
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

  // Render timeout screen if profile loading takes too long
  if (showTimeoutScreen) {
    return (
      <Wrapper>
        <ProfileLoadTimeoutScreen
          onRetry={handleProfileRetry}
          onSignIn={handleSignInAgain}
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    </Wrapper>
  );
};

export default AuthProvider;
