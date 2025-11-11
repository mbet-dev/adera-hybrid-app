import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WebMapView = ({ children, style, initialRegion, showsUserLocation }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);

  const markers = React.Children.toArray(children).map((child) => child.props);

  const getMapUrl = () => {
    let centerLat, centerLon, zoom;

    if (initialRegion) {
      centerLat = initialRegion.latitude;
      centerLon = initialRegion.longitude;
      const zoomLat = Math.log2(360 / initialRegion.latitudeDelta);
      const zoomLon = Math.log2(360 / initialRegion.longitudeDelta);
      zoom = Math.min(zoomLat, zoomLon);
    } else if (markers.length > 0) {
      const latitudes = markers.map((m) => m.coordinate.latitude);
      const longitudes = markers.map((m) => m.coordinate.longitude);
      centerLat = (Math.min(...latitudes) + Math.max(...latitudes)) / 2;
      centerLon = (Math.min(...longitudes) + Math.max(...longitudes)) / 2;
      zoom = 10;
    } else {
      centerLat = 9.0054; // Default to Addis Ababa
      centerLon = 38.7636;
      zoom = 10;
    }

    const markerParams = markers
      .map(
        (marker) =>
          `${marker.coordinate.longitude},${marker.coordinate.latitude},blue-pushpin`
      )
      .join('~');

    return `https://www.bing.com/maps/embed?h=400&w=800&cp=${centerLat}~${centerLon}&lvl=${zoom}&typ=d&sty=r&src=SHELL&FORM=MBEDV8&pins=${markerParams}`;
  };

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
  };

  return (
    <View style={[styles.container, style]}>
      <iframe
        src={getMapUrl()}
        title="Map"
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 'none' }}
      />
      {markers.map((marker, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: '50%', // Approximate position
            top: '50%', // Approximate position
            transform: 'translate(-50%, -100%)',
            cursor: 'pointer',
          }}
          onClick={() => handleMarkerClick(marker)}
        >
          {/* This is a simplified representation. A real implementation would need to calculate pixel positions from lat/lon */}
          <div style={{ fontSize: 24 }}>📍</div>
        </div>
      ))}
      {selectedMarker && (
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{selectedMarker.title}</Text>
          <Text>{selectedMarker.description}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  callout: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  calloutTitle: {
    fontWeight: 'bold',
  },
});

export default WebMapView;
