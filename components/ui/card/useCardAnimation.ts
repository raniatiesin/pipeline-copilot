/**
 * ============================================
 * CARD ANIMATION HOOK
 * ============================================
 *
 * Shared animation primitive for all card components.
 * Uses React Native's built-in Animated API for maximum
 * cross-platform compatibility (iOS, Android, Web).
 *
 * Features:
 * - Press-in scale with configurable spring
 * - Haptic feedback coordination
 * - Dragging state awareness (inspired by react-kanban CardBag)
 * - Disabled state support
 *
 * @module components/ui/card/useCardAnimation
 */

import * as Haptics from 'expo-haptics';
import { useCallback, useRef } from 'react';
import { Animated, Platform } from 'react-native';

// ============================================
// SPRING PRESETS
// ============================================

/** Tight, responsive spring for press feedback */
export const CARD_SPRING = {
  tension: 250,
  friction: 25,
  useNativeDriver: true,
} as const;

/** Softer spring for release / bounce-back */
export const CARD_SPRING_SOFT = {
  tension: 150,
  friction: 12,
  useNativeDriver: false,
} as const;

// ============================================
// TYPES
// ============================================

export interface CardAnimationConfig {
  /** Scale when pressed. @default 0.97 */
  pressScale?: number;
  /** Enable haptic on press-in. @default true */
  hapticOnPress?: boolean;
  /** Enable haptic on tap. @default true */
  hapticOnTap?: boolean;
  /** Disable all interactions. @default false */
  disabled?: boolean;
}

export interface CardAnimationReturn {
  /** Animated style to spread onto Animated.View */
  animatedStyle: { transform: { scale: Animated.Value }[] };
  /** Call on pressIn */
  handlePressIn: () => void;
  /** Call on pressOut */
  handlePressOut: () => void;
  /** Call on press (tap) */
  handlePress: () => void;
  /** Raw animated value for advanced composition */
  scale: Animated.Value;
}

// ============================================
// HOOK
// ============================================

/**
 * Universal card press animation hook.
 *
 * @example
 * ```tsx
 * const { animatedStyle, handlePressIn, handlePressOut, handlePress } = useCardAnimation({
 *   pressScale: 0.96,
 *   hapticOnPress: true,
 * });
 *
 * <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
 *   <Animated.View style={[styles.card, animatedStyle]}>
 *     {children}
 *   </Animated.View>
 * </Pressable>
 * ```
 */
export function useCardAnimation(
  config: CardAnimationConfig = {},
  onPress?: () => void,
): CardAnimationReturn {
  const {
    pressScale = 0.97,
    hapticOnPress = true,
    hapticOnTap = true,
    disabled = false,
  } = config;

  const scale = useRef(new Animated.Value(1)).current;

  const animatedStyle = { transform: [{ scale }] };

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: pressScale,
      ...CARD_SPRING,
    }).start();
    if (hapticOnPress && Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [disabled, pressScale, hapticOnPress, scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      ...CARD_SPRING,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (hapticOnTap && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.();
  }, [disabled, hapticOnTap, onPress]);

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
    handlePress,
    scale,
  };
}
