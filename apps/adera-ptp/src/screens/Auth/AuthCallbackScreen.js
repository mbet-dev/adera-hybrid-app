import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
        // Supabase should have handled tokens via URL automatically.
        // Refresh to ensure session is stored.
        await refreshSession();
      } catch (e) {
        console.warn('Auth callback refresh error', e);
      }
      // Replace to main app navigator regardless, routing will happen via auth state.
      navigation.replace('Login');
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
