import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { FAB } from 'react-native-paper';
import { useTheme } from '../ThemeProvider';

const CustomFAB = ({ style, ...props }) => {
  const theme = useTheme();
  
  return (
    <FAB
      {...props}
      style={[
        styles.fab,
        { backgroundColor: theme.colors.primary },
        Platform.select({
          ios: styles.iosFab,
          android: styles.androidFab,
          web: styles.webFab,
        }),
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    elevation: 8,
    zIndex: 999,
  },
  iosFab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  androidFab: {
    elevation: 8,
    // Remove default overlay/mask effect
    android_ripple: { color: 'rgba(0,0,0,0.2)' },
  },
  webFab: {
    cursor: 'pointer',
    // Remove default overlay/mask effect
    ':hover': {
      opacity: 0.9,
    },
  },
});

export default CustomFAB;