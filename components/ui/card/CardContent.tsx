/**
 * ============================================
 * CARD CONTENT COMPONENT
 * ============================================
 *
 * Simple content area wrapper for card bodies.
 * Provides consistent padding and flex layout.
 *
 * @module components/ui/card/CardContent
 */

import React, { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { spacing } from '@/constants/theme';

// ============================================
// TYPES
// ============================================

export interface CardContentProps {
  children: React.ReactNode;
  /** Padding size. @default 'default' */
  padding?: 'none' | 'compact' | 'default';
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

// ============================================
// COMPONENT
// ============================================

export const CardContent = memo(function CardContent({
  children,
  padding = 'default',
  style,
}: CardContentProps) {
  return (
    <View style={[styles.base, paddingStyles[padding], style]}>
      {children}
    </View>
  );
});

// ============================================
// STYLES
// ============================================

const paddingStyles: Record<string, ViewStyle> = {
  none: {},
  compact: { padding: spacing.sm },
  default: { padding: spacing.md },
};

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
});
