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
 * Extended by specific item types (Project, Module, Stage).
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
  /** Whether the card is outdated because a parent card changed */
  isOutdated?: boolean;
  /**
   * Raw script text for project-level items.
   * Stored at creation and passed to Beat Butcher when the stage is opened.
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
 * Note: No drag actions - status is auto-derived from progress.
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
  | { type: 'SET_LOADING'; payload: boolean };

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
 * Kanban context value for consumers.
 */
export interface KanbanContextValue {
  /** Current state */
  state: KanbanState;
  /** Dispatch action */
  dispatch: React.Dispatch<KanbanAction>;

  // Convenience methods
  /** Get items for a specific status (auto-derived from progress) */
  getItemsByStatus: (status: KanbanStatus) => KanbanItem[];
  /** Get count for a specific status */
  getCountByStatus: (status: KanbanStatus) => number;
  /** Update progress (auto-changes status) */
  updateProgress: (id: string, progress: number) => void;
  /** Approve item (moves from In Review to Done) */
  approveItem: (id: string) => void;
  /** Update quick note for a card */
  updateNote: (id: string, note: string) => void;
  /** Set active page index */
  setPageIndex: (index: number) => void;
  /**
   * Create a new project item in the Projects Kanban.
   * Stores prospect name, post name, and script.
   * Status auto-derives to IN_PROGRESS on creation.
   */
  createProject: (data: CreateProjectData) => void;
}

// ============================================
// COMPONENT PROPS
// ============================================

/**
 * Props for KanbanCard component.
 */
export interface KanbanCardProps {
  /** Item data */
  item: KanbanItem;
  /** Press handler */
  onPress?: (item: KanbanItem) => void;
  /** Card width for 4:3 aspect ratio calculation */
  cardWidth?: number;
}

/**
 * Props for KanbanColumn component.
 */
export interface KanbanColumnProps {
  /** Column status */
  status: KanbanStatus;
  /** Items in this column */
  items: KanbanItem[];
  /** Item count for tab badge */
  count: number;
  /** Card press handler */
  onCardPress?: (item: KanbanItem) => void;
  /** Column width */
  columnWidth: number;
  /**
   * Add-project callback — only provided for the Todo column.
   * Renders an AddProjectButton at the bottom of the list when present.
   */
  onAddProject?: () => void;
}

/**
 * Props for KanbanTabs component.
 */
export interface KanbanTabsProps {
  /** Item counts per status */
  counts: Record<KanbanStatus, number>;
}

/**
 * Props for KanbanBoard component.
 */
export interface KanbanBoardProps {
  /** Item press handler */
  onItemPress?: (item: KanbanItem) => void;
  /** Action button handlers by status */
  onAction?: (status: KanbanStatus) => void;
  /** Called when the visible page/column changes */
  onPageChange?: (pageIndex: number) => void;
  /**
   * Callback for adding a new project.
   * Surfaces an AddProjectButton in the To Do column.
   */
  onAddProject?: () => void;
}
