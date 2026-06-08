/**
 * ============================================
 * KANBAN CARD COMPONENT
 * ============================================
 *
 * Kanban item card with:
 * - Status-based left border accent colour
 * - "MARK AS DONE" button for IN_REVIEW cards
 * - JSON export (clipboard copy) for project cards
 *
 * @module components/kanban/KanbanCard
 */

import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { pillSizes } from '@/constants/pills';
import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { MODULE_CONFIG } from '@/constants/kanbanTheme';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';
import { useKanban } from '@/hooks/useKanban';
import { exportPipeline } from '@/lib/exportPipeline';
import type { KanbanCardProps, KanbanStatus } from '@/types/kanban';

import { CardActionModal } from './CardActionModal';
import { UniversalModuleCard } from '../ui/card';

// Status accents removed — clean neobrutalist cards without colored borders
// Visual hierarchy conveyed through card content and status pill instead

// ============================================
// MAIN COMPONENT
// ============================================

export const KanbanCard = React.memo(function KanbanCard({
  item,
  onPress,
  cardWidth,
}: KanbanCardProps) {
  const { updateNote, markDone, getProjectRow } = useKanban();
  const [showActionModal, setShowActionModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const iconName = useMemo(() => {
    const moduleConfig = item.moduleId
      ? MODULE_CONFIG[item.moduleId as keyof typeof MODULE_CONFIG]
      : null;
    return (item.icon || moduleConfig?.icon || 'box') as keyof typeof Feather.glyphMap;
  }, [item.moduleId, item.icon]);

  const handlePress = useCallback(() => {
    if (item.status === KANBAN_STATUS.TODO) return;
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

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const row = getProjectRow(item.id);
      if (!row) return;
      const data = exportPipeline(row);
      await Clipboard.setStringAsync(JSON.stringify(data, null, 2));
      setShowActionModal(false);
    } finally {
      setIsExporting(false);
    }
  }, [item.id, getProjectRow]);

  const handleActionModalOpen = useCallback(() => {
    setShowActionModal(true);
  }, []);

  const effectiveWidth = cardWidth || 300;
  const isInReview = item.status === KANBAN_STATUS.IN_REVIEW;
  const isTodo = item.status === KANBAN_STATUS.TODO;
  const isProjectCard = item.moduleId === 'project';

  return (
    <View
      style={[
        styles.wrapper,
        isTodo && styles.wrapperTodo,
        { width: effectiveWidth },
      ]}
    >
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
        accessibilityHint={isTodo ? 'Locked' : 'Double tap to open'}
      />

      {/* "Mark as Done" — only on IN_REVIEW cards */}
      {isInReview && (
        <TouchableOpacity
          onPress={handleMarkDone}
          activeOpacity={0.8}
          style={styles.markDoneButton}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${item.title} as done`}
        >
          <Feather name="check-circle" size={14} color={colors.text.inverse} />
          <Text style={styles.markDoneText}>MARK AS DONE</Text>
        </TouchableOpacity>
      )}

      {/* Export — only on project cards */}
      {isProjectCard && (
        <TouchableOpacity
          onPress={handleActionModalOpen}
          activeOpacity={0.8}
          style={styles.exportButton}
          accessibilityRole="button"
          accessibilityLabel={`Options for ${item.title}`}
        >
          <Feather name="more-vertical" size={16} color={colors.text.secondary} />
          <Text style={styles.exportText}>OPTIONS</Text>
        </TouchableOpacity>
      )}

      {/* Action modal */}
      <CardActionModal
        visible={showActionModal}
        cardTitle={item.title}
        onClose={() => setShowActionModal(false)}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </View>
  );
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  wrapperTodo: {
    opacity: 0.5,
  },
  markDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  exportText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 10,
  },
});
