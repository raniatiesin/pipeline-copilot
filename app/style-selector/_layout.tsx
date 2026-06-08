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
