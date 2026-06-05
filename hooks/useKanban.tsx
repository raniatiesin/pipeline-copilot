/**
 * ============================================
 * KANBAN STATE MANAGEMENT HOOK
 * ============================================
 *
 * Context provider and hook for Kanban board state.
 * Manages items with auto-derived status based on progress.
 *
 * Status Derivation Rules:
 * - 0% + locked (previous not at 100%) → TODO
 * - 0% + unlocked (previous at 100%) → UP_NEXT
 * - 1-99% → IN_PROGRESS
 * - 100% + !approved → IN_REVIEW
 * - 100% + approved → DONE
 *
 * Stage card lifecycle (1D):
 * - markInReview(moduleId) → sets progress=100, clears downstream outdated
 * - markDone(moduleId)     → sets progress=100 + isApproved=true
 * - flagOutdated(moduleId) → sets isOutdated=true on downstream started cards
 * - clearOutdated(moduleId)→ clears isOutdated on all downstream cards
 * - Auto-flags downstream when UPDATE_PROGRESS drops a card from 100 → <100
 *
 * @module hooks/useKanban
 */

import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { MODULE_ORDER } from '@/constants/kanbanTheme';
import type {
  CreateProjectData,
  KanbanAction,
  KanbanContextValue,
  KanbanItem,
  KanbanState,
  KanbanStatus,
} from '@/types/kanban';
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';

// ============================================
// INITIAL STATE
// ============================================

const initialState: KanbanState = {
  items: {},
  activePageIndex: 0,
  isLoading: false,
};

// ============================================
// HELPERS
// ============================================

/**
 * Derives the display status of a single item from its progress + approval.
 */
function deriveStatus(item: KanbanItem, isUnlocked: boolean): KanbanStatus {
  const progress = item.progress ?? 0;
  const isApproved = item.isApproved ?? false;

  if (progress === 0) {
    return isUnlocked ? KANBAN_STATUS.UP_NEXT : KANBAN_STATUS.TODO;
  } else if (progress > 0 && progress < 100) {
    return KANBAN_STATUS.IN_PROGRESS;
  } else {
    return isApproved ? KANBAN_STATUS.DONE : KANBAN_STATUS.IN_REVIEW;
  }
}

/**
 * Whether a module is unlocked by its predecessor reaching 100%.
 * Items with a moduleId outside MODULE_ORDER (e.g. 'project') are always unlocked.
 * The first item in MODULE_ORDER is always unlocked.
 */
function isModuleUnlocked(
  moduleId: string | undefined,
  items: Record<string, KanbanItem>,
): boolean {
  if (!moduleId) return true;
  const moduleIndex = MODULE_ORDER.indexOf(moduleId as typeof MODULE_ORDER[number]);
  if (moduleIndex < 0) return true;   // not a stage card → always unlocked
  if (moduleIndex === 0) return true;  // first stage → always unlocked

  const previousModuleId = MODULE_ORDER[moduleIndex - 1];
  const previousItem = Object.values(items).find(i => i.moduleId === previousModuleId);
  return previousItem ? (previousItem.progress ?? 0) >= 100 : true;
}

/**
 * Returns the index of moduleId in MODULE_ORDER, or -1.
 */
function moduleIdx(moduleId: string | undefined): number {
  if (!moduleId) return -1;
  return MODULE_ORDER.indexOf(moduleId as typeof MODULE_ORDER[number]);
}

/**
 * Re-derives status on every item. Called after every state mutation.
 */
function applyDerivedStatuses(items: Record<string, KanbanItem>): Record<string, KanbanItem> {
  const result: Record<string, KanbanItem> = {};
  for (const key of Object.keys(items)) {
    const item = items[key];
    const unlocked = isModuleUnlocked(item.moduleId, items);
    result[key] = { ...item, status: deriveStatus(item, unlocked) };
  }
  return result;
}

/**
 * Applies isOutdated:true to all downstream cards of moduleId that have progress > 0.
 * Mutates the provided record in place; returns it for convenience.
 */
function flagDownstreamOutdated(
  items: Record<string, KanbanItem>,
  sourceModuleId: string,
): Record<string, KanbanItem> {
  const srcIdx = moduleIdx(sourceModuleId);
  if (srcIdx < 0) return items;

  const result = { ...items };
  for (const key of Object.keys(result)) {
    const item = result[key];
    const dstIdx = moduleIdx(item.moduleId);
    if (dstIdx > srcIdx && (item.progress ?? 0) > 0) {
      result[key] = { ...item, isOutdated: true };
    }
  }
  return result;
}

