import React, { createContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { AuthState, UserRole } from './types';

export const AuthContext = createContext();

// Demo mode check
const isDemoMode = !process.env.EXPO_PUBLIC_SUPABASE_URL;

const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authState, setAuthState] = useState(AuthState.LOADING);

  useEffect(() => {
    if (isDemoMode) {
      // Demo mode - skip authentication for development
      console.log('Running in demo mode - authentication disabled');
      setAuthState(AuthState.UNAUTHENTICATED);
      return;
    }

    // Production mode - real Supabase authentication
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setAuthState(AuthState.UNAUTHENTICATED);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setAuthState(AuthState.UNAUTHENTICATED);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setAuthState(AuthState.UNAUTHENTICATED);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

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
      setAuthState(AuthState.LOADING);
      
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
        
        setAuthState(AuthState.UNAUTHENTICATED);
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
      
      setAuthState(AuthState.UNAUTHENTICATED);
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
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
      if (typeof window !== 'undefined' && window.location && window.location.origin) {
        // Web platform
        return `${window.location.origin}/auth/callback`;
      } else {
        // Native platform - use deep link
        return 'com.adera.app://auth/callback';
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
      redirectTo: `${window.location.origin}/reset-password`,
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
    // OTP methods
    sendOTP,
    verifyOTP,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
