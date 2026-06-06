/**
 * ============================================
 * ENTITY EDITOR HOOK
 * ============================================
 *
 * Local UI state for the Entity Editor screen:
 * word-tap selection flow, naming modal state,
 * category rename editing, and fuzzy suggestions.
 *
 * @module hooks/useEntityEditor
 */

import { useCallback, useState } from 'react';

import { useSceneSegmentation } from './useSceneSegmentation';
import type { SubjectCategory } from '../types/scene-segmentation';

// ============================================
// SUBJECT COLOR PALETTE
// ============================================

export const SUBJECT_COLORS = [
  '#e8824f', // burntSienna — warm coral
  '#69c2ef', // skyBlue — cool accent
  '#9b8ec4', // lavender — soft purple
  '#6baa8e', // sage — muted green
  '#e8c14f', // warm gold
  '#c47a8e', // dusty rose
  '#8ec4b0', // seafoam
  '#b08ec4', // violet
];

export function getSubjectColor(order: number): string {
  return SUBJECT_COLORS[(order - 1) % SUBJECT_COLORS.length];
}

// ============================================
// TYPES
// ============================================

export interface SelectionStart {
  sceneId: string;
  wordIdx: number;
  wordText: string;
}

export interface NamingState {
  sceneId: string;
  startWordIdx: number;
  endWordIdx: number;
  suggestedName: string;
}

export interface EntityEditorHook {
  selectionStart: SelectionStart | null;
  namingState: NamingState | null;
  editingCategoryId: string | null;
  editingName: string;
  handleWordTap: (sceneId: string, wordIdx: number, wordText: string) => void;
  confirmSubject: (name: string, existingCategoryId?: string) => void;
  cancelSelection: () => void;
  handleDeleteCategory: (categoryId: string) => void;
  handleDeleteSubjectFromScene: (sceneId: string, subjectId: string) => void;
  startEditCategory: (categoryId: string, currentName: string) => void;
  setEditingName: (name: string) => void;
  confirmEditCategory: () => void;
  cancelEditCategory: () => void;
  getSuggestions: (name: string) => SubjectCategory[];
}

// ============================================
// HOOK
// ============================================

export function useEntityEditor(): EntityEditorHook {
  const {
    state,
    createSubjectWithCategory,
    createSubjectInCategory,
    deleteSubject,
    deleteCategory,
    renameCategory,
  } = useSceneSegmentation();

  const [selectionStart, setSelectionStart] = useState<SelectionStart | null>(null);
  const [namingState, setNamingState] = useState<NamingState | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // ----------------------------------------
  // Fuzzy suggestions
  // ----------------------------------------

  const getSuggestions = useCallback((name: string): SubjectCategory[] => {
    const lower = name.trim().toLowerCase();
    if (!lower || lower.length < 2) return [];
    return state.subjectCategories.filter(c => {
      const catLower = c.name.toLowerCase();
      return catLower.includes(lower) || lower.includes(catLower);
    });
  }, [state.subjectCategories]);

  // ----------------------------------------
  // Word tap interaction
  // ----------------------------------------

  const handleWordTap = useCallback((sceneId: string, wordIdx: number, _wordText: string) => {
    if (namingState) return;

    if (!selectionStart) {
      // First tap — anchor selection
      setSelectionStart({ sceneId, wordIdx, wordText: _wordText });
      return;
    }

    // Tap same word → cancel
    if (selectionStart.sceneId === sceneId && selectionStart.wordIdx === wordIdx) {
      setSelectionStart(null);
      return;
    }

    // Different scene → restart from new word
    if (selectionStart.sceneId !== sceneId) {
      setSelectionStart({ sceneId, wordIdx, wordText: _wordText });
      return;
    }

    // Same scene, second word → build range + open naming
    const startIdx = Math.min(selectionStart.wordIdx, wordIdx);
    const endIdx = Math.max(selectionStart.wordIdx, wordIdx);

    const scene = state.scenes.find(s => s.id === sceneId);
    const rangeWords = scene?.words.filter(w => w.index >= startIdx && w.index <= endIdx) ?? [];
    const suggestedName = rangeWords.map(w => w.text).join(' ').trim();

    setSelectionStart(null);
    setNamingState({ sceneId, startWordIdx: startIdx, endWordIdx: endIdx, suggestedName });
  }, [selectionStart, namingState, state.scenes]);

  // ----------------------------------------
  // Subject confirmation
  // ----------------------------------------

  const confirmSubject = useCallback((name: string, existingCategoryId?: string) => {
    if (!namingState) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    if (existingCategoryId) {
      createSubjectInCategory(
        namingState.sceneId,
        namingState.startWordIdx,
        namingState.endWordIdx,
        existingCategoryId,
      );
    } else {
      createSubjectWithCategory(
        namingState.sceneId,
        namingState.startWordIdx,
        namingState.endWordIdx,
        trimmed,
      );
    }

    setNamingState(null);
  }, [namingState, createSubjectWithCategory, createSubjectInCategory]);

  const cancelSelection = useCallback(() => {
    setSelectionStart(null);
    setNamingState(null);
  }, []);

  // ----------------------------------------
  // Category management
  // ----------------------------------------

  const handleDeleteCategory = useCallback((categoryId: string) => {
    deleteCategory(categoryId);
  }, [deleteCategory]);

  const handleDeleteSubjectFromScene = useCallback((sceneId: string, subjectId: string) => {
    deleteSubject(sceneId, subjectId);
  }, [deleteSubject]);

  const startEditCategory = useCallback((categoryId: string, currentName: string) => {
    setEditingCategoryId(categoryId);
    setEditingName(currentName);
  }, []);

  const confirmEditCategory = useCallback(() => {
    if (editingCategoryId && editingName.trim()) {
      renameCategory(editingCategoryId, editingName.trim());
    }
    setEditingCategoryId(null);
    setEditingName('');
  }, [editingCategoryId, editingName, renameCategory]);

  const cancelEditCategory = useCallback(() => {
    setEditingCategoryId(null);
    setEditingName('');
  }, []);

  return {
    selectionStart,
    namingState,
    editingCategoryId,
    editingName,
    handleWordTap,
    confirmSubject,
    cancelSelection,
    handleDeleteCategory,
    handleDeleteSubjectFromScene,
    startEditCategory,
    setEditingName,
    confirmEditCategory,
    cancelEditCategory,
    getSuggestions,
  };
}
