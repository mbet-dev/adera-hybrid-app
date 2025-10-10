import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@adera/auth';
import { LoadingScreen } from '@adera/ui';

// Import screens based on user role - using simple version for debugging
import CustomerNavigator from './CustomerNavigator.simple';
import PartnerNavigator from './PartnerNavigator';
import DriverNavigator from './DriverNavigator';
import StaffNavigator from './StaffNavigator';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return <LoadingScreen message="Loading Adera..." />;
  }

  if (!isAuthenticated) {
    // This shouldn't happen as auth is handled in App.js
    return <LoadingScreen message="Authenticating..." />;
  }

  // Route based on user role
  const getNavigatorForRole = () => {
    switch (role) {
      case 'customer':
        return <CustomerNavigator />;
      case 'partner':
        return <PartnerNavigator />;
      case 'driver':
        return <DriverNavigator />;
      case 'staff':
      case 'admin':
        return <StaffNavigator />;
      default:
        return <CustomerNavigator />; // Default fallback
    }
  };

  return (
    <NavigationContainer>
      {getNavigatorForRole()}
    </NavigationContainer>
  );
};

export default AppNavigator;
