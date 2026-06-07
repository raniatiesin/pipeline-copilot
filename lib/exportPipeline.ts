/**
 * ============================================
 * EXPORT PIPELINE — JSON SERIALISER
 * ============================================
 *
 * Pure function — takes a raw pipeline row and returns a structured
 * export object suitable for JSON serialisation and clipboard copy.
 *
 * @module lib/exportPipeline
 */

import type { RawPipelineRow } from '../types/kanban';
import type { PipelineExport } from '../types/export';

/**
 * Converts a raw pipeline DB row into a clean, structured export object.
 * All JSON columns are parsed; missing columns default to null / [].
 */
export function exportPipeline(row: RawPipelineRow): PipelineExport {
  const safeParse = (value: string | null): unknown => {
    if (!value) return null;
    try { return JSON.parse(value); } catch { return null; }
  };

  const safeParseArray = (value: string | null): unknown[] => {
    const parsed = safeParse(value);
    return Array.isArray(parsed) ? parsed : [];
  };

  return {
    meta: {
      prospectName: row.prospect_name,
      postName: row.post_name,
      exportedAt: new Date().toISOString(),
    },
    script: row.script,
    styleSelection: safeParse(row.style_selection),
    scenes: safeParseArray(row.beat_butcher_output),
    subjects: safeParseArray(row.entity_editor_output),
    arcAssembler: safeParse(row.arc_assembler_output),
  };
}
