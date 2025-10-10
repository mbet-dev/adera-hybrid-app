import React, { useState } from 'react';
import { BottomNavigation } from '@adera/ui';

// Import Staff screens
import StaffDashboard from '../screens/Staff/StaffDashboard';
import ParcelOversight from '../screens/Staff/ParcelOversight';
import Analytics from '../screens/Staff/Analytics';
import Support from '../screens/Staff/Support';
import StaffProfile from '../screens/Staff/StaffProfile';

const StaffNavigator = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'parcels', title: 'Oversight', focusedIcon: 'eye', unfocusedIcon: 'eye-outline' },
    { key: 'analytics', title: 'Analytics', focusedIcon: 'bar-chart', unfocusedIcon: 'bar-chart-outline' },
    { key: 'support', title: 'Support', focusedIcon: 'help-circle', unfocusedIcon: 'help-circle-outline' },
    { key: 'profile', title: 'Profile', focusedIcon: 'person', unfocusedIcon: 'person-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    dashboard: StaffDashboard,
    parcels: ParcelOversight,
    analytics: Analytics,
    support: Support,
    profile: StaffProfile,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default StaffNavigator;
