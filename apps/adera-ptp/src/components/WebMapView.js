import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from '@adera/ui';

// Only import leaflet on web
let MapContainer, TileLayer, Marker, Popup, useMap;
let leafletAvailable = false;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  try {
    // Import leaflet CSS (only on web)
    if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
    
    // Fix for leaflet default icon issue (will be applied when leaflet loads)
    if (typeof window !== 'undefined') {
      const fixLeafletIcons = () => {
        if (window.L && window.L.Icon && window.L.Icon.Default) {
          delete window.L.Icon.Default.prototype._getIconUrl;
          window.L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          });
        }
      };
      // Try immediately
      fixLeafletIcons();
      // Also try after a short delay in case leaflet loads asynchronously
      setTimeout(fixLeafletIcons, 100);
    }
    
    const L = require('react-leaflet');
    MapContainer = L.MapContainer;
    TileLayer = L.TileLayer;
    Marker = L.Marker;
    Popup = L.Popup;
    useMap = L.useMap;
    leafletAvailable = true;
  } catch (e) {
    console.warn('[WebMapView] react-leaflet not available:', e);
    leafletAvailable = false;
  }
}

const WebMapView = ({ 
  partner, 
  userLocation, 
  partners = [],
  onPartnerSelect,
  selectedPartnerId = null,
  showUserLocation = true,
  height = 260,
  ...props 
}) => {
  const theme = useTheme();
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Fallback for non-web or when leaflet is not available
  if (Platform.OS !== 'web' || !MapContainer) {
    return (
      <View style={[styles.fallbackContainer, { height }]}>
        <Text style={[styles.fallbackText, { color: theme.colors.text.secondary }]}>
          Interactive map not available
        </Text>
      </View>
    );
  }

  // Single partner view (existing functionality)
  if (partner && partners.length === 0) {
    return <SinglePartnerMapView partner={partner} userLocation={userLocation} height={height} theme={theme} />;
  }

  // Multiple partners view (for partner selection)
  return (
    <View style={[styles.container, { height }]}>
      <MapContainer
        center={userLocation ? [userLocation.latitude, userLocation.longitude] : [8.9806, 38.7578]}
        zoom={12}
        style={{ height: '100%', width: '100%', borderRadius: 12 }}
        whenReady={() => setMapReady(true)}
        {...props}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        {showUserLocation && userLocation && userLocation.latitude && userLocation.longitude && (
          <Marker position={[userLocation.latitude, userLocation.longitude]}>
            <Popup>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Partner markers */}
        {partners.map((p) => {
          if (!p.location || !p.location.latitude || !p.location.longitude) return null;
          
          const isSelected = selectedPartnerId === p.id;
          
          return (
            <Marker
              key={p.id}
              position={[p.location.latitude, p.location.longitude]}
              eventHandlers={{
                click: () => {
                  if (onPartnerSelect) {
                    onPartnerSelect(p);
                  }
                },
              }}
            >
              <Popup>
                <div style={{ minWidth: '200px', padding: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px', color: theme.colors.text.primary }}>
                    {p.name}
                  </div>
                  {p.address && (
                    <div style={{ fontSize: '12px', marginBottom: '4px', color: theme.colors.text.secondary }}>
                      {p.address}
                    </div>
                  )}
                  {typeof p.distance === 'number' && (
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px', color: theme.colors.primary }}>
                      {p.distance < 1 
                        ? `${Math.round(p.distance * 1000)} m away`
                        : `${p.distance.toFixed(1)} km away`
                      }
                    </div>
                  )}
                  {onPartnerSelect && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPartnerSelect(p);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 16px',
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.onPrimary || '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Select
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {!mapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
    </View>
  );
};

// Single partner view (backward compatibility)
const SinglePartnerMapView = ({ partner, userLocation, height, theme }) => {
  const getMapUrlWithUserLocation = () => {
    if (!partner || !partner.location) return null;
    const lat = Number(partner.location.latitude || 0);
    const lon = Number(partner.location.longitude || 0);
    if (!lat || !lon) return null;
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01},${lat - 0.01},${lon + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lon}`;
    }
    const uLat = Number(userLocation.latitude);
    const uLon = Number(userLocation.longitude);
    const minLon = Math.min(lon, uLon) - 0.01;
    const minLat = Math.min(lat, uLat) - 0.01;
    const maxLon = Math.max(lon, uLon) + 0.01;
    const maxLat = Math.max(lat, uLat) + 0.01;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon},${minLat},${maxLon},${maxLat}&layer=mapnik&marker=${lat},${lon}`;
  };

  const openInGoogleMaps = () => {
    try {
      const lat = Number(partner.location.latitude || 0);
      const lon = Number(partner.location.longitude || 0);
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      if (typeof window !== 'undefined') window.open(url, '_blank');
      else Linking.openURL(url);
    } catch (e) {
      // ignore
    }
  };

  const mapUrl = getMapUrlWithUserLocation();

  if (!mapUrl) {
    return (
      <View style={[styles.mapUnavailableContainer, { height }]}>
        <Text style={styles.mapUnavailableText}>Map unavailable</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <iframe
        src={mapUrl}
        title={`Map for ${partner.name}`}
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 'none', borderRadius: 12 }}
      />
      <View style={styles.overlay}>
        <View style={styles.partnerLabel}>
          <Text style={styles.partnerLabelText}>{partner.name}</Text>
        </View>
        {userLocation && userLocation.latitude && userLocation.longitude && (
          <View style={styles.userLabel}>
            <Text style={styles.userLabelText}>You</Text>
          </View>
        )}
        <View style={styles.gmapsButtonContainer}>
          <TouchableOpacity onPress={openInGoogleMaps} style={styles.gmapsButton}>
            <Text style={styles.gmapsButtonText}>Open in Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  partnerLabel: {
    position: 'absolute',
    left: '60%',
    top: '18%',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  partnerLabelText: {
    fontWeight: '700',
  },
  userLabel: {
    position: 'absolute',
    left: '45%',
    top: '70%',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  userLabelText: {
    color: '#fff',
    fontWeight: '700',
  },
  gmapsButtonContainer: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    pointerEvents: 'auto',
  },
  gmapsButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  gmapsButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  mapUnavailableContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
  },
  mapUnavailableText: {
    color: '#666',
  },
  fallbackContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  fallbackText: {
    fontSize: 14,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  popupContent: {
    minWidth: 150,
    padding: 4,
  },
  popupTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  popupText: {
    fontSize: 12,
    marginBottom: 4,
  },
  selectButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  selectButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default WebMapView;
