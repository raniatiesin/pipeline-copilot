/**
 * ============================================
 * STAGE CALLBACKS — CROSS-ROUTE BRIDGE
 * ============================================
 *
 * Allows work screens (beat-butcher, entity-editor, style-selector,
 * arc-assembler) to call Kanban mutations on the Stages board context,
 * which lives in a separate route tree.
 *
 * @module lib/stageCallbacks
 */

import type { KanbanStatus } from '@/types/kanban';

// ============================================
// INTERNAL REFS
// ============================================

let markInReviewCallback: ((moduleId: string) => void) | null = null;
let markInProgressCallback: ((moduleId: string) => void) | null = null;
let getModuleStatusCallback: ((moduleId: string) => KanbanStatus | null) | null = null;

// ============================================
// PUBLIC API
// ============================================

export const stageCallbacks = {
  setMarkInReview(fn: ((moduleId: string) => void) | null): void {
    markInReviewCallback = fn;
  },

  markInReview(moduleId: string): void {
    markInReviewCallback?.(moduleId);
  },

  setMarkInProgress(fn: ((moduleId: string) => void) | null): void {
    markInProgressCallback = fn;
  },

  markInProgress(moduleId: string): void {
    markInProgressCallback?.(moduleId);
  },

  setGetModuleStatus(fn: ((moduleId: string) => KanbanStatus | null) | null): void {
    getModuleStatusCallback = fn;
  },

  getModuleStatus(moduleId: string): KanbanStatus | null {
    return getModuleStatusCallback?.(moduleId) ?? null;
  },
};
