import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '@adera/auth';
import { LoadingScreen } from '@adera/ui';

// Import screens based on user role
import CustomerNavigator from './CustomerNavigator';
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
    // The root `NavigationContainer` is provided in App.js.
    // AppNavigator should only return the appropriate navigator for the current role.
    getNavigatorForRole()
  );
};

export default AppNavigator;
