import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import { useAuth } from '@adera/auth';
import { usePreferences } from '@adera/preferences';

export const useProfileSettings = (roleType = 'customer') => {
  const { user: authUser, signOut } = useAuth();
  const { 
    themeMode, 
    setThemeMode, 
    language, 
    setLanguage, 
    biometricEnabled, 
    enableBiometrics, 
    disableBiometrics 
  } = usePreferences();

  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [locationTracking, setLocationTracking] = useState(roleType === 'driver');
  const [shopOpen, setShopOpen] = useState(roleType === 'partner');
  const [autoAcceptParcels, setAutoAcceptParcels] = useState(false);

  const handleThemeModeChange = () => {
    Alert.alert(
      'Select Theme',
      'Choose your preferred theme mode',
      [
        {
          text: 'System Default',
          onPress: () => {
            if (themeMode !== 'system') setThemeMode('system');
          },
        },
        {
          text: 'Light Mode',
          onPress: () => {
            if (themeMode !== 'light') setThemeMode('light');
          },
        },
        {
          text: 'Dark Mode',
          onPress: () => {
            if (themeMode !== 'dark') setThemeMode('dark');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Select Language',
      'Choose your preferred language',
      [
        {
          text: 'English',
          onPress: () => {
            if (language !== 'en') setLanguage('en');
          },
        },
        {
          text: 'አማርኛ (Amharic)',
          onPress: () => {
            if (language !== 'am') setLanguage('am');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleBiometricToggle = async (enabled) => {
    if (enabled) {
      const result = await enableBiometrics();
      if (!result.success) {
        let message = 'Failed to enable biometrics';
        let title = 'Biometric Setup';
        
        if (Platform.OS === 'web') {
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

  const handleSignOut = () => {
    console.log('[ProfileScreen] handleSignOut: Starting sign out');
    
    if (Platform.OS === 'web') {
      // On web, skip confirmation for smoother experience
      signOutUser();
    } else {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: signOutUser,
          },
        ],
        { cancelable: true }
      );
    }
  };

  const signOutUser = async () => {
    try {
      // Clear any pending profile fetches before signing out
      if (typeof window !== 'undefined') {
        window._profileFetchAborted = true;
      }
      
      const result = await signOut();
      if (!result.success && Platform.OS !== 'web') {
        Alert.alert('Error', result.warning || 'Failed to sign out. Please try again.');
      }
    } catch (error) {
      console.error('[ProfileScreen] handleSignOut: Error during sign out:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Failed to sign out. Please try again.');
      }
    }
  };

  const commonMenuItems = [
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
          onPress: () => Alert.alert('About', `Version 1.0.0\n© 2025 Adera PTP`),
        },
      ],
    },
  ];

  const getRoleSpecificStats = () => {
    const baseStats = [
      {
        label: 'Member Since',
        value: new Date(authUser?.created_at).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        icon: 'calendar',
      },
    ];

    switch (roleType) {
      case 'customer':
        return [
          {
            label: 'Parcels',
            value: '12',
            icon: 'package-variant',
          },
          ...baseStats,
        ];
      case 'driver':
        return [
          {
            label: 'Rating',
            value: '4.9 ★',
            icon: 'star',
          },
          {
            label: 'Deliveries',
            value: '1,243',
            icon: 'package-variant-closed',
          },
          ...baseStats,
        ];
      case 'partner':
        return [
          {
            label: 'Rating',
            value: '4.7 ★',
            icon: 'star',
          },
          {
            label: 'Parcels Handled',
            value: '856',
            icon: 'package-variant',
          },
          {
            label: 'Shop Items',
            value: '23',
            icon: 'store',
          },
        ];
      default:
        return baseStats;
    }
  };

  const getRoleSpecificMenuItems = () => {
    const roleSpecificItems = {
      customer: [
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
      ],
      driver: [
        {
          section: 'Vehicle & Documents',
          items: [
            { id: 'vehicle-info', label: 'Vehicle Information', icon: 'car-info', onPress: () => Alert.alert('Coming Soon', 'Vehicle info management coming soon') },
            { id: 'driving-license', label: 'Driving License', icon: 'card-account-details', onPress: () => Alert.alert('Coming Soon', 'License management coming soon') },
            { id: 'insurance', label: 'Insurance Details', icon: 'shield-car', onPress: () => Alert.alert('Coming Soon', 'Insurance management coming soon') },
          ],
        },
      ],
      partner: [
        {
          section: 'Business Settings',
          items: [
            { id: 'shop-status', label: 'Shop Open Status', icon: 'store-check', type: 'switch', value: shopOpen, onToggle: setShopOpen },
            { id: 'auto-accept', label: 'Auto-Accept Parcels', icon: 'package-check', type: 'switch', value: autoAcceptParcels, onToggle: setAutoAcceptParcels },
            { id: 'payment-methods', label: 'Payment Methods', icon: 'bank', onPress: () => Alert.alert('Coming Soon', 'Payment methods coming soon') },
            { id: 'operating-hours', label: 'Operating Hours', icon: 'clock-outline', onPress: () => Alert.alert('Coming Soon', 'Operating hours coming soon') },
          ],
        },
      ],
    };

    return [...(roleSpecificItems[roleType] || []), ...commonMenuItems];
  };

  return {
    user: {
      name: authUser?.user_metadata?.full_name || `Adera ${roleType.charAt(0).toUpperCase() + roleType.slice(1)}`,
      email: authUser?.email,
      stats: getRoleSpecificStats(),
    },
    menuItems: getRoleSpecificMenuItems(),
    appVersion: `Adera PTP ${roleType.charAt(0).toUpperCase() + roleType.slice(1)} v1.0.0`,
    notifications,
    setNotifications,
    emailNotifications,
    setEmailNotifications,
    smsNotifications,
    setSmsNotifications,
    locationTracking,
    setLocationTracking,
    shopOpen,
    setShopOpen,
    autoAcceptParcels,
    setAutoAcceptParcels,
    handleSignOut,
  };
};