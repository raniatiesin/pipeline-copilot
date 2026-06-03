/**
 * ============================================
 * DROP ZONE COMPONENT
 * ============================================
 *
 * Dashed-outline rectangle that appears between scene cards
 * during a drag-to-reorder gesture. Highlights when the
 * dragged card overlaps this position.
 *
 * @module components/scene-segmentation/scene-mapper/DropZone
 */

import {
    DROP_ZONE_HEIGHT,
    REORDER_COLORS,
    TIMING_FADE,
} from '@/constants/sceneMapper';
import { borderRadius, spacing, typography } from '@/constants/theme';
import type { DropZoneProps } from '@/types/scene-mapper-gestures';
import React from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// ============================================
// COMPONENT
// ============================================

export const DropZone: React.FC<DropZoneProps> = ({ isActive, isDisabled }) => {
  return (
    <Animated.View
      entering={FadeIn.duration(TIMING_FADE)}
      exiting={FadeOut.duration(TIMING_FADE)}
      style={[
        styles.zone,
        isActive && styles.zoneActive,
        isDisabled && styles.zoneDisabled,
      ]}
    >
      <Text
        style={[
          styles.label,
          isActive && styles.labelActive,
          isDisabled && styles.labelDisabled,
        ]}
      >
        {isDisabled ? '—' : 'Drop here'}
      </Text>
    </Animated.View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  zone: {
    height: DROP_ZONE_HEIGHT,
    marginVertical: spacing.xxs,
    borderWidth: Platform.OS === 'android' ? 1.5 : 2,
    borderColor: REORDER_COLORS.dropZoneText,
    // Android crashes on borderStyle: 'dashed' — use solid fallback
    borderStyle: Platform.OS === 'android' ? 'solid' : 'dashed',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneActive: {
    borderColor: REORDER_COLORS.dropZoneBorder,
    backgroundColor: REORDER_COLORS.dropZoneActiveBg,
    borderStyle: 'solid',
  },
  zoneDisabled: {
    opacity: 0.3,
    borderColor: REORDER_COLORS.dropZoneText,
  },
  label: {
    ...typography.caption,
    color: REORDER_COLORS.dropZoneText,
  },
  labelActive: {
    color: REORDER_COLORS.dropZoneBorder,
    fontWeight: '700',
  },
  labelDisabled: {
    color: REORDER_COLORS.dropZoneText,
  },
});
