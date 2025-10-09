import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, useTheme } from '@adera/ui';

const DriverEarnings = ({ navigation }) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <AppBar title="Driver Earnings" />
      
      <ScrollView style={styles.content}>
        <Card style={styles.summaryCard}>
          <Text variant="headlineMedium" style={[styles.totalEarnings, { color: theme.colors.primary }]}>
            1,850 ETB
          </Text>
          <Text variant="bodyLarge">Total This Week</Text>
        </Card>

        <Card style={styles.breakdownCard}>
          <Text variant="titleMedium" style={styles.breakdownTitle}>This Week's Summary</Text>
          
          <View style={styles.earningItem}>
            <Text variant="bodyMedium">Deliveries Completed</Text>
            <Text variant="bodyMedium">23</Text>
          </View>
          
          <View style={styles.earningItem}>
            <Text variant="bodyMedium">Distance Covered</Text>
            <Text variant="bodyMedium">145 km</Text>
          </View>
          
          <View style={styles.earningItem}>
            <Text variant="bodyMedium">Average per Delivery</Text>
            <Text variant="bodyMedium">80 ETB</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  summaryCard: { padding: 24, marginBottom: 16, alignItems: 'center' },
  totalEarnings: { fontWeight: 'bold', marginBottom: 8 },
  breakdownCard: { padding: 20 },
  breakdownTitle: { fontWeight: '500', marginBottom: 16 },
  earningItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
});

export default DriverEarnings;
