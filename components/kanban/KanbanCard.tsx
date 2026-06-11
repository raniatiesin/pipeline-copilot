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
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionPill } from '@/components/ui/ActionPill';
import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { MODULE_CONFIG } from '@/constants/kanbanTheme';
import { spacing } from '@/constants/theme';
import { useKanban } from '@/hooks/useKanban';
import {
  getStageCardPillConfig,
  PROJECT_CARD_PILLS,
} from '@/lib/kanbanActionPills';
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
  projectNumber,
}: KanbanCardProps) {
  const router = useRouter();
  const { state, updateNote, markDone, getProjectRow, deleteProject } = useKanban();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const allItems = useMemo(
    () => Object.values(state.items),
    [state.items],
  );

  const iconName = useMemo(() => {
    const moduleConfig = item.moduleId
      ? MODULE_CONFIG[item.moduleId as keyof typeof MODULE_CONFIG]
      : null;
    return (item.icon || moduleConfig?.icon || 'box') as keyof typeof Feather.glyphMap;
  }, [item.moduleId, item.icon]);

  const isProjectCard = item.moduleId === 'project';
  const isTodo = item.status === KANBAN_STATUS.TODO;
  const isDone = item.status === KANBAN_STATUS.DONE;

  const navigateToStages = useCallback(() => {
    if (!isProjectCard || projectNumber == null) return;
    router.push({
      pathname: '/stages' as any,
      params: {
        projectId: item.id,
        projectNumber: String(projectNumber),
        title: item.title,
        subtitle: item.description ?? '',
        script: item.script ?? '',
      },
    });
  }, [isProjectCard, projectNumber, router, item]);

  const handlePress = useCallback(() => {
    if (isProjectCard) {
      if (item.status === KANBAN_STATUS.TODO) return;
      onPress?.(item);
      return;
    }
    if (isTodo || isDone) return;
    onPress?.(item);
  }, [item, onPress, isProjectCard, isTodo, isDone]);

  const handleNoteChange = useCallback((note: string) => {
    updateNote(item.id, note);
  }, [item.id, updateNote]);

  const handleStagePillPress = useCallback(() => {
    if (!item.moduleId) return;

    if (item.status === KANBAN_STATUS.IN_REVIEW) {
      markDone(item.moduleId);
      return;
    }

    onPress?.(item);
  }, [item, markDone, onPress]);

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
    if (isProjectCard) {
      setShowDeleteModal(true);
    }
  }, [isProjectCard]);

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteModal(false);
    deleteProject(item.id);
  }, [deleteProject, item.id]);

  const footerContent = useMemo(() => {
    if (isProjectCard) {
      const pills = item.status ? PROJECT_CARD_PILLS[item.status] : undefined;
      if (!pills?.length) return null;

      const leftPills = pills.filter((p) => p.side === 'left');
      const rightPills = pills.filter((p) => p.side === 'right');

      return (
        <View style={styles.footerRow}>
          <View style={styles.footerSide}>
            {leftPills.map((pill) => (
              <ActionPill
                key={pill.label}
                label={pill.label}
                color={pill.color}
                onPress={navigateToStages}
              />
            ))}
          </View>
          <View style={styles.footerSpacer} />
          <View style={styles.footerSide}>
            {rightPills.map((pill) => (
              <ActionPill
                key={pill.label}
                label={pill.label}
                color={pill.color}
                onPress={navigateToStages}
              />
            ))}
          </View>
        </View>
      );
    }

    const pillConfig = getStageCardPillConfig(item, allItems);
    if (!pillConfig) return null;

    return (
      <View style={styles.footerRow}>
        <View style={styles.footerSpacer} />
        <ActionPill
          label={pillConfig.label}
          color={pillConfig.color}
          onPress={handleStagePillPress}
        />
      </View>
    );
  }, [
    isProjectCard,
    item,
    allItems,
    navigateToStages,
    handleStagePillPress,
  ]);

  const effectiveWidth = cardWidth || 300;

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
        projectNumber={isProjectCard ? projectNumber : undefined}
        footerContent={footerContent}
        onChangeNote={isProjectCard ? undefined : handleNoteChange}
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: spacing.sm,
  },
  footerSide: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerSpacer: {
    flex: 1,
  },
});
