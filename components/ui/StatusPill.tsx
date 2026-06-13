/**
 * ============================================
 * STATUS PILL — REUSABLE BADGE / ACTION PILL
 * ============================================
 *
 * A single colored pill that displays a status label.
 * Used in two modes:
 *   1. Display-only (used by KanbanColumn headers — no onPress)
 *   2. Pressable action (used by project-card pills — with onPress)
 *
 * Styling matches the column-header pill exactly:
 * same font, padding, radius, border, and per-status color.
 *
 * @module components/ui/StatusPill
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { kanbanColors } from '@/constants/kanbanTheme';
import { pillSizes } from '@/constants/pills';
import { colors, typography } from '@/constants/theme';
import type { KanbanStatus } from '@/types/kanban';

// ============================================
// COLOR LOOKUP
// ============================================

function getColorSet(status: KanbanStatus): (typeof kanbanColors)[keyof typeof kanbanColors] {
  switch (status) {
    case 'waiting':
      return kanbanColors.gray;
    case 'up-next':
      return kanbanColors.yellow;
    case 'in-progress':
      return kanbanColors.orange;
    case 'in-review':
      return kanbanColors.purple;
    case 'done':
      return kanbanColors.blue;
  }
}

function getDisplayLabel(status: KanbanStatus): string {
  switch (status) {
    case 'waiting':
      return 'Waiting';
    case 'up-next':
      return 'Up Next';
    case 'in-progress':
      return 'In Progress';
    case 'in-review':
      return 'In Review';
    case 'done':
      return 'Done';
  }
}

// ============================================
// PROPS
// ============================================

export interface StatusPillProps {
  /** The Kanban status that determines label text and color */
  status: KanbanStatus;
  /** When provided, renders as a pressable TouchableOpacity */
  onPress?: () => void;
  /** Optionally override the display label (defaults to status's display name) */
  label?: string;
  /** Test ID for automation */
  testID?: string;
}

// ============================================
// COMPONENT
// ============================================

export function StatusPill({
  status,
  onPress,
  label,
  testID,
}: StatusPillProps) {
  const colorSet = getColorSet(status);
  const displayLabel = label ?? getDisplayLabel(status);

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const pillContent = (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: colorSet.pill,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.text.primary }]}>
        {displayLabel}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={displayLabel}
        testID={testID}
      >
        {pillContent}
      </TouchableOpacity>
    );
  }

  return (
    <View pointerEvents="none">
      {pillContent}
    </View>
  );
}

// ============================================
// STYLES (mirrors ColumnTab styling exactly)
// ============================================

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: pillSizes.big.minHeight,
    paddingHorizontal: pillSizes.big.paddingHorizontal,
    paddingVertical: pillSizes.big.paddingVertical,
    borderRadius: pillSizes.big.borderRadius,
    borderWidth: pillSizes.big.borderWidth,
    alignSelf: 'flex-start',
  },
  label: {
    ...typography.body,
    fontWeight: '700',
  },
});