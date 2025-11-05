import React, { useEffect, useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BottomNavigation as RNPBottomNavigation } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './ThemeProvider';

const AppBottomNavigation = ({ navigationState, onIndexChange, renderScene, renderFab, ...props }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Handle web back button
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handlePopState = () => {
        const hash = window.location.hash;
        const matchingRoute = navigationState.routes.findIndex(
          route => `#${route.key}` === hash
        );
        if (matchingRoute >= 0 && matchingRoute !== navigationState.index) {
          onIndexChange(matchingRoute);
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [navigationState, onIndexChange]);

  // Handle web URL updates
  const updateWebUrl = useCallback((index) => {
    if (Platform.OS === 'web') {
      const route = navigationState.routes[index];
      if (route) {
        const newHash = `#${route.key}`;
        if (window.location.hash !== newHash) {
          window.history.pushState(null, '', newHash);
        }
      }
    }
  }, [navigationState.routes]);

  // Enhanced index change handler
  const handleIndexChange = useCallback((newIndex) => {
    updateWebUrl(newIndex);
    onIndexChange(newIndex);
  }, [updateWebUrl, onIndexChange]);

  // Initialize web URL on mount
  useEffect(() => {
    if (Platform.OS === 'web') {
      const hash = window.location.hash;
      if (!hash) {
        // Set initial route in URL
        updateWebUrl(navigationState.index);
      } else {
        // Sync with existing URL
        const matchingRoute = navigationState.routes.findIndex(
          route => `#${route.key}` === hash
        );
        if (matchingRoute >= 0 && matchingRoute !== navigationState.index) {
          onIndexChange(matchingRoute);
        }
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      <RNPBottomNavigation
        navigationState={navigationState}
        onIndexChange={handleIndexChange}
        renderScene={renderScene}
        safeAreaInsets={{
          bottom: insets.bottom,
          top: insets.top,
          left: insets.left,
          right: insets.right,
        }}
        barStyle={[
          styles.bar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outline,
          },
        ]}
        sceneContainerStyle={{
          backgroundColor: theme.colors.background,
          marginBottom: Platform.OS === 'web' ? 56 : 0,
        }}
        activeColor={theme.colors.primary}
        inactiveColor={theme.colors.onSurfaceVariant}
        {...props}
      />
      {renderFab && <View style={styles.fabContainer}>{renderFab()}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bar: {
    borderTopWidth: 1,
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    width: '100%',
    bottom: 0,
    zIndex: 1000,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 80, // Adjust this value to position the FAB correctly
    zIndex: 1001,
  },
});

AppBottomNavigation.SceneMap = RNPBottomNavigation.SceneMap;

export default AppBottomNavigation;
