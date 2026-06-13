/**
 * ============================================
 * STAGES SCREEN — INNER PIPELINE KANBAN
 * ============================================
 *
 * Displays the Stages Kanban for a single project:
 * 4 pipeline cards — Style Selector, Beat Butcher,
 * Entity Editor, Arc Assembler.
 *
 * Registers stageCallbacks.markInReview and markInProgress
 * on mount so work screens can call them via the bridge.
 *
 * @module app/stages
 */

import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { KanbanBoard } from '@/components/kanban';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { KANBAN_STATUS, KANBAN_STATUS_ORDER } from '@/constants/kanbanStatus';
import { KanbanProvider, useKanban } from '@/hooks/useKanban';
import { getFooterPillConfig } from '@/lib/kanbanActionPills';
import { getActiveColumnStatus, getPriorityItemInStatus } from '@/lib/kanbanLogic';
import { stageCallbacks } from '@/lib/stageCallbacks';
import type { KanbanItem, KanbanStatus } from '@/types/kanban';

// ============================================
// STAGE MODULES — 4 cards, final names
// ============================================

function buildStageModules(): KanbanItem[] {
  return [
    {
      id: 'style-selector',
      title: 'Style Selector',
      description: 'Choose visual style for the project',
      moduleId: 'style-selector',
      icon: 'image',
      status: KANBAN_STATUS.UP_NEXT,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      priority: 'high',
    },
    {
      id: 'beat-butcher',
      title: 'Beat Butcher',
      description: 'Segment script into beats and scenes',
      moduleId: 'beat-butcher',
      icon: 'scissors',
      status: KANBAN_STATUS.IN_PROGRESS,
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 50,
      priority: 'high',
    },
    {
      id: 'entity-editor',
      title: 'Entity Editor',
      description: 'Map recurring subjects across scenes',
      moduleId: 'entity-editor',
      icon: 'users',
      status: KANBAN_STATUS.WAITING,
      order: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      priority: 'medium',
    },
    {
      id: 'arc-assembler',
      title: 'Arc Assembler',
      description: 'Assemble complete visual brief',
      moduleId: 'arc-assembler',
      icon: 'map',
      status: KANBAN_STATUS.WAITING,
      order: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      priority: 'medium',
    },
  ];
}

// ============================================
// INNER CONTENT (needs KanbanProvider context)
// ============================================

interface StagesContentProps {
  script: string;
  title: string;
  subtitle: string;
  projectId: string;
  projectNumber: number;
}

function StagesContent({
  script,
  title,
  subtitle,
  projectId,
  projectNumber,
}: StagesContentProps) {
  const router = useRouter();
  const {
    markInReview,
    markInProgress,
    markDone,
    getModuleStatus,
    getItemsByStatus,
    state,
  } = useKanban();

  const postName = subtitle || title;
  const allItems = useMemo(
    () => Object.values(state.items),
    [state.items],
  );

  const activeColumnStatus = useMemo(
    () => getActiveColumnStatus(allItems),
    [allItems],
  );

  const [focusedStatus, setFocusedStatus] = useState<KanbanStatus>(activeColumnStatus);
  const [autoFocusKey, setAutoFocusKey] = useState(0);

  useEffect(() => {
    if (!state.isLoading && allItems.length > 0) {
      const status = getActiveColumnStatus(allItems);
      setFocusedStatus(status);
      setAutoFocusKey((k) => k + 1);
    }
  }, [state.isLoading, allItems]);

  useFocusEffect(
    useCallback(() => {
      if (allItems.length === 0) return;
      const status = getActiveColumnStatus(allItems);
      setFocusedStatus(status);
      setAutoFocusKey((k) => k + 1);
    }, [allItems]),
  );

  // ── Register stageCallbacks on mount ─────────────────────────────
  useEffect(() => {
    stageCallbacks.setMarkInReview(markInReview);
    stageCallbacks.setMarkInProgress(markInProgress);
    stageCallbacks.setGetModuleStatus(getModuleStatus);
    return () => {
      stageCallbacks.setMarkInReview(null);
      stageCallbacks.setMarkInProgress(null);
      stageCallbacks.setGetModuleStatus(null);
    };
  }, [markInReview, markInProgress, getModuleStatus]);

  const handlePageChange = useCallback((pageIndex: number) => {
    const status = KANBAN_STATUS_ORDER[pageIndex];
    if (status) {
      setFocusedStatus(status);
    }
  }, []);

  // ── Card navigation ──────────────────────────────────────────────

  const handleItemPress = useCallback((item: KanbanItem) => {
    const workParams = {
      projectId,
      projectNumber: String(projectNumber),
      title: postName,
    };

    if (item.moduleId === 'style-selector') {
      router.push({
        pathname: '/style-selector/' as any,
        params: workParams,
      });
    } else if (item.moduleId === 'beat-butcher') {
      router.push({
        pathname: '/scene-segmentation/beat-butcher' as any,
        params: workParams,
      });
    } else if (item.moduleId === 'entity-editor') {
      router.push({
        pathname: '/scene-segmentation/entity-editor' as any,
        params: workParams,
      });
    } else if (item.moduleId === 'arc-assembler') {
      router.push({
        pathname: '/arc-assembler/' as any,
        params: workParams,
      });
    }
  }, [router, projectId, projectNumber, postName]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const footerPill = useMemo(
    () => getFooterPillConfig(focusedStatus, allItems),
    [focusedStatus, allItems],
  );

  const handleContinue = useCallback(() => {
    const item = getPriorityItemInStatus(allItems, focusedStatus);
    if (!item?.moduleId) return;

    if (focusedStatus === KANBAN_STATUS.IN_REVIEW) {
      markDone(item.moduleId);
      return;
    }

    handleItemPress(item);
  }, [allItems, focusedStatus, markDone, handleItemPress]);

  // ── Progress (count of DONE stage cards) ─────────────────────────

  const doneCount = getItemsByStatus(KANBAN_STATUS.DONE).length;
  const progress = Math.round((doneCount / 4) * 100);

  const showFooter =
    focusedStatus !== KANBAN_STATUS.WAITING &&
    focusedStatus !== KANBAN_STATUS.DONE &&
    footerPill != null;

  return (
    <ScreenLayout
      tabs={[{ label: `Project #${projectNumber}`, route: '/project' }]}
      title={postName}
      progress={progress}
      onBack={handleBack}
      onContinue={showFooter ? handleContinue : undefined}
      continueLabel={footerPill?.label}
      continueColor={footerPill?.color}
      showFooter={showFooter}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <KanbanBoard
        onItemPress={handleItemPress}
        onPageChange={handlePageChange}
        autoFocusStatus={activeColumnStatus}
        autoFocusKey={autoFocusKey}
      />
    </ScreenLayout>
  );
}

// ============================================
// MAIN SCREEN
// ============================================

export default function StagesScreen() {
  const { projectId, title, subtitle, script, projectNumber } = useLocalSearchParams<{
    projectId?: string;
    title?: string;
    subtitle?: string;
    script?: string;
    projectNumber?: string;
  }>();

  const parsedProjectNumber = projectNumber ? parseInt(projectNumber, 10) : 1;

  return (
    <KanbanProvider
      initialItems={buildStageModules()}
      projectId={projectId}
    >
      <StagesContent
        title={title || 'Untitled Project'}
        subtitle={subtitle || ''}
        script={script || ''}
        projectId={projectId || ''}
        projectNumber={Number.isFinite(parsedProjectNumber) ? parsedProjectNumber : 1}
      />
    </KanbanProvider>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({});
