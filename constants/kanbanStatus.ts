/**
 * ============================================
 * KANBAN STATUS CONSTANTS
 * ============================================
 *
 * Runtime constants for the Kanban status system.
 * Moved out of `types/kanban.ts` to maintain the
 * types-only contract of the `types/` layer.
 *
 * @module constants/kanbanStatus
 */

import type { KanbanStatus, KanbanStatusConfig } from '../types/kanban';

// ============================================
// STATUS VALUES
// ============================================

/**
 * Kanban column status values.
 * Ordered by workflow progression.
 */
export const KANBAN_STATUS = {
  TODO: 'todo',
  UP_NEXT: 'up-next',
  IN_PROGRESS: 'in-progress',
  IN_REVIEW: 'in-review',
  DONE: 'done',
} as const;

/**
 * All statuses in workflow order for iteration.
 */
export const KANBAN_STATUS_ORDER: KanbanStatus[] = [
  KANBAN_STATUS.TODO,
  KANBAN_STATUS.UP_NEXT,
  KANBAN_STATUS.IN_PROGRESS,
  KANBAN_STATUS.IN_REVIEW,
  KANBAN_STATUS.DONE,
];

// ============================================
// STATUS DISPLAY CONFIG
// ============================================

/**
 * Display configuration for each status.
 * Maps status → label, short label, color key, and icon.
 */
export const KANBAN_STATUS_CONFIG: Record<KanbanStatus, KanbanStatusConfig> = {
  [KANBAN_STATUS.TODO]: {
    label: 'To Do',
    shortLabel: 'Todo',
    colorKey: 'gray',
    icon: 'circle',
  },
  [KANBAN_STATUS.UP_NEXT]: {
    label: 'Up Next',
    shortLabel: 'Next',
    colorKey: 'yellow',
    icon: 'arrow-right',
  },
  [KANBAN_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    shortLabel: 'Active',
    colorKey: 'orange',
    icon: 'loader',
  },
  [KANBAN_STATUS.IN_REVIEW]: {
    label: 'In Review',
    shortLabel: 'Review',
    colorKey: 'purple',
    icon: 'eye',
  },
  [KANBAN_STATUS.DONE]: {
    label: 'Done',
    shortLabel: 'Done',
    colorKey: 'blue',
    icon: 'check-circle',
  },
};
