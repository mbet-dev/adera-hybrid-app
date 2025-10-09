import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';
import Card from './Card';
import StatusBadge from './StatusBadge';

const ParcelCard = ({ 
  parcel, 
  onPress, 
  onTrack,
  style,
  showActions = true 
}) => {
  const theme = useTheme();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card style={[styles.card, style]} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.trackingInfo}>
          <Text style={[styles.trackingId, { color: theme.colors.primary }]}>
            #{parcel.tracking_id}
          </Text>
          <StatusBadge status={parcel.status} size="small" />
        </View>
        <Text style={[styles.date, { color: theme.colors.text.secondary }]}>
          {formatDate(parcel.created_at)}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.locationRow}>
          <Ionicons 
            name="location-outline" 
            size={16} 
            color={theme.colors.primary} 
          />
          <View style={styles.locationInfo}>
            <Text style={[styles.locationLabel, { color: theme.colors.text.secondary }]}>
              From
            </Text>
            <Text style={[styles.locationText, { color: theme.colors.text.primary }]}>
              {parcel.pickup_location?.name || 'Pickup Location'}
            </Text>
          </View>
        </View>

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.gray[200] }]} />
          <Ionicons 
            name="arrow-down" 
            size={16} 
            color={theme.colors.gray[400]} 
          />
        </View>

        <View style={styles.locationRow}>
          <Ionicons 
            name="flag-outline" 
            size={16} 
            color={theme.colors.secondary} 
          />
          <View style={styles.locationInfo}>
            <Text style={[styles.locationLabel, { color: theme.colors.text.secondary }]}>
              To
            </Text>
            <Text style={[styles.locationText, { color: theme.colors.text.primary }]}>
              {parcel.delivery_location?.name || parcel.recipient_name}
            </Text>
          </View>
        </View>
      </View>

      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              { borderColor: theme.colors.primary }
            ]}
            onPress={() => onTrack?.(parcel)}
          >
            <Ionicons 
              name="location" 
              size={16} 
              color={theme.colors.primary} 
            />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>
              Track
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.actionButton,
              { borderColor: theme.colors.gray[300] }
            ]}
            onPress={() => onPress?.(parcel)}
          >
            <Ionicons 
              name="information-circle-outline" 
              size={16} 
              color={theme.colors.text.secondary} 
            />
            <Text style={[styles.actionText, { color: theme.colors.text.secondary }]}>
              Details
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingId: {
    fontSize: 16,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
  },
  content: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    alignItems: 'center',
    marginVertical: 8,
    position: 'relative',
  },
  dividerLine: {
    position: 'absolute',
    left: 8,
    top: 8,
    bottom: 8,
    width: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ParcelCard;
