import React, { useState } from 'react';
import { AppBottomNavigation } from '@adera/ui';

// Import Customer screens
import CustomerDashboard from '../screens/customer/CustomerDashboard';
import CreateParcel from '../screens/customer/CreateParcel';
import TrackParcel from '../screens/customer/TrackParcel';
import ParcelHistory from '../screens/customer/ParcelHistory';
import Profile from '../screens/customer/Profile';

const CustomerNavigator = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'create', title: 'Send', focusedIcon: 'send', unfocusedIcon: 'send-outline' },
    { key: 'track', title: 'Track', focusedIcon: 'map-marker', unfocusedIcon: 'map-marker-outline' },
    { key: 'history', title: 'History', focusedIcon: 'clock-outline', unfocusedIcon: 'clock-outline' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
  ]);

  console.log('[CustomerNavigator] Rendering with index:', index);

  const renderScene = AppBottomNavigation.SceneMap({
    dashboard: CustomerDashboard,
    create: CreateParcel,
    track: TrackParcel,
    history: ParcelHistory,
    profile: Profile,
  });

  console.log('[CustomerNavigator] Scene map created, rendering AppBottomNavigation');

  return (
    <AppBottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={(newIndex) => {
        console.log('[CustomerNavigator] Tab changed to:', newIndex, routes[newIndex]?.title);
        setIndex(newIndex);
      }}
      renderScene={renderScene}
    />
  );
};

export default CustomerNavigator;
