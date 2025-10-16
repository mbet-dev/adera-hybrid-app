import React, { useState, useEffect } from 'react';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, OnboardingScreen, AppSelectorScreen, LoadingScreen } from '@adera/ui';
import { AuthProvider, useAuth, EmailConfirmationHandler } from '@adera/auth';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';

// Main App Component
function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [emailConfirmParams, setEmailConfirmParams] = useState(null);
  const { isAuthenticated, isLoading } = useAuth();

  // Check for email confirmation callback on web
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location && window.location.hash) {
      const hash = window.location.hash;
      if (hash.includes('type=signup') && hash.includes('access_token')) {
        setShowEmailConfirmation(true);
        setShowOnboarding(false);
        setShowAppSelector(false);
      }
    }
    if (typeof window !== 'undefined' && window.location && window.location.search) {
      const search = window.location.search;
      if (search.includes('code=') || search.includes('type=signup')) {
        setShowEmailConfirmation(true);
        setShowOnboarding(false);
        setShowAppSelector(false);
      }
    }
  }, []);

  // Handle deep links for native (Expo/Android/iOS)
  useEffect(() => {
    let isMounted = true;

    const handleUrl = (url) => {
      if (!url) return;
      const parsed = Linking.parse(url);
      const qp = parsed?.queryParams || {};
      // Supabase sends tokens in the hash for web, but for deep links Expo parses into queryParams
      let accessToken = qp.access_token;
      let refreshToken = qp.refresh_token;
      let type = qp.type;
      let code = qp.code;

      // Fallback: extract from fragment if present (e.g., adera://auth/callback#access_token=...)
      if ((!accessToken || !refreshToken || !type) && typeof url === 'string') {
        const hashIndex = url.indexOf('#');
        if (hashIndex !== -1) {
          const fragment = url.substring(hashIndex + 1);
          const fragParams = new URLSearchParams(fragment);
          accessToken = accessToken || fragParams.get('access_token');
          refreshToken = refreshToken || fragParams.get('refresh_token');
          type = type || fragParams.get('type');
        }
      }
      // If PKCE code present, use confirmation handler with code
      if (code) {
        if (!isMounted) return;
        setEmailConfirmParams({ code });
        setShowEmailConfirmation(true);
        setShowOnboarding(false);
        setShowAppSelector(false);
        return;
      }

      if (type === 'signup' && accessToken && refreshToken) {
        if (!isMounted) return;
        setEmailConfirmParams({ access_token: accessToken, refresh_token: refreshToken });
        setShowEmailConfirmation(true);
        setShowOnboarding(false);
        setShowAppSelector(false);
      }
    };

    // Initial URL (app cold start from link)
    Linking.getInitialURL().then((initialUrl) => handleUrl(initialUrl)).catch(() => {});

    // Subscribe for future URLs while app is open
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => {
      isMounted = false;
      sub && sub.remove();
    };
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowAppSelector(true);
  };

  const handleAppSelect = (appType) => {
    // For now, both apps use the same authentication
    // In the future, you could redirect to different apps
    setShowAppSelector(false);
  };

  // Show email confirmation handler
  if (showEmailConfirmation) {
    return <EmailConfirmationHandler route={{ params: emailConfirmParams || {} }} />;
  }

  // Show loading while auth is initializing
  if (isLoading) {
    return <LoadingScreen message="Initializing Adera..." />;
  }

  // If authenticated, show main app
  if (isAuthenticated) {
    return <AppNavigator />;
  }

  // Show onboarding flow for new users
  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Show app selector screen
  if (showAppSelector) {
    return <AppSelectorScreen onAppSelect={handleAppSelect} />;
  }

  // Show authentication navigator
  return (
    <NavigationContainer>
      <AuthNavigator />
    </NavigationContainer>
  );
}

// Root App with Providers
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <View style={styles.container}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />
            <AppContent />
          </View>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
