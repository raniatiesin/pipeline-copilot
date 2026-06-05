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
 *
 * Uses ScreenLayout for universal Header → LINE → Content → LINE → Footer.
 *
 * @module app/project
 */

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { CreateProjectModal, KanbanBoard } from '@/components/kanban';
import type { CreateProjectData } from '@/components/kanban/CreateProjectModal';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { KanbanProvider, useKanban } from '@/hooks/useKanban';
import type { KanbanItem } from '@/types/kanban';

// ============================================
// INNER CONTENT — must be inside KanbanProvider
// ============================================

function ProjectsKanbanContent() {
  const router = useRouter();
  const { createProject } = useKanban();

  const [showModal, setShowModal] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

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
    // Navigate to the Stages Kanban for this project
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

  const handleContinue = useCallback(() => {
    // No-op at project level — user picks a project card to continue
  }, []);

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
      {/* KanbanProvider starts empty — projects are created via CreateProjectModal */}
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
