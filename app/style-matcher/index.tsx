/**
 * ============================================
 * STYLE MATCHER MODULE - KANBAN VIEW
 * ============================================
 * 
 * Module overview showing all style question stages
 * in a Kanban board view. Uses ScreenLayout for universal
 * Header → LINE → Content → LINE → Footer.
 * 
 * @module app/style-matcher/index
 */

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';

import { KanbanBoard } from '@/components/kanban';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { KANBAN_STATUS, KANBAN_STATUS_ORDER } from '@/constants/kanbanStatus';
import { styleMatcherData } from '@/constants/styleMatcherData';
import { KanbanProvider } from '@/hooks/useKanban';
import type { KanbanItem } from '@/types/kanban';

// ============================================
// STAGE METADATA (icon, description, priority)
// ============================================

/** Kanban-specific metadata keyed by question id. */
const STAGE_META: Record<string, { icon: string; description: string; priority: 'low' | 'medium' | 'high' }> = {
  vibe:        { icon: 'heart',   description: 'Define the overall mood and feeling you want to communicate in your visuals.', priority: 'high' },
  realism:     { icon: 'eye',     description: 'Choose how realistic or stylized your visual content should appear.',          priority: 'high' },
  texture:     { icon: 'layers',  description: 'Select the surface quality and tactile feel of your visual elements.',         priority: 'medium' },
  color:       { icon: 'droplet', description: 'Pick your color scheme, saturation levels, and overall color mood.',           priority: 'medium' },
  light:       { icon: 'sun',     description: 'Define the light quality, direction, and atmospheric lighting effects.',       priority: 'medium' },
  form:        { icon: 'box',     description: 'Choose the geometric qualities and structural style of objects.',              priority: 'medium' },
  composition: { icon: 'grid',    description: 'Set the framing, balance, and visual arrangement of elements.',               priority: 'medium' },
  mood:        { icon: 'cloud',   description: 'Fine-tune the emotional atmosphere and tonal quality of your visuals.',        priority: 'medium' },
  movement:    { icon: 'wind',    description: 'Define how motion and energy are conveyed in your visual style.',              priority: 'low' },
  artMovement: { icon: 'feather', description: 'Select an artistic era or movement to influence your visual style.',           priority: 'low' },
  detail:      { icon: 'zoom-in', description: 'Choose the complexity and intricacy of visual details.',                       priority: 'low' },
  subject:     { icon: 'user',    description: 'Define how subjects are presented and emphasized in the frame.',               priority: 'low' },
};

/** Derive Kanban stages from the single-source-of-truth question data. */
function buildStages(): KanbanItem[] {
  const now = new Date();
  return styleMatcherData.map((q) => {
    const meta = STAGE_META[q.id];
    return {
      id: q.id,
      title: q.title,
      order: q.order,
      status: KANBAN_STATUS.TODO,
      createdAt: now,
      updatedAt: now,
      moduleId: 'style-selector',
      progress: 0,
      ...(meta ?? {}),
    };
  });
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function StyleMatcherIndexScreen() {
  const router = useRouter();

  const stages = useMemo(() => buildStages(), []);

  // Calculate progress based on done items
  const totalItems = stages.length;
  const doneItems = stages.filter(item => item.status === KANBAN_STATUS.DONE).length;
  const progress = Math.round((doneItems / totalItems) * 100);

  // Track current page index for Continue button
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const handleItemPress = useCallback((item: KanbanItem) => {
    router.push(`/style-matcher/${item.order}`);
  }, [router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContinue = useCallback(() => {
    // Open the top card of the currently viewed column
    const currentStatus = KANBAN_STATUS_ORDER[currentPageIndex];
    if (!currentStatus) return;
    const items = stages.filter(s => s.status === currentStatus);
    if (items.length > 0) {
      handleItemPress(items[0]);
    }
  }, [currentPageIndex, handleItemPress, stages]);

  return (
    <ScreenLayout
      tabs={[
        { label: 'Project', route: '/project' },
      ]}
      title="Selection"
      progress={progress}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <KanbanProvider initialItems={stages}>
        <KanbanBoard
          onItemPress={handleItemPress}
          onPageChange={setCurrentPageIndex}
        />
      </KanbanProvider>
    </ScreenLayout>
  );
}
