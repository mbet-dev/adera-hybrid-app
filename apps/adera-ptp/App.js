import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, OnboardingScreen, GatewayScreen, LoadingScreen } from '@adera/ui';
import { AuthProvider, useAuth } from '@adera/auth';
import AppNavigator from './src/navigation/AppNavigator';
import GuestNavigator from './src/navigation/GuestNavigator';

// Main App Component
function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showGateway, setShowGateway] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const { isAuthenticated, isLoading, signIn } = useAuth();

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowGateway(true);
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

  const handleAppSelect = async (appType) => {
    if (appType === 'ptp') {
      // Auto-login for demo mode
      await handleLogin();
    }
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
    return (
      <OnboardingScreen 
        onComplete={handleOnboardingComplete}
        appFocus="ptp" // Focus on logistics features
      />
    );
  }

  // Show gateway/auth screen
  if (showGateway) {
    return (
      <GatewayScreen
        onLogin={handleLogin}
        onGuest={handleGuest}
        onAppSelect={handleAppSelect}
        defaultApp="ptp" // Default to PTP selection
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
            <StatusBar style="light" backgroundColor="#2E7D32" />
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
    backgroundColor: '#f5f5f5',
  },
});
