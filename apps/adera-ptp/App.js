import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, OnboardingScreen, AppSelectorScreen, GatewayScreen, LoadingScreen } from '@adera/ui';
import { AuthProvider, useAuth } from '@adera/auth';
import AppNavigator from './src/navigation/AppNavigator';
import GuestNavigator from './src/navigation/GuestNavigator';

// Main App Component
function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showAppSelector, setShowAppSelector] = useState(false);
  const [showGateway, setShowGateway] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [guestMode, setGuestMode] = useState(false);
  const { isAuthenticated, isLoading, signIn } = useAuth();

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowAppSelector(true);
  };

  const handleAppSelect = (appType) => {
    setSelectedApp(appType);
    setShowAppSelector(false);
    // For PTP app, only proceed if they selected PTP
    if (appType === 'ptp') {
      setShowGateway(true);
    } else {
      // If they selected Shop, redirect them to the Shop app
      // For now, we'll show a message or redirect logic
      setShowGateway(true);
    }
  };

  const handleLogin = async () => {
    try {
      // Demo login - this will work even without Supabase
      await signIn('demo@adera.et', 'demo123');
      setShowGateway(false);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGuest = () => {
    setShowGateway(false);
    setGuestMode(true);
  };

  const handleBackToAuth = () => {
    setGuestMode(false);
    setShowGateway(true);
  };

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

  // Show gateway/auth screen
  if (showGateway) {
    return (
      <GatewayScreen
        onLogin={handleLogin}
        onGuest={handleGuest}
        selectedApp={selectedApp}
      />
    );
  }

  // Show guest mode for browsing
  if (guestMode) {
    return <GuestNavigator onBackToAuth={handleBackToAuth} />;
  }

  // Fallback
  return <LoadingScreen message="Loading..." />;
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
