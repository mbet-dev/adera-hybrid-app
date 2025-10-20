import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeArea, Card, useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ParcelHistory = () => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [parcels, setParcels] = useState([
    {
      id: '1',
      trackingId: 'ADE20250110-3',
      recipient: 'Beza Tesfaye',
      status: 'in_transit_to_hub',
      statusLabel: 'In Transit',
      date: '2025-01-10',
      price: 150.0,
      icon: 'truck-fast',
      color: '#FF9800',
    },
    {
      id: '2',
      trackingId: 'ADE20250108-6',
      recipient: 'Dawit Kebede',
      status: 'delivered',
      statusLabel: 'Delivered',
      date: '2025-01-08',
      price: 120.0,
      icon: 'check-circle',
      color: '#4CAF50',
    },
    {
      id: '3',
      trackingId: 'ADE20250105-2',
      recipient: 'Selam Amare',
      status: 'delivered',
      statusLabel: 'Delivered',
      date: '2025-01-05',
      price: 180.0,
      icon: 'check-circle',
      color: '#4CAF50',
    },
    {
      id: '4',
      trackingId: 'ADE20250103-1',
      recipient: 'Yonas Desta',
      status: 'cancelled',
      statusLabel: 'Cancelled',
      date: '2025-01-03',
      price: 100.0,
      icon: 'close-circle',
      color: '#F44336',
    },
    {
      id: '5',
      trackingId: 'ADE20241228-5',
      recipient: 'Mahlet Girma',
      status: 'delivered',
      statusLabel: 'Delivered',
      date: '2024-12-28',
      price: 200.0,
      icon: 'check-circle',
      color: '#4CAF50',
    },
    {
      id: '6',
      trackingId: 'ADE20241220-4',
      recipient: 'Henok Tadesse',
      status: 'at_pickup_partner',
      statusLabel: 'Ready for Pickup',
      date: '2024-12-20',
      price: 130.0,
      icon: 'store',
      color: '#2196F3',
    },
  ]);

  const filters = [
    { id: 'all', label: 'All', count: 6 },
    { id: 'active', label: 'Active', count: 2 },
    { id: 'delivered', label: 'Delivered', count: 3 },
    { id: 'cancelled', label: 'Cancelled', count: 1 },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch from Supabase
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const getFilteredParcels = () => {
    if (filter === 'all') return parcels;
    if (filter === 'active') {
      return parcels.filter(
        p => !['delivered', 'cancelled'].includes(p.status)
      );
    }
    return parcels.filter(p => p.status === filter);
  };

  const renderFilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {filters.map((f) => (
        <TouchableOpacity
          key={f.id}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                filter === f.id ? theme.colors.primary : theme.colors.surfaceVariant,
            },
          ]}
          onPress={() => setFilter(f.id)}
        >
          <Text
            style={[
              styles.filterLabel,
              { color: filter === f.id ? '#FFF' : theme.colors.text.primary },
            ]}
          >
            {f.label}
          </Text>
          <View
            style={[
              styles.filterBadge,
              {
                backgroundColor: filter === f.id ? 'rgba(255,255,255,0.3)' : theme.colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.filterBadgeText,
                { color: filter === f.id ? '#FFF' : theme.colors.text.primary },
              ]}
            >
              {f.count}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderParcelCard = ({ item }) => (
    <Card style={styles.parcelCard}>
      <View style={styles.parcelHeader}>
        <View style={styles.parcelInfo}>
          <View
            style={[
              styles.parcelIcon,
              { backgroundColor: item.color + '20' },
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={item.color}
            />
          </View>
          <View style={styles.parcelDetails}>
            <Text style={[styles.trackingId, { color: theme.colors.text.primary }]}>
              {item.trackingId}
            </Text>
            <Text style={[styles.recipient, { color: theme.colors.text.secondary }]}>
              To: {item.recipient}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.parcelBody}>
        <View style={styles.parcelDetailRow}>
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color={theme.colors.text.secondary}
          />
          <Text style={[styles.parcelDetailText, { color: theme.colors.text.secondary }]}>
            {new Date(item.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.parcelDetailRow}>
          <MaterialCommunityIcons
            name="currency-eth"
            size={16}
            color={theme.colors.text.secondary}
          />
          <Text style={[styles.parcelDetailText, { color: theme.colors.text.secondary }]}>
            {item.price.toFixed(2)} ETB
          </Text>
        </View>
      </View>

      <View style={styles.parcelFooter}>
        <View style={[styles.statusBadge, { backgroundColor: item.color + '20' }]}>
          <Text style={[styles.statusText, { color: item.color }]}>
            {item.statusLabel}
          </Text>
        </View>
        {item.status !== 'delivered' && item.status !== 'cancelled' && (
          <TouchableOpacity style={styles.trackButton}>
            <MaterialCommunityIcons
              name="map-marker-path"
              size={18}
              color={theme.colors.primary}
            />
            <Text style={[styles.trackButtonText, { color: theme.colors.primary }]}>
              Track
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="package-variant"
        size={64}
        color={theme.colors.text.secondary}
      />
      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
        No Parcels Found
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text.secondary }]}>
        {filter === 'all'
          ? "You haven't sent any parcels yet"
          : `No ${filter} parcels found`}
      </Text>
    </View>
  );

  const renderStats = () => {
    const stats = [
      {
        label: 'Total Sent',
        value: parcels.length,
        icon: 'package-variant',
        color: theme.colors.primary,
      },
      {
        label: 'In Transit',
        value: parcels.filter(p => !['delivered', 'cancelled'].includes(p.status))
          .length,
        icon: 'truck-fast',
        color: '#FF9800',
      },
      {
        label: 'Delivered',
        value: parcels.filter(p => p.status === 'delivered').length,
        icon: 'check-circle',
        color: '#4CAF50',
      },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        {stats.map((stat, index) => (
          <Card key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
              <MaterialCommunityIcons
                name={stat.icon}
                size={24}
                color={stat.color}
              />
            </View>
            <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
              {stat.value}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
              {stat.label}
            </Text>
          </Card>
        ))}
      </ScrollView>
    );
  };

  const filteredParcels = getFilteredParcels();

  return (
    <SafeArea edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Parcel History
          </Text>
          <TouchableOpacity>
            <MaterialCommunityIcons
              name="filter-variant"
              size={24}
              color={theme.colors.text.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {renderStats()}

        {/* Filters */}
        {renderFilterChips()}

        {/* Parcel List */}
        <FlatList
          data={filteredParcels}
          renderItem={renderParcelCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsContent: {
    gap: 12,
  },
  statCard: {
    width: 120,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  parcelCard: {
    padding: 16,
    marginBottom: 12,
  },
  parcelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  parcelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  parcelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  parcelDetails: {
    flex: 1,
  },
  trackingId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  recipient: {
    fontSize: 14,
  },
  parcelBody: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  parcelDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  parcelDetailText: {
    fontSize: 14,
  },
  parcelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ParcelHistory;
