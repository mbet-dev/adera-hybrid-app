import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput as RNTextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share,
  Platform,
  Animated,
  Linking,
} from 'react-native';
import { SafeArea, Card, Button, useTheme } from '@adera/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TrackParcel = ({ route, navigation }) => {
  const theme = useTheme();
  const [trackingId, setTrackingId] = useState(route?.params?.trackingId || '');
  const [parcelData, setParcelData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [empty, setEmpty] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const abortRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isValidTrackingId = useMemo(() => {
    // Example: ADE20250110-3 (ADE + date yyyymmdd + - + digits)
    const re = /^ADE\d{8}-\d+$/i;
    return re.test(trackingId.trim());
  }, [trackingId]);

  const safeParseTimeline = useCallback((timeline) => {
    if (!Array.isArray(timeline)) return [];
    return timeline
      .filter(Boolean)
      .map((e, i) => ({
        id: e?.id ?? String(i),
        timestamp: e?.timestamp ?? null,
        completed: Boolean(e?.completed),
        active: Boolean(e?.active),
        status: e?.status ?? 'created',
        icon: e?.icon ?? 'progress-clock',
        label: e?.label ?? 'Update',
        description: e?.description ?? '',
      }));
  }, []);

  const fetchParcel = useCallback(async (code) => {
    setIsLoading(true);
    setError('');
    setEmpty(false);

    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // TODO: Replace with Supabase fetch. Simulate delay and response here.
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Simulated example results
      if (code.toUpperCase() === 'ADE20250110-3') {
        const mock = {
          currentStatus: 'dispatched',
          statusLabel: 'Dispatched from Partner',
          trackingId: code.toUpperCase(),
          recipient: 'John Doe',
          estimatedDelivery: new Date(Date.now() + 86400000).toISOString(),
          timeline: [
            { id: '1', timestamp: Date.now() - 3600e3 * 12, completed: true, active: false, status: 'created', icon: 'package-variant', label: 'Created', description: 'Parcel created' },
            { id: '2', timestamp: Date.now() - 3600e3 * 6, completed: true, active: false, status: 'at_pickup_partner', icon: 'storefront', label: 'At Pickup Partner', description: 'Received by pickup partner' },
            { id: '3', timestamp: Date.now() - 3600e3 * 1, completed: true, active: true, status: 'dispatched', icon: 'truck-fast', label: 'Dispatched', description: 'Left partner location' },
            { id: '4', timestamp: null, completed: false, active: false, status: 'in_transit_to_hub', icon: 'transit-connection-variant', label: 'In Transit', description: 'En route to hub' },
            { id: '5', timestamp: null, completed: false, active: false, status: 'at_hub', icon: 'warehouse', label: 'At Hub', description: 'Processing at hub' },
            { id: '6', timestamp: null, completed: false, active: false, status: 'delivered', icon: 'home-check', label: 'Delivered', description: 'Delivered to recipient' },
          ],
        };
        setParcelData({ ...mock, timeline: safeParseTimeline(mock.timeline) });
        setEmpty(false);
      } else {
        setParcelData(null);
        setEmpty(true);
      }
    } catch (e) {
      if (e?.name === 'AbortError') return; // ignore aborts
      setError('Failed to fetch tracking information. Please try again.');
      setParcelData(null);
    } finally {
      setIsLoading(false);
    }
  }, [safeParseTimeline]);

  const handleTrack = useCallback(() => {
    const code = trackingId.trim();
    if (!code) {
      Alert.alert('Required', 'Please enter a tracking ID');
      return;
    }
    if (!isValidTrackingId) {
      Alert.alert('Invalid', 'Tracking ID format looks incorrect. Example: ADE20250110-3');
      return;
    }
    fetchParcel(code);
  }, [trackingId, isValidTrackingId, fetchParcel]);

  const handleRefresh = useCallback(async () => {
    if (!parcelData) return;
    setRefreshing(true);
    await fetchParcel(parcelData.trackingId);
    setRefreshing(false);
  }, [parcelData, fetchParcel]);

  const handleShare = useCallback(async () => {
    if (!parcelData) return;
    try {
      const message = `Track my parcel: ${parcelData.trackingId}\nStatus: ${parcelData.statusLabel}\nRecipient: ${parcelData.recipient}\n\nTrack at: https://adera.et/track/${parcelData.trackingId}`;
      await Share.share({
        message,
        title: 'Adera Parcel Tracking',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [parcelData]);

  const handleCall = useCallback((phone) => {
    if (Platform.OS !== 'web') {
      Linking.openURL(`tel:${phone}`);
    }
  }, []);

  const handleClear = useCallback(() => {
    setTrackingId('');
    setParcelData(null);
    setError('');
    setEmpty(false);
  }, []);

  // Auto-track if tracking ID provided via navigation
  useEffect(() => {
    if (route?.params?.trackingId && isValidTrackingId) {
      fetchParcel(route.params.trackingId);
    }
  }, [route?.params?.trackingId]);

  // Animate progress when parcel data changes
  useEffect(() => {
    if (parcelData?.timeline) {
      const completedSteps = parcelData.timeline.filter(e => e.completed).length;
      const totalSteps = parcelData.timeline.length;
      const progress = completedSteps / totalSteps;
      
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 800,
        useNativeDriver: false,
      }).start();

      // Pulse animation for active step
      if (parcelData.timeline.some(e => e.active)) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }
    }
  }, [parcelData]);

  // Cleanup
  const debounceRef = useRef(null);
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

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
              accessibilityLabel="Tracking ID Input"
              testID="tracking-id-input"
              keyboardType="default"
              returnKeyType="search"
              onSubmitEditing={handleTrack}
            />
            {trackingId.length > 0 && (
              <TouchableOpacity onPress={handleClear} accessibilityLabel="Clear Tracking ID" testID="clear-tracking-id">
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            )}
          </View>
          {!isValidTrackingId && trackingId.length > 0 && (
            <Text style={{ color: theme.colors.error, marginTop: 4 }} accessibilityLabel="Invalid tracking id message">
              Invalid tracking ID. Example: ADE20250110-3
            </Text>
          )}
          <Button
            title="Track"
            onPress={handleTrack}
            loading={isLoading}
            size="lg"
            style={styles.trackButton}
            disabled={!isValidTrackingId || isLoading}
            accessibilityLabel="Track Button"
            testID="track-button"
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
          accessibilityLabel="Open QR Scanner (Coming Soon)"
          testID="qr-placeholder"
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
    if (isLoading) {
      return (
        <View style={[styles.detailsSection, { alignItems: 'center', paddingVertical: 24 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 8, color: theme.colors.text.secondary }}>Fetching tracking info…</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={[styles.detailsSection, { gap: 12 }]}
          accessibilityLabel="Error Section"
          testID="error-section"
        >
          <Card style={{ padding: 16, borderColor: theme.colors.error, borderWidth: 1 }}>
            <Text style={{ color: theme.colors.error, fontWeight: '700', marginBottom: 6 }}>Error</Text>
            <Text style={{ color: theme.colors.text.primary }}>{error}</Text>
          </Card>
          <Button title="Retry" onPress={handleTrack} leftIcon="reload" />
        </View>
      );
    }

    if (empty) {
      return (
        <View style={[styles.detailsSection, { gap: 12 }]} accessibilityLabel="Empty State" testID="empty-state">
          <Card style={{ padding: 20, alignItems: 'center' }}>
            <MaterialCommunityIcons name="package-variant" size={32} color={theme.colors.text.secondary} />
            <Text style={{ marginTop: 8, color: theme.colors.text.primary, fontWeight: '700' }}>No parcel found</Text>
            <Text style={{ marginTop: 4, color: theme.colors.text.secondary, textAlign: 'center' }}>
              Please check the tracking ID and try again.
            </Text>
          </Card>
        </View>
      );
    }

    if (!parcelData) return null;

    const completedSteps = parcelData.timeline.filter(e => e.completed).length;
    const totalSteps = parcelData.timeline.length;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    return (
      <View style={styles.detailsSection}>
        {/* Progress Bar */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressTitle, { color: theme.colors.text.primary }]}>
              Delivery Progress
            </Text>
            <Text style={[styles.progressPercentage, { color: theme.colors.primary }]}>
              {progressPercentage}%
            </Text>
          </View>
          <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.progressGradient}
              />
            </Animated.View>
          </View>
          <Text style={[styles.progressSubtext, { color: theme.colors.text.secondary }]}>
            {completedSteps} of {totalSteps} steps completed
          </Text>
        </Card>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <LinearGradient
            colors={[getStatusColor(parcelData.currentStatus) + '15', theme.colors.surface]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusGradient}
          >
            <View style={styles.statusHeader}>
              <Animated.View
                style={[
                  styles.statusIconContainer,
                  {
                    backgroundColor: getStatusColor(parcelData.currentStatus) + '20',
                    transform: [{ scale: parcelData.timeline.some(e => e.active) ? pulseAnim : 1 }],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={40}
                  color={getStatusColor(parcelData.currentStatus)}
                />
              </Animated.View>
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
          </LinearGradient>
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
                    numberOfLines={1}
                  >
                    {event.label}
                  </Text>
                  {!!event.description && (
                    <Text
                      style={[
                        styles.timelineDescription,
                        { color: theme.colors.text.secondary },
                      ]}
                      numberOfLines={2}
                    >
                      {event.description}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Text style={[styles.actionsTitle, { color: theme.colors.text.primary }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primaryContainer }]}
              onPress={handleShare}
            >
              <MaterialCommunityIcons name="share-variant" size={24} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.secondaryContainer }]}
              onPress={() => handleCall('+251911234567')}
            >
              <MaterialCommunityIcons name="phone" size={24} color={theme.colors.secondary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.secondary }]}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.tertiaryContainer }]}
              onPress={() => Alert.alert('Support', 'Chat support coming soon')}
            >
              <MaterialCommunityIcons name="chat" size={24} color={theme.colors.tertiary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.tertiary }]}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.errorContainer || '#FFEBEE' }]}
              onPress={() => Alert.alert('Report Issue', 'Issue reporting coming soon')}
            >
              <MaterialCommunityIcons name="alert-circle" size={24} color={theme.colors.error} />
              <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>Report</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <SafeArea edges={['top']}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          parcelData ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }
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
  progressCard: {
    padding: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
  },
  progressGradient: {
    flex: 1,
  },
  progressSubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  statusGradient: {
    borderRadius: 12,
  },
  actionsCard: {
    padding: 20,
    marginBottom: 16,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TrackParcel;
