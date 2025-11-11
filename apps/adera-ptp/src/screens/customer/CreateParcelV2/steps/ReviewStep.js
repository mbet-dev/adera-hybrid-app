import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, Checkbox, Button, Card } from '@adera/ui';

const ReviewStep = ({ values, onChange, onSubmit }) => {
  const [payVisible, setPayVisible] = useState(false);

  const summaryRows = [
    { label: 'Recipient', value: `${values.recipientName} — ${values.recipientPhone}` },
    { label: 'Package', value: values.packageSize || '-' },
    { label: 'Weight', value: values.weight ? `${values.weight} kg` : '-' },
    { label: 'Drop-off Partner', value: values.dropoffPartner?.name || '-' },
    { label: 'Pick-up Partner', value: values.pickupPartner?.name || '-' },
  ];

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.header}>Review Summary</Text>

      <Card style={styles.card}>
        {summaryRows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.label}>{row.label}</Text>
            <Text>{row.value}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.checkboxRow}>
        <Checkbox
          status={values.termsAccepted ? 'checked' : 'unchecked'}
          onPress={() => onChange({ termsAccepted: !values.termsAccepted })}
        />
        <Text>I agree to the Terms & Conditions</Text>
      </View>

      <Button
        title="Pay & Create (dummy)"
        mode="contained"
        disabled={!values.termsAccepted}
        onPress={() => setPayVisible(true)}
      />

      {/* Dummy payment modal */}
      <Modal visible={payVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>Payment Successful 🎉</Text>
            <Button title="Close" mode="contained" onPress={() => {
              setPayVisible(false);
              onSubmit?.();
            }} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 12 },
  card: { marginBottom: 16, padding: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontWeight: '600' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', padding: 24, borderRadius: 8, width: '80%' },
});

export default ReviewStep;
