/**
 * ============================================
 * KANBAN CARD COMPONENT
 * ============================================
 *
 * Kanban item card with status accent bar, progress, and actions.
 *
 * @module components/kanban/KanbanCard
 */

import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { MODULE_CONFIG } from '@/constants/kanbanTheme';
import { useKanban } from '@/hooks/useKanban';
import { exportPipeline } from '@/lib/exportPipeline';
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
  const { updateNote, markDone, getProjectRow, deleteProject } = useKanban();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
    } finally {
      setIsExporting(false);
    }
  }, [item.id, getProjectRow]);

  const handleLongPress = useCallback(() => {
    if (item.moduleId === 'project') {
      setShowDeleteModal(true);
    }
  }, [item.moduleId]);

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteModal(false);
    deleteProject(item.id);
  }, [deleteProject, item.id]);

  const effectiveWidth = cardWidth || 300;
  const isInReview = item.status === KANBAN_STATUS.IN_REVIEW;
  const isTodo = item.status === KANBAN_STATUS.TODO;
  const isDone = item.status === KANBAN_STATUS.DONE;
  const isProjectCard = item.moduleId === 'project';

  return (
    <>
      <UniversalModuleCard
        onPress={handlePress}
        onLongPress={isProjectCard ? handleLongPress : undefined}
        iconName={iconName}
        title={item.title}
        progressPercent={item.progress ?? 0}
        status={item.status}
        description={item.description}
        noteText={item.quickNote ?? ''}
        isOutdated={item.isOutdated}
        isProjectCard={isProjectCard}
        onChangeNote={handleNoteChange}
        onMarkDone={isInReview ? handleMarkDone : undefined}
        onExport={isProjectCard && !isExporting ? handleExport : undefined}
        style={[
          { width: effectiveWidth },
          isTodo && styles.wrapperTodo,
          isDone && styles.wrapperDone,
        ]}
        accessibilityLabel={`${item.title}. ${item.description || ''}`}
        accessibilityHint={isTodo ? 'Locked' : 'Double tap to open'}
      />

      <ConfirmModal
        visible={showDeleteModal}
        title="Delete project?"
        message={`This will permanently remove "${item.title}" and all its pipeline data.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  );
});

const styles = StyleSheet.create({
  wrapperTodo: {
    opacity: 0.45,
  },
  wrapperDone: {
    opacity: 0.75,
  },
});
