import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, SafeArea, useTheme } from '@adera/ui';

const Earnings = ({ navigation }) => {
  const theme = useTheme();

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Earnings" />
      
      <ScrollView style={styles.content}>
        <Card style={styles.summaryCard}>
          <Text variant="headlineMedium" style={[styles.totalEarnings, { color: theme.colors.primary }]}>
            2,450 ETB
          </Text>
          <Text variant="bodyLarge">Total This Month</Text>
        </Card>

        <Card style={styles.breakdownCard}>
          <Text variant="titleMedium" style={styles.breakdownTitle}>Earnings Breakdown</Text>
          
          <View style={styles.earningItem}>
            <Text variant="bodyMedium">Parcel Handling</Text>
            <Text variant="bodyMedium">1,850 ETB</Text>
          </View>
          
          <View style={styles.earningItem}>
            <Text variant="bodyMedium">Shop Commission</Text>
            <Text variant="bodyMedium">600 ETB</Text>
          </View>
        </Card>
      </ScrollView>
    </SafeArea>
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

export default Earnings;
