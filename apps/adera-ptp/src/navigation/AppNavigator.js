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

  console.log('[AppNavigator] Render:', { isAuthenticated, isLoading, role });

  if (isLoading) {
    console.log('[AppNavigator] Still loading...');
    return <LoadingScreen message="Loading Adera..." />;
  }

  if (!isAuthenticated) {
    console.log('[AppNavigator] Not authenticated, showing auth screen');
    // This shouldn't happen as auth is handled in App.js
    return <LoadingScreen message="Authenticating..." />;
  }

  // Route based on user role
  const getNavigatorForRole = () => {
    console.log('[AppNavigator] Routing for role:', role);
    switch (role) {
      case 'customer':
        console.log('[AppNavigator] Rendering CustomerNavigator');
        return <CustomerNavigator />;
      case 'partner':
        console.log('[AppNavigator] Rendering PartnerNavigator');
        return <PartnerNavigator />;
      case 'driver':
        console.log('[AppNavigator] Rendering DriverNavigator');
        return <DriverNavigator />;
      case 'staff':
      case 'admin':
        console.log('[AppNavigator] Rendering StaffNavigator');
        return <StaffNavigator />;
      default:
        console.log('[AppNavigator] No role matched, using CustomerNavigator as fallback');
        return <CustomerNavigator />; // Default fallback
    }
  };

  const navigator = getNavigatorForRole();
  console.log('[AppNavigator] Returning navigator:', navigator);
  return navigator;
};

export default AppNavigator;
