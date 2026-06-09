/**
 * ============================================
 * KANBAN STATE MANAGEMENT HOOK
 * ============================================
 *
 * Context provider and hook for Kanban board state.
 * Stage card columns are driven by explicit `status` in card_statuses JSON.
 *
 * @module hooks/useKanban
 */

import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import type { CardStatuses, PipelineRow, StageCardStatus } from '@/lib/database';
import {
    createProject as dbCreateProject,
    deleteProject as dbDeleteProject,
    updateProject as dbUpdateProject,
    getProjects,
    kanbanToStoredStatus,
    resolveKanbanStatus,
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

const DEFAULT_CARD_STATUS: StageCardStatus = {
  status: 'TODO',
  progress: 0,
  isApproved: false,
  isOutdated: false,
  quickNote: '',
};

function parseCardStatuses(json: string | null | undefined): CardStatuses {
  if (!json) return {};
  try { return JSON.parse(json) as CardStatuses; } catch { return {}; }
}

function cardStatus(
  statuses: CardStatuses,
  moduleId: string,
): StageCardStatus {
  return { ...DEFAULT_CARD_STATUS, ...(statuses[moduleId] ?? {}) };
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
            const newItems: Record<string, KanbanItem> = {};
            initialRows.forEach(row => {
              const item = rowToProjectItem(row);
              newItems[item.id] = item;
            });
            setItems(newItems);
            setIsLoading(false);
          }
        } catch (err) {
          if (!aborted) {
            console.error('[useKanban] getProjects error:', err);
            setIsLoading(false);
          }
          return;
        }
      }

      const query = projectId ? watchProject(projectId) : watchProjects();

      for await (const rows of query) {
        if (aborted) break;

        if (!Array.isArray(rows)) continue;

        rawRowsRef.current = rows;

        const newItems: Record<string, KanbanItem> = {};

        if (projectId) {
          if (rows.length > 0) {
            rowToStageItems(rows[0]).forEach(item => { newItems[item.id] = item; });
          }
        } else {
          if (rows.length > 0) {
            rows.forEach(row => {
              const item = rowToProjectItem(row);
              newItems[item.id] = item;
            });
          }
        }

        setItems(newItems);
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

  const createProject = useCallback(async (data: CreateProjectData) => {
    await dbCreateProject(data);
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
    const wasInReview = resolveKanbanStatus(current) === KANBAN_STATUS.IN_REVIEW;
    const isDropping = clamped < 100;
    const srcIdx = mIdx(id);

    const next: CardStatuses = { ...statuses };
    next[id] = { ...current, progress: clamped };

    if (wasInReview && isDropping && srcIdx >= 0) {
      (['style-selector', 'beat-butcher', 'entity-editor', 'arc-assembler'] as const).forEach((m, i) => {
        if (i > srcIdx) {
          const downstream = cardStatus(next, m);
          const downstreamStatus = resolveKanbanStatus(downstream);
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
        status: kanbanToStoredStatus(KANBAN_STATUS.DONE),
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
      status: kanbanToStoredStatus(KANBAN_STATUS.IN_REVIEW),
      isOutdated: false,
    };

    if (moduleId === 'beat-butcher') {
      next['entity-editor'] = {
        ...cardStatus(next, 'entity-editor'),
        status: kanbanToStoredStatus(KANBAN_STATUS.UP_NEXT),
        isOutdated: false,
      };
    }

    if (moduleId === 'entity-editor') {
      next['arc-assembler'] = {
        ...cardStatus(next, 'arc-assembler'),
        status: kanbanToStoredStatus(KANBAN_STATUS.UP_NEXT),
        isOutdated: false,
      };
    }

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

    if (resolveKanbanStatus(current) !== KANBAN_STATUS.UP_NEXT) return;

    const next: CardStatuses = {
      ...statuses,
      [moduleId]: {
        ...current,
        status: kanbanToStoredStatus(KANBAN_STATUS.IN_PROGRESS),
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
        status: kanbanToStoredStatus(KANBAN_STATUS.DONE),
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
        const downstreamStatus = resolveKanbanStatus(downstream);
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
