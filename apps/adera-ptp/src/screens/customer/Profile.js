import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeArea, Card, useTheme } from '@adera/ui';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@adera/auth';
import { usePreferences } from '@adera/preferences';

const Profile = ({ navigation }) => {
  const theme = useTheme();
  const { signOut } = useAuth();
  const { themeMode, setThemeMode, language, setLanguage, biometricEnabled, enableBiometrics, disableBiometrics } = usePreferences();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  console.log('[Profile] Render - themeMode:', themeMode, 'language:', language, 'biometric:', biometricEnabled);

  const user = {
    name: 'Alex Mengistu',
    email: 'alex.mengistu@example.com',
    phone: '+251 911 234 567',
    joinDate: '2024-12-15',
    totalParcels: 12,
    walletBalance: 1250.5,
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleThemeModeChange = () => {
    console.log('[Profile] handleThemeModeChange called, current mode:', themeMode);
    Alert.alert(
      'Select Theme',
      'Choose your preferred theme mode',
      [
        {
          text: 'System Default',
          onPress: () => {
            console.log('[Profile] User selected System theme');
            setThemeMode('system');
          },
        },
        {
          text: 'Light Mode',
          onPress: () => {
            console.log('[Profile] User selected Light theme');
            setThemeMode('light');
          },
        },
        {
          text: 'Dark Mode',
          onPress: () => {
            console.log('[Profile] User selected Dark theme');
            setThemeMode('dark');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLanguageChange = () => {
    console.log('[Profile] handleLanguageChange called, current language:', language);
    Alert.alert(
      'Select Language',
      'Choose your preferred language',
      [
        {
          text: 'English',
          onPress: () => {
            console.log('[Profile] User selected English');
            setLanguage('en');
          },
        },
        {
          text: 'አማርኛ (Amharic)',
          onPress: () => {
            console.log('[Profile] User selected Amharic');
            setLanguage('am');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleBiometricToggle = async (enabled) => {
    console.log('[Profile] handleBiometricToggle called with enabled:', enabled);
    if (enabled) {
      const result = await enableBiometrics();
      console.log('[Profile] enableBiometrics result:', result);
      if (!result.success) {
        let message = 'Failed to enable biometrics';
        let title = 'Biometric Setup';
        
        if (result.error === 'web_not_supported') {
          title = 'Not Available on Web';
          message = 'Biometric authentication is only available on iOS and Android. Please use the native mobile app to enable this feature.';
        } else if (result.error === 'hardware_unavailable') {
          message = 'This device does not have biometric hardware (fingerprint or face recognition).';
        } else if (result.error === 'not_enrolled') {
          message = 'No biometrics are enrolled on this device. Please set up fingerprint or face unlock in your device settings first.';
        } else if (result.error === 'authentication_failed') {
          message = 'Biometric authentication was not successful. Please try again.';
        }
        
        Alert.alert(title, message);
      } else {
        Alert.alert('Success', 'Biometric login has been enabled successfully!');
      }
    } else {
      await disableBiometrics();
    }
  };

  const menuItems = [
    {
      section: 'Account',
      items: [
        {
          id: 'edit-profile',
          label: 'Edit Profile',
          icon: 'account-edit',
          onPress: () => Alert.alert('Coming Soon', 'Profile edit feature coming soon'),
        },
        {
          id: 'wallet',
          label: 'Wallet & Payments',
          icon: 'wallet',
          onPress: () => Alert.alert('Coming Soon', 'Wallet management coming soon'),
        },
        {
          id: 'addresses',
          label: 'Saved Addresses',
          icon: 'map-marker',
          onPress: () => Alert.alert('Coming Soon', 'Address management coming soon'),
        },
      ],
    },
    {
      section: 'Preferences',
      items: [
        {
          id: 'theme',
          label: 'Theme Mode',
          icon: 'theme-light-dark',
          value: themeMode === 'system' ? 'System Default' : themeMode === 'light' ? 'Light Mode' : 'Dark Mode',
          onPress: handleThemeModeChange,
        },
        {
          id: 'language',
          label: 'Language',
          icon: 'translate',
          value: language === 'en' ? 'English' : 'አማርኛ',
          onPress: handleLanguageChange,
        },
        {
          id: 'biometric',
          label: 'Biometric Login',
          icon: 'fingerprint',
          type: 'switch',
          value: biometricEnabled,
          onToggle: handleBiometricToggle,
        },
        {
          id: 'notifications',
          label: 'Push Notifications',
          icon: 'bell',
          type: 'switch',
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: 'email-notifications',
          label: 'Email Notifications',
          icon: 'email',
          type: 'switch',
          value: emailNotifications,
          onToggle: setEmailNotifications,
        },
        {
          id: 'sms-notifications',
          label: 'SMS Notifications',
          icon: 'message',
          type: 'switch',
          value: smsNotifications,
          onToggle: setSmsNotifications,
        },
      ],
    },
    {
      section: 'Support',
      items: [
        {
          id: 'help',
          label: 'Help & Support',
          icon: 'help-circle',
          onPress: () => Alert.alert('Help', 'Help center coming soon'),
        },
        {
          id: 'terms',
          label: 'Terms & Conditions',
          icon: 'file-document',
          onPress: () => Alert.alert('Terms', 'Terms & conditions coming soon'),
        },
        {
          id: 'privacy',
          label: 'Privacy Policy',
          icon: 'shield-check',
          onPress: () => Alert.alert('Privacy', 'Privacy policy coming soon'),
        },
        {
          id: 'about',
          label: 'About Adera',
          icon: 'information',
          onPress: () => Alert.alert('About', 'Version 1.0.0\n© 2025 Adera PTP'),
        },
      ],
    },
  ];

  const renderProfileHeader = () => (
    <Card style={styles.profileCard}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text style={[styles.avatarText, { color: theme.colors.primary }]}>
            {user.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.surfaceVariant }]}
          onPress={() => Alert.alert('Coming Soon', 'Profile edit coming soon')}
        >
          <MaterialCommunityIcons
            name="pencil"
            size={20}
            color={theme.colors.text.primary}
          />
        </TouchableOpacity>
      </View>
      <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
        {user.name}
      </Text>
      <Text style={[styles.userEmail, { color: theme.colors.text.secondary }]}>
        {user.email}
      </Text>
      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="package-variant"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
            {user.totalParcels}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
            Parcels
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.colors.outline }]} />
        <View style={styles.statItem}>
          <MaterialCommunityIcons
            name="calendar"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
            {new Date(user.joinDate).toLocaleDateString('en-US', {
              month: 'short',
              year: 'numeric',
            })}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
            Member Since
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderMenuItem = (item) => {
    if (item.type === 'switch') {
      return (
        <View key={item.id} style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={theme.colors.text.primary}
            />
            <Text style={[styles.menuItemLabel, { color: theme.colors.text.primary }]}>
              {item.label}
            </Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary }}
            thumbColor="#FFF"
          />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.menuItem}
        onPress={item.onPress}
      >
        <View style={styles.menuItemLeft}>
          <MaterialCommunityIcons
            name={item.icon}
            size={24}
            color={theme.colors.text.primary}
          />
          <Text style={[styles.menuItemLabel, { color: theme.colors.text.primary }]}>
            {item.label}
          </Text>
        </View>
        <View style={styles.menuItemRight}>
          {item.value && (
            <Text style={[styles.menuItemValue, { color: theme.colors.text.secondary }]}>
              {item.value}
            </Text>
          )}
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={theme.colors.text.secondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeArea edges={['top']}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
            Profile
          </Text>
        </View>
        {/* Profile Header */}
        {renderProfileHeader()}
        {/* Menu Sections */}
        {menuItems.map((section, index) => (
          <View key={index} style={styles.menuSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
              {section.section}
            </Text>
            <Card style={styles.menuCard}>
              {section.items.map((item, itemIndex) => (
                <React.Fragment key={item.id}>
                  {renderMenuItem(item)}
                  {itemIndex < section.items.length - 1 && (
                    <View
                      style={[styles.menuDivider, { backgroundColor: theme.colors.outline }]}
                    />
                  )}
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}
        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.signOutButton, { backgroundColor: theme.colors.errorContainer }]}
          onPress={handleSignOut}
        >
          <MaterialCommunityIcons
            name="logout"
            size={24}
            color={theme.colors.error}
          />
          <Text style={[styles.signOutText, { color: theme.colors.error }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
        {/* App Version */}
        <Text style={[styles.versionText, { color: theme.colors.text.secondary }]}>
          Adera PTP v1.0.0
        </Text>
      </ScrollView>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  profileCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    alignItems: 'center',
  },
  profileHeader: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 20,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  menuSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemValue: {
    fontSize: 14,
  },
  menuDivider: {
    height: 1,
    marginLeft: 52,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default Profile;
