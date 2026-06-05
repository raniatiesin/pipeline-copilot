/**
 * ============================================
 * PROJECT PAGE - STAGES KANBAN BOARD
 * ============================================
 *
 * Inner Kanban board showing the 4 pipeline stage cards
 * for a single project: Style Selector, Beat Butcher,
 * Entity Editor, Arc Assembler.
 *
 * Uses ScreenLayout for universal Header → LINE → Content → LINE → Footer.
 *
 * @module app/project
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
// PROJECT MODULES — 4 cards, final names
// ============================================

const PROJECT_MODULES: KanbanItem[] = [
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProjectScreen() {
  const { title } = useLocalSearchParams<{ title?: string }>();
  const router = useRouter();
  const projectTitle = title || 'Untitled Project';

  // Calculate progress based on done items
  const totalItems = PROJECT_MODULES.length;
  const doneItems = PROJECT_MODULES.filter(item => item.status === KANBAN_STATUS.DONE).length;
  const progress = Math.round((doneItems / totalItems) * 100);

  // Track current page index for Continue button
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const handleItemPress = useCallback((item: KanbanItem) => {
    if (item.moduleId === 'style-selector') {
      router.push('/style-matcher/' as any);
    } else if (item.moduleId === 'beat-butcher') {
      router.push('/scene-segmentation/beat-butcher' as any);
    } else if (item.moduleId === 'entity-editor') {
      router.push('/scene-segmentation/entity-editor' as any);
    } else if (item.moduleId === 'arc-assembler') {
      router.push('/arc-assembler/' as any);
    }
  }, [router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContinue = useCallback(() => {
    // Open the top card of the currently viewed column
    const currentStatus = KANBAN_STATUS_ORDER[currentPageIndex];
    if (!currentStatus) return;
    const items = PROJECT_MODULES.filter(m => m.status === currentStatus);
    if (items.length > 0) {
      handleItemPress(items[0]);
    }
  }, [currentPageIndex, handleItemPress]);

  return (
    <ScreenLayout
      tabs={[
        { label: 'Projects', route: '/' },
      ]}
      title={projectTitle}
      progress={progress}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <KanbanProvider initialItems={PROJECT_MODULES}>
        <KanbanBoard
          onItemPress={handleItemPress}
          onPageChange={setCurrentPageIndex}
        />
      </KanbanProvider>
    </ScreenLayout>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({});
