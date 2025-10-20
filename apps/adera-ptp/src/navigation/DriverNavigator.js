import React, { useState } from 'react';
import { BottomNavigation } from '@adera/ui';

// Import Driver screens
import DriverDashboard from '../screens/driver/DriverDashboard';
import RouteMap from '../screens/driver/RouteMap';
import TaskList from '../screens/driver/TaskList';
import DriverEarnings from '../screens/driver/DriverEarnings';
import DriverProfile from '../screens/driver/DriverProfile';

const DriverNavigator = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'tasks', title: 'Tasks', focusedIcon: 'format-list-bulleted', unfocusedIcon: 'format-list-bulleted' },
    { key: 'earnings', title: 'Earnings', focusedIcon: 'cash', unfocusedIcon: 'cash' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
  ]);

  const renderScene = BottomNavigation.SceneMap({
    dashboard: DriverDashboard,
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
