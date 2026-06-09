/**
 * ============================================
 * KANBAN STATE MANAGEMENT HOOK
 * ============================================
 *
 * Context provider and hook for Kanban board state.
 * Stage card columns are derived from progress + unlock chain.
 *
 * @module hooks/useKanban
 */

import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import type { CardStatuses, PipelineRow, StageCardStatus } from '@/lib/database';
import {
    DEFAULT_STAGE_STATUS,
    createProject as dbCreateProject,
    deleteProject as dbDeleteProject,
    updateProject as dbUpdateProject,
    deriveStageStatus,
    getProject,
    getProjects,
    parseCardStatuses,
    rowToProjectItem,
    rowToStageItems,
    watchProject,
    watchProjects,
} from '@/lib/database';
import type {
    CreateProjectData,
    KanbanContextValue,
    KanbanItem,
    KanbanStatus,
} from '@/types/kanban';
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

// ============================================
// HELPERS
// ============================================

function mIdx(moduleId: string | undefined): number {
  if (!moduleId) return -1;
  const MODULE_ORDER = ['style-selector', 'beat-butcher', 'entity-editor', 'arc-assembler'] as const;
  return MODULE_ORDER.indexOf(moduleId as typeof MODULE_ORDER[number]);
}

function cardStatus(
  statuses: CardStatuses,
  moduleId: string,
): StageCardStatus {
  return { ...DEFAULT_STAGE_STATUS, ...(statuses[moduleId] ?? {}) };
}

function buildStageItemsFromRows(
  rows: PipelineRow[],
  projectId: string | undefined,
): Record<string, KanbanItem> {
  const newItems: Record<string, KanbanItem> = {};

  if (projectId) {
    if (rows.length > 0) {
      rowToStageItems(rows[0]).forEach(item => { newItems[item.id] = item; });
    }
  } else {
    rows.forEach(row => {
      const item = rowToProjectItem(row);
      newItems[item.id] = item;
    });
  }

  return newItems;
}

function derivedStatus(
  statuses: CardStatuses,
  moduleId: string,
): KanbanStatus {
  return deriveStageStatus(moduleId, cardStatus(statuses, moduleId), statuses);
}

// ============================================
// CONTEXT
// ============================================

const KanbanContext = createContext<KanbanContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface KanbanProviderProps {
  children: React.ReactNode;
  initialItems?: KanbanItem[];
  projectId?: string;
}

