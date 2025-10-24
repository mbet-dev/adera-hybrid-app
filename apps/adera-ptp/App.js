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
  const { isAuthenticated, isLoading, role } = useAuth();

  console.log('[AppContent] Render:', { isAuthenticated, isLoading, role });

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
    if (!isAuthenticated && !isLoading) {
      setHasCompletedOnboarding(false);
      setShowAppSelector(false);
    }
  }, [isAuthenticated, isLoading]);

  // Show loading while auth is initializing
  if (isLoading) {
    console.log('[AppContent] Showing loading screen');
    return <LoadingScreen message="Initializing Adera..." />;
  }

  // If authenticated, show main app
  if (isAuthenticated) {
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
