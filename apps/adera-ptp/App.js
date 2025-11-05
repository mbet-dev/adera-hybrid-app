import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { ThemeProvider, OnboardingScreen, AppSelectorScreen, LoadingScreen } from '@adera/ui';
import { AuthProvider, useAuth } from '@adera/auth';
import { PreferencesProvider, usePreferences } from '@adera/preferences';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import ThemelessLoadingScreen from './src/ThemelessLoadingScreen';

// Main App Component
function AppContent() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);
  const { isAuthenticated, isLoading, role } = useAuth();

  console.log('[AppContent] Render:', { isAuthenticated, isLoading, role, wasAuthenticated });

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
    setShowAppSelector(true);
  };

  const handleAppSelect = (appType) => {
    // For now, both apps use the same authentication
    // In the future, you could redirect to different apps
    setShowAppSelector(false);
  };

  useEffect(() => {
    console.log('[AppContent] Auth state changed:', { isAuthenticated, isLoading, wasAuthenticated });
    
    // Track when user becomes authenticated
    if (isAuthenticated && !wasAuthenticated) {
      console.log('[AppContent] User authenticated, setting wasAuthenticated flag');
      setWasAuthenticated(true);
    }
    
    // Only reset and reload if user was previously authenticated and is now signed out
    if (!isAuthenticated && !isLoading && wasAuthenticated) {
      console.log('[AppContent] User signed out (was authenticated), resetting onboarding state');
      setHasCompletedOnboarding(false);
      setShowAppSelector(false);
      setWasAuthenticated(false);
      
      // On web, force a reload to clear any cached state ONLY after actual sign out
      if (typeof window !== 'undefined' && window.location) {
        console.log('[AppContent] [WEB] Forcing page reload after sign out');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  }, [isAuthenticated, isLoading, wasAuthenticated]);

  // Show loading while auth is initializing
  if (isLoading) {
    console.log('[AppContent] Showing loading screen');
    return <LoadingScreen message="Initializing Adera..." />;
  }

  // If authenticated, show main app only if role is determined
  if (isAuthenticated) {
    if (role === null) {
      // Role not yet determined, keep showing loading to prevent flicker
      console.log('[AppContent] Authenticated but role not yet determined, waiting...');
      return <LoadingScreen message="Loading user profile..." />;
    }
    console.log('[AppContent] Authenticated, rendering AppNavigator with role:', role);
    return <AppNavigator />;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  if (showAppSelector) {
    return <AppSelectorScreen onAppSelect={handleAppSelect} />;
  }

  // Show authentication navigator
  return <AuthNavigator />;
}

// Root App with Providers
export default function App() {
  const AppWithTheme = () => {
    const { themeMode, isReady } = usePreferences();

    if (!isReady) {
      return <ThemelessLoadingScreen message="Loading preferences..." />;
    }

    return (
      <ThemeProvider forceLightMode={false} initialMode={themeMode}>
        <AuthProvider>
          <NavigationContainer linking={linking} theme={DefaultTheme}>
            <View style={styles.container}>
              <StatusBar style="auto" />
              <AppContent />
            </View>
          </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    );
  };

  const linking = {
    prefixes: [Linking.createURL('/')],
    config: { screens: { AuthCallback: 'auth/callback' } },
  };
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AppWithTheme />
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
