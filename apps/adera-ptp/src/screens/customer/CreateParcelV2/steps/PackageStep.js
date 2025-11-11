import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Chip, TextInput, Button, useTheme } from '@adera/ui';
import * as ImagePicker from 'expo-image-picker';

const sizes = [
  { id: 'document', label: 'Document', price: 50 },
  { id: 'small', label: 'Small (<2kg)', price: 100 },
  { id: 'medium', label: 'Medium (2-5kg)', price: 150 },
  { id: 'large', label: 'Large (5-10kg)', price: 250 },
];

const PackageStep = ({ values, onChange }) => {
  const theme = useTheme();
  const [photos, setPhotos] = useState(values.photos || []);

  useEffect(() => {
    onChange({ photos });
  }, [photos]);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
    if (!res.canceled) {
      setPhotos((p) => [...p, res.assets[0].uri]);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.header}>Package Details</Text>

      {/* Size selection */}
      <Text style={styles.sectionLabel}>Select Size</Text>
      <View style={styles.grid}>
        {sizes.map((s) => (
          <Chip
            key={s.id}
            selected={values.packageSize === s.id}
            onPress={() => onChange({ packageSize: s.id })}
            style={[styles.chip, values.packageSize === s.id && { backgroundColor: theme.colors.primary }]}
          >
            {s.label}
          </Chip>
        ))}
      </View>

      {/* Weight */}
      <TextInput
        label="Weight (kg)"
        mode="outlined"
        keyboardType="numeric"
        value={values.weight || ''}
        onChangeText={(t) => onChange({ weight: t })}
        style={styles.input}
      />

      {/* Photos */}
      <Text style={styles.sectionLabel}>Photos (optional)</Text>
      <View style={styles.photoRow}>
        {photos.map((uri, idx) => (
          <Image
            key={idx}
            source={{ uri }}
            style={styles.photoThumb}
          />
        ))}
        {photos.length < 3 && (
          <Button icon="camera" mode="outlined" onPress={pickImage} compact>
            Add
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chip: {
    marginBottom: 8,
  },
});

export default PackageStep;
