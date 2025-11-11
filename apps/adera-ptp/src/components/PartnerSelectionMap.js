import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from './MapView';

const PartnerSelectionMap = ({
  partners,
  userLocation,
  height = 200,
  showUserLocation = false,
  onSelectPartner,
}) => {
  const initialRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : undefined;

  return (
    <MapView
      style={{ height }}
      initialRegion={initialRegion}
      showsUserLocation={showUserLocation}
    >
      {partners.map((partner) => (
        <Marker
          key={partner.id}
          coordinate={{ latitude: partner.lat, longitude: partner.lng }}
          title={partner.name}
          description={partner.address}
          onPress={() => onSelectPartner?.(partner)}
        />
      ))}
    </MapView>
  );
};

export default PartnerSelectionMap;
