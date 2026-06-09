/**
 * ============================================
 * ARC ASSEMBLER HOOK & CONTEXT
 * ============================================
 *
 * Context provider and hook for the Arc Assembler screen.
 * Reads all upstream data from the local SQLite DB on mount:
 *   - beat_butcher_output  → Scene[]
 *   - entity_editor_output → SubjectCategory[]
 *   - style_selection      → StyleSelection (for tag tally placeholder)
 *   - arc_assembler_output → restores any previously written briefs
 *
 * Manages local state for:
 *   - Active mode (scene / subject)
 *   - Current scene + subject indices
 *   - sceneBriefs and subjectBriefs (shared source of truth)
 *
 * Writes arc_assembler_output back to the DB via a debounced
 * 800ms save triggered on every brief edit.
 *
 * The confirmAndSave action flushes immediately; markInReview is
 * called from app/arc-assembler/index.tsx on Continue.
 *
 * @module hooks/useArcAssembler
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { updateCardProgress, updateProject, watchProject } from '@/lib/database';
import {
  buildTagsPlaceholder,
  parseArcOutput,
  parseScenes,
  parseSubjectCategories,
} from '@/lib/arcAssembler';
import { parseStyleSelection } from '@/lib/styleSelector';
import type { ArcAssemblerContextValue, ArcAssemblerMode, ArcAssemblerOutput } from '@/types/arc-assembler';
import type { Scene, SubjectCategory } from '@/types/scene-segmentation';
import type { StyleSelection } from '@/types/style-selector';

// ============================================
// CONTEXT
// ============================================

const ArcAssemblerContext = createContext<ArcAssemblerContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface ArcAssemblerProviderProps {
  children: React.ReactNode;
  /** Pipeline row ID — required to read/write all pipeline columns. */
  projectId: string;
}

