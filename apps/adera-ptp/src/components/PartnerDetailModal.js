import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '@adera/ui';
import OperatingHoursDisplay from './OperatingHoursDisplay';
import defaultStorefront from '../../assets/adaptive-icon.png';
import MapView, { Marker, Callout } from './MapView';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PartnerDetailModal = ({ visible = false, partner = null, userLocation = null, onClose = () => {} }) => {
  const theme = useTheme();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (partner?.storefrontImage) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [partner]);

  if (!partner) return null;

  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) return 'Distance unknown';
    if (distance < 1) return `${Math.round(distance * 1000)} m away`;
    return `${distance.toFixed(1)} km away`;
  };

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme?.colors?.surface || '#fff' }]}>
          <View style={[styles.header, { backgroundColor: theme?.colors?.primary || '#1976D2' }]}>
            <Text style={[styles.headerTitle, { color: theme?.colors?.onPrimary || '#fff' }]} numberOfLines={1}>{partner.name}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={theme?.colors?.onPrimary || '#fff'} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.responsiveImageContainer}>
              {!imageError && partner.storefrontImage ? (
                <View>
                  <Image
                    source={{ uri: partner.storefrontImage }}
                    style={styles.detailHeroImage}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                    resizeMode="cover"
                  />
                  {imageLoading && (
                    <View style={styles.imageSpinnerOverlay}>
                      <ActivityIndicator size="large" color={theme?.colors?.primary || '#1976D2'} />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialCommunityIcons name="storefront-outline" size={72} color={theme?.colors?.onSurfaceVariant || '#999'} />
                </View>
              )}
            </View>

            <View style={styles.infoCard}>
              <Text style={[styles.name, { color: theme?.colors?.onSurface || '#111' }]}>{partner.name}</Text>
              {typeof partner.distance === 'number' && (
                <Text style={[styles.distanceText, { color: theme?.colors?.onSurface || '#111' }]}>
                  {formatDistance(partner.distance)}
                </Text>
              )}
              <Text style={[styles.infoText, { color: theme?.colors?.onSurface || '#111' }]}>
                {partner.address || 'Address not available'}
              </Text>
            </View>

            <View style={styles.mapCard}>
              <MapView
                style={{ height: 200 }}
                initialRegion={{
                  latitude: partner.location.latitude,
                  longitude: partner.location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={partner.location}
                  title={partner.name}
                />
              </MapView>
            </View>

            <View style={styles.hoursCard}>
              <Text style={[styles.sectionTitle, { color: theme?.colors?.onSurface || '#111' }]}>Operating Hours</Text>
              <OperatingHoursDisplay operatingHours={partner.operatingHours} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  headerTitle: { fontSize: 20, fontWeight: '700', flex: 1 },
  closeButton: { padding: 8 },
  responsiveImageContainer: { width: '100%', height: 200, backgroundColor: '#f0f0f0' },
  detailHeroImage: { width: '100%', height: '100%' },
  imageSpinnerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoCard: { padding: 16 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  distanceText: { fontSize: 16, marginBottom: 8 },
  infoText: { fontSize: 16 },
  mapCard: { padding: 16 },
  hoursCard: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
});

export default PartnerDetailModal;
