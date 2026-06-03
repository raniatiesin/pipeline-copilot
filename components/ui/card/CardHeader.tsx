/**
 * ============================================
 * CARD HEADER COMPONENT
 * ============================================
 *
 * Shared header strip for cards. Follows the pattern from
 * react-kanban's column headers: left label + right accessory.
 *
 * @module components/ui/card/CardHeader
 */

import React, { memo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { pillSizes } from '@/constants/pills';
import { colors, spacing, typography } from '@/constants/theme';

// ============================================
// TYPES
// ============================================

export interface CardHeaderProps {
  /** Primary label text */
  label: string;
  /** Background color for the label pill */
  labelColor?: string;
  /** Text color for the label */
  labelTextColor?: string;
  /** Right-side accessory (icons, badges, buttons) */
  right?: React.ReactNode;
  /** Show bottom border. @default true */
  bordered?: boolean;
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

// ============================================
// COMPONENT
// ============================================

export const CardHeader = memo(function CardHeader({
  label,
  labelColor = colors.primary,
  labelTextColor = colors.text.inverse,
  right,
  bordered = true,
  style,
}: CardHeaderProps) {
  return (
    <View
      style={[
        styles.container,
        bordered && styles.bordered,
        style,
      ]}
    >
      <View style={[styles.labelPill, { backgroundColor: labelColor }]}>
        <Text style={[styles.labelText, { color: labelTextColor }]}>
          {label}
        </Text>
      </View>
      {right && <View style={styles.right}>{right}</View>}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bordered: {
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
  },
  labelPill: {
    minHeight: pillSizes.small.minHeight,
    paddingHorizontal: pillSizes.small.paddingHorizontal,
    paddingVertical: pillSizes.small.paddingVertical,
    borderRadius: pillSizes.small.borderRadius,
    justifyContent: 'center',
  },
  labelText: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
