import React from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, Platform, View } from 'react-native';
import { useTheme } from './ThemeProvider';
import { useSafeAreaPadding } from './useSafeAreaPadding';

/**
 * SafeArea Component - AGGRESSIVE CONTAINMENT MODE
 * 
 * BULLETPROOF SafeAreaView wrapper that ensures NO content is EVER obscured by device UI.
 * 
 * PROTECTION STRATEGY:
 * 1. SafeAreaView handles top/left/right edges automatically (status bar, notches, rounded corners)
 * 2. For withBottomNav=true: Manually adds generous bottom padding (nav bar height + device inset + buffer)
 * 3. For withBottomNav=false: SafeAreaView handles bottom edge normally
 * 
 * CALCULATIONS:
 * - Top: Automatic via SafeAreaView (respects status bar, notch)
 * - Bottom with nav: 64px (nav base) + max(device inset, iOS:34px/Android:24px) + 24px buffer
 * - Bottom without nav: Automatic via SafeAreaView
 * - Left/Right: Automatic via SafeAreaView (respects rounded edges)
 * 
 * @param {Object} props
 * @param {Array<'top'|'bottom'|'left'|'right'>} props.edges - Which edges to apply safe area (default: all)
 * @param {boolean} props.aggressive - Use aggressive padding (default: true)
 * @param {boolean} props.withBottomNav - Add extra padding for bottom navigation bar (default: false)
 * @param {Object} props.style - Additional styles
 * @param {React.ReactNode} props.children - Child components
 */
const SafeArea = ({ 
  edges = ['top', 'bottom', 'left', 'right'], 
  aggressive = true,
  withBottomNav = false,
  style, 
  children,
  ...props 
}) => {
  const theme = useTheme();
  const safePadding = useSafeAreaPadding();
  const insets = useSafeAreaInsets();

  // Determine which edges SafeAreaView should handle
  // If withBottomNav, we'll manually handle bottom padding
  const safeAreaEdges = withBottomNav 
    ? edges.filter(edge => edge !== 'bottom')  // Let us handle bottom manually
    : edges;

  // ULTRA AGGRESSIVE MODE: Calculate manual bottom padding for nav bar
  let manualBottomPadding = 0;
  
  if (withBottomNav && edges.includes('bottom')) {
    // Match the BottomNavigation aggressive padding calculation
    // Bottom nav bar height (64px) + device inset + aggressive buffer
    const deviceBottomInset = insets.bottom || 0;
    const minimumPadding = Platform.OS === 'ios' ? 40 : 32;
    const aggressivePadding = Math.max(deviceBottomInset, minimumPadding) + 20;
    const totalNavSpace = deviceBottomInset + aggressivePadding + 64; // Include nav bar height
    
    // Add extra buffer to push content up from nav
    manualBottomPadding = totalNavSpace + 16; // 16px extra spacing above nav
  }

  // Additional padding for inner container (only bottom when withBottomNav)
  const innerPadding = {
    paddingBottom: manualBottomPadding,
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style
      ]}
      edges={safeAreaEdges}  // SafeAreaView handles top/left/right automatically
      {...props}
    >
      <View style={[styles.innerContainer, innerPadding]}>
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
});

export default SafeArea;
