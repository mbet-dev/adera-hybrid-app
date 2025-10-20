import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { AppBar, Card, SafeArea, useTheme } from '@adera/ui';
import { useAuth } from '@adera/auth';

const PartnerProfile = ({ navigation }) => {
  const theme = useTheme();
  const { userProfile, signOut } = useAuth();

  return (
    <SafeArea style={styles.container} withBottomNav={true}>
      <AppBar title="Partner Profile" />
      
      <ScrollView style={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Avatar.Text 
              size={60} 
              label={(userProfile?.business_name?.[0] || 'P').toUpperCase()}
              style={{ backgroundColor: theme.colors.primary }}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall">{userProfile?.business_name || 'Partner Business'}</Text>
              <Text variant="bodyMedium" style={styles.profileEmail}>
                {userProfile?.email || 'partner@adera.com'}
              </Text>
              <Text variant="bodySmall" style={styles.profileRole}>Partner</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.businessCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Business Information</Text>
          <Text variant="bodyMedium">Location: Bole, Addis Ababa</Text>
          <Text variant="bodyMedium">Phone: +251 911 234 567</Text>
          <Text variant="bodyMedium">Operating Hours: 8:00 AM - 8:00 PM</Text>
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
  businessCard: { padding: 20 },
  sectionTitle: { fontWeight: '500', marginBottom: 12 },
});

export default PartnerProfile;
