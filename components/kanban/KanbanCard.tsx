/**
 * ============================================
 * KANBAN CARD COMPONENT
 * ============================================
 *
 * Kanban item card with status accent bar, progress, and actions.
 *
 * @module components/kanban/KanbanCard
 */

import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { StatusPill } from '@/components/ui/StatusPill';
import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { spacing } from '@/constants/theme';
import { useKanban } from '@/hooks/useKanban';
import { exportPipeline } from '@/lib/exportPipeline';
import {
  getProjectCardPillConfig,
} from '@/lib/kanbanActionPills';
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
  const { state, updateNote, getProjectRow, deleteProject } = useKanban();
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const allItems = useMemo(
    () => Object.values(state.items),
    [state.items],
  );

  const isProjectCard = item.moduleId === 'project';
  const isWaiting = item.status === KANBAN_STATUS.WAITING;
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

  const navigateToProject = useCallback(() => {
    router.push('/project' as any);
  }, [router]);

  const handlePress = useCallback(() => {
    if (isProjectCard) {
      if (isWaiting) return;
      onPress?.(item);
      return;
    }
    onPress?.(item);
  }, [item, onPress, isProjectCard, isWaiting]);

  const handleNoteChange = useCallback((note: string) => {
    updateNote(item.id, note);
  }, [item.id, updateNote]);

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
      setShowActionsModal(true);
    }
  }, [isProjectCard]);

  const handleConfirmDelete = useCallback(() => {
    setShowActionsModal(false);
    deleteProject(item.id);
  }, [deleteProject, item.id]);

  const handlePillPress = useCallback(
    (targetStatus: string) => {
      // Special case: when on Waiting column, the only pill is "Up Next" → navigate to Projects Kanban
      if (isProjectCard && item.status === KANBAN_STATUS.WAITING) {
        navigateToProject();
        return;
      }
      // All other pills → navigate to Stages
      navigateToStages();
    },
    [item.status, isProjectCard, navigateToStages, navigateToProject],
  );

  const footerContent = useMemo(() => {
    if (!isProjectCard) return null;

    const pills = getProjectCardPillConfig(item);
    if (!pills?.length) return null;

    const leftPills = pills.filter((p) => p.side === 'left');
    const rightPills = pills.filter((p) => p.side === 'right');

    return (
      <View style={styles.footerRow}>
        <View style={styles.footerSide}>
          {leftPills.map((pill) => (
            <StatusPill
              key={pill.label}
              status={pill.targetStatus}
              label={pill.label}
              onPress={() => handlePillPress(pill.targetStatus)}
            />
          ))}
        </View>
        <View style={styles.footerSpacer} />
        <View style={styles.footerSide}>
          {rightPills.map((pill) => (
            <StatusPill
              key={pill.label}
              status={pill.targetStatus}
              label={pill.label}
              onPress={() => handlePillPress(pill.targetStatus)}
            />
          ))}
        </View>
      </View>
    );
  }, [isProjectCard, item, handlePillPress]);

  const effectiveWidth = cardWidth || 300;

  return (
    <>
      <UniversalModuleCard
        onPress={handlePress}
        onLongPress={isProjectCard ? handleLongPress : undefined}
        iconName={'film'}
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
        style={[
          { width: effectiveWidth },
          isWaiting && styles.wrapperWaiting,
          isDone && styles.wrapperDone,
        ]}
        accessibilityLabel={`${item.title}. ${item.description || ''}`}
        accessibilityHint={isWaiting ? 'Locked' : 'Double tap to open'}
      />

      <ConfirmModal
        visible={showActionsModal}
        title="Project actions"
        message={`"${item.title}"`}
        extraActions={
          <ConfirmModalAction
            label="Copy JSON"
            onPress={handleExport}
            isLoading={isExporting}
          />
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowActionsModal(false)}
      />
    </>
  );
});

/**
 * Small inline action button for the ConfirmModal extra actions.
 */
function ConfirmModalAction({
  label,
  onPress,
  isLoading,
}: {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
}) {
  return (
    <View style={styles.modalActionRow}>
      <StatusPill status="done" label={label} onPress={isLoading ? undefined : onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapperWaiting: {
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
  modalActionRow: {
    marginBottom: spacing.sm,
  },
});