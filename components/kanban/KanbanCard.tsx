/**
 * ============================================
 * KANBAN CARD COMPONENT
 * ============================================
 *
 * Kanban item card rendered with the universal scene-style card module.
 *
 * Visual features:
 * - Wide rectangular cards (aspect ratio from kanbanLayout)
 * - Scene-style header: module icon, title pill, progress percent
 * - Description in the lower body section
 * - "MARK AS DONE" action button — visible only on IN_REVIEW cards
 *
 * @module components/kanban/KanbanCard
 */

import { Feather } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { MODULE_CONFIG } from '@/constants/kanbanTheme';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';
import { useKanban } from '@/hooks/useKanban';
import type { KanbanCardProps } from '@/types/kanban';

import { UniversalModuleCard } from '../ui/card';

// ============================================
// MAIN COMPONENT
// ============================================

export const KanbanCard = React.memo(function KanbanCard({
  item,
  onPress,
  cardWidth,
}: KanbanCardProps) {
  const { updateNote, markDone } = useKanban();

  const iconName = useMemo(() => {
    const moduleConfig = item.moduleId
      ? MODULE_CONFIG[item.moduleId as keyof typeof MODULE_CONFIG]
      : null;
    return (item.icon || moduleConfig?.icon || 'box') as keyof typeof Feather.glyphMap;
  }, [item.moduleId, item.icon]);

  const handlePress = useCallback(() => {
    onPress?.(item);
  }, [item, onPress]);

  const handleNoteChange = useCallback((note: string) => {
    updateNote(item.id, note);
  }, [item.id, updateNote]);

  const handleMarkDone = useCallback(() => {
    if (item.moduleId) {
      markDone(item.moduleId);
    }
  }, [item.moduleId, markDone]);

  const effectiveWidth = cardWidth || 300;
  const isInReview = item.status === KANBAN_STATUS.IN_REVIEW;

  return (
    <>
      <UniversalModuleCard
        onPress={handlePress}
        iconName={iconName}
        title={item.title}
        progressPercent={item.progress ?? 0}
        description={item.description}
        noteText={item.quickNote ?? ''}
        isOutdated={item.isOutdated}
        onChangeNote={handleNoteChange}
        accessibilityLabel={`${item.title}. ${item.description || ''}`}
        accessibilityHint="Double tap to open"
        style={{ width: effectiveWidth }}
      />

      {/* "Mark as Done" — only on IN_REVIEW cards */}
      {isInReview && (
        <TouchableOpacity
          onPress={handleMarkDone}
          activeOpacity={0.8}
          style={[styles.markDoneButton, { width: effectiveWidth }]}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${item.title} as done`}
        >
          <Feather name="check-circle" size={14} color={colors.text.inverse} />
          <Text style={styles.markDoneText}>MARK AS DONE</Text>
        </TouchableOpacity>
      )}
    </>
  );
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  markDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    // Hard offset shadow
    shadowColor: colors.border,
    shadowOffset: shadows.hard.shadowOffset,
    shadowOpacity: shadows.hard.shadowOpacity,
    shadowRadius: 0,
    elevation: 4,
  },
  markDoneText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.inverse,
    letterSpacing: 0.8,
  },
});
