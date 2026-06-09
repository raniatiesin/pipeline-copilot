/**
 * ============================================
 * KANBAN BOARD TYPE DEFINITIONS
 * ============================================
 *
 * Pure type definitions for the Kanban board system.
 * Runtime constants live in `constants/kanbanStatus.ts`.
 *
 * Status Flow:
 * TODO → UP_NEXT → IN_PROGRESS → IN_REVIEW → DONE
 *
 * @module types/kanban
 */

// ============================================
// STATUS TYPES
// ============================================

/**
 * Kanban column status values.
 */
export type KanbanStatus = 'todo' | 'up-next' | 'in-progress' | 'in-review' | 'done';

/**
 * Display configuration for each status.
 */
export interface KanbanStatusConfig {
  /** Display label */
  label: string;
  /** Short label for compact views */
  shortLabel: string;
  /** Color key from kanbanTheme.kanbanColors */
  colorKey: 'gray' | 'yellow' | 'orange' | 'purple' | 'blue';
  /** Icon name (Feather icons) */
  icon: string;
}

// ============================================
// ITEM DEFINITIONS
// ============================================

/**
 * Base Kanban item properties.
 */
export interface KanbanItemBase {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Current status */
  status: KanbanStatus;
  /** Order within column (lower = higher) */
  order: number;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Optional item properties for richer cards.
 */
export interface KanbanItemMeta {
  /** Module identifier for pipeline ordering */
  moduleId?: string;
  /** Module icon name (Feather icons) */
  icon?: string;
  /** Brief description/explainer */
  description?: string;
  /** Category/module tags */
  tags?: string[];
  /** Progress percentage (0-100) - drives auto-status */
  progress?: number;
  /** Whether item has been approved (moves from In Review to Done) */
  isApproved?: boolean;
  /** Due date */
  dueDate?: Date;
  /** Priority level */
  priority?: 'low' | 'medium' | 'high';
  /** Quick note content shown from bookmark sheet */
  quickNote?: string;
  /**
   * Whether the card is outdated because an upstream card was re-edited
   * after this card had already started work.
   */
  isOutdated?: boolean;
  /**
   * Raw script text for project-level items.
   * Passed to Beat Butcher when the stage is opened.
   */
  script?: string;
}

/**
 * Complete Kanban item with all properties.
 */
export interface KanbanItem extends KanbanItemBase, KanbanItemMeta {}

// ============================================
// BOARD STATE
// ============================================

/**
 * Complete Kanban board state.
 */
export interface KanbanState {
  /** All items indexed by ID */
  items: Record<string, KanbanItem>;
  /** Currently active page/column index */
  activePageIndex: number;
  /** Whether board is in loading state */
  isLoading: boolean;
}

// ============================================
// ACTIONS
// ============================================

/**
 * Kanban action types for state management.
 */
export type KanbanAction =
  | { type: 'SET_ITEMS'; payload: KanbanItem[] }
  | { type: 'ADD_ITEM'; payload: KanbanItem }
  | { type: 'UPDATE_ITEM'; payload: { id: string; updates: Partial<KanbanItem> } }
  | { type: 'UPDATE_NOTE'; payload: { id: string; note: string } }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'UPDATE_PROGRESS'; payload: { id: string; progress: number } }
  | { type: 'APPROVE_ITEM'; payload: string }
  | { type: 'SET_PAGE_INDEX'; payload: number }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'MARK_IN_REVIEW'; payload: { moduleId: string } }
  | { type: 'MARK_DONE'; payload: { moduleId: string } }
  | { type: 'FLAG_OUTDATED'; payload: { moduleId: string } }
  | { type: 'CLEAR_OUTDATED'; payload: { moduleId: string } };

// ============================================
// CREATE PROJECT DATA
// ============================================

/**
 * Input shape for the createProject action.
 */
export interface CreateProjectData {
  prospectName: string;
  postName: string;
  script: string;
}

// ============================================
// CONTEXT TYPES
// ============================================

/**
 * Raw pipeline row shape needed by the export feature.
 * Mirrors PipelineRow in lib/database.ts — kept here to avoid circular imports.
 */
export interface RawPipelineRow {
  id: string;
  prospect_name: string;
  post_name: string;
  script: string;
  style_selection: string | null;
  beat_butcher_output: string | null;
  entity_editor_output: string | null;
  arc_assembler_output: string | null;
  card_statuses: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Kanban context value for consumers.
 */
export interface KanbanContextValue {
  /** Current state */
  state: KanbanState;
  /** Dispatch action */
  dispatch: React.Dispatch<KanbanAction>;

  // ── Convenience methods ────────────────────────────────────────────
  getItemsByStatus: (status: KanbanStatus) => KanbanItem[];
  getCountByStatus: (status: KanbanStatus) => number;
  /** Current column status for a stage module id (stages Kanban only). */
  getModuleStatus: (moduleId: string) => KanbanStatus | null;
  updateProgress: (id: string, progress: number) => void;
  approveItem: (id: string) => void;
  updateNote: (id: string, note: string) => void;
  setPageIndex: (index: number) => void;
  createProject: (data: CreateProjectData) => Promise<string>;
  deleteProject: (id: string) => void;

  // ── Stage card lifecycle actions ───────────────────────────────────
  /**
   * Mark a stage card IN_REVIEW by moduleId (progress → 100).
   * Unlock chain is derived automatically from progress values.
   */
  markInReview: (moduleId: string) => void;
  /**
   * Mark a stage card IN_PROGRESS by moduleId (progress 0 → 1 when UP_NEXT).
   */
  markInProgress: (moduleId: string) => void;
  /**
   * Mark a stage card DONE by moduleId (isApproved → true).
   */
  markDone: (moduleId: string) => void;
  flagOutdated: (moduleId: string) => void;
  clearOutdated: (moduleId: string) => void;

  // ── Data access ────────────────────────────────────────────────────
  /**
   * Returns the raw PipelineRow for a given project id.
   * Used by the export feature on project cards.
   */
  getProjectRow: (id: string) => RawPipelineRow | null;
}

// ============================================
// COMPONENT PROPS
// ============================================

export interface KanbanCardProps {
  item: KanbanItem;
  onPress?: (item: KanbanItem) => void;
  cardWidth?: number;
}

export interface KanbanColumnProps {
  status: KanbanStatus;
  items: KanbanItem[];
  count: number;
  onCardPress?: (item: KanbanItem) => void;
  columnWidth: number;
  onAddProject?: () => void;
}

export interface KanbanTabsProps {
  counts: Record<KanbanStatus, number>;
}

export interface KanbanBoardProps {
  onItemPress?: (item: KanbanItem) => void;
  onAction?: (status: KanbanStatus) => void;
  onPageChange?: (pageIndex: number) => void;
  onAddProject?: () => void;
}
