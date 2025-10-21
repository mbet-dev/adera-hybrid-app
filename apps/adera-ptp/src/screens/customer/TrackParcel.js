import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
} from 'react-native';
import { SafeArea, Card, Button, useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TrackParcel = () => {
  const theme = useTheme();
  const [trackingId, setTrackingId] = useState('');
  const [parcelData, setParcelData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock parcel data for demonstration
  const mockParcelData = {
    trackingId: 'ADE20250110-3',
    recipient: 'Beza Tesfaye',
    recipientPhone: '+251 912 345 678',
    sender: 'Alex Mengistu',
    currentStatus: 'in_transit_to_hub',
    statusLabel: 'In Transit to Hub',
    estimatedDelivery: '2025-01-12',
    timeline: [
      {
        id: 6,
        status: 'delivered',
        label: 'Delivered',
        description: 'Parcel delivered to recipient',
        timestamp: null,
        completed: false,
        icon: 'check-circle',
      },
      {
        id: 5,
        status: 'at_pickup_partner',
        label: 'At Pickup Partner',
        description: 'Parcel ready for pickup at Mexico Square Store',
        timestamp: null,
        completed: false,
        icon: 'store',
      },
      {
        id: 4,
        status: 'dispatched',
        label: 'Out for Delivery',
        description: 'Driver dispatched to pickup location',
        timestamp: null,
        completed: false,
        icon: 'truck-delivery',
      },
      {
        id: 3,
        status: 'at_hub',
        label: 'At Sorting Hub',
        description: 'Parcel sorted and processed at facility',
        timestamp: '2025-01-10 14:30',
        completed: true,
        icon: 'package-variant-closed',
      },
      {
        id: 2,
        status: 'in_transit_to_hub',
        label: 'In Transit to Hub',
        description: 'Driver en route to sorting facility',
        timestamp: '2025-01-10 11:15',
        completed: true,
        icon: 'truck-fast',
        active: true,
      },
      {
        id: 1,
        status: 'dropoff',
        label: 'At Dropoff Partner',
        description: 'Parcel received at Bole Mini Market',
        timestamp: '2025-01-10 09:00',
        completed: true,
        icon: 'store-check',
      },
      {
        id: 0,
        status: 'created',
        label: 'Order Created',
        description: 'Parcel order created and payment confirmed',
        timestamp: '2025-01-10 08:30',
        completed: true,
        icon: 'package-variant',
      },
    ],
  };

  const handleTrack = async () => {
    if (!trackingId.trim()) {
      Alert.alert('Required', 'Please enter a tracking ID');
      return;
    }

    setIsLoading(true);
    // TODO: Fetch from Supabase
    await new Promise(resolve => setTimeout(resolve, 1000));
    setParcelData(mockParcelData);
    setIsLoading(false);
  };

  const handleClear = () => {
    setTrackingId('');
    setParcelData(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return '#4CAF50';
      case 'at_pickup_partner':
      case 'dispatched':
        return '#2196F3';
      case 'at_hub':
      case 'in_transit_to_hub':
        return '#FF9800';
      case 'dropoff':
      case 'created':
        return '#9E9E9E';
      default:
        return theme.colors.text.secondary;
    }
  };

  const renderSearchSection = () => (
    <View style={styles.searchSection}>
      <Card style={styles.searchCard}>
        <Text style={[styles.searchTitle, { color: theme.colors.text.primary }]}>
          Track Your Parcel
        </Text>
        <Text style={[styles.searchSubtitle, { color: theme.colors.text.secondary }]}>
          Enter your tracking ID to view real-time status
        </Text>

        <View style={styles.searchInputContainer}>
          <View style={[styles.searchInputWrapper, { borderColor: theme.colors.outline }]}>
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color={theme.colors.text.secondary}
              style={styles.searchIcon}
            />
            <RNTextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder="e.g., ADE20250110-3"
              placeholderTextColor={theme.colors.text.secondary}
              value={trackingId}
              onChangeText={setTrackingId}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {trackingId.length > 0 && (
              <TouchableOpacity onPress={handleClear}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
          <Button
            title="Track"
            onPress={handleTrack}
            loading={isLoading}
            size="lg"
            style={styles.trackButton}
          />
        </View>

        {/* QR Scan Placeholder */}
        <TouchableOpacity
          style={[styles.qrPlaceholder, { borderColor: theme.colors.outline }]}
          onPress={() => {
            Alert.alert(
              'QR Scanner',
              'QR code scanning will be implemented in the next phase. For now, please use manual tracking input.',
              [{ text: 'OK' }]
            );
          }}
        >
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={32}
            color={theme.colors.primary}
          />
          <Text style={[styles.qrPlaceholderText, { color: theme.colors.primary }]}>
            Scan QR Code (Coming Soon)
          </Text>
        </TouchableOpacity>
      </Card>
    </View>
  );

  const renderParcelDetails = () => {
    if (!parcelData) return null;

    return (
      <View style={styles.detailsSection}>
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={styles.statusIconContainer}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={40}
                color={getStatusColor(parcelData.currentStatus)}
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: theme.colors.text.secondary }]}>
                Current Status
              </Text>
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(parcelData.currentStatus) },
                ]}
              >
                {parcelData.statusLabel}
              </Text>
            </View>
          </View>
          <View style={[styles.statusDivider, { backgroundColor: theme.colors.outline }]} />
          <View style={styles.statusDetails}>
            <View style={styles.statusDetailRow}>
              <MaterialCommunityIcons
                name="barcode"
                size={20}
                color={theme.colors.text.secondary}
              />
              <Text style={[styles.statusDetailLabel, { color: theme.colors.text.secondary }]}>
                Tracking ID
              </Text>
              <Text style={[styles.statusDetailValue, { color: theme.colors.text.primary }]}>
                {parcelData.trackingId}
              </Text>
            </View>
            <View style={styles.statusDetailRow}>
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={theme.colors.text.secondary}
              />
              <Text style={[styles.statusDetailLabel, { color: theme.colors.text.secondary }]}>
                Recipient
              </Text>
              <Text style={[styles.statusDetailValue, { color: theme.colors.text.primary }]}>
                {parcelData.recipient}
              </Text>
            </View>
            <View style={styles.statusDetailRow}>
              <MaterialCommunityIcons
                name="calendar"
                size={20}
                color={theme.colors.text.secondary}
              />
              <Text style={[styles.statusDetailLabel, { color: theme.colors.text.secondary }]}>
                Est. Delivery
              </Text>
              <Text style={[styles.statusDetailValue, { color: theme.colors.text.primary }]}>
                {new Date(parcelData.estimatedDelivery).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </Card>

        {/* Timeline */}
        <Card style={styles.timelineCard}>
          <Text style={[styles.timelineTitle, { color: theme.colors.text.primary }]}>
            Delivery Timeline
          </Text>

          <View style={styles.timeline}>
            {parcelData.timeline.map((event, index) => (
              <View key={event.id} style={styles.timelineItem}>
                <View style={styles.timelineLeftColumn}>
                  {event.timestamp && (
                    <Text style={[styles.timelineTime, { color: theme.colors.text.secondary }]}>
                      {new Date(event.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
                <View style={styles.timelineCenter}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor: event.completed
                          ? getStatusColor(event.status)
                          : theme.colors.surfaceVariant,
                        borderColor: event.active
                          ? getStatusColor(event.status)
                          : 'transparent',
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={event.icon}
                      size={16}
                      color={event.completed ? '#FFF' : theme.colors.text.secondary}
                    />
                  </View>
                  {index < parcelData.timeline.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        {
                          backgroundColor: event.completed
                            ? getStatusColor(event.status)
                            : theme.colors.surfaceVariant,
                        },
                      ]}
                    />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      {
                        color: event.completed
                          ? theme.colors.text.primary
                          : theme.colors.text.secondary,
                        fontWeight: event.active ? '700' : '600',
                      },
                    ]}
                  >
                    {event.label}
                  </Text>
                  <Text
                    style={[
                      styles.timelineDescription,
                      { color: theme.colors.text.secondary },
                    ]}
                  >
                    {event.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Contact Support"
            onPress={() => {
              Alert.alert('Contact Support', 'Support chat feature coming soon');
            }}
            variant="outline"
            leftIcon="chat"
          />
          <Button
            title="Share Tracking"
            onPress={() => {
              Alert.alert('Share', 'Share tracking link feature coming soon');
            }}
            variant="outline"
            leftIcon="share-variant"
          />
        </View>
      </View>
    );
  };

  return (
    <SafeArea edges={['top']}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSearchSection()}
        {renderParcelDetails()}
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  searchCard: {
    padding: 20,
  },
  searchTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  searchSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  searchInputContainer: {
    gap: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  trackButton: {
    width: '100%',
  },
  qrPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    marginTop: 16,
    gap: 12,
  },
  qrPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  statusCard: {
    padding: 20,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
  },
  statusDivider: {
    height: 1,
    marginBottom: 16,
  },
  statusDetails: {
    gap: 12,
  },
  statusDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDetailLabel: {
    fontSize: 14,
    flex: 1,
  },
  statusDetailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  timelineCard: {
    padding: 20,
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  timelineLeftColumn: {
    width: 60,
    paddingTop: 4,
  },
  timelineTime: {
    fontSize: 12,
  },
  timelineCenter: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 16,
  },
  timelineLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
});

export default TrackParcel;
