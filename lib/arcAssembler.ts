/**
 * ============================================
 * ARC ASSEMBLER — PURE LOGIC
 * ============================================
 *
 * Stateless utility functions for parsing upstream DB columns
 * and deriving UI-ready data for the Arc Assembler screen.
 * No React, no side effects.
 *
 * @module lib/arcAssembler
 */

import type { ArcAssemblerOutput } from '@/types/arc-assembler';
import type { Scene, SubjectCategory } from '@/types/scene-segmentation';

// ============================================
// DB COLUMN PARSERS
// ============================================

/**
 * Parse the beat_butcher_output JSON column into Scene[].
 * Returns an empty array on any error or missing data.
 */
export function parseScenes(json: string | null | undefined): Scene[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed as Scene[];
    return [];
  } catch {
    return [];
  }
}

/**
 * Parse the entity_editor_output JSON column into SubjectCategory[].
 * Returns an empty array on any error or missing data.
 */
export function parseSubjectCategories(json: string | null | undefined): SubjectCategory[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed as SubjectCategory[];
    return [];
  } catch {
    return [];
  }
}

/**
 * Parse the arc_assembler_output JSON column into ArcAssemblerOutput.
 * Returns empty maps on any error or missing data.
 */
export function parseArcOutput(json: string | null | undefined): ArcAssemblerOutput {
  if (!json) return { sceneBriefs: {}, subjectBriefs: {} };
  try {
    const parsed = JSON.parse(json) as Partial<ArcAssemblerOutput>;
    return {
      sceneBriefs: typeof parsed.sceneBriefs === 'object' && parsed.sceneBriefs !== null
        ? parsed.sceneBriefs
        : {},
      subjectBriefs: typeof parsed.subjectBriefs === 'object' && parsed.subjectBriefs !== null
        ? parsed.subjectBriefs
        : {},
    };
  } catch {
    return { sceneBriefs: {}, subjectBriefs: {} };
  }
}

// ============================================
// PLACEHOLDER TEXT
// ============================================

/**
 * Build a comma-separated placeholder string from a style tag tally.
 * Used in TextInput placeholders for both Scene Mode and Subject Mode.
 * Returns an empty string if tags are not yet set.
 *
 * @param tags  Record<questionId, optionLabel> from StyleSelection
 */
export function buildTagsPlaceholder(tags: Record<string, string> | null | undefined): string {
  if (!tags) return '';
  const values = Object.values(tags).filter(Boolean);
  return values.join(', ');
}

// ============================================
// SCENE APPEARANCE LOOKUP
// ============================================

/**
 * Returns the list of scene indices where a given SubjectCategory appears.
 * A category "appears" in a scene when at least one of that scene's
 * Subject entries has categoryId === category.id.
 *
 * @param categoryId   SubjectCategory.id
 * @param scenes       Full scene array from Beat Butcher
 */
export function getSceneIndicesForCategory(
  categoryId: string,
  scenes: Scene[],
): number[] {
  const indices: number[] = [];
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const hasCategory = scene.subjects.some(s => s.categoryId === categoryId);
    if (hasCategory) indices.push(i);
  }
  return indices;
}
