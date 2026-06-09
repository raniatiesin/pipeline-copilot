/**
 * ============================================
 * CARD PROGRESS BAR COMPONENT
 * ============================================
 *
 * Animated progress bar for cards. Uses React Native's
 * built-in Animated API for cross-platform compatibility.
 *
 * @module components/ui/card/CardProgressBar
 */

import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderRadius, colors } from '@/constants/theme';
import { CARD_SPRING_SOFT } from './useCardAnimation';

// ============================================
// TYPES
// ============================================

export interface CardProgressBarProps {
  /** Progress 0-100 */
  progress: number;
  /** Bar fill color. @default colors.accent */
  color?: string;
  /** Track color. @default colors.surfaceMuted */
  trackColor?: string;
  /** Height in px. @default 6 */
  height?: number;
  /** Additional styles on outer container */
  style?: StyleProp<ViewStyle>;
}

// ============================================
// COMPONENT
// ============================================

export const CardProgressBar = memo(function CardProgressBar({
  progress,
  color = colors.accent,
  trackColor = colors.border,
  height = 4,
  style,
}: CardProgressBarProps) {
  const widthPercent = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(widthPercent, {
      toValue: Math.max(0, Math.min(100, progress)),
      ...CARD_SPRING_SOFT,
    }).start();
  }, [progress, widthPercent]);

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: trackColor, borderRadius: borderRadius.sm },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            borderRadius: borderRadius.sm,
            width: widthPercent.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%'],
              extrapolate: 'clamp',
            }),
          },
        ]}
      />
    </View>
  );
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  fill: {
    height: '100%',
  },
});
