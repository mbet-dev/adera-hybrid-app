import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { useTheme } from '@adera/ui';

// Conditionally import native maps only on native platforms
// Use dynamic import to prevent web bundler from including it
let NativeMapView, NativeMarker, NativeCallout;

const loadNativeMaps = () => {
  if (Platform.OS === 'web') return null;
  
    try {
    // Dynamic require - let Metro/platform resolver pick .native or .web
    // Use the platform-agnostic filename so web picks up the .web implementation
    const nativeMaps = require('./NativeMapView');
    return {
      MapView: nativeMaps.NativeMapView,
      Marker: nativeMaps.NativeMarker,
      Callout: nativeMaps.NativeCallout,
    };
  } catch (e) {
    console.warn('[MapView] Native maps not available:', e);
    return null;
  }
};

const MapView = ({ 
  style, 
  initialRegion, 
  region, 
  onRegionChangeComplete,
  children,
  showsUserLocation = false,
  showsMyLocationButton = false,
  loadingEnabled = true,
  ...props 
}) => {
  const theme = useTheme();
  const mapRef = useRef(null);

  // Web fallback - return early to prevent any native code from being evaluated
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Text style={[styles.fallbackText, { color: theme.colors.text.secondary }]}>
          Map not available on this platform
        </Text>
      </View>
    );
  }

  // Lazy load native maps only when needed (native platforms only)
  const nativeMaps = loadNativeMaps();
  if (!nativeMaps || !nativeMaps.MapView) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Text style={[styles.fallbackText, { color: theme.colors.text.secondary }]}>
          Map not available
        </Text>
      </View>
    );
  }

  const RNMapView = nativeMaps.MapView;

  // Update region when prop changes
  useEffect(() => {
    if (mapRef.current && region) {
      mapRef.current.animateToRegion(region, 500);
    }
  }, [region]);

  return (
    <RNMapView
      ref={mapRef}
      style={[styles.map, style]}
      initialRegion={initialRegion}
      region={region}
      onRegionChangeComplete={onRegionChangeComplete}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      loadingEnabled={loadingEnabled}
      mapType="standard"
      {...props}
    >
      {children}
    </RNMapView>
  );
};

const Marker = ({ 
  coordinate, 
  title, 
  description, 
  pinColor, 
  onPress,
  children,
  ...props 
}) => {
  // Web fallback
  if (Platform.OS === 'web') {
    return null;
  }

  // Lazy load native maps
  const nativeMaps = loadNativeMaps();
  if (!nativeMaps || !nativeMaps.Marker) {
    return null;
  }

  const RNMarker = nativeMaps.Marker;

  return (
    <RNMarker
      coordinate={coordinate}
      title={title}
      description={description}
      pinColor={pinColor}
      onPress={onPress}
      {...props}
    >
      {children}
    </RNMarker>
  );
};

const Callout = ({ children, onPress, ...props }) => {
  // Web fallback
  if (Platform.OS === 'web') {
    return null;
  }

  // Lazy load native maps
  const nativeMaps = loadNativeMaps();
  if (!nativeMaps || !nativeMaps.Callout) {
    return null;
  }

  const RNCallout = nativeMaps.Callout;

  return (
    <RNCallout onPress={onPress} {...props}>
      {children}
    </RNCallout>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  fallbackText: {
    fontSize: 14,
  },
});

export default MapView;
export { Marker, Callout };
