/**
 * ============================================
 * STYLE SELECTOR — PURE LOGIC
 * ============================================
 *
 * Stateless utility functions for the gallery-based style
 * selection flow. No React, no side effects.
 *
 * Tag Tally Strategy
 * ------------------
 * No curated per-collage tag data exists yet. We use a
 * deterministic seeded formula to assign one question option
 * to each collage per question:
 *
 *   index = (collageId * 7 + question.order * 13) % options.length
 *
 * This gives an even distribution across all 686 collages
 * and all 12 question dimensions. The formula is stable —
 * the same collageId always returns the same tags.
 *
 * To replace with curated data: swap `getCollageTags` to
 * read from a JSON map instead of computing. Everything
 * downstream (filter logic, persistence) stays the same.
 *
 * @module lib/styleSelector
 */

import { styleMatcherData } from '@/constants/styleMatcherData';
import type { FilterState, StyleSelection } from '@/types/style-selector';

// Total number of collage images available (1 … COLLAGE_COUNT)
export const COLLAGE_COUNT = 686;

// Pre-compute the full list of valid IDs (1-indexed)
export const ALL_COLLAGE_IDS: number[] = Array.from(
  { length: COLLAGE_COUNT },
  (_, i) => i + 1,
);

// ============================================
// TAG TALLY
// ============================================

/**
 * Returns a deterministic tag map for a collage.
 * Keys = question IDs from styleMatcherData.
 * Values = one option label per question, picked by seed formula.
 *
 * @param collageId  Numeric collage ID (1–686)
 */
export function getCollageTags(collageId: number): Record<string, string> {
  const result: Record<string, string> = {};
  for (const question of styleMatcherData) {
    if (question.options.length === 0) continue;
    const idx =
      ((collageId * 7 + question.order * 13) % question.options.length +
        question.options.length) %
      question.options.length;
    result[question.id] = question.options[idx].label;
  }
  return result;
}

// ============================================
// FILTER LOGIC (AND-intersection)
// ============================================

/**
 * Returns the subset of collage IDs that satisfy all active filters.
 *
 * Rules:
 * - No active filters → all IDs returned (unfiltered gallery)
 * - Each active filter: collage's tag for that question must equal
 *   the selected option label (AND logic across questions)
 *
 * @param filters   Currently active chips (questionId → optionLabel)
 */
export function filterCollages(filters: FilterState): number[] {
  const activeEntries = Object.entries(filters).filter(([, v]) => v !== '');

  if (activeEntries.length === 0) {
    return ALL_COLLAGE_IDS;
  }

  return ALL_COLLAGE_IDS.filter(id => {
    const tags = getCollageTags(id);
    return activeEntries.every(([questionId, optionLabel]) => {
      return tags[questionId] === optionLabel;
    });
  });
}

// ============================================
// SELECTION HELPERS
// ============================================

/**
 * Build a full StyleSelection object for a given collage ID.
 * Collects the deterministic tags to store alongside the ID.
 */
export function buildSelection(collageId: number): StyleSelection {
  return {
    collageId,
    tags: getCollageTags(collageId),
  };
}

/**
 * Parse a StyleSelection from a JSON string (from the DB).
 * Returns null on parse error or missing data.
 */
export function parseStyleSelection(json: string | null | undefined): StyleSelection | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<StyleSelection>;
    if (
      typeof parsed.collageId === 'number' &&
      parsed.collageId >= 1 &&
      parsed.collageId <= COLLAGE_COUNT &&
      typeof parsed.tags === 'object' &&
      parsed.tags !== null
    ) {
      return parsed as StyleSelection;
    }
    return null;
  } catch {
    return null;
  }
}