export function KanbanProvider({
  children,
  initialItems = [],
  projectId,
}: KanbanProviderProps) {
  const rawRowsRef = useRef<PipelineRow[]>([]);

  const [items, setItems] = useState<Record<string, KanbanItem>>(() => {
    const map: Record<string, KanbanItem> = {};
    initialItems.forEach(item => { map[item.id] = item; });
    return map;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activePageIndex, setActivePageIndexState] = useState(0);

  useEffect(() => {
    let aborted = false;

    const run = async () => {
      if (!projectId) {
        try {
          const initialRows = await getProjects();
          if (!aborted) {
            rawRowsRef.current = initialRows;
            setItems(buildStageItemsFromRows(initialRows, undefined));
            setIsLoading(false);
          }
        } catch (err) {
          if (!aborted) {
            console.error('[useKanban] getProjects error:', err);
            setIsLoading(false);
          }
          return;
        }
      } else {
        // Seed from a one-shot read so the first paint matches DB state
        // before watchProject's initial (sometimes empty) emission.
        try {
          const row = await getProject(projectId);
          if (!aborted && row) {
            rawRowsRef.current = [row];
            setItems(buildStageItemsFromRows([row], projectId));
            setIsLoading(false);
          }
        } catch (err) {
          if (!aborted) {
            console.error('[useKanban] getProject error:', err);
          }
        }
      }

      const query = projectId ? watchProject(projectId) : watchProjects();

      for await (const rows of query) {
        if (aborted) break;

        if (!Array.isArray(rows)) continue;

        // PowerSync may emit an empty array before the row is visible — never
        // wipe seeded / initialItems state on that transient emission.
        if (projectId && rows.length === 0) continue;

        rawRowsRef.current = rows;

        const newItems = buildStageItemsFromRows(rows, projectId);
        if (Object.keys(newItems).length > 0) {
          setItems(newItems);
        }
        setIsLoading(false);
      }
    };

    run().catch(err => {
      if (!aborted) {
        console.error('[useKanban] watch error:', err);
        setIsLoading(false);
      }
    });

    return () => { aborted = true; };
  }, [projectId]);

  // ── Computed selectors ─────────────────────────────────────────────────────

  const getItemsByStatus = useCallback(
    (status: KanbanStatus): KanbanItem[] =>
      Object.values(items)
        .filter(item => item.status === status)
        .sort((a, b) => {
          const ai = mIdx(a.moduleId) >= 0 ? mIdx(a.moduleId) : 999;
          const bi = mIdx(b.moduleId) >= 0 ? mIdx(b.moduleId) : 999;
          if (ai !== bi) return ai - bi;
          return a.order - b.order;
        }),
    [items],
  );

  const getCountByStatus = useCallback(
    (status: KanbanStatus): number =>
      Object.values(items).filter(item => item.status === status).length,
    [items],
  );

  const getModuleStatus = useCallback(
    (moduleId: string): KanbanStatus | null => {
      const item = items[moduleId];
      return item?.status ?? null;
    },
    [items],
  );

  // ── Data access ────────────────────────────────────────────────────────────

  const getProjectRow = useCallback((id: string): PipelineRow | null => {
    return rawRowsRef.current.find(r => r.id === id) ?? null;
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createProject = useCallback(async (data: CreateProjectData): Promise<string> => {
    return dbCreateProject(data);
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await dbDeleteProject(id);
  }, []);

  const updateProgress = useCallback(async (id: string, progress: number) => {
    if (!projectId) return;
    const rows = rawRowsRef.current;
    if (rows.length === 0) return;

    const statuses = parseCardStatuses(rows[0].card_statuses);
    const clamped = Math.max(0, Math.min(100, progress));
    const current = cardStatus(statuses, id);
    const wasInReview = derivedStatus(statuses, id) === KANBAN_STATUS.IN_REVIEW;
    const isDropping = clamped < 100;
    const srcIdx = mIdx(id);

    const next: CardStatuses = { ...statuses };
    next[id] = { ...current, progress: clamped };

    if (wasInReview && isDropping && srcIdx >= 0) {
      (['style-selector', 'beat-butcher', 'entity-editor', 'arc-assembler'] as const).forEach((m, i) => {
        if (i > srcIdx) {
          const downstream = cardStatus(next, m);
          const downstreamStatus = deriveStageStatus(m, downstream, next);
          if (downstreamStatus !== KANBAN_STATUS.TODO && downstreamStatus !== KANBAN_STATUS.UP_NEXT) {
            next[m] = { ...downstream, isOutdated: true };
          }
        }
      });
    }

    await dbUpdateProject(projectId, { card_statuses: JSON.stringify(next) });
  }, [projectId]);

  const approveItem = useCallback(async (id: string) => {
    if (!projectId) return;
    const rows = rawRowsRef.current;
    if (rows.length === 0) return;

    const statuses = parseCardStatuses(rows[0].card_statuses);
    const current = cardStatus(statuses, id);
    const next: CardStatuses = {
      ...statuses,
      [id]: {
        ...current,
        isApproved: true,
      },
    };
    await dbUpdateProject(projectId, { card_statuses: JSON.stringify(next) });
  }, [projectId]);

  const updateNote = useCallback(async (id: string, note: string) => {
    if (!projectId) return;
    const rows = rawRowsRef.current;
    if (rows.length === 0) return;

    const statuses = parseCardStatuses(rows[0].card_statuses);
    const next: CardStatuses = {
      ...statuses,
      [id]: { ...cardStatus(statuses, id), quickNote: note },
    };
    await dbUpdateProject(projectId, { card_statuses: JSON.stringify(next) });
  }, [projectId]);

  const setPageIndex = useCallback((index: number) => {
    setActivePageIndexState(index);
  }, []);

  const markInReview = useCallback(async (moduleId: string) => {
    if (!projectId) return;
    const rows = rawRowsRef.current;
    if (rows.length === 0) return;

    const statuses = parseCardStatuses(rows[0].card_statuses);
    const next: CardStatuses = { ...statuses };

    next[moduleId] = {
      ...cardStatus(statuses, moduleId),
      progress: 100,
      isOutdated: false,
    };

    const srcIdx = mIdx(moduleId);
    if (srcIdx >= 0) {
      (['style-selector', 'beat-butcher', 'entity-editor', 'arc-assembler'] as const).forEach((m, i) => {
        if (i > srcIdx && next[m]) {
          next[m] = { ...cardStatus(next, m), isOutdated: false };
        }
      });
    }

    await dbUpdateProject(projectId, { card_statuses: JSON.stringify(next) });
  }, [projectId]);

  const markInProgress = useCallback(async (moduleId: string) => {
    if (!projectId) return;
    const rows = rawRowsRef.current;
    if (rows.length === 0) return;

    const statuses = parseCardStatuses(rows[0].card_statuses);
    const current = cardStatus(statuses, moduleId);

    if (derivedStatus(statuses, moduleId) !== KANBAN_STATUS.UP_NEXT) return;

    const next: CardStatuses = {
      ...statuses,
      [moduleId]: {
        ...current,
        progress: 1,
      },
    };

    await dbUpdateProject(projectId, { card_statuses: JSON.stringify(next) });
  }, [projectId]);

  const markDone = useCallback(async (moduleId: string) => {
    if (!projectId) return;
    const rows = rawRowsRef.current;
    if (rows.length === 0) return;

    const statuses = parseCardStatuses(rows[0].card_statuses);
    const next: CardStatuses = {
      ...statuses,
      [moduleId]: {
        ...cardStatus(statuses, moduleId),
        progress: 100,
        isApproved: true,
        isOutdated: false,
      },
    };

    await dbUpdateProject(projectId, { card_statuses: JSON.stringify(next) });
  }, [projectId]);

  const flagOutdated = useCallback(async (moduleId: string) => {
    if (!projectId) return;
    const rows = rawRowsRef.current;
    if (rows.length === 0) return;

    const statuses = parseCardStatuses(rows[0].card_statuses);
    const srcIdx = mIdx(moduleId);
    if (srcIdx < 0) return;

    const next: CardStatuses = { ...statuses };
    (['style-selector', 'beat-butcher', 'entity-editor', 'arc-assembler'] as const).forEach((m, i) => {
      if (i > srcIdx) {
        const downstream = cardStatus(next, m);
        const downstreamStatus = deriveStageStatus(m, downstream, next);
        if (downstreamStatus !== KANBAN_STATUS.TODO && downstreamStatus !== KANBAN_STATUS.UP_NEXT) {
          next[m] = { ...downstream, isOutdated: true };
        }
      }
    });

    await dbUpdateProject(projectId, { card_statuses: JSON.stringify(next) });
  }, [projectId]);

  const clearOutdated = useCallback(async (moduleId: string) => {
    if (!projectId) return;
    const rows = rawRowsRef.current;
    if (rows.length === 0) return;

    const statuses = parseCardStatuses(rows[0].card_statuses);
    const srcIdx = mIdx(moduleId);
    if (srcIdx < 0) return;

    const next: CardStatuses = { ...statuses };
    (['style-selector', 'beat-butcher', 'entity-editor', 'arc-assembler'] as const).forEach((m, i) => {
      if (i > srcIdx && cardStatus(next, m).isOutdated) {
        next[m] = { ...cardStatus(next, m), isOutdated: false };
      }
    });

    await dbUpdateProject(projectId, { card_statuses: JSON.stringify(next) });
  }, [projectId]);

  // ── Context value ──────────────────────────────────────────────────────────

  const value: KanbanContextValue = useMemo(
    () => ({
      state: {
        items,
        activePageIndex,
        isLoading,
      },
      dispatch: () => {},
      getItemsByStatus,
      getCountByStatus,
      getModuleStatus,
      updateProgress,
      approveItem,
      updateNote,
      setPageIndex,
      createProject,
      deleteProject,
      markInReview,
      markInProgress,
      markDone,
      flagOutdated,
      clearOutdated,
      getProjectRow,
    }),
    [
      items,
      activePageIndex,
      isLoading,
      getItemsByStatus,
      getCountByStatus,
      getModuleStatus,
      updateProgress,
      approveItem,
      updateNote,
      setPageIndex,
      createProject,
      deleteProject,
      markInReview,
      markInProgress,
      markDone,
      flagOutdated,
      clearOutdated,
      getProjectRow,
    ],
  );

  return (
    <KanbanContext.Provider value={value}>
      {children}
    </KanbanContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useKanban(): KanbanContextValue {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
}
