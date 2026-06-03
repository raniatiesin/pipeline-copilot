/**
 * ============================================
 * CARD BADGE COMPONENT
 * ============================================
 *
 * Reusable pill/badge for status, progress, or counts.
 * Consistent across KanbanCard, ModuleCard, SubjectCategoryCard.
 *
 * @module components/ui/card/CardBadge
 */

import { Feather } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { pillSizes } from '@/constants/pills';
import { colors, spacing } from '@/constants/theme';

// ============================================
// TYPES
// ============================================

export interface CardBadgeProps {
  /** Text content */
  text: string;
  /** Optional Feather icon before text */
  icon?: keyof typeof Feather.glyphMap;
  /** Icon/text color. @default colors.text.primary */
  color?: string;
  /** Background color. @default colors.surface */
  backgroundColor?: string;
  /** Show border. @default true */
  bordered?: boolean;
  /** Size variant. @default 'default' */
  size?: 'small' | 'default';
  /** Additional styles */
  style?: StyleProp<ViewStyle>;
}

// ============================================
// COMPONENT
// ============================================

export const CardBadge = memo(function CardBadge({
  text,
  icon,
  color = colors.text.primary,
  backgroundColor = colors.surface,
  bordered = true,
  size = 'default',
  style,
}: CardBadgeProps) {
  const geometry = size === 'small' ? pillSizes.small : pillSizes.big;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor,
          minHeight: geometry.minHeight,
          paddingVertical: geometry.paddingVertical,
          paddingHorizontal: geometry.paddingHorizontal,
          borderRadius: geometry.borderRadius,
        },
        bordered && styles.bordered,
        style,
      ]}
    >
      {icon && (
        <Feather
          name={icon}
          size={geometry.iconSize}
          color={color}
        />
      )}
      <Text
        style={[
          styles.text,
          { color },
        ]}
      >
        {text}
      </Text>
    </View>
  );
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    flexShrink: 0,
  },
  bordered: {
    borderWidth: 3,
    borderColor: colors.border,
    shadowColor: 'rgba(20, 22, 20, 0.08)',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});
