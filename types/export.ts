/**
 * @module types/export
 */

export interface PipelineExport {
  meta: { prospectName: string; postName: string; exportedAt: string };
  script: string;
  styleSelection: unknown | null;
  scenes: unknown[];
  subjects: unknown[];
  arcAssembler: unknown | null;
}
