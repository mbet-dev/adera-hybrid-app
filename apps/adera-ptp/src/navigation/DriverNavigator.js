import React, { useState } from 'react';
import { AppBottomNavigation } from '@adera/ui';

// Import Driver screens
import DriverDashboard from '../screens/driver/DriverDashboard';
import RouteMap from '../screens/driver/RouteMap';
import TaskList from '../screens/driver/TaskList';
import DriverPerformance from '../screens/driver/DriverPerformance';
import DriverProfile from '../screens/driver/DriverProfile';

const DriverNavigator = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'dashboard', title: 'Dashboard', focusedIcon: 'home', unfocusedIcon: 'home-outline' },
    { key: 'tasks', title: 'Tasks', focusedIcon: 'format-list-bulleted', unfocusedIcon: 'format-list-bulleted' },
    { key: 'performance', title: 'Performance', focusedIcon: 'chart-line', unfocusedIcon: 'chart-line' },
    { key: 'profile', title: 'Profile', focusedIcon: 'account', unfocusedIcon: 'account-outline' },
  ]);

  const renderScene = AppBottomNavigation.SceneMap({
    dashboard: DriverDashboard,
    tasks: TaskList,
    performance: DriverPerformance,
    profile: DriverProfile,
  });

  return (
    <AppBottomNavigation
      navigationState={{ index, routes }}
      onIndexChange={setIndex}
      renderScene={renderScene}
    />
  );
};

export default DriverNavigator;
