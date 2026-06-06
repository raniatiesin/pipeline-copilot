/**
 * ============================================
 * STYLE SELECTOR TYPES
 * ============================================
 *
 * Types for the gallery-first style selection flow.
 * A user browses 686 collage images, optionally filters
 * by question-option chips, then picks one collage.
 * The stored selection carries collage ID + tag tally
 * (one option label per question) for use downstream
 * in Arc Assembler as placeholder text.
 *
 * @module types/style-selector
 */

// ============================================
// SELECTION OUTPUT
// ============================================

/**
 * The persisted style selection for a project.
 * Stored as JSON in the `style_selection` DB column.
 */
export interface StyleSelection {
  /** Numeric collage ID (1–686) */
  collageId: number;
  /**
   * Tag tally — one selected option label per question.
   * Keys are question IDs from styleMatcherData.
   * Values are the option labels deterministically
   * assigned to this collage.
   */
  tags: Record<string, string>;
}

// ============================================
// FILTER STATE
// ============================================

/**
 * Active filter chips, one selection per question.
 * Empty string = no active filter for that question.
 * Omitted key = no active filter for that question.
 */
export type FilterState = Record<string, string>;

// ============================================
// HOOK CONTEXT
// ============================================

/**
 * Value provided by StyleSelectorProvider.
 */
export interface StyleSelectorContextValue {
  /** Currently active filter chips (questionId → optionLabel) */
  filters: FilterState;
  /** Collage IDs that pass all active filters */
  filteredIds: number[];
  /** Currently selected collage (null = nothing selected yet) */
  selectedCollage: StyleSelection | null;
  /** Toggle a filter chip; deselects if already active */
  toggleFilter: (questionId: string, optionLabel: string) => void;
  /** Clear all active filter chips */
  clearFilters: () => void;
  /** Select a collage (deselects current if same ID tapped twice) */
  selectCollage: (id: number) => void;
  /** Persist selection + mark in review. Returns false if nothing selected. */
  confirmSelection: () => Promise<boolean>;
  /** True while the initial DB load is in flight */
  isLoading: boolean;
}
