/**
 * ============================================
 * PROJECT SCREEN — PROJECTS KANBAN (OUTER BOARD)
 * ============================================
 *
 * The Projects Kanban — shows one card per reel project.
 * Each card represents a video pipeline in progress.
 *
 * - To Do column has the "New Project" button (only column with it)
 * - Tapping a project card navigates to its Stages Kanban (/stages)
 * - "New Project" opens CreateProjectModal (3-input form)
 * - Auto-seeds one demo project on first launch (empty DB)
 *
 * @module app/project
 */

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { CreateProjectModal, KanbanBoard } from '@/components/kanban';
import type { CreateProjectData } from '@/components/kanban/CreateProjectModal';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { KanbanProvider, useKanban } from '@/hooks/useKanban';
import type { KanbanItem } from '@/types/kanban';

// ============================================
// DEMO PROJECT SEED DATA
// ============================================

const DEMO_PROJECT: CreateProjectData = {
  prospectName: 'Rania Al-Masri',
  postName: 'The Art of Stillness',
  script:
    'There is a kind of courage that looks like doing nothing. ' +
    'It is the courage to pause, to breathe, to let silence speak. ' +
    'In a world that rewards speed, stillness can feel like failure. ' +
    'But stillness is where clarity lives. ' +
    'Where your best ideas surface. ' +
    'Where you remember what actually matters. ' +
    'This is not about slowing down your output. ' +
    'It is about deepening your intention. ' +
    'When you create from stillness, every frame carries weight. ' +
    'Every word earns its place. ' +
    'So before you hit record — stop. ' +
    'Breathe. ' +
    'And let the work begin from the inside out.',
};

// ============================================
// INNER CONTENT — must be inside KanbanProvider
// ============================================

function ProjectsKanbanContent() {
  const router = useRouter();
  const { state, createProject } = useKanban();

  const [showModal, setShowModal] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const seedAttempted = useRef(false);

  // Auto-seed demo project if DB is empty after initial load
  useEffect(() => {
    if (seedAttempted.current) return;
    const timer = setTimeout(() => {
      if (seedAttempted.current) return;
      seedAttempted.current = true;
      const projectItems = Object.values(state.items).filter(
        (i: KanbanItem) => i.moduleId === 'project',
      );
      if (projectItems.length === 0) {
        createProject(DEMO_PROJECT);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [state.items, createProject]);

  const handleAddProject = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleCreateProject = useCallback((data: CreateProjectData) => {
    createProject(data);
    setShowModal(false);
  }, [createProject]);

  const handleItemPress = useCallback((item: KanbanItem) => {
    router.push({
      pathname: '/stages' as any,
      params: {
        projectId: item.id,
        title: item.title,
        subtitle: item.description ?? '',
        script: item.script ?? '',
      },
    });
  }, [router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <KanbanBoard
        onItemPress={handleItemPress}
        onPageChange={setCurrentPageIndex}
        onAddProject={handleAddProject}
      />

      <CreateProjectModal
        visible={showModal}
        onClose={handleModalClose}
        onConfirm={handleCreateProject}
      />
    </>
  );
}

// ============================================
// MAIN SCREEN
// ============================================

export default function ProjectScreen() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <ScreenLayout
      tabs={[
        { label: 'Projects', route: '/project' },
      ]}
      title="Projects"
      onBack={handleBack}
      showFooter={false}
    >
      <KanbanProvider initialItems={[]}>
        <ProjectsKanbanContent />
      </KanbanProvider>
    </ScreenLayout>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({});
