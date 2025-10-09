import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, List, Switch, Avatar } from 'react-native-paper';
import { AppBar, Card, Button, useTheme } from '@adera/ui';
import { useAuth } from '@adera/auth';
import { Ionicons } from '@expo/vector-icons';

const Profile = ({ navigation }) => {
  const theme = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  };

  const profileItems = [
    {
      title: 'Personal Information',
      icon: 'person-outline',
      onPress: () => console.log('Edit profile')
    },
    {
      title: 'Payment Methods',
      icon: 'card-outline',
      onPress: () => console.log('Payment methods')
    },
    {
      title: 'Delivery Addresses',
      icon: 'location-outline',
      onPress: () => console.log('Addresses')
    },
    {
      title: 'Help & Support',
      icon: 'help-circle-outline',
      onPress: () => console.log('Help')
    },
    {
      title: 'Terms & Privacy',
      icon: 'document-text-outline',
      onPress: () => console.log('Terms')
    }
  ];

  return (
    <View style={styles.container}>
      <AppBar 
        title="Profile"
        onBack={() => navigation?.goBack?.()}
      />
      
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={60} 
              label={(userProfile?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.profileName}>
                {userProfile?.first_name 
                  ? `${userProfile.first_name} ${userProfile.last_name || ''}`
                  : 'Customer'
                }
              </Text>
              <Text variant="bodyMedium" style={styles.profileEmail}>
                {user?.email}
              </Text>
              <Text variant="bodySmall" style={styles.profileRole}>
                {userProfile?.role || 'Customer'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Profile Menu */}
        <Card style={styles.menuCard}>
          <List.Section>
            {profileItems.map((item, index) => (
              <List.Item
                key={index}
                title={item.title}
                left={() => <List.Icon icon={item.icon} />}
                right={() => <List.Icon icon="chevron-right" />}
                onPress={item.onPress}
                style={styles.listItem}
              />
            ))}
          </List.Section>
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Notification Settings
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Push Notifications</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Get updates about your parcels
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text variant="bodyLarge">Email Updates</Text>
              <Text variant="bodySmall" style={styles.settingDescription}>
                Receive delivery confirmations via email
              </Text>
            </View>
            <Switch
              value={emailUpdates}
              onValueChange={setEmailUpdates}
              color={theme.colors.primary}
            />
          </View>
        </Card>

        {/* App Info */}
        <Card style={styles.infoCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            App Information
          </Text>
          
          <View style={styles.infoItem}>
            <Text variant="bodyMedium">Version</Text>
            <Text variant="bodyMedium">1.0.0</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text variant="bodyMedium">Build</Text>
            <Text variant="bodyMedium">001</Text>
          </View>
        </Card>

        {/* Sign Out Button */}
        <Button
          mode="contained"
          onPress={handleSignOut}
          style={[styles.signOutButton, { backgroundColor: theme.colors.error }]}
          labelStyle={{ color: 'white' }}
        >
          Sign Out
        </Button>
      </ScrollView>
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
  profileCard: {
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    color: '#666',
    marginBottom: 2,
  },
  profileRole: {
    color: '#666',
    textTransform: 'capitalize',
  },
  menuCard: {
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 8,
  },
  settingsCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '500',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
  },
  settingDescription: {
    color: '#666',
    marginTop: 2,
  },
  infoCard: {
    padding: 20,
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  signOutButton: {
    marginBottom: 20,
    paddingVertical: 8,
  },
});

export default Profile;
