import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, useTheme } from '@adera/ui';

const RecipientStep = () => {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={{ marginBottom: 12 }}>
        Recipient Details
      </Text>
      <TextInput label="Name" style={styles.input} mode="outlined" />
      <TextInput label="Phone" style={styles.input} mode="outlined" keyboardType="phone-pad" />
      <TextInput
        label="Description (optional)"
        style={styles.input}
        mode="outlined"
        multiline
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    marginBottom: 12,
  },
});

export default RecipientStep;
