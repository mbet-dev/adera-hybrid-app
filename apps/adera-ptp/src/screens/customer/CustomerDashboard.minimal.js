import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CustomerDashboardMinimal = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Dashboard</Text>
      <Text style={styles.subtitle}>Welcome to Adera-PTP</Text>
      <Text style={styles.info}>This is a minimal version for testing</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});

export default CustomerDashboardMinimal;
