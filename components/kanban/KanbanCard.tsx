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
 * - Long-press delete — visible only on project cards (moduleId === 'project')
 *   Triggers a ConfirmModal with dark backdrop. Confirmation required.
 *
 * @module components/kanban/KanbanCard
 */

import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { MODULE_CONFIG } from '@/constants/kanbanTheme';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';
import { deleteProject } from '@/lib/database';
import { useKanban } from '@/hooks/useKanban';
import type { KanbanCardProps } from '@/types/kanban';

import { ConfirmModal } from '../ui/ConfirmModal';
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

  const isProjectCard = item.moduleId === 'project';
  const isInReview = item.status === KANBAN_STATUS.IN_REVIEW;
  const effectiveWidth = cardWidth || 300;

  // ── Delete confirmation modal (project cards only) ────────────────
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const openDeleteModal = useCallback(() => {
    if (!isProjectCard) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setDeleteModalVisible(true);
  }, [isProjectCard]);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleteModalVisible(false);
    await deleteProject(item.id);
  }, [item.id]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalVisible(false);
  }, []);

  // ── Icon ─────────────────────────────────────────────────────────
  const iconName = useMemo(() => {
    const moduleConfig = item.moduleId
      ? MODULE_CONFIG[item.moduleId as keyof typeof MODULE_CONFIG]
      : null;
    return (item.icon || moduleConfig?.icon || 'box') as keyof typeof Feather.glyphMap;
  }, [item.moduleId, item.icon]);

  // ── Handlers ─────────────────────────────────────────────────────
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

  return (
    <View>
      <UniversalModuleCard
        onPress={handlePress}
        onLongPress={isProjectCard ? openDeleteModal : undefined}
        iconName={iconName}
        title={item.title}
        progressPercent={item.progress ?? 0}
        description={item.description}
        noteText={item.quickNote ?? ''}
        isOutdated={item.isOutdated}
        onChangeNote={handleNoteChange}
        accessibilityLabel={`${item.title}. ${item.description || ''}`}
        accessibilityHint={isProjectCard ? 'Double tap to open, long press to delete' : 'Double tap to open'}
        style={{ width: effectiveWidth }}
      />

      {/* "Mark as Done" — only on IN_REVIEW stage cards */}
      {isInReview && !isProjectCard && (
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

      {/* Confirm delete modal — rendered at root, appears above everything */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Delete this project?"
        message="All pipeline data will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        destructive
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </View>
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
