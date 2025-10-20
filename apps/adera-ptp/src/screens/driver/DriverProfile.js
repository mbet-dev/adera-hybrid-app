import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { AppBar, Card, SafeArea, useTheme } from '@adera/ui';
import { useAuth } from '@adera/auth';

const DriverProfile = ({ navigation }) => {
  const theme = useTheme();
  const { userProfile } = useAuth();

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Driver Profile" />
      
      <ScrollView style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={60} 
              label={(userProfile?.first_name?.[0] || 'D').toUpperCase()}
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall">
                {userProfile?.first_name 
                  ? `${userProfile.first_name} ${userProfile.last_name || ''}`
                  : 'Driver'
                }
              </Text>
              <Text variant="bodyMedium" style={styles.profileEmail}>
                {userProfile?.email || 'driver@adera.com'}
              </Text>
              <Text variant="bodySmall" style={styles.profileRole}>Driver</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.statsCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Driver Statistics</Text>
          <Text variant="bodyMedium">Rating: 4.9 ⭐ (127 reviews)</Text>
          <Text variant="bodyMedium">Total Deliveries: 1,243</Text>
          <Text variant="bodyMedium">Member Since: January 2024</Text>
        </Card>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  profileCard: { padding: 20, marginBottom: 16 },
  profileHeader: { flexDirection: 'row', alignItems: 'center' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileEmail: { color: '#666', marginBottom: 2 },
  profileRole: { color: '#666', textTransform: 'capitalize' },
  statsCard: { padding: 20 },
  sectionTitle: { fontWeight: '500', marginBottom: 12 },
});

export default DriverProfile;
