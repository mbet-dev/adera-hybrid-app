import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  TextInput,
  Modal,
  Alert,
  Share,
} from 'react-native';
import { SafeArea, Card, useTheme, Button } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ParcelHistory = ({ navigation }) => {
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'status', 'price'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
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

  // Memoized filtered parcels array
const filteredParcels = useMemo(() => {
    let filtered = parcels;

    // Apply status filter
    if (filter !== 'all') {
      if (filter === 'active') {
        filtered = filtered.filter(
          p => !['delivered', 'cancelled'].includes(p.status)
        );
      } else {
        filtered = filtered.filter(p => p.status === filter);
      }
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.trackingId.toLowerCase().includes(query) ||
          p.recipient.toLowerCase().includes(query) ||
          p.statusLabel.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date) - new Date(a.date);
        case 'price':
          return b.price - a.price;
        case 'status':
          return a.statusLabel.localeCompare(b.statusLabel);
        default:
          return 0;
      }
    });

    return filtered;
  }, [parcels, filter, searchQuery, sortBy]);

  const handleExport = useCallback(async () => {
    try {
      const csv = [
        'Tracking ID,Recipient,Status,Date,Price (ETB)',
        ...filteredParcels.map(p =>
          `${p.trackingId},${p.recipient},${p.statusLabel},${p.date},${p.price}`
        ),
      ].join('\n');

      await Share.share({
        message: csv,
        title: 'Parcel History Export',
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to export parcel history');
    }
  }, [filteredParcels]);

  const handleTrackParcel = useCallback((trackingId) => {
    navigation?.navigate?.('track', { trackingId });
  }, [navigation]);

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
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleTrackParcel(item.trackingId)}
      >
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
              <Text
                style={[styles.trackingId, { color: theme.colors.text.primary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.trackingId}
              </Text>
              <Text
                style={[styles.recipient, { color: theme.colors.text.secondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                To: {item.recipient}
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.text.secondary}
          />
        </View>
      <View style={styles.parcelBody}>
        <View style={styles.parcelDetailRow}>
          <MaterialCommunityIcons
            name="calendar"
            size={16}
            color={theme.colors.text.secondary}
          />
          <Text
            style={[styles.parcelDetailText, { color: theme.colors.text.secondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
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
          <Text
            style={[styles.parcelDetailText, { color: theme.colors.text.secondary }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.price.toFixed(2)} ETB
          </Text>
        </View>
      </View>
      <View style={styles.parcelFooter}>
        <View style={[styles.statusBadge, { backgroundColor: item.color + '20' }]}>
          <Text style={[styles.statusText, { color: item.color }]} numberOfLines={1}>
            {item.statusLabel}
          </Text>
        </View>
        <View style={styles.quickActions}>
          {item.status !== 'delivered' && item.status !== 'cancelled' && (
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.colors.primaryContainer }]}
              onPress={() => handleTrackParcel(item.trackingId)}
            >
              <MaterialCommunityIcons
                name="map-marker-path"
                size={16}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.quickActionButton, { backgroundColor: theme.colors.secondaryContainer }]}
            onPress={() => Share.share({ message: `Track: ${item.trackingId}` })}
          >
            <MaterialCommunityIcons
              name="share-variant"
              size={16}
              color={theme.colors.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>
      </TouchableOpacity>
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

  // Use memoized array directly
// eslint-disable-next-line react-hooks/exhaustive-deps
// Note: filteredParcels is already array, not function


  return (
    <SafeArea edges={['top']}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Parcel History
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.colors.primaryContainer }]}
              onPress={handleExport}
            >
              <MaterialCommunityIcons
                name="download"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton, { backgroundColor: theme.colors.primaryContainer }]}
              onPress={() => setShowFilterModal(true)}
            >
              <MaterialCommunityIcons
                name="filter-variant"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={theme.colors.text.secondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder="Search by tracking ID, recipient..."
              placeholderTextColor={theme.colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
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
    minWidth: 0,
  },
  cardAction: {
    paddingLeft: 12,
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
    minWidth: 0,
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
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 8,
    marginBottom: 12,
  },
  parcelDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
  },
  parcelDetailText: {
    fontSize: 14,
  },
  parcelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    maxWidth: '60%',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
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
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  quickActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ParcelHistory;
