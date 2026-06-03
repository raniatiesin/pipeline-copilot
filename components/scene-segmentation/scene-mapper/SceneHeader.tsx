/**
 * ============================================
 * SCENE HEADER COMPONENT
 * ============================================
 *
 * Header bar for a scene card displaying the scene number
 * badge, duration, and a drag-handle icon (≡).
 *
 * Long-pressing the header (500ms) activates drag-to-reorder
 * mode via a Pan gesture with activateAfterLongPress.
 *
 * @module components/scene-segmentation/scene-mapper/SceneHeader
 */

import { pillSizes } from '@/constants/pills';
import {
    DRAG_SCALE,
    REORDER_LONG_PRESS_MS,
    SCENE_HEADER_HEIGHT,
    SPRING_CARD,
} from '@/constants/sceneMapper';
import { colors, spacing, typography } from '@/constants/theme';
import type { SceneHeaderProps } from '@/types/scene-mapper-gestures';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

// ============================================
// COMPONENT
// ============================================

export const SceneHeader: React.FC<SceneHeaderProps> = ({
  sceneNumber,
  duration,
  disabled,
  onReorderStart,
  onReorderMove,
  onReorderEnd,
}) => {
  const scale = useSharedValue(1);
  const lastSentTranslation = useSharedValue(Number.NaN);

  // ── Haptic on reorder activation ──
  const fireReorderHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  // ── Pan gesture with long-press activation ──
  const reorderGesture = Gesture.Pan()
    .enabled(!disabled)
    .activateAfterLongPress(REORDER_LONG_PRESS_MS)
    .onStart(() => {
      'worklet';
      scale.value = withSpring(DRAG_SCALE, SPRING_CARD);
      lastSentTranslation.value = Number.NaN;
      runOnJS(fireReorderHaptic)();
      runOnJS(onReorderStart)();
    })
    .onUpdate((e) => {
      'worklet';
      const quantizedY = Math.round(e.translationY / 4) * 4;
      if (quantizedY !== lastSentTranslation.value) {
        lastSentTranslation.value = quantizedY;
        runOnJS(onReorderMove)(quantizedY);
      }
    })
    .onEnd((e) => {
      'worklet';
      runOnJS(onReorderMove)(e.translationY);
      scale.value = withSpring(1, SPRING_CARD);
      runOnJS(onReorderEnd)();
    })
    .onFinalize(() => {
      'worklet';
      lastSentTranslation.value = Number.NaN;
      scale.value = withSpring(1, SPRING_CARD);
    });

  // ── Animated style for drag elevation ──
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={reorderGesture}>
      <Animated.View style={[styles.header, animatedStyle]}>
        {/* Drag handle */}
        <View style={styles.dragHandle}>
          <Feather name="menu" size={16} color={colors.text.secondary} />
        </View>

        {/* Scene badge — clip container for scroll effect */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Scene {sceneNumber}</Text>
        </View>

        {/* Duration */}
        <Text style={styles.duration}>{duration}</Text>
      </Animated.View>
    </GestureDetector>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  header: {
    height: SCENE_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  dragHandle: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    minHeight: pillSizes.small.minHeight,
    paddingHorizontal: pillSizes.small.paddingHorizontal,
    paddingVertical: pillSizes.small.paddingVertical,
    borderRadius: pillSizes.small.borderRadius,
    overflow: 'hidden',
    textTransform: 'uppercase',
    textAlignVertical: 'center',
  },
  duration: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
