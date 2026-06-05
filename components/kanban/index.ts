/**
 * ============================================
 * KANBAN COMPONENTS BARREL EXPORT
 * ============================================
 *
 * Central export point for all Kanban board components.
 * Import from '@/components/kanban' to access any component.
 *
 * Components:
 * - KanbanBoard         → Main board with paged columns
 * - KanbanCard          → Individual item card
 * - KanbanColumn        → Single status column with integrated tab
 * - AddProjectButton    → "New Project" button for To Do column
 * - CreateProjectModal  → 3-input project creation form
 *
 * @example
 * ```tsx
 * import { KanbanBoard, CreateProjectModal } from '@/components/kanban';
 * ```
 *
 * @module components/kanban
 */

// ============================================
// MAIN BOARD
// ============================================

export { KanbanBoard } from './KanbanBoard';

// ============================================
// BUILDING BLOCKS
// ============================================

export { KanbanCard } from './KanbanCard';
export { KanbanColumn } from './KanbanColumn';
export { AddProjectButton } from './AddProjectButton';
export { CreateProjectModal } from './CreateProjectModal';
export type { CreateProjectData } from './CreateProjectModal';
