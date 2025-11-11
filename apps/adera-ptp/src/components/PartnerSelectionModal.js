import React from 'react';
import { Modal, View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Card, Button } from '@adera/ui';

// Minimal stub – replace with full implementation later
const PartnerSelectionModal = ({ visible, partners = [], onSelect, onClose, userLocation, filterType }) => {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text variant="titleMedium" style={{ marginBottom: 12 }}>Select Partner</Text>
        <FlatList
          data={partners}
          keyExtractor={(item) => String(item?.id)}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onSelect(item)}>
              <Card style={styles.card}>
                <Text>{item?.name || 'Unknown'}</Text>
              </Card>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text>No partners</Text>}
        />
        <Button title="Close" onPress={onClose} style={{ marginTop: 12 }} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 8, padding: 12 },
});

export default PartnerSelectionModal;
