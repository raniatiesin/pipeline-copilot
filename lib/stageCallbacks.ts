/**
 * ============================================
 * STAGE CALLBACKS — CROSS-ROUTE BRIDGE
 * ============================================
 *
 * Allows work screens (beat-butcher, entity-editor) to call
 * `markInReview` on the Stages Kanban context, which lives in a
 * separate route tree (app/stages.tsx has its own KanbanProvider).
 *
 * Pattern: simple mutable ref — no new library, no global store.
 * stages.tsx registers the callback on mount; work screens call it.
 *
 * @module lib/stageCallbacks
 */

// ============================================
// INTERNAL REFS
// ============================================

let markInReviewCallback: ((moduleId: string) => void) | null = null;
let markInProgressCallback: ((moduleId: string) => void) | null = null;

// ============================================
// PUBLIC API
// ============================================

export const stageCallbacks = {
  /**
   * Called by StagesContent (inside KanbanProvider) on mount.
   * Pass null to unregister on unmount.
   */
  setMarkInReview(fn: ((moduleId: string) => void) | null): void {
    markInReviewCallback = fn;
  },

  /**
   * Called by work screens when Continue is pressed.
   * Marks the given module card as IN_REVIEW in the Stages Kanban.
   * No-op if stages.tsx is not mounted.
   */
  markInReview(moduleId: string): void {
    markInReviewCallback?.(moduleId);
  },

  /**
   * Called by StagesContent on mount. Pass null to unregister on unmount.
   */
  setMarkInProgress(fn: ((moduleId: string) => void) | null): void {
    markInProgressCallback = fn;
  },

  /**
   * Called by work screens on mount (useEffect).
   * Transitions the card from UP_NEXT → IN_PROGRESS (progress 0 → 10).
   * No-op if stages.tsx is not mounted or card already has progress > 0.
   */
  markInProgress(moduleId: string): void {
    markInProgressCallback?.(moduleId);
  },
};
