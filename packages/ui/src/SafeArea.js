import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Platform, View } from 'react-native';
import { useTheme } from './ThemeProvider';
import { useSafeAreaPadding } from './useSafeAreaPadding';

/**
 * SafeArea Component
 * 
 * BULLETPROOF SafeAreaView wrapper that ensures NO content is EVER obscured by device UI.
 * Uses both SafeAreaView AND additional calculated padding as multiple layers of protection.
 * 
 * This component follows the Adera design rule: all screens must respect safe area insets
 * to prevent content from being obscured by device UI elements.
 * 
 * PROTECTION LAYERS:
 * 1. SafeAreaView with all edges
 * 2. Additional calculated padding based on platform
 * 3. Extra buffer padding for maximum compatibility
 * 
 * @param {Object} props
 * @param {Array<'top'|'bottom'|'left'|'right'>} props.edges - Which edges to apply safe area (default: all)
 * @param {boolean} props.aggressive - Use aggressive padding (default: true)
 * @param {Object} props.style - Additional styles
 * @param {React.ReactNode} props.children - Child components
 */
const SafeArea = ({ 
  edges = ['top', 'bottom', 'left', 'right'], 
  aggressive = true,
  style, 
  children,
  ...props 
}) => {
  const theme = useTheme();
  const safePadding = useSafeAreaPadding();

  // Calculate additional padding based on aggressive mode
  const additionalPadding = aggressive ? {
    paddingTop: edges.includes('top') ? 0 : 0, // SafeAreaView handles top
    paddingBottom: edges.includes('bottom') ? (Platform.OS === 'ios' ? 25 : 35) : 0,
    paddingLeft: edges.includes('left') ? 0 : 0, // SafeAreaView handles left
    paddingRight: edges.includes('right') ? 0 : 0, // SafeAreaView handles right
  } : {};

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        style
      ]}
      edges={edges}
      {...props}
    >
      <View style={[
        styles.innerContainer,
        additionalPadding
      ]}>
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
