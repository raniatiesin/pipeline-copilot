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
 * @module app/project
 */

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
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
  const { createProject, state } = useKanban();
  const [showModal, setShowModal] = useState(false);

  const projectNumbers = useMemo(() => {
    const projects = Object.values(state.items);
    const map: Record<string, number> = {};
    [...projects]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .forEach((p, i) => {
        map[p.id] = i + 1;
      });
    return map;
  }, [state.items]);

  const handleAddProject = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleCreateProject = useCallback(async (data: CreateProjectData) => {
    const id = await createProject(data);
    setShowModal(false);
    const projectNumber = Object.values(state.items).length + 1;

    router.push({
      pathname: '/stages' as any,
      params: {
        projectId: id,
        projectNumber: String(projectNumber || 1),
        title: data.prospectName,
        subtitle: data.postName,
        script: data.script,
      },
    });
  }, [createProject, router, state.items]);

  const handleItemPress = useCallback((item: KanbanItem) => {
    router.push({
      pathname: '/stages' as any,
      params: {
        projectId: item.id,
        projectNumber: String(projectNumbers[item.id] ?? 1),
        title: item.title,
        subtitle: item.description ?? '',
        script: item.script ?? '',
      },
    });
  }, [router, projectNumbers]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <KanbanBoard
        onItemPress={handleItemPress}
        onAddProject={handleAddProject}
        projectNumbers={projectNumbers}
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
