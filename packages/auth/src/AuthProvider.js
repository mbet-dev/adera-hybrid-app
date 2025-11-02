import React, { createContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { AuthState, UserRole } from './types';

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

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            setAuthState(AuthState.AUTHENTICATED);
            setUserProfile({ id: session.user.id, role: 'customer' });
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
        console.log('Auth state changed:', event);
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setAuthState(AuthState.AUTHENTICATED);
          setUserProfile({ id: session.user.id, role: 'customer' });
          await ensureUserProfileExists(session.user, session.user.user_metadata);
          await touchLastLogin(session.user.id);
          fetchUserProfile(session.user.id);
          if (event === 'SIGNED_IN') {
            addNotification(`Welcome back! You've signed in successfully.`, NOTIFICATION_TYPES.SUCCESS);
          }
        } else {
          setUserProfile(null);
          setAuthState(AuthState.UNAUTHENTICATED);
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
    try {
      // Try to get profile from public.profiles first (new system)
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile from profiles:', profileError);
      }

      if (!profile) {
        // Fallback to legacy users table
        const { data: legacyProfile, error: legacyError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        if (legacyError && legacyError.code !== 'PGRST116') {
          console.error('Error fetching user profile from users:', legacyError);
        }

        if (legacyProfile) {
          profile = {
            id: legacyProfile.id,
            email: legacyProfile.email,
            full_name: `${legacyProfile.first_name || ''} ${legacyProfile.last_name || ''}`.trim(),
            phone: legacyProfile.phone,
            role: legacyProfile.role || 'customer',
            language: legacyProfile.language || 'en',
            avatar_url: legacyProfile.avatar_url,
            email_confirmed: legacyProfile.is_verified,
            phone_confirmed: false
          };

          // Best-effort: try to migrate this profile to new system
          try {
            const { error: insertError } = await supabase
              .from('profiles')
              .upsert(profile)
              .select()
              .single();

            if (!insertError) {
              console.log('[AuthProvider] Successfully migrated user profile to new system');
            }
          } catch (e) {
            console.warn('[AuthProvider] Profile migration attempt failed:', e);
          }
        }
      }

      if (!profile) {
        // If still no profile and within retry limit, wait and retry
        // This handles race conditions with auth triggers
        if (retryCount < 3) {
          console.log(`Profile not found, retrying in ${(retryCount + 1) * 2} seconds...`);
          setTimeout(() => {
            fetchUserProfile(userId, retryCount + 1);
          }, (retryCount + 1) * 2000);
          return;
        }
        // Last resort: create minimal profile
        profile = { 
          id: userId,
          role: 'customer',
          email: user?.email,
          language: 'en'
        };
        
        // Try to create this minimal profile
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .upsert(profile)
            .select()
            .single();

          if (!insertError) {
            console.log('[AuthProvider] Created minimal profile for user');
          }
        } catch (e) {
          console.warn('[AuthProvider] Minimal profile creation failed:', e);
        }
      }

      setUserProfile(profile);
      setAuthState(AuthState.AUTHENTICATED);

    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      
      // Retry logic for network errors
      if (retryCount < 2) {
        console.log(`Network error, retrying in ${(retryCount + 1) * 3} seconds...`);
        setTimeout(() => {
          fetchUserProfile(userId, retryCount + 1);
        }, (retryCount + 1) * 3000);
        return;
      }
      
      // Keep user authenticated with minimal profile
      setUserProfile(prev => prev || { 
        id: userId,
        role: 'customer',
        email: user?.email,
        language: 'en'
      });
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
      // Clear ALL local storage and state first
      try {
        // Clear any app-specific storage
        localStorage.removeItem('adera:app_state');
        localStorage.removeItem('adera:theme');
        localStorage.removeItem('adera:preferences');
        // Clear any session storage
        sessionStorage.clear();
      } catch (e) {
        console.warn('[AuthProvider] Error clearing storage:', e);
      }

      // Clear state
      setUser(null);
      setUserProfile(null);
      setSession(null);
      setAuthState(AuthState.UNAUTHENTICATED);

      // Then sign out from Supabase - this should clear auth storage
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthProvider] Sign out error:', error);
        // Even if Supabase sign-out fails, local state is cleared
        return { success: true, warning: error.message };
      }

      console.log('[AuthProvider] Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('[AuthProvider] Sign out exception:', error);
      // Ensure local state is cleared even on exception
      setUser(null);
      setUserProfile(null);
      setSession(null);
      setAuthState(AuthState.UNAUTHENTICATED);
      return { success: true, warning: error.message };
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
