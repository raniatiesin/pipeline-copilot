/**
 * ============================================
 * STYLE SELECTOR HOOK & CONTEXT
 * ============================================
 *
 * Context provider and hook for the gallery-based style
 * selection screen. Manages:
 *   - Active filter chips (one per question, AND-intersection)
 *   - Filtered collage ID list (recomputed on filter change)
 *   - Selected collage + its deterministic tag tally
 *   - Loading and persisting to the PowerSync DB
 *
 * Cross-route: markInReview is called via stageCallbacks bridge
 * (stages.tsx registers the real KanbanProvider callback on mount)
 * because style-matcher lives outside the Stages KanbanProvider tree.
 *
 * @module hooks/useStyleSelector
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

import { updateProject, watchProject } from '@/lib/database';
import { stageCallbacks } from '@/lib/stageCallbacks';
import {
  buildSelection,
  filterCollages,
  parseStyleSelection,
} from '@/lib/styleSelector';
import type {
  FilterState,
  StyleSelection,
  StyleSelectorContextValue,
} from '@/types/style-selector';

// ============================================
// CONTEXT
// ============================================

const StyleSelectorContext = createContext<StyleSelectorContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface StyleSelectorProviderProps {
  children: React.ReactNode;
  /** Pipeline row ID — required to read/write style_selection */
  projectId: string;
}

export function StyleSelectorProvider({
  children,
  projectId,
}: StyleSelectorProviderProps) {
  const [filters, setFilters] = useState<FilterState>({});
  const [selectedCollage, setSelectedCollage] = useState<StyleSelection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<'gallery' | 'filters'>('gallery');

  // Ref so confirmSelection always sees the latest selection without
  // needing to be recreated on every selection change
  const selectedRef = useRef<StyleSelection | null>(null);
  selectedRef.current = selectedCollage;

  // ── Load existing selection from DB on mount ────────────────────
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
          const saved = parseStyleSelection(row.style_selection);
          if (saved) {
            setSelectedCollage(saved);
          }
        }
        // Only the first emission is needed to restore persisted state
        setIsLoading(false);
        break;
      }
    };

    run().catch(() => setIsLoading(false));

    return () => {
      aborted = true;
    };
  }, [projectId]);

  // ── Filtered collage IDs ────────────────────────────────────────
  const filteredIds = useMemo(() => filterCollages(filters), [filters]);

  // ── Actions ────────────────────────────────────────────────────

  const toggleFilter = useCallback((questionId: string, optionLabel: string) => {
    setFilters(prev => ({
      ...prev,
      [questionId]: prev[questionId] === optionLabel ? '' : optionLabel,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const selectCollage = useCallback((id: number) => {
    setSelectedCollage(prev =>
      prev?.collageId === id ? null : buildSelection(id),
    );
  }, []);

  /**
   * Persist selection to DB and mark this card In Review.
   * Returns false if nothing is selected.
   */
  const confirmSelection = useCallback(async (): Promise<boolean> => {
    const sel = selectedRef.current;
    if (!sel || !projectId) return false;

    await updateProject(projectId, {
      style_selection: JSON.stringify(sel),
    });

    stageCallbacks.markInReview('style-selector');
    return true;
  }, [projectId]);

  // ── Context value ───────────────────────────────────────────────
  const value = useMemo<StyleSelectorContextValue>(
    () => ({
      filters,
      filteredIds,
      selectedCollage,
      toggleFilter,
      clearFilters,
      selectCollage,
      confirmSelection,
      isLoading,
      mode,
      setMode,
    }),
    [
      filters,
      filteredIds,
      selectedCollage,
      toggleFilter,
      clearFilters,
      selectCollage,
      confirmSelection,
      isLoading,
      mode,
    ],
  );

  return (
    <StyleSelectorContext.Provider value={value}>
      {children}
    </StyleSelectorContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useStyleSelector(): StyleSelectorContextValue {
  const context = useContext(StyleSelectorContext);
  if (!context) {
    throw new Error('useStyleSelector must be used within a StyleSelectorProvider');
  }
  return context;
}
