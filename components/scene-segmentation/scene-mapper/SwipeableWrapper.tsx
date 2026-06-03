/**
 * ============================================
 * SWIPEABLE WRAPPER COMPONENT
 * ============================================
 *
 * Wraps a scene card with horizontal pan gesture handling
 * for swipe-to-merge interactions.
 *
 * Swipe right → merge with previous scene
 * Swipe left  → merge with next scene
 *
 * Features:
 * - Weighted resistance (0.6x before threshold, 0.3x after)
 * - Action background reveal with label text
 * - Rubber-band bounce on disabled directions
 * - Threshold haptic feedback
 *
 * @module components/scene-segmentation/scene-mapper/SwipeableWrapper
 */

import {
    MERGE_COLORS,
    SPRING_CARD,
    SWIPE_ACTION_WIDTH,
    SWIPE_MAX_DISTANCE,
    SWIPE_MIN_START,
    SWIPE_RESISTANCE,
    SWIPE_RESISTANCE_PAST,
    SWIPE_RUBBER_BAND_MAX,
    SWIPE_THRESHOLD,
} from '@/constants/sceneMapper';
import { typography } from '@/constants/theme';
import type { SwipeableWrapperProps } from '@/types/scene-mapper-gestures';
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

export const SwipeableWrapper: React.FC<SwipeableWrapperProps> = ({
  canSwipeLeft,
  canSwipeRight,
  onSwipeLeft,
  onSwipeRight,
  disabled,
  children,
}) => {
  const translateX = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);

  // ── Haptic helpers (JS thread) ──

  const fireThresholdHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  const fireCancelHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const fireConfirmHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  // ── Pan gesture ──

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-SWIPE_MIN_START, SWIPE_MIN_START])
    .failOffsetY([-20, 20])
    .onStart(() => {
      'worklet';
      hasTriggeredHaptic.value = false;
    })
    .onUpdate((e) => {
      'worklet';
      const raw = e.translationX;
      const direction = raw > 0 ? 'right' : 'left';
      const allowed = direction === 'right' ? canSwipeRight : canSwipeLeft;

      let x: number;
      if (!allowed) {
        // Rubber-band on disabled direction
        x = raw * 0.15;
        x = Math.max(-SWIPE_RUBBER_BAND_MAX, Math.min(SWIPE_RUBBER_BAND_MAX, x));
      } else {
        const absRaw = Math.abs(raw);
        // Apply resistance
        if (absRaw < SWIPE_THRESHOLD) {
          x = raw * SWIPE_RESISTANCE;
        } else {
          const base = SWIPE_THRESHOLD * SWIPE_RESISTANCE;
          const extra = (absRaw - SWIPE_THRESHOLD) * SWIPE_RESISTANCE_PAST;
          x = (base + extra) * Math.sign(raw);
        }
        // Clamp
        x = Math.max(-SWIPE_MAX_DISTANCE, Math.min(SWIPE_MAX_DISTANCE, x));
      }

      translateX.value = x;

      // Threshold haptic (once per gesture)
      if (allowed && Math.abs(x) >= SWIPE_THRESHOLD * SWIPE_RESISTANCE && !hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = true;
        runOnJS(fireThresholdHaptic)();
      }
    })
    .onEnd(() => {
      'worklet';
      const absX = Math.abs(translateX.value);
      const direction = translateX.value > 0 ? 'right' : 'left';
      const allowed = direction === 'right' ? canSwipeRight : canSwipeLeft;
      const thresholdMet = allowed && absX >= SWIPE_THRESHOLD * SWIPE_RESISTANCE;

      if (thresholdMet) {
        // Confirmed — spring back physically, let parent handle merge
        translateX.value = withSpring(0, SPRING_CARD);
        runOnJS(fireConfirmHaptic)();
        if (direction === 'right') {
          runOnJS(onSwipeRight)();
        } else {
          runOnJS(onSwipeLeft)();
        }
      } else {
        // Cancel — spring back
        translateX.value = withSpring(0, SPRING_CARD);
        if (absX > 5) {
          runOnJS(fireCancelHaptic)();
        }
      }
    });

  // ── Animated styles ──

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const leftActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0
      ? Math.min(translateX.value / (SWIPE_THRESHOLD * SWIPE_RESISTANCE), 1)
      : 0,
  }));

  const rightActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0
      ? Math.min(Math.abs(translateX.value) / (SWIPE_THRESHOLD * SWIPE_RESISTANCE), 1)
      : 0,
  }));

  // ── Render ──

  return (
    <View style={styles.wrapper}>
      {/* Left action (revealed when swiping right → merge next) */}
      <Animated.View style={[styles.actionBg, styles.actionLeft, { backgroundColor: MERGE_COLORS.nextBg }, leftActionStyle]}>
        {canSwipeRight ? (
          <>
            <Feather name="arrow-right" size={16} color={MERGE_COLORS.actionText} />
            <Text style={styles.actionText}>Merge next</Text>
          </>
        ) : (
          <View style={styles.disabledStripes} />
        )}
      </Animated.View>

      {/* Right action (revealed when swiping left → merge prev) */}
      <Animated.View style={[styles.actionBg, styles.actionRight, { backgroundColor: MERGE_COLORS.prevBg }, rightActionStyle]}>
        {canSwipeLeft ? (
          <>
            <Text style={[styles.actionText, { color: MERGE_COLORS.actionTextLight }]}>Merge prev</Text>
            <Feather name="arrow-left" size={16} color={MERGE_COLORS.actionTextLight} />
          </>
        ) : (
          <View style={styles.disabledStripes} />
        )}
      </Animated.View>

      {/* Card content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardStyle}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'visible',
  },
  actionBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: SWIPE_ACTION_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 18,
  },
  actionLeft: {
    left: 0,
  },
  actionRight: {
    right: 0,
  },
  actionText: {
    ...typography.caption,
    fontWeight: '700',
    color: MERGE_COLORS.actionText,
  },
  disabledStripes: {
    flex: 1,
    backgroundColor: MERGE_COLORS.disabledStripes,
    borderRadius: 18,
  },
});
