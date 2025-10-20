import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@adera/ui';
import { useTheme } from '@adera/ui';
import { Ionicons } from '@expo/vector-icons';

const GuestNavigator = ({ onBackToAuth }) => {
  const theme = useTheme();
  
  const partnerLocations = [
    { id: 1, name: 'Merkato Hub', address: 'Addis Ketema, Addis Ababa', type: 'Pickup Point' },
    { id: 2, name: 'Bole Terminal', address: 'Bole, Addis Ababa', type: 'Pickup Point' },
    { id: 3, name: 'Piassa Station', address: 'Arada, Addis Ababa', type: 'Pickup Point' },
    { id: 4, name: 'Mexico Square', address: 'Kirkos, Addis Ababa', type: 'Pickup Point' },
    { id: 5, name: 'CMC Partners', address: 'Bole, Addis Ababa', type: 'Shop Partner' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom', 'left', 'right']}>
      {/* Simple Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBackToAuth}
        >
          <Ionicons name="arrow-back" size={20} color={theme.colors.onPrimary} />
          <Text style={[styles.backButtonText, { color: theme.colors.onPrimary }]}>
            Back
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.onPrimary }]}>
          Browse as Guest
        </Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.contentHeader}>
          <Text style={[styles.title, { color: theme.colors.primary }]}>
            Adera-PTP Partner Locations
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onSurface }]}>
            Explore pickup points and shop partners in Addis Ababa
          </Text>
        </View>

        <View style={styles.locationsList}>
          {partnerLocations.map((location) => (
            <Card
              key={location.id}
              style={styles.locationCard}
              onPress={() => {}}
              elevation={2}
            >
              <View style={styles.locationInfo}>
                <View style={styles.locationHeader}>
                  <Ionicons
                    name={location.type === 'Shop Partner' ? 'storefront' : 'location-outline'}
                    size={24}
                    color={theme.colors.primary}
                    style={styles.locationIcon}
                  />
                  <View style={styles.locationDetails}>
                    <Text style={[styles.locationName, { color: theme.colors.onSurface }]}>
                      {location.name}
                    </Text>
                    <Text style={[styles.locationAddress, { color: theme.colors.onSurfaceVariant }]}>
                      {location.address}
                    </Text>
                  </View>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: theme.colors.primaryContainer }]}>
                  <Text style={[styles.typeText, { color: theme.colors.onPrimaryContainer }]}>
                    {location.type}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Card style={[styles.authPrompt, { backgroundColor: theme.colors.primaryContainer }]}>
          <Ionicons name="key" size={32} color={theme.colors.onPrimaryContainer} style={styles.promptIcon} />
          <Text style={[styles.promptText, { color: theme.colors.onPrimaryContainer }]}>
            To send parcels and access all features, please create an account or log in.
          </Text>
          <Button
            title="Create Account / Log In"
            onPress={onBackToAuth}
            style={styles.authButton}
            variant="primary"
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 16, // AGGRESSIVE bottom padding to prevent overlap
  },
  contentHeader: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  locationsList: {
    marginBottom: 32,
  },
  locationCard: {
    marginBottom: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  locationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    marginBottom: 8,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  authPrompt: {
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40, // Extra bottom margin
  },
  promptIcon: {
    marginBottom: 12,
  },
  promptText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  authButton: {
    minWidth: 200,
  },
});

export default GuestNavigator;
