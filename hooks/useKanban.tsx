/**
 * ============================================
 * KANBAN STATE MANAGEMENT HOOK
 * ============================================
 *
 * Context provider and hook for Kanban board state.
 * Data flows from PowerSync (SQLite, offline-first):
 *   - No projectId → project mode: watchProjects(), one KanbanItem per pipeline row
 *   - projectId given → stage mode: watchProject(id), card_statuses JSON → 4 KanbanItems
 *
 * @module hooks/useKanban
 */

import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { MODULE_ORDER } from '@/constants/kanbanTheme';
import type { CardStatuses, PipelineRow, StageCardStatus } from '@/lib/database';
import {
    createProject as dbCreateProject,
    updateProject as dbUpdateProject,
    getProjects,
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
// STATUS DERIVATION HELPERS (pure, stateless)
// ============================================

function deriveStatus(item: KanbanItem, isUnlocked: boolean): KanbanStatus {
  const progress = item.progress ?? 0;
  const isApproved = item.isApproved ?? false;

  if (progress === 0) {
    return isUnlocked ? KANBAN_STATUS.UP_NEXT : KANBAN_STATUS.TODO;
  }
  if (progress > 0 && progress < 100) {
    return KANBAN_STATUS.IN_PROGRESS;
  }
  return isApproved ? KANBAN_STATUS.DONE : KANBAN_STATUS.IN_REVIEW;
}

function isModuleUnlocked(
  moduleId: string | undefined,
  items: Record<string, KanbanItem>,
): boolean {
  if (!moduleId) return true;
  const idx = MODULE_ORDER.indexOf(moduleId as typeof MODULE_ORDER[number]);
  if (idx < 0) return true;
  if (idx === 0) return true;

  const prevId = MODULE_ORDER[idx - 1];
  const prev = Object.values(items).find(i => i.moduleId === prevId);
  return prev ? (prev.progress ?? 0) >= 100 : true;
}

function applyDerivedStatuses(
  items: Record<string, KanbanItem>,
): Record<string, KanbanItem> {
  const result: Record<string, KanbanItem> = {};
  for (const key of Object.keys(items)) {
    const item = items[key];
    result[key] = { ...item, status: deriveStatus(item, isModuleUnlocked(item.moduleId, items)) };
  }
  return result;
}

function mIdx(moduleId: string | undefined): number {
  if (!moduleId) return -1;
  return MODULE_ORDER.indexOf(moduleId as typeof MODULE_ORDER[number]);
}

// ============================================
// CARD STATUSES HELPERS
// ============================================

const DEFAULT_CARD_STATUS: StageCardStatus = {
  progress: 0,
  isApproved: false,
  isOutdated: false,
  quickNote: '',
};

function parseCardStatuses(json: string | null | undefined): CardStatuses {
  if (!json) return {};
  try { return JSON.parse(json) as CardStatuses; } catch { return {}; }
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
    return applyDerivedStatuses(map);
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
            setItems(applyDerivedStatuses(newItems));
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

        setItems(applyDerivedStatuses(newItems));
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

  // ── Data access ────────────────────────────────────────────────────────────

  const getProjectRow = useCallback((id: string): PipelineRow | null => {
    return rawRowsRef.current.find(r => r.id === id) ?? null;
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createProject = useCallback(async (data: CreateProjectData) => {
    await dbCreateProject(data);
  }, []);

  const updateProgress = useCallback(async (id: string, progress: number) => {
    if (!projectId) return;
    const rows = rawRowsRef.current;
    if (rows.length === 0) return;

    const statuses = parseCardStatuses(rows[0].card_statuses);
    const clamped = Math.max(0, Math.min(100, progress));
    const wasInReview = (statuses[id]?.progress ?? 0) === 100 && !statuses[id]?.isApproved;
    const isDropping = clamped < 100;
    const srcIdx = mIdx(id);

    const next: CardStatuses = { ...statuses };
    next[id] = { ...(statuses[id] ?? DEFAULT_CARD_STATUS), progress: clamped };

    if (wasInReview && isDropping && srcIdx >= 0) {
      (MODULE_ORDER as readonly string[]).forEach((m, i) => {
        if (i > srcIdx && (next[m]?.progress ?? 0) > 0) {
          next[m] = { ...(next[m] ?? DEFAULT_CARD_STATUS), isOutdated: true };
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
    const next: CardStatuses = {
      ...statuses,
      [id]: { ...(statuses[id] ?? DEFAULT_CARD_STATUS), isApproved: true },
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
      [id]: { ...(statuses[id] ?? DEFAULT_CARD_STATUS), quickNote: note },
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
    const srcIdx = mIdx(moduleId);
    const next: CardStatuses = { ...statuses };

    next[moduleId] = {
      ...(statuses[moduleId] ?? DEFAULT_CARD_STATUS),
      progress: 100,
      isOutdated: false,
    };

    (MODULE_ORDER as readonly string[]).forEach((m, i) => {
      if (i > srcIdx && next[m]) {
        next[m] = { ...next[m], isOutdated: false };
      }
    });

    await dbUpdateProject(projectId, { card_statuses: JSON.stringify(next) });
  }, [projectId]);

  const markInProgress = useCallback(async (moduleId: string) => {
    if (!projectId) return;
    const rows = rawRowsRef.current;
    if (rows.length === 0) return;

    const statuses = parseCardStatuses(rows[0].card_statuses);
    const current = statuses[moduleId];

    // Only update if not yet started — idempotent guard
    if ((current?.progress ?? 0) > 0) return;

    const next: CardStatuses = {
      ...statuses,
      [moduleId]: {
        ...(current ?? DEFAULT_CARD_STATUS),
        progress: 10,
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
        ...(statuses[moduleId] ?? DEFAULT_CARD_STATUS),
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
    (MODULE_ORDER as readonly string[]).forEach((m, i) => {
      if (i > srcIdx && (next[m]?.progress ?? 0) > 0) {
        next[m] = { ...(next[m] ?? DEFAULT_CARD_STATUS), isOutdated: true };
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
    (MODULE_ORDER as readonly string[]).forEach((m, i) => {
      if (i > srcIdx && next[m]?.isOutdated) {
        next[m] = { ...next[m], isOutdated: false };
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
      updateProgress,
      approveItem,
      updateNote,
      setPageIndex,
      createProject,
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
      updateProgress,
      approveItem,
      updateNote,
      setPageIndex,
      createProject,
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
