/**
 * Root layout — wraps entire app in PowerSyncProvider.
 * Async iterator polyfill must be the very first import.
 */
import '@azure/core-asynciterator-polyfill';

import { PowerSyncContext } from '@powersync/react';
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
    // Hide splash immediately after first render — don't wait for network
    const hideSplash = () => {
      SplashScreen.hideAsync().catch(() => {});
    };

    // Schedule splash hide for immediate execution
    const splashTimer = setTimeout(hideSplash, 50);

    // Defer initialization to after first render — don't block UI rendering
    // Use Promise chain instead of setImmediate to ensure proper error handling
    const initPromise = Promise.resolve().then(async () => {
      try {
        await supabase.auth.signInAnonymously();
      } catch (error) {
        // Non-blocking — app works offline without auth
        console.warn('[Auth] Anonymous sign-in failed (app offline):', error);
      }
      try {
        await powerSyncDb.connect(connector);
      } catch (error) {
        // Non-blocking — PowerSync retries automatically
        console.warn('[PowerSync] Connection failed (app offline):', error);
      }
    }).catch((error) => {
      // Catch any unhandled errors from the promise chain
      console.error('[Init] Unhandled error during initialization:', error);
    });

    return () => {
      clearTimeout(splashTimer);
    };
  }, []);

  return (
    <PowerSyncContext.Provider value={powerSyncDb}>
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
    </PowerSyncContext.Provider>
  );
}