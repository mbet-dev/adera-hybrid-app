import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { 
  AppBar, 
  Card, 
  ParcelCard, 
  StatusBadge, 
  DemoRoleSwitcher,
  useTheme 
} from '@adera/ui';
import { useAuth } from '@adera/auth';
import { Ionicons } from '@expo/vector-icons';

const CustomerDashboard = ({ navigation }) => {
  const theme = useTheme();
  const { user, userProfile, updateProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [recentParcels, setRecentParcels] = useState([]);
  const [stats, setStats] = useState({
    totalParcels: 0,
    inTransit: 0,
    delivered: 0,
    pendingPayment: 0
  });

  // Sample data - replace with real API calls
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setRefreshing(true);
    
    // Simulate API calls
    setTimeout(() => {
      setStats({
        totalParcels: 12,
        inTransit: 3,
        delivered: 8,
        pendingPayment: 1
      });
      
      setRecentParcels([
        {
          id: '1',
          tracking_id: 'AD001234',
          status: 5,
          recipient_name: 'John Doe',
          pickup_location: { name: 'Bole Atlas' },
          delivery_location: { name: 'Gerji' },
          created_at: '2025-01-09T10:00:00.000Z'
        },
        {
          id: '2',
          tracking_id: 'AD001235',
          status: 2,
          recipient_name: 'Mary Smith',
          pickup_location: { name: 'Piazza' },
          delivery_location: { name: 'Kazanchis' },
          created_at: '2025-01-08T15:30:00.000Z'
        }
      ]);
      
      setRefreshing(false);
    }, 1000);
  };

  const onRefresh = () => {
    loadDashboardData();
  };

  const handleCreateParcel = () => {
    navigation?.navigate?.('create') || console.log('Navigate to create parcel');
  };

  const handleTrackParcel = (parcel) => {
    navigation?.navigate?.('track', { trackingId: parcel.tracking_id }) || 
    console.log('Track parcel:', parcel.tracking_id);
  };

  const handleRoleChange = async (newRole) => {
    try {
      await updateProfile({ role: newRole });
      console.log(`Demo role changed to: ${newRole}`);
      // The navigation system will automatically update based on the new role
    } catch (error) {
      console.error('Error changing role:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <View style={styles.container}>
      <AppBar 
        title="Adera PTP"
        elevated={false}
        style={{ backgroundColor: theme.colors.primary }}
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* Demo Role Switcher - Only shown in demo mode */}
        <DemoRoleSwitcher 
          currentRole={userProfile?.role || 'customer'} 
          onRoleChange={handleRoleChange} 
        />

        {/* Greeting Section */}
        <Card style={[styles.greetingCard, { backgroundColor: theme.colors.primary }]}>
          <Text 
            variant="headlineSmall" 
            style={[styles.greeting, { color: theme.colors.onPrimary }]}
          >
            {getGreeting()}, {userProfile?.first_name || 'Customer'}!
          </Text>
          <Text 
            variant="bodyMedium" 
            style={[styles.subGreeting, { color: theme.colors.onPrimary }]}
          >
            Send packages across Addis Ababa quickly and securely
          </Text>
        </Card>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard
              icon="package-variant"
              label="Total Parcels"
              value={stats.totalParcels}
              color={theme.colors.primary}
            />
            <StatCard
              icon="truck-delivery"
              label="In Transit"
              value={stats.inTransit}
              color="#FF9800"
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              icon="check-circle"
              label="Delivered"
              value={stats.delivered}
              color="#4CAF50"
            />
            <StatCard
              icon="credit-card-outline"
              label="Pending Payment"
              value={stats.pendingPayment}
              color="#F44336"
            />
          </View>
        </View>

        {/* Recent Parcels */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recent Parcels
          </Text>
          
          {recentParcels.length > 0 ? (
            recentParcels.map(parcel => (
              <ParcelCard
                key={parcel.id}
                parcel={parcel}
                onTrack={handleTrackParcel}
                style={styles.parcelCard}
              />
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons 
                  name="package-variant-closed" 
                  size={48} 
                  color={theme.colors.gray[400]} 
                />
                <Text 
                  variant="bodyLarge" 
                  style={[styles.emptyText, { color: theme.colors.text.secondary }]}
                >
                  No parcels yet
                </Text>
                <Text 
                  variant="bodyMedium" 
                  style={[styles.emptySubtext, { color: theme.colors.text.secondary }]}
                >
                  Tap the + button to send your first parcel
                </Text>
              </View>
            </Card>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActions}>
            <QuickActionCard
              icon="send"
              title="Send Parcel"
              description="Create a new delivery"
              onPress={handleCreateParcel}
            />
            <QuickActionCard
              icon="qr-code-scanner"
              title="Scan QR"
              description="Track with QR code"
              onPress={() => console.log('Open QR scanner')}
            />
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={handleCreateParcel}
        label="Send Parcel"
      />
    </View>
  );
};

// Helper Components
const StatCard = ({ icon, label, value, color }) => {
  const theme = useTheme();
  
  return (
    <Card style={styles.statCard}>
      <View style={styles.statContent}>
        <Ionicons name={icon} size={24} color={color} />
        <Text variant="headlineMedium" style={[styles.statValue, { color }]}>
          {value}
        </Text>
        <Text 
          variant="bodySmall" 
          style={[styles.statLabel, { color: theme.colors.text.secondary }]}
        >
          {label}
        </Text>
      </View>
    </Card>
  );
};

const QuickActionCard = ({ icon, title, description, onPress }) => {
  const theme = useTheme();
  
  return (
    <Card style={styles.quickActionCard} onPress={onPress}>
      <View style={styles.quickActionContent}>
        <Ionicons name={icon} size={32} color={theme.colors.primary} />
        <Text variant="titleMedium" style={styles.quickActionTitle}>
          {title}
        </Text>
        <Text 
          variant="bodySmall" 
          style={[styles.quickActionDesc, { color: theme.colors.text.secondary }]}
        >
          {description}
        </Text>
      </View>
    </Card>
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
  greetingCard: {
    padding: 20,
    marginBottom: 16,
  },
  greeting: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subGreeting: {
    opacity: 0.9,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    marginVertical: 4,
  },
  statLabel: {
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  parcelCard: {
    marginBottom: 8,
  },
  emptyCard: {
    padding: 32,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    padding: 20,
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionTitle: {
    marginTop: 8,
    fontWeight: '500',
  },
  quickActionDesc: {
    marginTop: 4,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default CustomerDashboard;
