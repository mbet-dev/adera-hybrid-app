import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CreateParcelMinimal = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Parcel</Text>
      <Text style={styles.info}>Send parcel functionality will be here</Text>
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
  info: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
  },
});

export default CreateParcelMinimal;
