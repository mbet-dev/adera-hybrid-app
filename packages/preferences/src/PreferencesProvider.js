import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const THEME_KEY = '@adera/preferences/themeMode';
const LANGUAGE_KEY = '@adera/preferences/language';
const BIOMETRIC_KEY = 'adera.preferences.biometricEnabled';

const defaultState = {
  themeMode: 'system',
  language: 'en',
  biometricEnabled: false,
};

const PreferencesContext = createContext(null);

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
};

export const PreferencesProvider = ({ children }) => {
  const [state, setState] = useState(defaultState);
  const [isReady, setIsReady] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const [storedTheme, storedLanguage] = await Promise.all([
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(LANGUAGE_KEY),
      ]);

      let biometricEnabled = false;
      try {
        const secureAvailable = SecureStore?.isAvailableAsync ? await SecureStore.isAvailableAsync() : false;
        if (secureAvailable) {
          const storedBiometric = await SecureStore.getItemAsync(BIOMETRIC_KEY);
          biometricEnabled = storedBiometric === 'true';
        }
      } catch (error) {
        // Ignore secure storage errors to keep preferences functional
      }

      setState((prev) => ({
        ...prev,
        themeMode: storedTheme || defaultState.themeMode,
        language: storedLanguage || defaultState.language,
        biometricEnabled,
      }));
    } catch (error) {
      // Fallback to defaults when persistence fails
      setState(defaultState);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const setThemeMode = useCallback(async (newMode) => {
    console.log('[PreferencesProvider] Setting theme mode to:', newMode);
    setState((prev) => ({ ...prev, themeMode: newMode }));
    try {
      await AsyncStorage.setItem(THEME_KEY, newMode);
      console.log('[PreferencesProvider] Theme mode saved to storage:', newMode);
    } catch (error) {
      console.error('[PreferencesProvider] Failed to save theme mode:', error);
    }
  }, []);

  const setLanguage = useCallback(async (code) => {
    console.log('[PreferencesProvider] Setting language to:', code);
    setState((prev) => ({ ...prev, language: code }));
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, code);
      console.log('[PreferencesProvider] Language saved to storage:', code);
    } catch (error) {
      console.error('[PreferencesProvider] Failed to save language:', error);
    }
  }, []);

  const persistBiometric = useCallback(async (enabled) => {
    setState((prev) => ({ ...prev, biometricEnabled: enabled }));
    try {
      const secureAvailable = SecureStore?.isAvailableAsync ? await SecureStore.isAvailableAsync() : false;
      if (!secureAvailable) {
        return;
      }
      if (enabled) {
        await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
      } else {
        await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
      }
    } catch (error) {
      // Ignore secure storage failures
    }
  }, []);

  const enableBiometrics = useCallback(async () => {
    try {
      console.log('[PreferencesProvider] Enabling biometrics, platform:', Platform.OS);
      // Web platform doesn't support biometrics
      if (Platform.OS === 'web') {
        console.log('[PreferencesProvider] Biometrics not supported on web');
        return { success: false, error: 'web_not_supported' };
      }

      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        return { success: false, error: 'hardware_unavailable' };
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        return { success: false, error: 'not_enrolled' };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric login',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        return { success: false, error: result.error || 'authentication_failed' };
      }

      await persistBiometric(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error?.message || 'unknown_error' };
    }
  }, [persistBiometric]);

  const disableBiometrics = useCallback(async () => {
    await persistBiometric(false);
    return { success: true };
  }, [persistBiometric]);

  const refreshPreferences = useCallback(() => {
    loadPreferences();
  }, [loadPreferences]);

  const contextValue = useMemo(() => ({
    ...state,
    isReady,
    setThemeMode,
    setLanguage,
    enableBiometrics,
    disableBiometrics,
    refreshPreferences,
  }), [state, isReady, setThemeMode, setLanguage, enableBiometrics, disableBiometrics, refreshPreferences]);

  return (
    <PreferencesContext.Provider value={contextValue}>
      {children}
    </PreferencesContext.Provider>
  );
};
