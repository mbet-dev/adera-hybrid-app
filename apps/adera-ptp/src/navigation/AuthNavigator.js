import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen, SignUpScreen, ForgotPasswordScreen, AuthCallbackScreen } from '../screens/Auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import GuestNavigator from './GuestNavigator';

const Stack = createNativeStackNavigator();

const LoginScreenWrapper = (props) => (
  <SafeAreaView style={{ flex: 1 }}>
    <LoginScreen {...props} />
  </SafeAreaView>
);

const SignUpScreenWrapper = (props) => (
  <SafeAreaView style={{ flex: 1 }}>
    <SignUpScreen {...props} />
  </SafeAreaView>
);

const ForgotPasswordScreenWrapper = (props) => (
  <SafeAreaView style={{ flex: 1 }}>
    <ForgotPasswordScreen {...props} />
  </SafeAreaView>
);

const GuestNavigatorWrapper = (props) => (
  <SafeAreaView style={{ flex: 1 }}>
    <GuestNavigator {...props} />
  </SafeAreaView>
);

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FFFFFF' },
        animation: 'fade',
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreenWrapper} />
      <Stack.Screen name="SignUp" component={SignUpScreenWrapper} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreenWrapper} />
      <Stack.Screen name="Guest" component={GuestNavigatorWrapper} />
      <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
