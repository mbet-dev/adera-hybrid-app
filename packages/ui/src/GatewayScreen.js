import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import { useTheme } from './ThemeProvider';

const { width, height } = Dimensions.get('window');

const GatewayScreen = ({ onLogin, onGuest, onAppSelect }) => {
  const theme = useTheme();
  
  const handleAppSelect = (appType) => {
    onAppSelect(appType);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View 
        style={[styles.gradient, { backgroundColor: theme.colors.primary }]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🏺</Text>
            </View>
            <Text style={[styles.appName, { color: theme.colors.white }]}>
              Adera
            </Text>
          </View>
          
          {/* Market Illustration */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.marketEmoji}>🏪</Text>
            <Text style={styles.marketText}>Addis Ababa Marketplace</Text>
          </View>
          
          {/* Main Content */}
          <View style={styles.content}>
            <Text style={[styles.welcomeTitle, { color: theme.colors.white }]}>
              Welcome to Adera
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: theme.colors.white }]}>
              Your all-in-one ecosystem for logistics and e-commerce in Addis Ababa.
            </Text>
            
            {/* Primary Actions */}
            <View style={styles.primaryActions}>
              <Button
                title="Log In or Sign Up"
                variant="outline"
                size="lg"
                onPress={onLogin}
                style={[styles.primaryButton, { borderColor: theme.colors.white }]}
                textStyle={{ color: theme.colors.white, fontSize: 18 }}
              />
              
              <Button
                title="Continue as Guest"
                variant="ghost"
                size="lg"
                onPress={onGuest}
                style={styles.secondaryButton}
                textStyle={{ color: theme.colors.white, fontSize: 16 }}
              />
            </View>
            
            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.white + '40' }]} />
              <Text style={[styles.dividerText, { color: theme.colors.white }]}>
                Or choose an app
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.white + '40' }]} />
            </View>
            
            {/* App Selection */}
            <View style={styles.appSelection}>
              <TouchableOpacity
                style={[styles.appButton, { backgroundColor: theme.colors.white + '20' }]}
                onPress={() => handleAppSelect('ptp')}
                activeOpacity={0.8}
              >
                <Ionicons name="car" size={24} color={theme.colors.white} />
                <Text style={[styles.appButtonText, { color: theme.colors.white }]}>
                  Adera-PTP
                </Text>
                <Text style={[styles.appButtonSubtext, { color: theme.colors.white + '80' }]}>
                  Logistics
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.appButton, { backgroundColor: theme.colors.white + '20' }]}
                onPress={() => handleAppSelect('shop')}
                activeOpacity={0.8}
              >
                <Ionicons name="storefront" size={24} color={theme.colors.white} />
                <Text style={[styles.appButtonText, { color: theme.colors.white }]}>
                  Adera-Shop
                </Text>
                <Text style={[styles.appButtonSubtext, { color: theme.colors.white + '80' }]}>
                  E-Commerce
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height, // Ensure minimum height for proper layout
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  illustrationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  marketEmoji: {
    fontSize: 60,
    marginBottom: 8,
  },
  marketText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    marginBottom: 32,
  },
  primaryActions: {
    marginBottom: 32,
  },
  primaryButton: {
    marginBottom: 16,
    borderWidth: 2,
  },
  secondaryButton: {
    opacity: 0.9,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  appSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appButton: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  appButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  appButtonSubtext: {
    fontSize: 12,
    fontWeight: '400',
  },
});

export default GatewayScreen;
