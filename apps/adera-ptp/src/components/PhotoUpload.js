import React, { useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@adera/ui';

const MAX_PHOTOS = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const PhotoUpload = ({
  photos = [],
  onPhotosChange,
  maxPhotos = MAX_PHOTOS,
  maxFileSize = MAX_FILE_SIZE,
  allowedTypes = ALLOWED_TYPES,
  label = 'Parcel Photos',
  description = `Upload up to ${MAX_PHOTOS} photos of your parcel`,
}) => {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);

  const handleFileSelection = useCallback(async (file) => {
    try {
      // Validate file size (for web)
      if (Platform.OS === 'web' && file.size > maxFileSize) {
        Alert.alert('File Too Large', `File size must be less than ${maxFileSize / 1024 / 1024}MB.`);
        return;
      }

      // Validate file type (for web)
      if (Platform.OS === 'web' && !allowedTypes.includes(file.type)) {
        Alert.alert('Invalid File Type', 'Please select a JPEG or PNG image.');
        return;
      }

      // Create photo object
      let photo;
      if (Platform.OS === 'web') {
        // Convert file to data URL for preview
        photo = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              uri: e.target.result,
              type: file.type,
              name: file.name,
              size: file.size,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        photo = file;
      }

      // Add photo to list
      const newPhotos = [...photos, photo];
      onPhotosChange(newPhotos);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    }
  }, [maxFileSize, allowedTypes, photos, onPhotosChange]);

  const handleAddPhoto = useCallback(async () => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limit Reached', `You can only upload up to ${maxPhotos} photos.`);
      return;
    }

    try {
      setUploading(true);

      if (Platform.OS === 'web') {
        // Web implementation using file input
        if (typeof document === 'undefined') {
          console.warn('[PhotoUpload] document not available on web');
          setUploading(false);
          return;
        }
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/jpg,image/png';
        input.multiple = false;
        input.onchange = (e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelection(file);
          } else {
            console.log('[PhotoUpload] No file selected');
          }
          setUploading(false);
        };
        input.oncancel = () => {
          console.log('[PhotoUpload] File selection cancelled');
          setUploading(false);
        };
        input.click();
      } else {
        // Native implementation using expo-image-picker
        const ImagePicker = require('expo-image-picker');
        
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'We need access to your photos to upload parcel images.',
            [{ text: 'OK' }]
          );
          setUploading(false);
          return;
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
          allowsMultipleSelection: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          const photo = {
            uri: asset.uri,
            width: asset.width,
            height: asset.height,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `photo_${Date.now()}.jpg`,
          };
          handleFileSelection(photo);
        }
        setUploading(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
      setUploading(false);
    }
  }, [photos.length, maxPhotos, handleFileSelection]);

  const handleRemovePhoto = useCallback((index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  }, [photos, onPhotosChange]);

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>{label}</Text>
        <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
          {description}
        </Text>
      </View>

      <View style={styles.photosContainer}>
        {/* Existing Photos */}
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoWrapper}>
            <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
            <TouchableOpacity
              style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
              onPress={() => handleRemovePhoto(index)}
            >
              <MaterialCommunityIcons name="close" size={16} color="#fff" />
            </TouchableOpacity>
            {photo.size && (
              <View style={[styles.sizeBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <Text style={styles.sizeText}>{formatFileSize(photo.size)}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Add Photo Button */}
        {photos.length < maxPhotos && (
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.outline,
              },
            ]}
            onPress={handleAddPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="camera-plus"
                  size={32}
                  color={theme.colors.primary}
                />
                <Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
                  Add Photo
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Photo Count */}
      <Text style={[styles.countText, { color: theme.colors.text.secondary }]}>
        {photos.length} / {maxPhotos} photos
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sizeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  countText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
});

export default memo(PhotoUpload);

