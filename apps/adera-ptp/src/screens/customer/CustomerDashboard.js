import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeArea, Card, useTheme } from '@adera/ui';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@adera/auth';

const { width } = Dimensions.get('window');

const CustomerDashboard = ({ navigation }) => {
  const theme = useTheme();
  const { signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(1250.50);

  console.log('[CustomerDashboard] Rendering...');
  const [recentParcels, setRecentParcels] = useState([
    {
      id: '1',
      trackingId: 'ADE20250110-3',
      recipient: 'Beza Tesfaye',
      status: 'in_transit_to_hub',
      statusLabel: 'In Transit to Hub',
      date: '2025-01-10',
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
      icon: 'check-circle',
      color: '#4CAF50',
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch fresh data from Supabase
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const quickActions = [
    {
      id: 'send',
      title: 'Send Parcel',
      icon: 'package-variant',
      color: theme.colors.primary,
      bgColor: theme.colors.primaryContainer,
      onPress: () => navigation?.navigate?.('create'),
    },
    {
      id: 'track',
      title: 'Track Parcel',
      icon: 'map-marker-path',
      color: theme.colors.secondary,
      bgColor: theme.colors.secondaryContainer,
      onPress: () => navigation?.navigate?.('track'),
    },
    {
      id: 'history',
      title: 'History',
      icon: 'history',
      color: theme.colors.tertiary,
      bgColor: theme.colors.tertiaryContainer,
      onPress: () => navigation?.navigate?.('history'),
    },
    {
      id: 'wallet',
      title: 'Top Up',
      icon: 'wallet-plus',
      color: '#00BCD4',
      bgColor: '#E0F7FA',
      onPress: () => {
        // TODO: Navigate to wallet top-up
      },
    },
  ];

  const stats = [
    { label: 'Active', value: '2', icon: 'package-variant', color: '#FF9800' },
    { label: 'Delivered', value: '12', icon: 'check-circle', color: '#4CAF50' },
    { label: 'Cancelled', value: '1', icon: 'close-circle', color: '#F44336' },
  ];

  return (
    <SafeArea edges={['top']}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: theme.colors.text.secondary }]}>
              Welcome back,
            </Text>
            <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
              Alex Mengistu
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              style={[styles.notificationButton, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color={theme.colors.text.primary}
              />
              <View style={[styles.notificationBadge, { backgroundColor: theme.colors.error }]}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        {/* Wallet Card */}<LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.walletCard}
        >
          <View style={styles.walletHeader}>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <MaterialCommunityIcons name="wallet" size={28} color="#FFF" />
          </View>
          <Text style={styles.walletBalance}>
            {walletBalance.toLocaleString('en-ET', {
              style: 'currency',
              currency: 'ETB',
            })}
          </Text>
          <View style={styles.walletActions}>
            <TouchableOpacity style={styles.walletActionButton}>
              <MaterialCommunityIcons name="plus-circle" size={20} color="#FFF" />
              <Text style={styles.walletActionText}>Top Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.walletActionButton}>
              <MaterialCommunityIcons name="history" size={20} color="#FFF" />
              <Text style={styles.walletActionText}>Transactions</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        {/* Quick Actions */}<View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[styles.quickActionCard, { backgroundColor: action.bgColor }]}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={action.icon}
                  size={32}
                  color={action.color}
                />
                <Text style={[styles.quickActionTitle, { color: action.color }]}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Statistics */}<View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
            Parcel Summary
          </Text>
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View
                key={index}
                style={[
                  styles.statCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <MaterialCommunityIcons
                  name={stat.icon}
                  size={24}
                  color={stat.color}
                />
                <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/* Recent Parcels */}<View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              Recent Parcels
            </Text>
            <TouchableOpacity onPress={() => navigation?.navigate?.('history')}>
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          {recentParcels.map((parcel) => (
            <Card key={parcel.id} style={styles.parcelCard}>
              <View style={styles.parcelHeader}>
                <View style={styles.parcelInfo}>
                  <MaterialCommunityIcons
                    name={parcel.icon}
                    size={28}
                    color={parcel.color}
                  />
                  <View style={styles.parcelDetails}>
                    <Text style={[styles.trackingId, { color: theme.colors.text.primary }]}>
                      {parcel.trackingId}
                    </Text>
                    <Text style={[styles.recipient, { color: theme.colors.text.secondary }]}>
                      To: {parcel.recipient}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    // TODO: Navigate to tracking details
                  }}
                >
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={theme.colors.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.parcelFooter}>
                <View style={[styles.statusBadge, { backgroundColor: parcel.color + '20' }]}>
                  <Text style={[styles.statusText, { color: parcel.color }]}>
                    {parcel.statusLabel}
                  </Text>
                </View>
                <Text style={[styles.parcelDate, { color: theme.colors.text.secondary }]}>
                  {new Date(parcel.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </Card>
          ))}
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  walletCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  walletBalance: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 16,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },
  walletActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    gap: 6,
  },
  walletActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 56) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  parcelCard: {
    marginBottom: 12,
    padding: 16,
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
  parcelDate: {
    fontSize: 12,
  },
});

export default CustomerDashboard;
