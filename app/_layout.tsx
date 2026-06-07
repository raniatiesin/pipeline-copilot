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
import * as FileSystem from 'expo-file-system';

import { colors } from '../constants/theme';
import { connector, powerSyncDb } from '../lib/powersync';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    // Hide splash immediately — UI must render regardless of network state
    SplashScreen.hideAsync().catch(() => {});

    // AGGRESSIVE: Delete the entire PowerSync database to clear any corrupted sync state
    // This handles the case where bad UUIDs are stuck in PowerSync's internal sync queue
    const resetPowerSync = async () => {
      try {
        const dbPath = `${FileSystem.getConstants().documentDirectory}PowerSync`;
        const exists = await FileSystem.getInfoAsync(dbPath);
        if (exists.exists) {
          console.log('[Init] Clearing PowerSync database directory:', dbPath);
          await FileSystem.deleteAsync(dbPath, { idempotent: true });
          console.log('[Init] PowerSync database cleared');
        }
      } catch (error) {
        console.warn('[Init] Could not clear PowerSync database:', error);
        // Continue anyway — not critical
      }
    };

    // Clear before connecting
    resetPowerSync().catch(console.warn);

    // Defer PowerSync connection to much later (after UI is fully stable)
    const connectionTimer = setTimeout(() => {
      Promise.resolve()
        .then(async () => {
          try {
            await powerSyncDb.connect(connector);
          } catch (error) {
            console.warn('[PowerSync] Connection attempt failed (app offline):', error);
          }
        })
        .catch((error) => {
          console.error('[PowerSync] Initialization error:', error);
        });
    }, 500);

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