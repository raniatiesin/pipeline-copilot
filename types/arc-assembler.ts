/**
 * ============================================
 * ARC ASSEMBLER TYPES
 * ============================================
 *
 * Pure type definitions for the Arc Assembler module.
 * No runtime code lives here.
 *
 * The Arc Assembler synthesises all upstream outputs
 * (scenes, subjects, style) into per-scene and per-subject
 * visual briefs — the production prompts for AI generation.
 *
 * @module types/arc-assembler
 */

import type { Scene, SubjectCategory } from './scene-segmentation';
import type { StyleSelection } from './style-selector';

// ============================================
// MODE
// ============================================

/**
 * The two viewing/editing perspectives in the Arc Assembler.
 * Toggled by a full-page horizontal swipe.
 */
export type ArcAssemblerMode = 'scene' | 'subject';

// ============================================
// OUTPUT SHAPE (persisted to DB)
// ============================================

/**
 * The structured JSON stored in the `arc_assembler_output`
 * column of the pipelines table.
 *
 * Designed for direct consumption by ComfyUI/Flux/LTX workflows.
 */
export interface ArcAssemblerOutput {
  /** sceneId → visual brief text for that scene. */
  sceneBriefs: Record<string, string>;
  /** SubjectCategory.id → visual brief text for that subject. */
  subjectBriefs: Record<string, string>;
}

// ============================================
// CONTEXT VALUE
// ============================================

/**
 * Everything exposed by ArcAssemblerProvider to its consumers.
 */
export interface ArcAssemblerContextValue {
  // ── Upstream data (read from DB) ──────────────────────────────────
  /** Scenes parsed from beat_butcher_output. */
  scenes: Scene[];
  /** Subject profiles parsed from entity_editor_output. */
  subjectCategories: SubjectCategory[];
  /** Style selection parsed from style_selection. Null if not set. */
  styleSelection: StyleSelection | null;
  /** Comma-separated tag tally values — used as TextInput placeholder. */
  tagsPlaceholder: string;

  // ── Mode & navigation ─────────────────────────────────────────────
  /** Active page mode. */
  mode: ArcAssemblerMode;
  /** Switch active mode. Called by the mode indicator tabs. */
  setMode: (mode: ArcAssemblerMode) => void;
  /** Index of the currently focused scene (0-based). */
  currentSceneIdx: number;
  /** Move cursor to the prev or next scene. Clamps at edges. */
  navigateScene: (dir: 'prev' | 'next') => void;
  /** Index of the currently focused subject category (0-based). */
  currentSubjectIdx: number;
  /** Move cursor to the prev or next subject. Clamps at edges. */
  navigateSubject: (dir: 'prev' | 'next') => void;
  /**
   * Jump to a specific subject category by ID and switch to Subject Mode.
   * Used by the SubjectBriefPopup "Edit" flow.
   */
  navigateToSubject: (categoryId: string) => void;

  // ── Brief state (shared source of truth for both modes) ───────────
  /** Map of sceneId → visual brief text. */
  sceneBriefs: Record<string, string>;
  /** Map of SubjectCategory.id → visual brief text. */
  subjectBriefs: Record<string, string>;

  // ── Mutations ─────────────────────────────────────────────────────
  /** Update the visual brief for a scene. Triggers debounced DB save. */
  setSceneBrief: (sceneId: string, text: string) => void;
  /**
   * Update the visual brief for a subject category.
   * Triggers debounced DB save.
   * Instantly propagates to Scene Mode subject popup (via shared state).
   */
  setSubjectBrief: (categoryId: string, text: string) => void;
  /**
   * Flush current state to DB immediately and call
   * stageCallbacks.markInReview('arc-assembler').
   * Called by the Continue button.
   */
  confirmAndSave: () => Promise<void>;

  // ── Loading ───────────────────────────────────────────────────────
  /** True while the initial DB row load is in flight. */
  isLoading: boolean;
}
