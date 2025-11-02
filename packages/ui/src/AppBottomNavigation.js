import React from 'react';
import { BottomNavigation as RNPBottomNavigation } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeProvider';

const AppBottomNavigation = ({ navigationState, onIndexChange, renderScene, ...props }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <RNPBottomNavigation
      navigationState={navigationState}
      onIndexChange={onIndexChange}
      renderScene={renderScene}
      safeAreaInsets={{
        bottom: insets.bottom,
        top: insets.top,
        left: insets.left,
        right: insets.right,
      }}
      barStyle={{
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outline,
      }}
      sceneContainerStyle={{ backgroundColor: theme.colors.background }}
      activeColor={theme.colors.primary}
      inactiveColor={theme.colors.onSurfaceVariant}
      {...props}
    />
  );
};

AppBottomNavigation.SceneMap = RNPBottomNavigation.SceneMap;

export default AppBottomNavigation;
