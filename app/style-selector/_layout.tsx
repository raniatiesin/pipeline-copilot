/**
 * ============================================
 * STYLE SELECTOR LAYOUT
 * ============================================
 *
 * Route group layout for the style-selector screens.
 * Provides Stack navigation config only — provider scope
 * is handled per-screen (StyleSelectorProvider lives in
 * index.tsx and receives projectId from search params).
 *
 * @module app/style-selector/_layout
 */

import { Stack } from 'expo-router';
import React from 'react';

import { colors } from '../../constants/theme';

export default function StyleSelectorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
        animationDuration: 150,
        animationTypeForReplace: 'push',
      }}
    />
  );
}
