/**
 * ============================================
 * SCENE SEGMENTATION HOOK & CONTEXT
 * ============================================
 * 
 * React Context and hook for managing scene segmentation state.
 * Supports two-stage mapping: Scene Mapper and Subject Mapper.
 * 
 * @module hooks/useSceneSegmentation
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
    addManualSubject,
    autoSegment,
    generateId,
    mergeScenes,
    moveWords,
    removeSubject,
    reorderScenes,
    splitAndMove,
    splitScene,
    updateSubjectBounds,
} from '../lib/sceneSegmentation';
import type { DragState, Scene, SceneSegmentationState, SubjectCategory, WordRange } from '../types';

// ============================================
// CONTEXT VALUE TYPE
// ============================================

interface SceneSegmentationContextValue {
  state: SceneSegmentationState;
  setScript: (script: string) => void;
  processScript: () => void;
  splitSceneAt: (sceneId: string, wordIndex: number) => void;
  mergeScenesById: (sceneId1: string, sceneId2: string) => void;
  deleteScene: (sceneId: string) => void;
  insertSceneAfter: (sceneId: string) => void;
  moveWordsToScene: (fromSceneId: string, toSceneId: string, wordIndex: number, direction: 'up' | 'down') => void;
  movePhraseToScene: (fromSceneId: string, toSceneId: string | 'new', startWordIndex: number, endWordIndex: number, insertAfterSceneId?: string) => void;
  splitAndMoveWords: (sourceSceneId: string, wordIndex: number, direction: 'up' | 'down', destination: 'new' | 'neighbor') => void;
  expandSubject: (sceneId: string, subjectId: string, newStart: number, newEnd: number) => void;
  createSubject: (sceneId: string, startWordIndex: number, endWordIndex: number) => void;
  deleteSubject: (sceneId: string, subjectId: string) => void;
  createCategory: (name: string, subjectId?: string) => string;
  assignSubjectToCategory: (subjectId: string, categoryId: string) => void;
  unassignSubject: (subjectId: string) => void;
  renameCategory: (categoryId: string, newName: string) => void;
  deleteCategory: (categoryId: string) => void;
  setPendingHighlight: (range: WordRange | null) => void;
  setEditMode: (mode: 'subject' | 'scene' | null) => void;
  selectSubject: (subjectId: string | null) => void;
  selectWord: (wordId: string | null) => void;
  setDragState: (state: DragState | null) => void;
  insertSceneAtIndex: (index: number) => void;
  reorderSceneById: (sceneId: string, newIndex: number) => void;
  sceneCount: number;
  totalDuration: number;
  totalSubjects: number;
  assignedSubjects: number;
  pendingSubjects: number;
  reset: () => void;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: SceneSegmentationState = {
  originalScript: '',
  scenes: [],
  isProcessing: false,
  editMode: null,
  selectedSubjectId: null,
  selectedWordId: null,
  dragState: null,
  subjectCategories: [],
  pendingHighlight: null,
};

// ============================================
// CONTEXT
// ============================================

const SceneSegmentationContext = createContext<SceneSegmentationContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

export const SceneSegmentationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SceneSegmentationState>(initialState);

  const setScript = useCallback((script: string) => {
    setState(prev => ({ ...prev, originalScript: script }));
  }, []);

  const processScript = useCallback(() => {
    setState(prev => {
      if (!prev.originalScript.trim()) return prev;
      const result = autoSegment(prev.originalScript);
      return { ...prev, scenes: result.scenes, isProcessing: false, editMode: 'scene' as const };
    });
  }, []);

  const splitSceneAt = useCallback((sceneId: string, wordIndex: number) => {
    setState(prev => {
      const sceneIndex = prev.scenes.findIndex(s => s.id === sceneId);
      if (sceneIndex < 0) return prev;
      const scene = prev.scenes[sceneIndex];
      const [first, second] = splitScene(scene, wordIndex);
      const newScenes = [...prev.scenes.slice(0, sceneIndex), first, second, ...prev.scenes.slice(sceneIndex + 1)];
      return { ...prev, scenes: reorderScenes(newScenes) };
    });
  }, []);

  const mergeScenesById = useCallback((sceneId1: string, sceneId2: string) => {
    setState(prev => {
      const index1 = prev.scenes.findIndex(s => s.id === sceneId1);
      const index2 = prev.scenes.findIndex(s => s.id === sceneId2);
      if (index1 < 0 || index2 < 0) return prev;
      const [firstIndex, secondIndex] = index1 < index2 ? [index1, index2] : [index2, index1];
      const [firstScene, secondScene] = index1 < index2 ? [prev.scenes[index1], prev.scenes[index2]] : [prev.scenes[index2], prev.scenes[index1]];
      const merged = mergeScenes(firstScene, secondScene);
      const newScenes = [...prev.scenes.slice(0, firstIndex), merged, ...prev.scenes.slice(firstIndex + 1, secondIndex), ...prev.scenes.slice(secondIndex + 1)];
      return { ...prev, scenes: reorderScenes(newScenes) };
    });
  }, []);

  const deleteScene = useCallback((sceneId: string) => {
    setState(prev => ({ ...prev, scenes: reorderScenes(prev.scenes.filter(s => s.id !== sceneId)) }));
  }, []);

  const insertSceneAfter = useCallback((sceneId: string) => {
    setState(prev => {
      const sceneIndex = prev.scenes.findIndex(s => s.id === sceneId);
      if (sceneIndex < 0) return prev;
      const newScene: Scene = { id: generateId(), order: sceneIndex + 2, words: [], subjects: [], estimatedDuration: 0 };
      const newScenes = [...prev.scenes.slice(0, sceneIndex + 1), newScene, ...prev.scenes.slice(sceneIndex + 1)];
      return { ...prev, scenes: reorderScenes(newScenes) };
    });
  }, []);

  const moveWordsToScene = useCallback((fromSceneId: string, toSceneId: string, wordIndex: number, direction: 'up' | 'down') => {
    setState(prev => {
      const fromIndex = prev.scenes.findIndex(s => s.id === fromSceneId);
      const toIndex = prev.scenes.findIndex(s => s.id === toSceneId);
      if (fromIndex < 0 || toIndex < 0) return prev;
      const [updatedFrom, updatedTo] = moveWords(prev.scenes[fromIndex], prev.scenes[toIndex], wordIndex, direction);
      const newScenes = [...prev.scenes];
      newScenes[fromIndex] = updatedFrom;
      newScenes[toIndex] = updatedTo;
      return { ...prev, scenes: reorderScenes(newScenes.filter(s => s.words.length > 0)) };
    });
  }, []);

  const movePhraseToScene = useCallback((fromSceneId: string, toSceneId: string | 'new', startWordIndex: number, endWordIndex: number, insertAfterSceneId?: string) => {
    setState(prev => {
      const fromIndex = prev.scenes.findIndex(s => s.id === fromSceneId);
      if (fromIndex < 0) return prev;
      const fromScene = prev.scenes[fromIndex];
      const phraseWords = fromScene.words.filter(w => w.index >= startWordIndex && w.index <= endWordIndex);
      const remainingWords = fromScene.words.filter(w => w.index < startWordIndex || w.index > endWordIndex);
      if (phraseWords.length === 0) return prev;

      let newScenes = [...prev.scenes];
      newScenes[fromIndex] = { ...fromScene, words: remainingWords, subjects: fromScene.subjects.filter(s => s.startWordIndex < startWordIndex || s.endWordIndex > endWordIndex), estimatedDuration: remainingWords.length / 2.5 };

      if (toSceneId === 'new') {
        const insertIndex = insertAfterSceneId ? newScenes.findIndex(s => s.id === insertAfterSceneId) + 1 : fromIndex + 1;
        newScenes.splice(insertIndex, 0, { id: generateId(), order: 0, words: phraseWords, subjects: [], estimatedDuration: phraseWords.length / 2.5 });
      } else {
        const toIndex = newScenes.findIndex(s => s.id === toSceneId);
        if (toIndex < 0) return prev;
        const toScene = newScenes[toIndex];
        newScenes[toIndex] = { ...toScene, words: [...toScene.words, ...phraseWords], estimatedDuration: (toScene.words.length + phraseWords.length) / 2.5 };
      }

      return { ...prev, scenes: reorderScenes(newScenes.filter(s => s.words.length > 0)) };
    });
  }, []);

  const splitAndMoveWords = useCallback((sourceSceneId: string, wordIndex: number, direction: 'up' | 'down', destination: 'new' | 'neighbor') => {
    setState(prev => ({
      ...prev,
      scenes: splitAndMove(prev.scenes, sourceSceneId, wordIndex, direction, destination),
    }));
  }, []);

  const expandSubject = useCallback((sceneId: string, subjectId: string, newStart: number, newEnd: number) => {
    setState(prev => {
      const sceneIndex = prev.scenes.findIndex(s => s.id === sceneId);
      if (sceneIndex < 0) return prev;
      const newScenes = [...prev.scenes];
      newScenes[sceneIndex] = updateSubjectBounds(prev.scenes[sceneIndex], subjectId, newStart, newEnd);
      return { ...prev, scenes: newScenes };
    });
  }, []);

  const createSubject = useCallback((sceneId: string, startWordIndex: number, endWordIndex: number) => {
    setState(prev => {
      const sceneIndex = prev.scenes.findIndex(s => s.id === sceneId);
      if (sceneIndex < 0) return prev;
      const newScenes = [...prev.scenes];
      newScenes[sceneIndex] = addManualSubject(prev.scenes[sceneIndex], startWordIndex, endWordIndex);
      return { ...prev, scenes: newScenes, pendingHighlight: null };
    });
  }, []);

  const deleteSubject = useCallback((sceneId: string, subjectId: string) => {
    setState(prev => {
      const sceneIndex = prev.scenes.findIndex(s => s.id === sceneId);
      if (sceneIndex < 0) return prev;
      const newScenes = [...prev.scenes];
      newScenes[sceneIndex] = removeSubject(prev.scenes[sceneIndex], subjectId);
      const updatedCategories = prev.subjectCategories.map(cat => ({ ...cat, subjectIds: cat.subjectIds.filter(id => id !== subjectId) }));
      return { ...prev, scenes: newScenes, subjectCategories: updatedCategories };
    });
  }, []);

  const createCategory = useCallback((name: string, subjectId?: string): string => {
    const categoryId = generateId();
    setState(prev => {
      const newCategory: SubjectCategory = { id: categoryId, name, subjectIds: subjectId ? [subjectId] : [], order: prev.subjectCategories.length + 1 };
      let updatedScenes = prev.scenes;
      if (subjectId) {
        updatedScenes = prev.scenes.map(scene => ({ ...scene, subjects: scene.subjects.map(s => s.id === subjectId ? { ...s, categoryId } : s) }));
      }
      return { ...prev, scenes: updatedScenes, subjectCategories: [...prev.subjectCategories, newCategory], pendingHighlight: null };
    });
    return categoryId;
  }, []);

  const assignSubjectToCategory = useCallback((subjectId: string, categoryId: string) => {
    setState(prev => {
      const updatedCategories = prev.subjectCategories.map(cat => {
        if (cat.id === categoryId) return { ...cat, subjectIds: cat.subjectIds.includes(subjectId) ? cat.subjectIds : [...cat.subjectIds, subjectId] };
        return { ...cat, subjectIds: cat.subjectIds.filter(id => id !== subjectId) };
      });
      const updatedScenes = prev.scenes.map(scene => ({ ...scene, subjects: scene.subjects.map(s => s.id === subjectId ? { ...s, categoryId } : s) }));
      return { ...prev, scenes: updatedScenes, subjectCategories: updatedCategories, pendingHighlight: null };
    });
  }, []);

  const unassignSubject = useCallback((subjectId: string) => {
    setState(prev => {
      const updatedCategories = prev.subjectCategories.map(cat => ({ ...cat, subjectIds: cat.subjectIds.filter(id => id !== subjectId) }));
      const updatedScenes = prev.scenes.map(scene => ({ ...scene, subjects: scene.subjects.map(s => s.id === subjectId ? { ...s, categoryId: null } : s) }));
      return { ...prev, scenes: updatedScenes, subjectCategories: updatedCategories };
    });
  }, []);

  const renameCategory = useCallback((categoryId: string, newName: string) => {
    setState(prev => ({ ...prev, subjectCategories: prev.subjectCategories.map(cat => cat.id === categoryId ? { ...cat, name: newName } : cat) }));
  }, []);

  const deleteCategory = useCallback((categoryId: string) => {
    setState(prev => {
      const category = prev.subjectCategories.find(c => c.id === categoryId);
      const subjectIdsToUnassign = category?.subjectIds || [];
      const updatedScenes = prev.scenes.map(scene => ({ ...scene, subjects: scene.subjects.map(s => subjectIdsToUnassign.includes(s.id) ? { ...s, categoryId: null } : s) }));
      return { ...prev, scenes: updatedScenes, subjectCategories: prev.subjectCategories.filter(c => c.id !== categoryId) };
    });
  }, []);

  const setPendingHighlight = useCallback((range: WordRange | null) => {
    setState(prev => ({ ...prev, pendingHighlight: range }));
  }, []);

  const setEditMode = useCallback((mode: 'subject' | 'scene' | null) => {
    setState(prev => ({ ...prev, editMode: mode, selectedSubjectId: null, selectedWordId: null, pendingHighlight: null }));
  }, []);

  const selectSubject = useCallback((subjectId: string | null) => {
    setState(prev => ({ ...prev, selectedSubjectId: subjectId }));
  }, []);

  const selectWord = useCallback((wordId: string | null) => {
    setState(prev => ({ ...prev, selectedWordId: wordId }));
  }, []);

  const setDragState = useCallback((dragState: DragState | null) => {
    setState(prev => ({ ...prev, dragState }));
  }, []);

  const insertSceneAtIndex = useCallback((index: number) => {
    setState(prev => {
      const newScene: Scene = {
        id: generateId(),
        order: 0,
        words: [],
        subjects: [],
        estimatedDuration: 0,
      };
      const newScenes = [...prev.scenes];
      newScenes.splice(index, 0, newScene);
      return { ...prev, scenes: reorderScenes(newScenes) };
    });
  }, []);

  const reorderSceneById = useCallback((sceneId: string, newIndex: number) => {
    setState(prev => {
      const currentIndex = prev.scenes.findIndex(s => s.id === sceneId);
      if (currentIndex < 0 || currentIndex === newIndex) return prev;
      const clampedIndex = Math.max(0, Math.min(newIndex, prev.scenes.length - 1));
      const newScenes = [...prev.scenes];
      const [removed] = newScenes.splice(currentIndex, 1);
      newScenes.splice(clampedIndex, 0, removed);
      return { ...prev, scenes: reorderScenes(newScenes) };
    });
  }, []);

  const reset = useCallback(() => { setState(initialState); }, []);

  const sceneCount = useMemo(() => state.scenes.length, [state.scenes]);
  const totalDuration = useMemo(() => state.scenes.reduce((sum, scene) => sum + (scene.estimatedDuration || 0), 0), [state.scenes]);
  const totalSubjects = useMemo(() => state.scenes.reduce((sum, scene) => sum + scene.subjects.length, 0), [state.scenes]);
  const assignedSubjects = useMemo(() => state.scenes.reduce((sum, scene) => sum + scene.subjects.filter(s => s.categoryId).length, 0), [state.scenes]);
  const pendingSubjects = useMemo(() => totalSubjects - assignedSubjects, [totalSubjects, assignedSubjects]);

  const value = useMemo<SceneSegmentationContextValue>(() => ({
    state, setScript, processScript, splitSceneAt, mergeScenesById, deleteScene, insertSceneAfter,
    moveWordsToScene, movePhraseToScene, splitAndMoveWords, expandSubject, createSubject, deleteSubject,
    createCategory, assignSubjectToCategory, unassignSubject, renameCategory, deleteCategory,
    setPendingHighlight, setEditMode, selectSubject, selectWord, setDragState,
    insertSceneAtIndex, reorderSceneById,
    sceneCount, totalDuration, totalSubjects, assignedSubjects, pendingSubjects, reset,
  }), [
    state, setScript, processScript, splitSceneAt, mergeScenesById, deleteScene, insertSceneAfter,
    moveWordsToScene, movePhraseToScene, splitAndMoveWords, expandSubject, createSubject, deleteSubject,
    createCategory, assignSubjectToCategory, unassignSubject, renameCategory, deleteCategory,
    setPendingHighlight, setEditMode, selectSubject, selectWord, setDragState,
    insertSceneAtIndex, reorderSceneById,
    sceneCount, totalDuration, totalSubjects, assignedSubjects, pendingSubjects, reset,
  ]);

  return (
    <SceneSegmentationContext.Provider value={value}>
      {children}
    </SceneSegmentationContext.Provider>
  );
};

export function useSceneSegmentation(): SceneSegmentationContextValue {
  const context = useContext(SceneSegmentationContext);
  if (!context) {
    throw new Error('useSceneSegmentation must be used within a SceneSegmentationProvider');
  }
  return context;
}
