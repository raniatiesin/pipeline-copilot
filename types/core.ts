/**
 * ============================================
 * CORE APPLICATION TYPES
 * ============================================
 * 
 * This file contains foundational types used throughout
 * the Tiesin application. These are building blocks that
 * other modules depend upon.
 * 
 * @module types/core
 */

// ============================================
// MODULE SYSTEM
// ============================================

/**
 * Status of a module in the video project pipeline.
 * Each module progresses through these states as the user works.
 */
export type ModuleStatus = 'not-started' | 'in-progress' | 'completed';

/**
 * Unique identifier for each module in the pipeline.
 * Must stay in sync with `constants/kanbanTheme.ts` MODULE_ORDER.
 */
export type ModuleId =
  | 'style-selector'
  | 'beat-butcher'
  | 'entity-editor'
  | 'arc-assembler'
  | 'voice-cloner'       // Future module
  | 'script-generator'   // Future module
  | 'video-renderer';    // Future module

/**
 * Base interface for tracking module progress.
 * All modules must implement this interface for the project hub.
 */
export interface ModuleProgress {
  /** Unique module identifier */
  moduleId: ModuleId;
  /** Display name for the module */
  moduleName: string;
  /** Current completion status */
  status: ModuleStatus;
  /** Completion percentage (0-100) */
  progress: number;
  /** Last modification timestamp */
  lastUpdated?: Date;
  /** Module-specific data payload */
  data?: unknown;
}

// ============================================
// VIDEO PROJECT
// ============================================

/**
 * Main project entity containing all module progress and metadata.
 * This is the root state object for a user's video project.
 */
export interface VideoProject {
  /** Unique project identifier */
  id: string;
  /** User-defined project name */
  name: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Last modification timestamp */
  updatedAt: Date;
  /** Progress state for each module */
  modules: Record<ModuleId, ModuleProgress>;
}

// ============================================
// COMMON CALLBACK TYPES
// ============================================
export type PressHandler = () => void;

/**
 * Standard callback type for value changes.
 */
export type ChangeHandler<T> = (value: T) => void;