/**
 * Clears isOutdated on all downstream cards of moduleId.
 */
function clearDownstreamOutdated(
  items: Record<string, KanbanItem>,
  sourceModuleId: string,
): Record<string, KanbanItem> {
  const srcIdx = moduleIdx(sourceModuleId);
  if (srcIdx < 0) return items;

  const result = { ...items };
  for (const key of Object.keys(result)) {
    const item = result[key];
    const dstIdx = moduleIdx(item.moduleId);
    if (dstIdx > srcIdx && item.isOutdated) {
      result[key] = { ...item, isOutdated: false };
    }
  }
  return result;
}

// ============================================
// REDUCER
// ============================================

function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {

    case 'SET_ITEMS': {
      const items: Record<string, KanbanItem> = {};
      action.payload.forEach(item => { items[item.id] = item; });
      return { ...state, items: applyDerivedStatuses(items), isLoading: false };
    }

    case 'ADD_ITEM': {
      const nextItems = { ...state.items, [action.payload.id]: action.payload };
      return { ...state, items: applyDerivedStatuses(nextItems) };
    }

    case 'UPDATE_ITEM': {
      const { id, updates } = action.payload;
      const existing = state.items[id];
      if (!existing) return state;
      const nextItems = {
        ...state.items,
        [id]: { ...existing, ...updates, updatedAt: new Date() },
      };
      return { ...state, items: applyDerivedStatuses(nextItems) };
    }

    case 'UPDATE_NOTE': {
      const { id, note } = action.payload;
      const existing = state.items[id];
      if (!existing) return state;
      return {
        ...state,
        items: applyDerivedStatuses({
          ...state.items,
          [id]: { ...existing, quickNote: note, updatedAt: new Date() },
        }),
      };
    }

    case 'DELETE_ITEM': {
      const { [action.payload]: _removed, ...remaining } = state.items;
      return { ...state, items: applyDerivedStatuses(remaining) };
    }

    case 'UPDATE_PROGRESS': {
      const { id, progress } = action.payload;
      const existing = state.items[id];
      if (!existing) return state;
      const clamped = Math.max(0, Math.min(100, progress));

      // Auto-flag downstream as outdated when a card drops from IN_REVIEW (100%) to active
      const wasInReview = (existing.progress ?? 0) === 100 && !existing.isApproved;
      const isDropping  = clamped < 100;

      let nextItems: Record<string, KanbanItem> = {
        ...state.items,
        [id]: { ...existing, progress: clamped, updatedAt: new Date() },
      };

      if (wasInReview && isDropping && existing.moduleId) {
        nextItems = flagDownstreamOutdated(nextItems, existing.moduleId);
      }

      return { ...state, items: applyDerivedStatuses(nextItems) };
    }

    case 'APPROVE_ITEM': {
      const existing = state.items[action.payload];
      if (!existing) return state;
      return {
        ...state,
        items: applyDerivedStatuses({
          ...state.items,
          [action.payload]: { ...existing, isApproved: true, updatedAt: new Date() },
        }),
      };
    }

    case 'MARK_IN_REVIEW': {
      const { moduleId } = action.payload;
      const target = Object.values(state.items).find(i => i.moduleId === moduleId);
      if (!target) return state;

      // Set progress=100 (→ IN_REVIEW) and clear outdated on self + all downstream
      let nextItems: Record<string, KanbanItem> = {
        ...state.items,
        [target.id]: {
          ...target,
          progress: 100,
          isOutdated: false,
          updatedAt: new Date(),
        },
      };
      nextItems = clearDownstreamOutdated(nextItems, moduleId);
      return { ...state, items: applyDerivedStatuses(nextItems) };
    }

    case 'MARK_DONE': {
      const { moduleId } = action.payload;
      const target = Object.values(state.items).find(i => i.moduleId === moduleId);
      if (!target) return state;
      return {
        ...state,
        items: applyDerivedStatuses({
          ...state.items,
          [target.id]: {
            ...target,
            progress: 100,
            isApproved: true,
            isOutdated: false,
            updatedAt: new Date(),
          },
        }),
      };
    }

    case 'FLAG_OUTDATED': {
      const { moduleId } = action.payload;
      return {
        ...state,
        items: applyDerivedStatuses(flagDownstreamOutdated({ ...state.items }, moduleId)),
      };
    }

    case 'CLEAR_OUTDATED': {
      const { moduleId } = action.payload;
      return {
        ...state,
        items: applyDerivedStatuses(clearDownstreamOutdated({ ...state.items }, moduleId)),
      };
    }

    case 'SET_PAGE_INDEX': {
      return { ...state, activePageIndex: action.payload };
    }

    case 'SET_LOADING': {
      return { ...state, isLoading: action.payload };
    }

    default:
      return state;
  }
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
}

