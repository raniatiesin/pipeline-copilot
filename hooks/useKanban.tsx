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
 * @example
 * ```tsx
 * <KanbanProvider initialItems={items}>
 *   <KanbanBoard />
 * </KanbanProvider>
 * 
 * const { state, updateProgress, approveItem } = useKanban();
 * ```
 * 
 * @module hooks/useKanban
 */

import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { MODULE_ORDER } from '@/constants/kanbanTheme';
import type {
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
// STATUS DERIVATION HELPER
// ============================================

/**
 * Derives the status of an item based on its progress and unlock state.
 */
function deriveStatus(
  item: KanbanItem,
  isUnlocked: boolean,
  isMotherOutdated: boolean = false
): KanbanStatus {
  const progress = item.progress ?? 0;
  const isApproved = item.isApproved ?? false;

  if (isMotherOutdated && item.moduleId !== 'script-pasting') {
    // If mother card ('script-pasting') is not done/in-review,
    // all dependent active cards drop back to IN_PROGRESS.
    return progress > 0 ? KANBAN_STATUS.IN_PROGRESS : KANBAN_STATUS.TODO;
  }

  if (progress === 0) {
    return isUnlocked ? KANBAN_STATUS.UP_NEXT : KANBAN_STATUS.TODO;
  } else if (progress > 0 && progress < 100) {
    return KANBAN_STATUS.IN_PROGRESS;
  } else {
    // progress === 100
    return isApproved ? KANBAN_STATUS.DONE : KANBAN_STATUS.IN_REVIEW;
  }
}

/**
 * Checks if a module is unlocked based on previous module's progress.
 * First module is always unlocked. Subsequent modules unlock when
 * the previous module reaches 100% progress.
 */
function isModuleUnlocked(
  moduleId: string | undefined,
  items: Record<string, KanbanItem>
): boolean {
  if (!moduleId) return true;
  
  const moduleIndex = MODULE_ORDER.indexOf(moduleId as typeof MODULE_ORDER[number]);
  if (moduleIndex <= 0) return true; // First module or not in order
  
  const previousModuleId = MODULE_ORDER[moduleIndex - 1];
  const previousItem = Object.values(items).find(
    (item) => item.moduleId === previousModuleId
  );
  
  return previousItem ? (previousItem.progress ?? 0) >= 100 : true;
}

/**
 * Refreshes derived status properties on all items in state based on new rules.
 */
function applyDerivedStatuses(items: Record<string, KanbanItem>): Record<string, KanbanItem> {
  const motherCard = Object.values(items).find(i => i.moduleId === 'script-pasting');
  const motherProgress = motherCard?.progress ?? 0;
  // Mother is outdated if it's currently IN_PROGRESS (meaning it was modified)
  // i.e., progress > 0 but < 100.
  const isMotherOutdated = motherProgress > 0 && motherProgress < 100;

  const result: Record<string, KanbanItem> = {};
  for (const key of Object.keys(items)) {
    const item = items[key];
    const unlocked = isModuleUnlocked(item.moduleId, items);
    
    // Check if it's outdated relative to mother card directly in our status
    const status = deriveStatus(item, unlocked, isMotherOutdated);
    
    // Card is marked outdated if mother is outdated AND this child card actually has progress
    const childIsOutdated = isMotherOutdated && item.moduleId !== 'script-pasting' && (item.progress ?? 0) > 0;
    
    result[key] = {
      ...item,
      status,
      isOutdated: childIsOutdated
    };
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
      action.payload.forEach((item) => {
        items[item.id] = item;
      });
      return { ...state, items: applyDerivedStatuses(items), isLoading: false };
    }

    case 'ADD_ITEM': {
      const nextItems = {
        ...state.items,
        [action.payload.id]: action.payload,
      };
      return {
        ...state,
        items: applyDerivedStatuses(nextItems),
      };
    }

    case 'UPDATE_ITEM': {
      const { id, updates } = action.payload;
      const existing = state.items[id];
      if (!existing) return state;
      const nextItems = {
        ...state.items,
        [id]: { ...existing, ...updates, updatedAt: new Date() },
      };
      return {
        ...state,
        items: applyDerivedStatuses(nextItems),
      };
    }

    case 'UPDATE_NOTE': {
      const { id, note } = action.payload;
      const existing = state.items[id];
      if (!existing) return state;
      const nextItems = {
        ...state.items,
        [id]: {
          ...existing,
          quickNote: note,
          updatedAt: new Date(),
        },
      };
      return { ...state, items: applyDerivedStatuses(nextItems) };
    }

    case 'DELETE_ITEM': {
      const { [action.payload]: removed, ...remaining } = state.items;
      return { ...state, items: applyDerivedStatuses(remaining) };
    }

    case 'UPDATE_PROGRESS': {
      const { id, progress } = action.payload;
      const existing = state.items[id];
      if (!existing) return state;
      
      // Clamp progress between 0 and 100
      const clampedProgress = Math.max(0, Math.min(100, progress));
      const nextItems = {
        ...state.items,
        [id]: {
          ...existing,
          progress: clampedProgress,
          updatedAt: new Date(),
        },
      };
      
      return {
        ...state,
        items: applyDerivedStatuses(nextItems),
      };
    }

    case 'APPROVE_ITEM': {
      const existing = state.items[action.payload];
      if (!existing) return state;
      const nextItems = {
        ...state.items,
        [action.payload]: {
          ...existing,
          isApproved: true,
          updatedAt: new Date(),
        },
      };
      return { ...state, items: applyDerivedStatuses(nextItems) };
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
  // Initialize state with items
  const initState = useMemo((): KanbanState => {
    const items: Record<string, KanbanItem> = {};
    initialItems.forEach((item) => {
      items[item.id] = item;
    });
    return { ...initialState, items };
  }, []);

  const [state, dispatch] = useReducer(kanbanReducer, initState);

  // Get items filtered by derived status, sorted by module order
  const getItemsByStatus = useCallback(
    (status: KanbanStatus): KanbanItem[] => {
      return Object.values(state.items)
        .filter((item) => {
          const isUnlocked = isModuleUnlocked(item.moduleId, state.items);
          const derivedStatus = deriveStatus(item, isUnlocked);
          return derivedStatus === status;
        })
        .sort((a, b) => {
          // Sort by module order
          const aIndex = a.moduleId 
            ? MODULE_ORDER.indexOf(a.moduleId as typeof MODULE_ORDER[number])
            : 999;
          const bIndex = b.moduleId 
            ? MODULE_ORDER.indexOf(b.moduleId as typeof MODULE_ORDER[number])
            : 999;
          if (aIndex !== bIndex) return aIndex - bIndex;
          return a.order - b.order;
        });
    },
    [state.items]
  );

  // Get count for a derived status
  const getCountByStatus = useCallback(
    (status: KanbanStatus): number => {
      return Object.values(state.items).filter((item) => {
        const isUnlocked = isModuleUnlocked(item.moduleId, state.items);
        const derivedStatus = deriveStatus(item, isUnlocked);
        return derivedStatus === status;
      }).length;
    },
    [state.items]
  );

  // Update progress (auto-changes derived status)
  const updateProgress = useCallback((id: string, progress: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { id, progress } });
  }, []);

  // Approve item (moves from In Review to Done)
  const approveItem = useCallback((id: string) => {
    dispatch({ type: 'APPROVE_ITEM', payload: id });
  }, []);

  // Update quick note text for a card
  const updateNote = useCallback((id: string, note: string) => {
    dispatch({ type: 'UPDATE_NOTE', payload: { id, note } });
  }, []);

  // Set active page index
  const setPageIndex = useCallback((index: number) => {
    dispatch({ type: 'SET_PAGE_INDEX', payload: index });
  }, []);

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
    }),
    [state, getItemsByStatus, getCountByStatus, updateProgress, approveItem, updateNote, setPageIndex]
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
