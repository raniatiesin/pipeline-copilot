/**
 * ============================================
 * CARD IDENTITY PILL
 * ============================================
 *
 * Top-row identity cluster used by Kanban cards.
 * Layout: dark icon badge + light title strip + progress pill.
 *
 * @module components/ui/card/CardIdentityPill
 */

import { Feather } from '@expo/vector-icons';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { pillSizes } from '@/constants/pills';
import { colors, spacing, typography } from '@/constants/theme';

export interface CardIdentityPillProps {
  title: string;
  iconName: keyof typeof Feather.glyphMap;
  progressPercent: number;
  isOutdated?: boolean;
}

export const CardIdentityPill = memo(function CardIdentityPill({
  title,
  iconName,
  progressPercent,
  isOutdated,
}: CardIdentityPillProps) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconBadge, isOutdated && styles.iconBadgeOutdated]}>
        <Feather name={iconName} size={14} color={isOutdated ? colors.text.primary : colors.text.inverse} />
      </View>

      <View style={[styles.titleWrap, isOutdated && styles.titleWrapOutdated]}>
        <Text style={styles.title} numberOfLines={1}>
          {isOutdated ? `⚠️ ${title}` : title}
        </Text>
      </View>

      <View style={[styles.progressPill, isOutdated && styles.progressPillOutdated]}>
        <Text style={[styles.progressText, isOutdated && styles.progressTextOutdated]}>
          {isOutdated ? 'Outdated' : `${progressPercent}%`}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  iconBadge: {
    width: 58,
    minHeight: pillSizes.small.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: pillSizes.small.borderRadius,
  },
  titleWrap: {
    flex: 1,
    minHeight: pillSizes.small.minHeight,
    justifyContent: 'center',
    borderRadius: pillSizes.small.borderRadius,
    paddingHorizontal: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    color: colors.text.primary,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  progressPill: {
    minWidth: 58,
    minHeight: pillSizes.small.minHeight,
    borderWidth: pillSizes.small.borderWidth,
    borderColor: colors.border,
    borderRadius: pillSizes.small.borderRadius,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: pillSizes.small.paddingHorizontal,
  },
  progressText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconBadgeOutdated: {
    backgroundColor: '#ffedd5', // pale orange
    borderWidth: 2,
    borderColor: '#f97316',
  },
  titleWrapOutdated: {
    backgroundColor: '#fff7ed',
  },
  progressPillOutdated: {
    backgroundColor: '#ffedd5',
    borderColor: '#f97316',
    paddingHorizontal: spacing.sm,
  },
  progressTextOutdated: {
    color: '#c2410c',
  },
});
