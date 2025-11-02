import React from 'react';
import { Alert } from 'react-native';
import { ProfileScreen } from '@adera/ui';
import { useAuth } from '@adera/auth';
import { usePreferences } from '@adera/preferences';

const StaffProfile = () => {
  const { user: authUser } = useAuth();
  const { themeMode, setThemeMode, language, setLanguage } = usePreferences();

  const user = {
    name: authUser?.user_metadata?.full_name || 'Adera Staff',
    email: authUser?.email,
  };

  const handleThemeModeChange = () => {
    Alert.alert('Select Theme', 'Choose your preferred theme mode', [
      { text: 'System Default', onPress: () => setThemeMode('system') },
      { text: 'Light Mode', onPress: () => setThemeMode('light') },
      { text: 'Dark Mode', onPress: () => setThemeMode('dark') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLanguageChange = () => {
    Alert.alert('Select Language', 'Choose your preferred language', [
      { text: 'English', onPress: () => setLanguage('en') },
      { text: 'አማርኛ (Amharic)', onPress: () => setLanguage('am') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const menuItems = [
    {
      section: 'Access Level',
      items: [
        { id: 'parcel-management', label: 'Parcel Management', icon: 'package-variant-closed', onPress: () => {} },
        { id: 'customer-support', label: 'Customer Support', icon: 'face-agent', onPress: () => {} },
        { id: 'analytics', label: 'Analytics Dashboard', icon: 'chart-line', onPress: () => {} },
        { id: 'partner-oversight', label: 'Partner Oversight', icon: 'storefront', onPress: () => {} },
      ],
    },
    {
      section: 'Preferences',
      items: [
        { id: 'theme', label: 'Theme Mode', icon: 'theme-light-dark', value: themeMode, onPress: handleThemeModeChange },
        { id: 'language', label: 'Language', icon: 'translate', value: language, onPress: handleLanguageChange },
      ],
    },
    {
      section: 'Support',
      items: [
        { id: 'help', label: 'Help & Support', icon: 'help-circle', onPress: () => {} },
      ],
    },
  ];

  return <ProfileScreen user={user} menuItems={menuItems} appVersion="Adera PTP Staff v1.0.0" />;
};

export default StaffProfile;
