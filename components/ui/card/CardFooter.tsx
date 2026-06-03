/**
 * ============================================
 * CARD FOOTER COMPONENT
 * ============================================
 *
 * Shared footer strip for cards. Shows metadata like
 * subject counts, tags, or action chips.
 *
 * @module components/ui/card/CardFooter
 */

import React, { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { borderRadius, colors, spacing } from '@/constants/theme';

// ============================================
// TYPES
// ============================================

export interface CardFooterProps {
  children: React.ReactNode;
  /** Show top border. @default true */
  bordered?: boolean;
  /** Muted background. @default true */
  muted?: boolean;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

// ============================================
// COMPONENT
// ============================================

export const CardFooter = memo(function CardFooter({
  children,
  bordered = true,
  muted = true,
  style,
}: CardFooterProps) {
  return (
    <View
      style={[
        styles.container,
        bordered && styles.bordered,
        muted && styles.muted,
        style,
      ]}
    >
      {children}
    </View>
  );
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xxs,
  },
  bordered: {
    borderTopWidth: 2,
    borderTopColor: colors.borderSubtle,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
    borderBottomLeftRadius: borderRadius.lg - 2,
    borderBottomRightRadius: borderRadius.lg - 2,
  },
});
