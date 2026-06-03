import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '../../constants/theme';
import { SceneSegmentationProvider } from '../../hooks/useSceneSegmentation';

export default function SceneSegmentationLayout() {
  return (
    <SceneSegmentationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
          animationDuration: 150,
          animationTypeForReplace: 'push',
        }}
      />
    </SceneSegmentationProvider>
  );
}
