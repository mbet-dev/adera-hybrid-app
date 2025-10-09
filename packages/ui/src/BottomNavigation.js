import React from 'react';
import { BottomNavigation as RNPBottomNavigation } from 'react-native-paper';
import { useTheme } from './ThemeProvider';

const BottomNavigation = ({ navigationState, onIndexChange, renderScene, style, ...props }) => {
  const theme = useTheme();

  return (
    <RNPBottomNavigation
      navigationState={navigationState}
      onIndexChange={onIndexChange}
      renderScene={renderScene}
      barStyle={[
        {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outline,
        },
        style
      ]}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      {...props}
    />
  );
};

// Add SceneMap functionality
BottomNavigation.SceneMap = (scenes) => {
  return ({ route, jumpTo }) => {
    const Scene = scenes[route.key];
    return Scene ? <Scene jumpTo={jumpTo} /> : null;
  };
};

export default BottomNavigation;
