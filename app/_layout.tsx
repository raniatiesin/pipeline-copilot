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

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash immediately — UI must render regardless of network state
    // Don't wait for any network initialization
    SplashScreen.hideAsync().catch(() => {});

    // Defer PowerSync connection to much later (after UI is fully stable)
    // This prevents network errors from blocking the initial render
    const connectionTimer = setTimeout(() => {
      // Don't await — fire and forget
      // PowerSync will handle retries and connection automatically
      Promise.resolve()
        .then(async () => {
          try {
            await powerSyncDb.connect(connector);
          } catch (error) {
            // Non-blocking — PowerSync retries automatically
            // App works fully offline until connection succeeds
            console.warn('[PowerSync] Connection attempt failed (app offline):', error);
          }
        })
        .catch((error) => {
          // Catch any unhandled errors
          console.error('[PowerSync] Initialization error:', error);
        });
    }, 500); // Wait 500ms after UI renders before trying to connect

    return () => {
      clearTimeout(connectionTimer);
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