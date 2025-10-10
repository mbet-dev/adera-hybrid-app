import React, { useState } from 'react';
import { BottomNavigation } from '@adera/ui';

// Import Driver screens
import DriverDashboard from '../screens/Driver/DriverDashboard';
import RouteMap from '../screens/Driver/RouteMap';
import TaskList from '../screens/Driver/TaskList';
import DriverEarnings from '../screens/Driver/DriverEarnings';
import DriverProfile from '../screens/Driver/DriverProfile';

const DriverNavigator = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'map', title: 'Route', focusedIcon: 'map', unfocusedIcon: 'map-outline' },
    { key: 'tasks', title: 'Tasks', focusedIcon: 'list', unfocusedIcon: 'list-outline' },
    { key: 'earnings', title: 'Earnings', focusedIcon: 'cash', unfocusedIcon: 'cash-outline' },
    { key: 'profile', title: 'Profile', focusedIcon: 'person', unfocusedIcon: 'person-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    dashboard: DriverDashboard,
    map: RouteMap,
    tasks: TaskList,
    earnings: DriverEarnings,
    profile: DriverProfile,
  });

  return (
    <BottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default DriverNavigator;
