import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '@adera/auth';
import { useAuth } from '@adera/auth';
import { useTheme, SafeArea } from '@adera/ui';

const AuthCallbackScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { refreshSession } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if this is an email verification callback
        let isVerification = false;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const searchParams = new URLSearchParams(window.location.search);
          const type = hashParams.get('type') || searchParams.get('type');
          isVerification = type === 'signup' || type === 'email';
        }

        // Supabase should have handled tokens via URL automatically.
        // Refresh to ensure session is stored.
        await refreshSession();
        
        // Navigate to Login with verification success parameter
        navigation.replace('Login', { 
          emailVerified: isVerification,
          showSuccessMessage: isVerification 
        });
      } catch (e) {
        console.warn('Auth callback refresh error', e);
        // Still navigate to Login even on error
        navigation.replace('Login', { emailVerified: false });
      }
    };
    handleCallback();
  }, []);

  return (
    <SafeArea edges={['top', 'bottom', 'left', 'right']}>      
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>        
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    </SafeArea>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AuthCallbackScreen;
