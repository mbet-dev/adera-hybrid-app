import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { AppBar, Card, SafeArea, useTheme } from '@adera/ui';
import { useAuth } from '@adera/auth';

const StaffProfile = () => {
  const theme = useTheme();
  const { userProfile } = useAuth();

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Staff Profile" />
      
      <ScrollView style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={60} 
              label={(userProfile?.first_name?.[0] || 'S').toUpperCase()}
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall">
                {userProfile?.first_name 
                  ? `${userProfile.first_name} ${userProfile.last_name || ''}`
                  : 'Staff Member'
                }
              </Text>
              <Text variant="bodyMedium" style={styles.profileEmail}>
                {userProfile?.email || 'staff@adera.com'}
              </Text>
              <Text variant="bodySmall" style={styles.profileRole}>
                {userProfile?.role === 'admin' ? 'Administrator' : 'Staff'}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.accessCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Access Level</Text>
          <Text variant="bodyMedium">• Parcel Management</Text>
          <Text variant="bodyMedium">• Customer Support</Text>
          <Text variant="bodyMedium">• Analytics Dashboard</Text>
          <Text variant="bodyMedium">• Partner Oversight</Text>
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
  accessCard: { padding: 20 },
  sectionTitle: { fontWeight: '500', marginBottom: 12 },
});

export default StaffProfile;
