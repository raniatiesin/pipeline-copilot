/**
 * ============================================
 * CARD CONTAINER COMPONENT
 * ============================================
 *
 * Universal animated wrapper for every card in the app.
 * Inspired by react-kanban's render-delegation: this is the
 * structural shell; content is injected via children.
 *
 * Features:
 * - Reanimated press spring (UI-thread, 60fps)
 * - Haptic coordination via useCardAnimation
 * - Neobrutalist border + shadow from theme
 * - Variant system: default | flush | elevated | dashed
 * - Accessibility baked in
 *
 * @module components/ui/card/CardContainer
 */

import React, { memo } from 'react';
import { Animated, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { getLineThickness } from '@/constants/line';
import { borderRadius, colors, shadows } from '@/constants/theme';

import { useCardAnimation, type CardAnimationConfig } from './useCardAnimation';

// ============================================
// TYPES
// ============================================

export type CardVariant = 'default' | 'flush' | 'elevated' | 'dashed';

export interface CardContainerProps extends CardAnimationConfig {
  children: React.ReactNode;
  /** Visual variant. @default 'default' */
  variant?: CardVariant;
  /** Override background color */
  backgroundColor?: string;
  /** Override border color */
  borderColor?: string;
  /** Called on tap */
  onPress?: () => void;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
  /** Accessibility label */
  accessibilityLabel?: string;
  /** Accessibility hint */
  accessibilityHint?: string;
  /** testID for automation */
  testID?: string;
}

// ============================================
// VARIANT STYLES
// ============================================

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.surface,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    ...shadows.soft,
  },
  flush: {
    backgroundColor: colors.surface,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    // No shadow — sits flat
  },
  elevated: {
    backgroundColor: colors.surface,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  dashed: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: getLineThickness('base'),
    borderColor: colors.borderSubtle,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
  },
};

// ============================================
// COMPONENT
// ============================================

export const CardContainer = memo(function CardContainer({
  children,
  variant = 'default',
  backgroundColor,
  borderColor,
  onPress,
  style,
  disabled = false,
  pressScale,
  hapticOnPress,
  hapticOnTap,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: CardContainerProps) {
  const { animatedStyle, handlePressIn, handlePressOut, handlePress } =
    useCardAnimation(
      { pressScale, hapticOnPress, hapticOnTap, disabled },
      onPress,
    );

  const overrides: ViewStyle = {};
  if (backgroundColor) overrides.backgroundColor = backgroundColor;
  if (borderColor) overrides.borderColor = borderColor;

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      testID={testID}
    >
      <Animated.View
        style={[
          styles.base,
          variantStyles[variant],
          overrides,
          disabled && styles.disabled,
          animatedStyle,
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
});
