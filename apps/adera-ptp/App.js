import React, { useState, useEffect } from 'react';
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
    return <EmailConfirmationHandler />;
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
