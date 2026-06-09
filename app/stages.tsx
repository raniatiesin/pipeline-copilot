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

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { KanbanBoard } from '@/components/kanban';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { KANBAN_STATUS, KANBAN_STATUS_ORDER } from '@/constants/kanbanStatus';
import { KanbanProvider, useKanban } from '@/hooks/useKanban';
import { stageCallbacks } from '@/lib/stageCallbacks';
import type { KanbanItem } from '@/types/kanban';

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
      progress: 0,
      priority: 'high',
    },
    {
      id: 'entity-editor',
      title: 'Entity Editor',
      description: 'Map recurring subjects across scenes',
      moduleId: 'entity-editor',
      icon: 'users',
      status: KANBAN_STATUS.TODO,
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
      status: KANBAN_STATUS.TODO,
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
}

function StagesContent({ script, title, subtitle, projectId }: StagesContentProps) {
  const router = useRouter();
  const { markInReview, markInProgress, getModuleStatus, getItemsByStatus, state } = useKanban();
  const [currentPageIndex, setCurrentPageIndex] = useState(state.activePageIndex || 0);

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

  // ── Card navigation ──────────────────────────────────────────────

  const handleItemPress = useCallback((item: KanbanItem) => {
    if (item.moduleId === 'style-selector') {
      router.push({
        pathname: '/style-selector/' as any,
        params: { projectId },
      });
    } else if (item.moduleId === 'beat-butcher') {
      router.push({
        pathname: '/scene-segmentation/input' as any,
        params: { prefill: script, projectId },
      });
    } else if (item.moduleId === 'entity-editor') {
      router.push({
        pathname: '/scene-segmentation/entity-editor' as any,
        params: { projectId },
      });
    } else if (item.moduleId === 'arc-assembler') {
      router.push({
        pathname: '/arc-assembler/' as any,
        params: { projectId },
      });
    }
  }, [router, script, projectId]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContinue = useCallback(() => {
    const currentStatus = KANBAN_STATUS_ORDER[currentPageIndex];
    if (!currentStatus) return;
    const items = getItemsByStatus(currentStatus);
    if (items.length > 0) {
      handleItemPress(items[0]);
    }
  }, [currentPageIndex, handleItemPress, getItemsByStatus]);

  // ── Progress (count of DONE stage cards) ─────────────────────────

  const doneCount = getItemsByStatus(KANBAN_STATUS.DONE).length;
  const progress = Math.round((doneCount / 4) * 100);

  return (
    <ScreenLayout
      tabs={[
        { label: 'Projects', route: '/project' },
        { label: title, route: '/stages' },
      ]}
      title={subtitle || title}
      progress={progress}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <KanbanBoard
        onItemPress={handleItemPress}
        onPageChange={setCurrentPageIndex}
      />
    </ScreenLayout>
  );
}

// ============================================
// MAIN SCREEN
// ============================================

export default function StagesScreen() {
  const { projectId, title, subtitle, script } = useLocalSearchParams<{
    projectId?: string;
    title?: string;
    subtitle?: string;
    script?: string;
  }>();

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
      />
    </KanbanProvider>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({});
