import React, { useState, useEffect, useMemo, memo } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '@adera/ui';
import MapView, { Marker, Callout } from './MapView';
import WebMapView from './WebMapView';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PartnerSelectionMap = ({
  partners = [],
  userLocation = null,
  selectedPartnerId = null,
  onPartnerSelect,
  filterType = null, // 'dropoff' or 'pickup'
  height = 400,
  showUserLocation = true,
  ...props
}) => {
  const theme = useTheme();
  const [mapRegion, setMapRegion] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter partners based on type
  const filteredPartners = useMemo(() => {
    if (!filterType) return partners;
    return partners.filter((p) => {
      if (filterType === 'dropoff') return p.isDropoff === true;
      if (filterType === 'pickup') return p.isPickup === true;
      return true;
    });
  }, [partners, filterType]);

  // Calculate map region to show all partners and user location
  useEffect(() => {
    if (filteredPartners.length === 0) {
      if (userLocation) {
        setMapRegion({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } else {
        // Default to Addis Ababa
        setMapRegion({
          latitude: 8.9806,
          longitude: 38.7578,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
      setLoading(false);
      return;
    }

    const validPartners = filteredPartners.filter(
      (p) => p.location && p.location.latitude && p.location.longitude
    );

    if (validPartners.length === 0) {
      setLoading(false);
      return;
    }

    const lats = validPartners.map((p) => p.location.latitude);
    const lons = validPartners.map((p) => p.location.longitude);

    if (userLocation && userLocation.latitude && userLocation.longitude) {
      lats.push(userLocation.latitude);
      lons.push(userLocation.longitude);
    }

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
    const lonDelta = Math.max((maxLon - minLon) * 1.5, 0.01);

    setMapRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lonDelta,
    });
    setLoading(false);
  }, [filteredPartners, userLocation]);

  // Web implementation using WebMapView
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { height }]}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
              Loading map...
            </Text>
          </View>
        ) : (
          <WebMapView
            partners={filteredPartners}
            userLocation={userLocation}
            onPartnerSelect={onPartnerSelect}
            selectedPartnerId={selectedPartnerId}
            showUserLocation={showUserLocation}
            height={height}
            {...props}
          />
        )}
      </View>
    );
  }

  // Native implementation using MapView
  if (loading || !mapRegion) {
    return (
      <View style={[styles.container, styles.loadingContainer, { height }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>
          Loading map...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        style={styles.map}
        initialRegion={mapRegion}
        region={mapRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={showUserLocation}
        onRegionChangeComplete={setMapRegion}
        {...props}
      >
        {/* User location marker (if showsUserLocation is false, we add custom marker) */}
        {showUserLocation && userLocation && userLocation.latitude && userLocation.longitude && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            pinColor="#FF3B30"
            title="Your Location"
          />
        )}

        {/* Partner markers */}
        {filteredPartners.map((partner) => {
          if (!partner.location || !partner.location.latitude || !partner.location.longitude) {
            return null;
          }

          const isSelected = selectedPartnerId === partner.id;
          const pinColor = isSelected ? theme.colors.primary : '#007AFF';

          return (
            <Marker
              key={partner.id}
              coordinate={{
                latitude: partner.location.latitude,
                longitude: partner.location.longitude,
              }}
              pinColor={pinColor}
              title={partner.name}
              description={partner.address}
              onPress={() => {
                if (onPartnerSelect) {
                  onPartnerSelect(partner);
                }
              }}
            >
              <Callout>
                <View style={styles.calloutContainer}>
                  <Text style={[styles.calloutTitle, { color: theme.colors.text.primary }]}>
                    {partner.name}
                  </Text>
                  {partner.address && (
                    <Text style={[styles.calloutText, { color: theme.colors.text.secondary }]}>
                      {partner.address}
                    </Text>
                  )}
                  {typeof partner.distance === 'number' && (
                    <View style={styles.distanceRow}>
                      <MaterialCommunityIcons
                        name="map-marker-distance"
                        size={14}
                        color={theme.colors.primary}
                      />
                      <Text style={[styles.calloutDistance, { color: theme.colors.primary }]}>
                        {partner.distance < 1
                          ? `${Math.round(partner.distance * 1000)} m away`
                          : `${partner.distance.toFixed(1)} km away`}
                      </Text>
                    </View>
                  )}
                  {partner.rating > 0 && (
                    <View style={styles.ratingRow}>
                      <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
                      <Text style={[styles.calloutText, { color: theme.colors.text.secondary }]}>
                        {partner.rating.toFixed(1)} ({partner.totalReviews || 0} reviews)
                      </Text>
                    </View>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  calloutContainer: {
    minWidth: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 12,
    marginBottom: 4,
  },
  calloutDistance: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});

export default memo(PartnerSelectionMap);

