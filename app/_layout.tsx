/**
 * Root layout — wraps entire app in PowerSyncProvider.
 * Async iterator polyfill must be the very first import.
 */
import '@azure/core-asynciterator-polyfill';

import { PowerSyncProvider } from '@powersync/react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../constants/theme';
import { connector, powerSyncDb } from '../lib/powersync';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    const setup = async () => {
      // Anonymous sign-in so PowerSync has a valid JWT.
      // Non-blocking — app works offline if this fails.
      try {
        await supabase.auth.signInAnonymously();
      } catch {
        console.warn('[App] signInAnonymously failed — running offline');
      }

      // Connect PowerSync (retries automatically when back online).
      try {
        await powerSyncDb.connect(connector);
      } catch (err) {
        console.warn('[App] PowerSync connect error:', err);
      }
    };

    setup();

    // Splash screen
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <PowerSyncProvider database={powerSyncDb}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
              animation: 'fade',
            }}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PowerSyncProvider>
  );
}
