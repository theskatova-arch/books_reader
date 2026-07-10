import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BooksProvider } from '@/context/BooksContext';
import colors from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * Decides which screens are accessible based on auth state.
 * BooksProvider is always mounted (Expo Router pre-renders all screens).
 * BooksContext skips its API fetch when there is no token.
 */
function AppNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.light.background,
        }}
      >
        <ActivityIndicator color={colors.light.primary} size="large" />
      </View>
    );
  }

  if (!token) {
    // Not authenticated — only login is reachable
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="home" redirect />
        <Stack.Screen name="room/(tabs)" redirect />
        <Stack.Screen name="library" redirect />
      </Stack>
    );
  }

  // Authenticated — the "home" chooser screen is the entry point,
  // from which the user picks "Моя комната" (tabs) or "Библиотека".
  // "index" (the literal "/" route) redirects to "home" so that a cold
  // start or root URL cannot bypass the chooser and land on the tabs.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="home" />
      <Stack.Screen name="room/(tabs)" />
      <Stack.Screen name="library" />
      <Stack.Screen name="login" redirect />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <AuthProvider>
                {/* BooksProvider must wrap the navigator so all tab screens
                    always have access to the context, even when not yet
                    authenticated. BooksContext skips its API fetch until
                    a valid token is available. */}
                <BooksProvider>
                  <AppNavigator />
                </BooksProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
