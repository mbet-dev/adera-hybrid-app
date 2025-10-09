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

  const fetchUserProfile = async (userId) => {
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
        setAuthState(AuthState.UNAUTHENTICATED);
        return;
      }

      setUserProfile(data);
      setAuthState(AuthState.AUTHENTICATED);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
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

  const value = {
    session,
    user,
    userProfile,
    authState,
    isAuthenticated: authState === AuthState.AUTHENTICATED,
    isLoading: authState === AuthState.LOADING,
    role: userProfile?.role || null,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
