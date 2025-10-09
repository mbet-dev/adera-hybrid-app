import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, TextInput, Button, StatusBadge, useTheme } from '@adera/ui';
import { Ionicons } from '@expo/vector-icons';

const TrackParcel = ({ navigation, route }) => {
  const theme = useTheme();
  const [trackingId, setTrackingId] = useState(route?.params?.trackingId || '');
  const [parcelData, setParcelData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async () => {
    if (!trackingId.trim()) return;
    
    setLoading(true);
    // TODO: Implement actual tracking API
    setTimeout(() => {
      setParcelData({
        tracking_id: trackingId,
        status: 2,
        recipient_name: 'John Doe',
        current_location: 'Transit Hub - Bole',
        estimated_delivery: '2025-01-10T14:00:00.000Z',
        events: [
          { status: 0, location: 'Created', time: '2025-01-09T10:00:00.000Z' },
          { status: 1, location: 'Picked up - Piazza', time: '2025-01-09T11:30:00.000Z' },
          { status: 2, location: 'In transit to hub', time: '2025-01-09T12:00:00.000Z' }
        ]
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <AppBar 
        title="Track Parcel"
        onBack={() => navigation?.goBack?.()}
      />
      
      <ScrollView style={styles.content}>
        <Card style={styles.searchCard}>
          <Text variant="titleLarge" style={styles.cardTitle}>
            Enter Tracking ID
          </Text>
          
          <TextInput
            label="Tracking ID"
            value={trackingId}
            onChangeText={setTrackingId}
            placeholder="AD001234"
            style={styles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleTrack}
            loading={loading}
            style={styles.trackButton}
          >
            Track Parcel
          </Button>
        </Card>

        {parcelData && (
          <>
            <Card style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Text variant="titleLarge">#{parcelData.tracking_id}</Text>
                <StatusBadge status={parcelData.status} />
              </View>
              
              <View style={styles.statusInfo}>
                <Ionicons name="location" size={20} color={theme.colors.primary} />
                <Text variant="bodyLarge">{parcelData.current_location}</Text>
              </View>
              
              <Text variant="bodyMedium" style={styles.estimatedTime}>
                Estimated delivery: Today, 2:00 PM
              </Text>
            </Card>

            <Card style={styles.timelineCard}>
              <Text variant="titleMedium" style={styles.timelineTitle}>
                Tracking Timeline
              </Text>
              
              {parcelData.events.map((event, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineMarker}>
                    <View style={[
                      styles.timelineDot,
                      { backgroundColor: theme.colors.primary }
                    ]} />
                    {index < parcelData.events.length - 1 && (
                      <View style={[
                        styles.timelineLine,
                        { backgroundColor: theme.colors.gray[300] }
                      ]} />
                    )}
                  </View>
                  
                  <View style={styles.timelineContent}>
                    <Text variant="bodyLarge" style={styles.timelineLocation}>
                      {event.location}
                    </Text>
                    <Text variant="bodySmall" style={styles.timelineTime}>
                      {new Date(event.time).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchCard: {
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  trackButton: {
    paddingVertical: 8,
  },
  statusCard: {
    padding: 20,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  estimatedTime: {
    color: '#666',
  },
  timelineCard: {
    padding: 20,
  },
  timelineTitle: {
    marginBottom: 16,
    fontWeight: '500',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineMarker: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLocation: {
    fontWeight: '500',
  },
  timelineTime: {
    color: '#666',
    marginTop: 2,
  },
});

export default TrackParcel;