export function ArcAssemblerProvider({ children, projectId }: ArcAssemblerProviderProps) {
  // ── Upstream data (populated from DB on mount) ────────────────────
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [subjectCategories, setSubjectCategories] = useState<SubjectCategory[]>([]);
  const [styleSelection, setStyleSelection] = useState<StyleSelection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Brief state (shared source of truth for both modes) ───────────
  const [sceneBriefs, setSceneBriefs] = useState<Record<string, string>>({});
  const [subjectBriefs, setSubjectBriefs] = useState<Record<string, string>>({});

  // Refs so debounce callback always reads latest without recreation
  const sceneBriefsRef = useRef<Record<string, string>>({});
  const subjectBriefsRef = useRef<Record<string, string>>({});
  sceneBriefsRef.current = sceneBriefs;
  subjectBriefsRef.current = subjectBriefs;

  // ── Navigation state ──────────────────────────────────────────────
  const [mode, setModeState] = useState<ArcAssemblerMode>('scene');
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [currentSubjectIdx, setCurrentSubjectIdx] = useState(0);

  // ── Debounce timer ────────────────────────────────────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load upstream data from DB on mount (single read, no live watch) ──
  useEffect(() => {
    if (!projectId) {
      setIsLoading(false);
      return;
    }

    let aborted = false;

    const run = async () => {
      for await (const rows of watchProject(projectId)) {
        if (aborted) break;
        const row = rows[0];
        if (row) {
          const parsedScenes = parseScenes(row.beat_butcher_output);
          const parsedCategories = parseSubjectCategories(row.entity_editor_output);
          const parsedStyle = parseStyleSelection(row.style_selection);
          const parsedArc = parseArcOutput(row.arc_assembler_output);

          setScenes(parsedScenes);
          setSubjectCategories(parsedCategories);
          setStyleSelection(parsedStyle);

          // Restore saved briefs — only if not already set (first load only)
          setSceneBriefs(prev =>
            Object.keys(prev).length === 0 ? parsedArc.sceneBriefs : prev,
          );
          setSubjectBriefs(prev =>
            Object.keys(prev).length === 0 ? parsedArc.subjectBriefs : prev,
          );
        }
        setIsLoading(false);
        // Single-shot — break after first emission
        break;
      }
    };

    run().catch(() => setIsLoading(false));

    return () => {
      aborted = true;
      // Flush any pending debounced save on unmount
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [projectId]);

  // ── Derived values ────────────────────────────────────────────────

  const tagsPlaceholder = useMemo(
    () => buildTagsPlaceholder(styleSelection?.tags),
    [styleSelection],
  );

  // ── Debounced save ────────────────────────────────────────────────

  const scheduleSave = useCallback(() => {
    if (!projectId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const output: ArcAssemblerOutput = {
        sceneBriefs: sceneBriefsRef.current,
        subjectBriefs: subjectBriefsRef.current,
      };
      updateProject(projectId, {
        arc_assembler_output: JSON.stringify(output),
      }).catch(err => console.error('[ArcAssembler] debounced save failed:', err));
    }, 800);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const hasBrief =
      Object.values(sceneBriefs).some(t => t.trim().length > 0) ||
      Object.values(subjectBriefs).some(t => t.trim().length > 0);
    if (hasBrief) {
      updateCardProgress(projectId, 'arc-assembler', 50).catch(err =>
        console.error('[ArcAssembler] progress update failed:', err),
      );
    }
  }, [projectId, sceneBriefs, subjectBriefs]);

  // ── Actions ───────────────────────────────────────────────────────

  const setMode = useCallback((newMode: ArcAssemblerMode) => {
    setModeState(newMode);
  }, []);

  const navigateScene = useCallback((dir: 'prev' | 'next') => {
    setCurrentSceneIdx(prev => {
      if (dir === 'prev') return Math.max(0, prev - 1);
      return Math.min(scenes.length - 1, prev + 1);
    });
  }, [scenes.length]);

  const navigateSubject = useCallback((dir: 'prev' | 'next') => {
    setCurrentSubjectIdx(prev => {
      if (dir === 'prev') return Math.max(0, prev - 1);
      return Math.min(subjectCategories.length - 1, prev + 1);
    });
  }, [subjectCategories.length]);

  const navigateToSubject = useCallback((categoryId: string) => {
    const idx = subjectCategories.findIndex(c => c.id === categoryId);
    if (idx >= 0) setCurrentSubjectIdx(idx);
    setModeState('subject');
  }, [subjectCategories]);

  const setSceneBrief = useCallback((sceneId: string, text: string) => {
    setSceneBriefs(prev => ({ ...prev, [sceneId]: text }));
    scheduleSave();
  }, [scheduleSave]);

  const setSubjectBrief = useCallback((categoryId: string, text: string) => {
    setSubjectBriefs(prev => ({ ...prev, [categoryId]: text }));
    scheduleSave();
  }, [scheduleSave]);

  const confirmAndSave = useCallback(async () => {
    if (!projectId) return;
    // Clear pending debounce and flush immediately
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const output: ArcAssemblerOutput = {
      sceneBriefs: sceneBriefsRef.current,
      subjectBriefs: subjectBriefsRef.current,
    };
    await updateProject(projectId, {
      arc_assembler_output: JSON.stringify(output),
    });
  }, [projectId]);

  // ── Context value ─────────────────────────────────────────────────

  const value = useMemo<ArcAssemblerContextValue>(
    () => ({
      scenes,
      subjectCategories,
      styleSelection,
      tagsPlaceholder,
      mode,
      setMode,
      currentSceneIdx,
      navigateScene,
      currentSubjectIdx,
      navigateSubject,
      navigateToSubject,
      sceneBriefs,
      subjectBriefs,
      setSceneBrief,
      setSubjectBrief,
      confirmAndSave,
      isLoading,
    }),
    [
      scenes,
      subjectCategories,
      styleSelection,
      tagsPlaceholder,
      mode,
      setMode,
      currentSceneIdx,
      navigateScene,
      currentSubjectIdx,
      navigateSubject,
      navigateToSubject,
      sceneBriefs,
      subjectBriefs,
      setSceneBrief,
      setSubjectBrief,
      confirmAndSave,
      isLoading,
    ],
  );

  return (
    <ArcAssemblerContext.Provider value={value}>
      {children}
    </ArcAssemblerContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useArcAssembler(): ArcAssemblerContextValue {
  const context = useContext(ArcAssemblerContext);
  if (!context) {
    throw new Error('useArcAssembler must be used within an ArcAssemblerProvider');
  }
  return context;
}
