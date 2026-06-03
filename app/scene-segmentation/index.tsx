/**
 * ============================================
 * SCENE SEGMENTATION MODULE - KANBAN VIEW
 * ============================================
 * 
 * Module overview showing all scene segmentation stages
 * in a Kanban board view. Uses ScreenLayout for universal
 * Header → LINE → Content → LINE → Footer.
 * 
 * @module app/scene-segmentation/index
 */

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';

import { KanbanBoard } from '@/components/kanban';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { KANBAN_STATUS, KANBAN_STATUS_ORDER } from '@/constants/kanbanStatus';
import { KanbanProvider } from '@/hooks/useKanban';
import type { KanbanItem } from '@/types/kanban';

// ============================================
// SCENE SEGMENTATION STAGES
// ============================================

const SCENE_SEGMENTATION_STAGES: KanbanItem[] = [
  {
    id: 'paste-script',
    title: 'Paste Script',
    description: 'Input your script text to begin automatic scene detection and segmentation.',
    moduleId: 'scene-segmentor',
    icon: 'clipboard',
    status: KANBAN_STATUS.TODO,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: 0,
    priority: 'high',
  },
  {
    id: 'scene-mapper',
    title: 'Scene Mapper',
    description: 'Drag and drop phrases between scene cards to define scene boundaries.',
    moduleId: 'scene-segmentor',
    icon: 'layers',
    status: KANBAN_STATUS.TODO,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: 0,
    priority: 'high',
  },
  {
    id: 'subject-mapper',
    title: 'Subject Mapper',
    description: 'Identify and categorize recurring subjects across your scenes.',
    moduleId: 'scene-segmentor',
    icon: 'users',
    status: KANBAN_STATUS.TODO,
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: 0,
    priority: 'high',
  },
];

// ============================================
// MAIN COMPONENT
// ============================================

export default function SceneSegmentationIndexScreen() {
  const router = useRouter();

  // Calculate progress based on done items
  const totalItems = SCENE_SEGMENTATION_STAGES.length;
  const doneItems = SCENE_SEGMENTATION_STAGES.filter(item => item.status === KANBAN_STATUS.DONE).length;
  const progress = Math.round((doneItems / totalItems) * 100);

  // Track current page index for Continue button
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const handleItemPress = useCallback((item: KanbanItem) => {
    if (item.id === 'paste-script') {
      router.push('/scene-segmentation/input');
    } else if (item.id === 'scene-mapper') {
      router.push('/scene-segmentation/scene-mapper');
    } else if (item.id === 'subject-mapper') {
      router.push('/scene-segmentation/subject-mapper');
    }
  }, [router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContinue = useCallback(() => {
    // Open the top card of the currently viewed column
    const currentStatus = KANBAN_STATUS_ORDER[currentPageIndex];
    if (!currentStatus) return;
    const items = SCENE_SEGMENTATION_STAGES.filter(s => s.status === currentStatus);
    if (items.length > 0) {
      handleItemPress(items[0]);
    }
  }, [currentPageIndex, handleItemPress]);

  return (
    <ScreenLayout
      tabs={[
        { label: 'Project', route: '/project' },
      ]}
      title="Segmentation"
      progress={progress}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <KanbanProvider initialItems={SCENE_SEGMENTATION_STAGES}>
        <KanbanBoard
          onItemPress={handleItemPress}
          onPageChange={setCurrentPageIndex}
        />
      </KanbanProvider>
    </ScreenLayout>
  );
}
