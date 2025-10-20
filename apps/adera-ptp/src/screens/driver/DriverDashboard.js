import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { AppBar, Card, SafeArea, StatusBadge, useTheme } from '@adera/ui';
import { useAuth } from '@adera/auth';
import { Ionicons } from '@expo/vector-icons';

const DriverDashboard = ({ navigation }) => {
  const theme = useTheme();
  const { userProfile } = useAuth();
  const [stats] = useState({
    activeDeliveries: 3,
    todayEarnings: 450,
    completedToday: 8,
    rating: 4.9
  });

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar 
        title="Driver Dashboard"
        style={{ backgroundColor: theme.colors.primary }}
      />
      
      <ScrollView style={styles.content}>
        <Card style={[styles.welcomeCard, { backgroundColor: theme.colors.primary }]}>
          <Text variant="headlineSmall" style={[styles.welcome, { color: theme.colors.onPrimary }]}>
            Good morning, {userProfile?.first_name || 'Driver'}!
          </Text>
          <Text variant="bodyMedium" style={[styles.subWelcome, { color: theme.colors.onPrimary }]}>
            You have 3 active deliveries today
          </Text>
        </Card>

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <StatCard icon="truck" label="Active" value={stats.activeDeliveries} color="#FF9800" />
            <StatCard icon="cash" label="Today's Earnings" value={`${stats.todayEarnings} ETB`} color="#4CAF50" />
          </View>
          <View style={styles.statsRow}>
            <StatCard icon="checkmark-circle-outline" label="Completed" value={stats.completedToday} color={theme.colors.primary} />
            <StatCard icon="star" label="Rating" value={`${stats.rating} ⭐`} color="#9C27B0" />
          </View>
        </View>

        <Card style={styles.routeCard}>
          <Text variant="titleMedium" style={styles.routeTitle}>Today's Route</Text>
          <Text variant="bodyMedium">3 pickups • 5 deliveries</Text>
          <Text variant="bodySmall" style={styles.routeDistance}>
            Estimated distance: 25 km
          </Text>
        </Card>
      </ScrollView>

      <FAB
        icon="map"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation?.navigate?.('map')}
        label="View Route"
      />
    </SafeArea>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <Card style={styles.statCard}>
    <View style={styles.statContent}>
      <Ionicons name={icon} size={24} color={color} />
      <Text variant="headlineMedium" style={[styles.statValue, { color }]}>{value}</Text>
      <Text variant="bodySmall" style={styles.statLabel}>{label}</Text>
    </View>
  </Card>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  welcomeCard: { padding: 20, marginBottom: 16 },
  welcome: { fontWeight: 'bold', marginBottom: 4 },
  subWelcome: { opacity: 0.9 },
  statsContainer: { marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, padding: 16 },
  statContent: { alignItems: 'center' },
  statValue: { fontWeight: 'bold', marginVertical: 4 },
  statLabel: { textAlign: 'center', color: '#666' },
  routeCard: { padding: 20 },
  routeTitle: { fontWeight: '500', marginBottom: 8 },
  routeDistance: { color: '#666', marginTop: 4 },
  fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});

export default DriverDashboard;
