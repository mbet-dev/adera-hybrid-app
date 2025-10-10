import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BottomNavigation } from '@adera/ui';

// Import Customer screens - using minimal versions for debugging
import CustomerDashboard from '../screens/Customer/CustomerDashboard.minimal';
import CreateParcel from '../screens/Customer/CreateParcel.minimal';
import TrackParcel from '../screens/Customer/CreateParcel.minimal';
import ParcelHistory from '../screens/Customer/CreateParcel.minimal';
import Profile from '../screens/Customer/CreateParcel.minimal';

const Stack = createNativeStackNavigator();

const CustomerNavigator = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'create', title: 'Send', focusedIcon: 'send', unfocusedIcon: 'send-outline' },
    { key: 'track', title: 'Track', focusedIcon: 'location', unfocusedIcon: 'location-outline' },
    { key: 'history', title: 'History', focusedIcon: 'time', unfocusedIcon: 'time-outline' },
    { key: 'profile', title: 'Profile', focusedIcon: 'person', unfocusedIcon: 'person-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    dashboard: CustomerDashboard,
    create: CreateParcel,
    track: TrackParcel,
    history: ParcelHistory,
    profile: Profile,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default CustomerNavigator;
