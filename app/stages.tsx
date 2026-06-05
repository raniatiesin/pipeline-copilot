/**
 * ============================================
 * STAGES SCREEN — INNER PIPELINE KANBAN
 * ============================================
 *
 * Displays the Stages Kanban for a single project:
 * the 4 pipeline cards — Style Selector, Beat Butcher,
 * Entity Editor, Arc Assembler.
 *
 * Receives project context via route params:
 *   - title: prospect name
 *   - subtitle: post name
 *   - script: raw script text (passed to Beat Butcher on open)
 *
 * @module app/stages
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { KanbanBoard } from '@/components/kanban';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { KANBAN_STATUS, KANBAN_STATUS_ORDER } from '@/constants/kanbanStatus';
import { KanbanProvider } from '@/hooks/useKanban';
import type { KanbanItem } from '@/types/kanban';

// ============================================
// STAGE MODULES — 4 cards, final names
// ============================================

function buildStageModules(): KanbanItem[] {
  return [
    {
      id: 'style-selector',
      title: 'Style Selector',
      description: 'Browse and select one of 690 offline visual style collages to anchor the project aesthetic.',
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
      description: 'Segment the script into beats and scenes using gestures — split, merge, reorder.',
      moduleId: 'beat-butcher',
      icon: 'scissors',
      status: KANBAN_STATUS.UP_NEXT,
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: 0,
      priority: 'high',
    },
    {
      id: 'entity-editor',
      title: 'Entity Editor',
      description: 'Identify and catalogue recurring subjects across all scenes.',
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
      description: 'Combine scenes, subjects, and style into a complete visual brief for each beat.',
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
}

function StagesContent({ script, title, subtitle }: StagesContentProps) {
  const router = useRouter();
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const STAGE_MODULES = buildStageModules();

  const handleItemPress = useCallback((item: KanbanItem) => {
    if (item.moduleId === 'style-selector') {
      router.push('/style-matcher/' as any);
    } else if (item.moduleId === 'beat-butcher') {
      // Pass script to Beat Butcher's input screen for pre-population
      router.push({
        pathname: '/scene-segmentation/input' as any,
        params: { prefill: script },
      });
    } else if (item.moduleId === 'entity-editor') {
      router.push('/scene-segmentation/entity-editor' as any);
    } else if (item.moduleId === 'arc-assembler') {
      router.push('/arc-assembler/' as any);
    }
  }, [router, script]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContinue = useCallback(() => {
    const currentStatus = KANBAN_STATUS_ORDER[currentPageIndex];
    if (!currentStatus) return;
    const items = STAGE_MODULES.filter(m => m.status === currentStatus);
    if (items.length > 0) {
      handleItemPress(items[0]);
    }
  }, [currentPageIndex, handleItemPress, STAGE_MODULES]);

  const progress = Math.round(
    (STAGE_MODULES.filter(m => m.status === KANBAN_STATUS.DONE).length / STAGE_MODULES.length) * 100
  );

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
  const { title, subtitle, script } = useLocalSearchParams<{
    title?: string;
    subtitle?: string;
    script?: string;
  }>();

  const projectTitle = title || 'Untitled Project';
  const projectSubtitle = subtitle || '';
  const projectScript = script || '';

  return (
    <KanbanProvider initialItems={buildStageModules()}>
      <StagesContent
        title={projectTitle}
        subtitle={projectSubtitle}
        script={projectScript}
      />
    </KanbanProvider>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({});
