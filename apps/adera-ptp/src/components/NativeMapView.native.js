/**
 * Native-only map components
 * This file is only imported on native platforms to prevent web bundler errors
 */
import React from 'react';
import { Platform } from 'react-native';

// This file should never be imported on web
if (Platform.OS === 'web') {
  throw new Error('NativeMapView should not be imported on web platform');
}

let RNMapView, RNMarker, RNCallout;
try {
  const Maps = require('react-native-maps');
  RNMapView = Maps.default;
  RNMarker = Maps.Marker;
  RNCallout = Maps.Callout;
} catch (e) {
  console.warn('[NativeMapView] react-native-maps not available:', e);
}

export const NativeMapView = RNMapView;
export const NativeMarker = RNMarker;
export const NativeCallout = RNCallout;

