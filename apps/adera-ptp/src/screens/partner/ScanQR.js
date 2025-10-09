import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { AppBar, Card, Button, useTheme } from '@adera/ui';
import { Ionicons } from '@expo/vector-icons';

const ScanQR = ({ navigation }) => {
  const theme = useTheme();
  const [scanning, setScanning] = useState(false);

  const handleScan = () => {
    setScanning(true);
    
    // TODO: Implement actual QR scanning with expo-barcode-scanner
    setTimeout(() => {
      setScanning(false);
      Alert.alert(
        'QR Code Scanned',
        'Parcel AD001234 - Status updated to "At Partner Location"',
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <AppBar 
        title="Scan QR Code"
        onBack={() => navigation?.goBack?.()}
      />
      
      <View style={styles.content}>
        <Card style={styles.scanCard}>
          <View style={styles.scanArea}>
            <Ionicons 
              name="qr-code-outline" 
              size={120} 
              color={theme.colors.primary} 
            />
            <Text variant="headlineSmall" style={styles.scanTitle}>
              Scan Parcel QR Code
            </Text>
            <Text variant="bodyMedium" style={styles.scanDescription}>
              Position the QR code within the frame to scan
            </Text>
          </View>
          
          <Button
            mode="contained"
            onPress={handleScan}
            loading={scanning}
            style={styles.scanButton}
          >
            {scanning ? 'Scanning...' : 'Start Scanning'}
          </Button>
        </Card>

        <Card style={styles.infoCard}>
          <Text variant="titleMedium" style={styles.infoTitle}>
            How to Scan
          </Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoStep}>1.</Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Point your camera at the parcel's QR code
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoStep}>2.</Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Make sure the code is clearly visible
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoStep}>3.</Text>
            <Text variant="bodyMedium" style={styles.infoText}>
              Wait for automatic detection and confirmation
            </Text>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scanCard: {
    padding: 32,
    marginBottom: 16,
  },
  scanArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scanTitle: {
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  scanDescription: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  scanButton: {
    paddingVertical: 8,
  },
  infoCard: {
    padding: 20,
  },
  infoTitle: {
    fontWeight: '500',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoStep: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    width: 20,
  },
  infoText: {
    flex: 1,
  },
});

export default ScanQR;
