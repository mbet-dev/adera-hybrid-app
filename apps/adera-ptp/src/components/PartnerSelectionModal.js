import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme, Card, Button } from '@adera/ui';
import PartnerSelectionMap from './PartnerSelectionMap';
import OperatingHoursDisplay from './OperatingHoursDisplay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PartnerSelectionModal = ({
  visible = false,
  partners = [],
  userLocation = null,
  filterType = null, // 'dropoff' or 'pickup'
  onSelect = () => {},
  onClose = () => {},
  title = 'Select Partner',
}) => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);

  // Filter partners based on type and search query
  const filteredPartners = useMemo(() => {
    let filtered = partners;

    // Filter by type
    if (filterType === 'dropoff') {
      filtered = filtered.filter((p) => p.isDropoff === true);
    } else if (filterType === 'pickup') {
      filtered = filtered.filter((p) => p.isPickup === true);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(query) ||
          (p.address || '').toLowerCase().includes(query) ||
          (p.category || '').toLowerCase().includes(query)
      );
    }

    // Sort by distance if available
    return filtered.sort((a, b) => {
      if (a.distance === null && b.distance === null) return 0;
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }, [partners, filterType, searchQuery]);

  const handleSelect = (partner) => {
    setSelectedPartnerId(partner.id);
    onSelect(partner);
  };

  const formatDistance = (distance) => {
    if (distance === null || distance === undefined) return 'Distance unknown';
    if (distance < 1) return `${Math.round(distance * 1000)} m away`;
    return `${distance.toFixed(1)} km away`;
  };

  const isPartnerOpen = (partner) => {
    if (!partner.operatingHours) return true;
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = dayNames[day];
    const hours = partner.operatingHours[today];
    if (!hours || !hours.open || !hours.close) return true;
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const openTime = parseTime(hours.open);
    const closeTime = parseTime(hours.close);
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <View style={styles.headerTop}>
              <Text style={[styles.headerTitle, { color: theme.colors.onPrimary }]}>{title}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={28} color={theme.colors.onPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={theme.colors.text.secondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text.primary }]}
                placeholder="Search partners..."
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

            {/* View Toggle */}
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'map' && { backgroundColor: theme.colors.onPrimary },
                ]}
                onPress={() => setViewMode('map')}
              >
                <MaterialCommunityIcons
                  name="map"
                  size={20}
                  color={viewMode === 'map' ? theme.colors.primary : theme.colors.onPrimary}
                />
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color: viewMode === 'map' ? theme.colors.primary : theme.colors.onPrimary,
                    },
                  ]}
                >
                  Map
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'list' && { backgroundColor: theme.colors.onPrimary },
                ]}
                onPress={() => setViewMode('list')}
              >
                <MaterialCommunityIcons
                  name="format-list-bulleted"
                  size={20}
                  color={viewMode === 'list' ? theme.colors.primary : theme.colors.onPrimary}
                />
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color: viewMode === 'list' ? theme.colors.primary : theme.colors.onPrimary,
                    },
                  ]}
                >
                  List
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {viewMode === 'map' ? (
              <PartnerSelectionMap
                partners={filteredPartners}
                userLocation={userLocation}
                selectedPartnerId={selectedPartnerId}
                onPartnerSelect={handleSelect}
                filterType={filterType}
                height={SCREEN_HEIGHT * 0.6}
                showUserLocation={true}
              />
            ) : (
              <ScrollView
                style={styles.listContainer}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredPartners.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                      name="map-marker-off"
                      size={48}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                      No partners found
                    </Text>
                    {searchQuery && (
                      <Text style={[styles.emptySubtext, { color: theme.colors.text.secondary }]}>
                        Try a different search term
                      </Text>
                    )}
                  </View>
                ) : (
                  filteredPartners.map((partner) => {
                    const isOpen = isPartnerOpen(partner);
                    const isSelected = selectedPartnerId === partner.id;

                    return (
                      <Card
                        key={partner.id}
                        style={[
                          styles.partnerCard,
                          isSelected && { borderColor: theme.colors.primary, borderWidth: 2 },
                        ]}
                        onPress={() => handleSelect(partner)}
                        elevation={isSelected ? 4 : 2}
                      >
                        <View style={styles.partnerCardContent}>
                          {/* Partner Icon/Image */}
                          <View
                            style={[
                              styles.partnerIcon,
                              { backgroundColor: theme.colors.primaryContainer },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={partner.type === 'Shop Partner' ? 'storefront' : 'map-marker'}
                              size={32}
                              color={theme.colors.primary}
                            />
                          </View>

                          {/* Partner Info */}
                          <View style={styles.partnerInfo}>
                            <View style={styles.partnerHeader}>
                              <Text
                                style={[styles.partnerName, { color: theme.colors.text.primary }]}
                                numberOfLines={1}
                              >
                                {partner.name}
                              </Text>
                              <View
                                style={[
                                  styles.statusBadge,
                                  {
                                    backgroundColor: isOpen
                                      ? theme.colors.success || '#2e7d32'
                                      : theme.colors.error || '#d32f2f',
                                  },
                                ]}
                              >
                                <Text style={styles.statusBadgeText}>
                                  {isOpen ? 'OPEN' : 'CLOSED'}
                                </Text>
                              </View>
                            </View>

                            {partner.address && (
                              <View style={styles.infoRow}>
                                <MaterialCommunityIcons
                                  name="map-marker"
                                  size={14}
                                  color={theme.colors.text.secondary}
                                />
                                <Text
                                  style={[styles.infoText, { color: theme.colors.text.secondary }]}
                                  numberOfLines={1}
                                >
                                  {partner.address}
                                </Text>
                              </View>
                            )}

                            {typeof partner.distance === 'number' && (
                              <View style={styles.infoRow}>
                                <MaterialCommunityIcons
                                  name="map-marker-distance"
                                  size={14}
                                  color={theme.colors.primary}
                                />
                                <Text
                                  style={[styles.distanceText, { color: theme.colors.primary }]}
                                >
                                  {formatDistance(partner.distance)}
                                </Text>
                              </View>
                            )}

                            {partner.rating > 0 && (
                              <View style={styles.infoRow}>
                                <MaterialCommunityIcons name="star" size={14} color="#FFC107" />
                                <Text
                                  style={[styles.infoText, { color: theme.colors.text.secondary }]}
                                >
                                  {partner.rating.toFixed(1)} ({partner.totalReviews || 0} reviews)
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Select Indicator */}
                          {isSelected && (
                            <View style={[styles.selectIndicator, { backgroundColor: theme.colors.primary }]}>
                              <Ionicons name="checkmark" size={20} color={theme.colors.onPrimary} />
                            </View>
                          )}
                        </View>
                      </Card>
                    );
                  })
                )}
              </ScrollView>
            )}

            {/* Results Count */}
            {filteredPartners.length > 0 && (
              <View style={[styles.resultsFooter, { backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.resultsText, { color: theme.colors.text.secondary }]}>
                  {filteredPartners.length} {filteredPartners.length === 1 ? 'partner' : 'partners'}{' '}
                  found
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: SCREEN_HEIGHT * 0.9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  partnerCard: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  partnerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  partnerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  resultsFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  resultsText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default PartnerSelectionModal;

