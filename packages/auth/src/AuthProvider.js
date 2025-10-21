import React, { createContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { AuthState, UserRole } from './types';

export const AuthContext = createContext();

// Demo mode enabled for development (Supabase not configured yet)
const isDemoMode = process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === 'true';

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authState, setAuthState] = useState(AuthState.LOADING);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      if (isDemoMode) {
        // Demo mode - skip authentication for development
        console.log('Running in demo mode - authentication disabled');
        if (isMounted) setAuthState(AuthState.UNAUTHENTICATED);
        return;
      }

      try {
        // Production mode - real Supabase authentication
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Consider user authenticated immediately; fetch profile in the background
            setAuthState(AuthState.AUTHENTICATED);
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Mark authenticated immediately; profile may follow shortly
          setAuthState(AuthState.AUTHENTICATED);
          // Pass user metadata if available from the session object, useful for post-signup flow
          await ensureUserProfileExists(session.user, session.user.user_metadata);
          await touchLastLogin(session.user.id);
          fetchUserProfile(session.user.id);
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
      const { data, error } = await supabase
        .from('users')
        .select('id')
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
        
        const { error: insertError } = await supabase.from('users').insert(profileData);
        if (insertError) {
          console.warn('ensureUserProfileExists: insert error', insertError);
        }
      }
    } catch (e) {
      console.warn('ensureUserProfileExists: unexpected error', e);
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
    if (isDemoMode) {
      // Demo profile - you can test different roles here
      setUserProfile({
        id: 'demo-user',
        role: 'customer', // Change this to test: 'customer', 'partner', 'driver', 'staff', 'admin'
        first_name: 'Demo',
        last_name: 'User',
        email: 'demo@adera.et',
        business_name: 'Demo Business',
      });
      setAuthState(AuthState.AUTHENTICATED);
      return;
    }

    try {
      // Do not drop global auth loading here; keep UI authenticated while fetching profile
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If user profile doesn't exist and this is first retry, wait and try again
        // This handles the case where email confirmation trigger hasn't run yet
        if (error.code === 'PGRST116' && retryCount < 3) {
          console.log(`User profile not found, retrying in ${(retryCount + 1) * 2} seconds...`);
          setTimeout(() => {
            fetchUserProfile(userId, retryCount + 1);
          }, (retryCount + 1) * 2000);
          return;
        }
        // Keep user authenticated despite profile error; set minimal profile
        setUserProfile({ id: userId, role: 'customer' });
        return;
      }

      setUserProfile(data);
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
      // Keep user authenticated; show minimal profile
      setUserProfile(prev => prev || { id: userId, role: 'customer' });
    }
  };

  const signIn = async (email, password) => {
    if (isDemoMode) {
      // Demo login - simulate success
      const demoUser = { id: 'demo-user', email: 'demo@adera.et' };
      setUser(demoUser);
      await fetchUserProfile(demoUser.id);
      return { user: demoUser };
    }

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
      // Handle 'Email not confirmed' error specifically
      if (error.message.includes('Email not confirmed')) {
        throw new Error('EMAIL_NOT_CONFIRMED');
      }
      throw error;
    }

    // Best-effort: ensure profile exists and update last login
    if (data?.user) {
      // Pass metadata from the user object itself upon sign-in
      await ensureUserProfileExists(data.user, data.user.user_metadata);
      await touchLastLogin(data.user.id);
      // Fetch profile to populate role for routing ASAP
      fetchUserProfile(data.user.id);
    }
    return data;
  };

  const signUp = async (email, password, userData = {}) => {
    if (isDemoMode) {
      // Demo signup - simulate success
      const demoUser = { id: 'demo-user', email };
      setUser(demoUser);
      await fetchUserProfile(demoUser.id);
      return { user: demoUser };
    }

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
    }
    
    return data;
  };

  const signOut = async () => {
    if (isDemoMode) {
      // Demo logout
      setUser(null);
      setUserProfile(null);
      setSession(null);
      setAuthState(AuthState.UNAUTHENTICATED);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateProfile = async (updates) => {
    if (isDemoMode) {
      // Demo update
      setUserProfile(prev => ({ ...prev, ...updates }));
      return { ...userProfile, ...updates };
    }

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
    if (isDemoMode) {
      console.log('Demo mode: Password reset email would be sent to:', email);
      return { success: true };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' && window.location && window.location.origin
        ? `${window.location.origin}/reset-password`
        : `${process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'}/reset-password`,
    });

    if (error) throw error;
    return { success: true };
  };

  const updatePassword = async (newPassword) => {
    if (isDemoMode) {
      console.log('Demo mode: Password would be updated');
      return { success: true };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { success: true };
  };

  const refreshSession = async () => {
    if (isDemoMode) return;

    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return;
    }

    setSession(data.session);
    setUser(data.session?.user ?? null);
  };

  const verifyOTP = async (phone, token) => {
    if (isDemoMode) {
      console.log('Demo mode: OTP verified for:', phone);
      return { success: true };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) throw error;
    return data;
  };

  const sendOTP = async (phone) => {
    if (isDemoMode) {
      console.log('Demo mode: OTP would be sent to:', phone);
      return { success: true };
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw error;
    return { success: true };
  };

  const resendConfirmationEmail = async (email) => {
    if (isDemoMode) {
      console.log('Demo mode: Confirmation email would be resent to:', email);
      return { success: true };
    }

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

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: getRedirectUrl(),
      },
    });

    if (error) throw error;
    return { success: true };
  };

  const checkEmailConfirmationStatus = async () => {
    if (isDemoMode) {
      return { confirmed: true };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // If we have a valid session, email is confirmed
        return { confirmed: true, user: session.user };
      }
      return { confirmed: false };
    } catch (error) {
      console.error('Error checking email confirmation:', error);
      return { confirmed: false, error };
    }
  };

  const value = {
    session,
    user,
    userProfile,
    authState,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    isLoading: authState === AuthState.LOADING,
    isDemoMode,
    role: userProfile?.role || null,
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