export function KanbanProvider({ children, initialItems = [] }: KanbanProviderProps) {
  const initState = useMemo((): KanbanState => {
    const items: Record<string, KanbanItem> = {};
    initialItems.forEach(item => { items[item.id] = item; });
    return { ...initialState, items };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [state, dispatch] = useReducer(kanbanReducer, initState);

  const getItemsByStatus = useCallback(
    (status: KanbanStatus): KanbanItem[] =>
      Object.values(state.items)
        .filter(item => {
          const unlocked = isModuleUnlocked(item.moduleId, state.items);
          return deriveStatus(item, unlocked) === status;
        })
        .sort((a, b) => {
          const ai = a.moduleId ? MODULE_ORDER.indexOf(a.moduleId as any) : 999;
          const bi = b.moduleId ? MODULE_ORDER.indexOf(b.moduleId as any) : 999;
          if (ai !== bi) return ai - bi;
          return a.order - b.order;
        }),
    [state.items],
  );

  const getCountByStatus = useCallback(
    (status: KanbanStatus): number =>
      Object.values(state.items).filter(item => {
        const unlocked = isModuleUnlocked(item.moduleId, state.items);
        return deriveStatus(item, unlocked) === status;
      }).length,
    [state.items],
  );

  const updateProgress = useCallback(
    (id: string, progress: number) =>
      dispatch({ type: 'UPDATE_PROGRESS', payload: { id, progress } }),
    [],
  );

  const approveItem = useCallback(
    (id: string) => dispatch({ type: 'APPROVE_ITEM', payload: id }),
    [],
  );

  const updateNote = useCallback(
    (id: string, note: string) =>
      dispatch({ type: 'UPDATE_NOTE', payload: { id, note } }),
    [],
  );

  const setPageIndex = useCallback(
    (index: number) => dispatch({ type: 'SET_PAGE_INDEX', payload: index }),
    [],
  );

  /**
   * Creates a new project-level KanbanItem.
   * progress=10 forces IN_PROGRESS status via deriveStatus.
   */
  const createProject = useCallback((data: CreateProjectData) => {
    const id = `project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id,
        title: data.prospectName,
        description: data.postName,
        moduleId: 'project',
        icon: 'film',
        status: KANBAN_STATUS.IN_PROGRESS,
        order: Date.now(),
        progress: 10,
        priority: 'high',
        script: data.script,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }, []);

  /** Mark stage card IN_REVIEW. Unlocks next card; clears downstream isOutdated. */
  const markInReview = useCallback(
    (moduleId: string) =>
      dispatch({ type: 'MARK_IN_REVIEW', payload: { moduleId } }),
    [],
  );

  /** Mark stage card DONE (progress=100 + isApproved=true). */
  const markDone = useCallback(
    (moduleId: string) =>
      dispatch({ type: 'MARK_DONE', payload: { moduleId } }),
    [],
  );

  /** Flag all started downstream cards as outdated. */
  const flagOutdated = useCallback(
    (moduleId: string) =>
      dispatch({ type: 'FLAG_OUTDATED', payload: { moduleId } }),
    [],
  );

  /** Clear isOutdated from all downstream cards. */
  const clearOutdated = useCallback(
    (moduleId: string) =>
      dispatch({ type: 'CLEAR_OUTDATED', payload: { moduleId } }),
    [],
  );

  const value: KanbanContextValue = useMemo(
    () => ({
      state,
      dispatch,
      getItemsByStatus,
      getCountByStatus,
      updateProgress,
      approveItem,
      updateNote,
      setPageIndex,
      createProject,
      markInReview,
      markDone,
      flagOutdated,
      clearOutdated,
    }),
    [
      state,
      getItemsByStatus,
      getCountByStatus,
      updateProgress,
      approveItem,
      updateNote,
      setPageIndex,
      createProject,
      markInReview,
      markDone,
      flagOutdated,
      clearOutdated,
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

/**
 * Access Kanban board state and actions.
 * Must be used within a KanbanProvider.
 */
export function useKanban(): KanbanContextValue {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
}
