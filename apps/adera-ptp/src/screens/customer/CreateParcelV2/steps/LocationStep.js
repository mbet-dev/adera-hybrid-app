import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Text, Chip, Button, useTheme } from '@adera/ui';
import { usePartners } from '../../../../hooks/usePartners';
import PartnerSelectionModal from '../../../../components/PartnerSelectionModal';
import PartnerSelectionMap from '../../../../components/PartnerSelectionMap';

const LocationStep = ({ values, onChange }) => {
  const theme = useTheme();
  const { partners, loading, userLocation } = usePartners();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('dropoff'); // 'dropoff' | 'pickup'
  const selectedDrop = values.dropoffPartner;
  const selectedPick = values.pickupPartner;

  const handleSelectPartner = (partner) => {
    if (modalType === 'dropoff') {
      onChange({ dropoffPartner: partner });
    } else {
      onChange({ pickupPartner: partner });
    }
    setModalVisible(false);
  };

  // naive price estimate: base + distance km * 5 ETB
  const distanceKm = useMemo(() => {
    if (!selectedDrop || !selectedPick) return 0;
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(selectedPick.lat - selectedDrop.lat);
    const dLon = toRad(selectedPick.lng - selectedDrop.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(selectedDrop.lat)) *
        Math.cos(toRad(selectedPick.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [selectedDrop, selectedPick]);

  const priceEstimate = useMemo(() => {
    if (!values.packageSize) return 0;
    const base = { document: 50, small: 100, medium: 150, large: 250 }[values.packageSize] || 100;
    return Math.round(base + distanceKm * 5);
  }, [values.packageSize, distanceKm]);

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.header}>
        Select Partners
      </Text>

      <View style={styles.row}>
        <Text>Drop-off Partner</Text>
        <Chip
          mode="outlined"
          icon="store"
          onPress={() => {
            setModalType('dropoff');
            setModalVisible(true);
          }}
        >
          {selectedDrop ? selectedDrop.name : 'Choose'}
        </Chip>
      </View>

      <View style={styles.row}>
        <Text>Pick-up Partner</Text>
        <Chip
          mode="outlined"
          icon="store"
          onPress={() => {
            setModalType('pickup');
            setModalVisible(true);
          }}
        >
          {selectedPick ? selectedPick.name : 'Choose'}
        </Chip>
      </View>

      {/* Map preview */}
      <View style={styles.mapContainer}>
        <PartnerSelectionMap
          partners={[selectedDrop, selectedPick].filter(Boolean)}
          userLocation={userLocation}
          height={200}
          showUserLocation
        />
      </View>

      {/* Price estimate */}
      <View style={styles.priceBox}>
        <Text style={{ color: theme.colors.text.secondary }}>Estimated Price</Text>
        <Text variant="titleMedium">ETB {priceEstimate}</Text>
      </View>

      <PartnerSelectionModal
        visible={modalVisible}
        partners={partners}
        userLocation={userLocation}
        filterType={modalType === 'dropoff' ? 'dropoff' : 'pickup'}
        onSelect={handleSelectPartner}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mapContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  priceBox: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
});

export default LocationStep;
