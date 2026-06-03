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

import { colors } from '@/constants/theme';
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
  trackColor = colors.surfaceMuted,
  height = 6,
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
        { height, backgroundColor: trackColor, borderRadius: height / 2 },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            borderRadius: height / 2,
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
    borderColor: colors.borderSubtle,
  },
  fill: {
    height: '100%',
  },
});
