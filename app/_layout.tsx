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
    SplashScreen.hideAsync().catch(() => {});

    const connectionTimer = setTimeout(() => {
      Promise.resolve()
        .then(async () => {
          try {
            await powerSyncDb.connect(connector);
          } catch (error) {
            console.error('[PowerSync] Connection attempt failed:', error);
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
