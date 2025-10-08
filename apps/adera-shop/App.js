import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { ThemeProvider } from '@adera/ui';
import OnboardingScreen from '@adera/ui/src/OnboardingScreen';
import GatewayScreen from '@adera/ui/src/GatewayScreen';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showGateway, setShowGateway] = useState(false);
  const [userType, setUserType] = useState(null); // 'authenticated', 'guest', 'ptp', 'shop'

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowGateway(true);
  };

  const handleLogin = () => {
    setUserType('authenticated');
    setShowGateway(false);
    // TODO: Navigate to auth flow
  };

  const handleGuest = () => {
    setUserType('guest');
    setShowGateway(false);
    // TODO: Navigate to guest mode
  };

  const handleAppSelect = (appType) => {
    if (appType === 'ptp') {
      setUserType('ptp');
      setShowGateway(false);
      // TODO: Navigate to PTP app
    } else if (appType === 'shop') {
      setUserType('shop');
      setShowGateway(false);
      // TODO: Navigate to Shop app
    }
  };

  return (
    <ThemeProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        {showOnboarding && (
          <OnboardingScreen onComplete={handleOnboardingComplete} />
        )}
        {showGateway && (
          <GatewayScreen
            onLogin={handleLogin}
            onGuest={handleGuest}
            onAppSelect={handleAppSelect}
          />
        )}
        {!showOnboarding && !showGateway && (
          <View style={styles.mainContent}>
            {/* TODO: Implement role-based navigation */}
          </View>
        )}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
