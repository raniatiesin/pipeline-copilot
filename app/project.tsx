/**
 * ============================================
 * PROJECT PAGE - KANBAN TASK BOARD
 * ============================================
 * 
 * Main project view showing tasks in a Kanban board.
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
// PROJECT MODULES
// ============================================

const PROJECT_MODULES: KanbanItem[] = [
  {
    id: 'script-pasting',
    title: 'Script Pasting',
    description: 'Paste your quote or script to generate the foundation for all other steps.',
    moduleId: 'script-pasting',
    icon: 'file-text',
    status: KANBAN_STATUS.IN_PROGRESS,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: 10,
    priority: 'high',
  },
  {
    id: 'style-selector',
    title: 'Style Selector',
    description: 'Pick from curated visual presets to define your video aesthetic.',
    moduleId: 'style-selector',
    icon: 'image',
    status: KANBAN_STATUS.UP_NEXT,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: 0,
    priority: 'high',
  },
  {
    id: 'scene-segmentor',
    title: 'Scene Segmentor',
    description: 'Divide the script into logical beats and scenes.',
    moduleId: 'scene-segmentor',
    icon: 'scissors',
    status: KANBAN_STATUS.UP_NEXT,
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: 0,
    priority: 'high',
  },
  {
    id: 'subject-segmentor',
    title: 'Subject Segmentor',
    description: 'Identify the primary subjects and concepts in the scenes.',
    moduleId: 'subject-segmentor',
    icon: 'users',
    status: KANBAN_STATUS.TODO,
    order: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: 0,
    priority: 'medium',
  },
  {
    id: 'scene-mapper',
    title: 'Scene Mapper',
    description: 'Combine script, style, and subjects into a complete visual storyboard.',
    moduleId: 'scene-mapper',
    icon: 'map',
    status: KANBAN_STATUS.TODO,
    order: 5,
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
    // Navigate to module Kanban view
    if (item.moduleId === 'style-selector') {
      router.push('/style-matcher/' as any);
    } else if (item.moduleId === 'scene-segmentor') {
      router.push('/scene-segmentation');
    } else if (item.moduleId === 'subject-segmentor') {
      router.push('/scene-segmentation/subject-mapper' as any);
    } else if (item.moduleId === 'scene-mapper') {
      router.push('/scene-segmentation/scene-mapper' as any);
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
        { label: 'Login', route: '/' },
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
