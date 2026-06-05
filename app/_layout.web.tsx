/**
 * Root layout — Web platform version.
 * Uses @powersync/web (WASQLite) instead of the native PowerSync adapter.
 */

import { PowerSyncContext } from '@powersync/react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '../constants/theme';
import { connector, powerSyncDb } from '../lib/powersync.web';
import { supabase } from '../lib/supabase';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    const setup = async () => {
      try {
        await supabase.auth.signInAnonymously();
      } catch {
        console.warn('[App] signInAnonymously failed — running offline');
      }

      try {
        await powerSyncDb.connect(connector);
      } catch (err) {
        console.warn('[App] PowerSync connect error:', err);
      }
    };

    setup();

    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <PowerSyncContext.Provider value={powerSyncDb as any}>
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
