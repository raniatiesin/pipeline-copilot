import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '../../constants/theme';
import { StyleMatcherProvider } from '../../hooks/useStyleMatcher';

export default function StyleMatcherLayout() {
  return (
    <StyleMatcherProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
          animationDuration: 150,
          animationTypeForReplace: 'push',
        }}
      />
    </StyleMatcherProvider>
  );
}
