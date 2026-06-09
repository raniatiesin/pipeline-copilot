/**
 * ============================================
 * DATABASE — THIN POWERSYNC WRAPPER
 * ============================================
 *
 * All reads go through PowerSync watched queries (SQLite, offline-first).
 * All writes go through PowerSync.execute() — changes are synced to
 * Supabase automatically when the device is online.
 *
 * Data model:
 *   pipelines — one row per project
 *   card_statuses JSON column — stores stage card state for all 4 modules
 *
 * @module lib/database
 */

import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { MODULE_ORDER } from '@/constants/kanbanTheme';
import type { KanbanItem, KanbanStatus } from '@/types/kanban';
import { powerSyncDb } from './powersync';

// ============================================
// TYPES
// ============================================

/** Status token stored in card_statuses JSON */
export type StoredStageStatus = 'TODO' | 'UP_NEXT' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface StageCardStatus {
  status?: StoredStageStatus | string;
  progress: number;
  isApproved: boolean;
  isOutdated: boolean;
  quickNote: string;
}

export type CardStatuses = Record<string, StageCardStatus>;

export interface PipelineRow {
  id: string;
  prospect_name: string;
  post_name: string;
  script: string;
  style_selection:      string | null;
  beat_butcher_output:  string | null;
  entity_editor_output: string | null;
  arc_assembler_output: string | null;
  card_statuses:        string | null;  // JSON: CardStatuses
  created_at:           string;
  updated_at:           string;
}

/** Fields accepted by updateProject() — snake_case, matching DB columns */
export interface PipelineUpdate {
  prospect_name?:        string;
  post_name?:            string;
  script?:               string;
  style_selection?:      string;
  beat_butcher_output?:  string;
  entity_editor_output?: string;
  arc_assembler_output?: string;
  card_statuses?:        string;
}

// ============================================
// STAGE CONFIG
// ============================================

const DEFAULT_STAGE_STATUS: StageCardStatus = {
  status: 'TODO',
  progress: 0,
  isApproved: false,
  isOutdated: false,
  quickNote: '',
};

// ============================================
// STATUS HELPERS
// ============================================

export function kanbanToStoredStatus(status: KanbanStatus): StoredStageStatus {
  switch (status) {
    case KANBAN_STATUS.TODO:
      return 'TODO';
    case KANBAN_STATUS.UP_NEXT:
      return 'UP_NEXT';
    case KANBAN_STATUS.IN_PROGRESS:
      return 'IN_PROGRESS';
    case KANBAN_STATUS.IN_REVIEW:
      return 'IN_REVIEW';
    case KANBAN_STATUS.DONE:
      return 'DONE';
    default:
      return 'TODO';
  }
}

export function storedStatusToKanban(stored: string | undefined): KanbanStatus | null {
  if (!stored) return null;
  switch (stored.toUpperCase()) {
    case 'TODO':
      return KANBAN_STATUS.TODO;
    case 'UP_NEXT':
      return KANBAN_STATUS.UP_NEXT;
    case 'IN_PROGRESS':
      return KANBAN_STATUS.IN_PROGRESS;
    case 'IN_REVIEW':
      return KANBAN_STATUS.IN_REVIEW;
    case 'DONE':
      return KANBAN_STATUS.DONE;
    default:
      return null;
  }
}

/** Resolve column status from stored card_statuses entry (legacy progress fallback). */
export function resolveKanbanStatus(card: StageCardStatus): KanbanStatus {
  const fromStored = storedStatusToKanban(card.status);
  if (fromStored) return fromStored;

  if (card.isApproved) return KANBAN_STATUS.DONE;
  if (card.progress >= 100) return KANBAN_STATUS.IN_REVIEW;
  if (card.progress > 0) return KANBAN_STATUS.IN_PROGRESS;
  return KANBAN_STATUS.TODO;
}

const STAGE_CONFIG: Record<string, {
  title: string;
  description: string;
  icon: string;
  order: number;
  priority: 'high' | 'medium';
}> = {
  'style-selector': {
    title: 'Style Selector',
    description: 'Browse and select one of 690 offline visual style collages to anchor the project aesthetic.',
    icon: 'image',
    order: 1,
    priority: 'high',
  },
  'beat-butcher': {
    title: 'Beat Butcher',
    description: 'Segment the script into beats and scenes using gestures — split, merge, reorder.',
    icon: 'scissors',
    order: 2,
    priority: 'high',
  },
  'entity-editor': {
    title: 'Entity Editor',
    description: 'Identify and catalogue recurring subjects across all scenes.',
    icon: 'users',
    order: 3,
    priority: 'medium',
  },
  'arc-assembler': {
    title: 'Arc Assembler',
    description: 'Combine scenes, subjects, and style into a complete visual brief for each beat.',
    icon: 'map',
    order: 4,
    priority: 'medium',
  },
};

// ============================================
// ROW → KANBAN ITEM MAPPERS
// ============================================

/**
 * Derive overall project progress from card_statuses.
 * Returns 10 minimum so the project card always derives to IN_PROGRESS.
 */
function computeProjectProgress(cardStatusesJson: string | null): number {
  if (!cardStatusesJson) return 10;
  try {
    const statuses: CardStatuses = JSON.parse(cardStatusesJson);
    const done = MODULE_ORDER.filter((m) => {
      const s = statuses[m];
      if (!s) return false;
      return resolveKanbanStatus(s) === KANBAN_STATUS.DONE;
    }).length;
    return Math.max(10, Math.round((done / MODULE_ORDER.length) * 100));
  } catch {
    return 10;
  }
}

/**
 * Maps a single pipeline row to a project-level KanbanItem
 * (the card shown in the Projects Kanban).
 */
export function rowToProjectItem(row: PipelineRow): KanbanItem {
  return {
    id: row.id,
    title: row.prospect_name,
    description: row.post_name,
    moduleId: 'project',
    icon: 'film',
    status: KANBAN_STATUS.IN_PROGRESS,
    order: new Date(row.created_at).getTime(),
    progress: computeProjectProgress(row.card_statuses),
    priority: 'high',
    script: row.script,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * Maps a single pipeline row to 4 stage KanbanItems
 * (the cards shown in the Stages Kanban for that project).
 */
export function rowToStageItems(row: PipelineRow): KanbanItem[] {
  let statuses: CardStatuses = {};
  if (row.card_statuses) {
    try { statuses = JSON.parse(row.card_statuses); } catch { /* use defaults */ }
  }

  return (MODULE_ORDER as readonly string[]).map(moduleId => {
    const s: StageCardStatus = { ...DEFAULT_STAGE_STATUS, ...(statuses[moduleId] ?? {}) };
    const cfg = STAGE_CONFIG[moduleId];
    return {
      id: moduleId,
      title: cfg.title,
      description: cfg.description,
      icon: cfg.icon,
      moduleId,
      status: resolveKanbanStatus(s),
      order: cfg.order,
      progress: s.progress,
      isApproved: s.isApproved,
      isOutdated: s.isOutdated,
      quickNote: s.quickNote,
      priority: cfg.priority,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  });
}

// ============================================
// WATCHED QUERIES
// ============================================

/**
 * One-time read of all pipelines.
 * Used to populate initial state before watching for changes.
 */
export async function getProjects(): Promise<PipelineRow[]> {
  const result = await powerSyncDb.getAll(
    'SELECT * FROM pipelines ORDER BY created_at DESC'
  );
  return (result as PipelineRow[]) ?? [];
}

/**
 * Watches all pipeline rows (projects).
 * Yields a new array each time the DB changes.
 */
export async function* watchProjects(): AsyncGenerator<PipelineRow[]> {
  for await (const result of powerSyncDb.watch(
    'SELECT * FROM pipelines ORDER BY created_at DESC',
    [],
  )) {
    const rows = (result.rows?._array as PipelineRow[]) ?? [];
    yield rows;
  }
}

/**
 * Watches a single pipeline row (one project's stage data).
 * Yields each time the row changes.
 */
export async function* watchProject(projectId: string): AsyncGenerator<PipelineRow[]> {
  for await (const result of powerSyncDb.watch(
    'SELECT * FROM pipelines WHERE id = ? LIMIT 1',
    [projectId],
  )) {
    const rows = (result.rows?._array as PipelineRow[]) ?? [];
    yield rows;
  }
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Generates a valid UUID v4 using the native crypto API.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a new pipeline row with default card_statuses.
 * Returns the new project id.
 */
export async function createProject(data: {
  prospectName: string;
  postName: string;
  script: string;
}): Promise<string> {
  const id = generateUUID();
  const now = new Date().toISOString();

  const defaultStatuses: CardStatuses = {
    'style-selector': {
      ...DEFAULT_STAGE_STATUS,
      status: 'UP_NEXT',
    },
    'beat-butcher': {
      ...DEFAULT_STAGE_STATUS,
      status: 'IN_PROGRESS',
    },
    'entity-editor': {
      ...DEFAULT_STAGE_STATUS,
      status: 'TODO',
    },
    'arc-assembler': {
      ...DEFAULT_STAGE_STATUS,
      status: 'TODO',
    },
  };

  await powerSyncDb.execute(
    `INSERT INTO pipelines
      (id, prospect_name, post_name, script, card_statuses, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.prospectName,
      data.postName,
      data.script ?? '',
      JSON.stringify(defaultStatuses),
      now,
      now,
    ],
  );

  return id;
}

export async function getProject(projectId: string): Promise<PipelineRow | null> {
  const result = await powerSyncDb.getAll(
    'SELECT * FROM pipelines WHERE id = ? LIMIT 1',
    [projectId],
  );
  const rows = (result as PipelineRow[]) ?? [];
  return rows[0] ?? null;
}

/**
 * Deletes a pipeline row by id.
 */
export async function deleteProject(id: string): Promise<void> {
  await powerSyncDb.execute('DELETE FROM pipelines WHERE id = ?', [id]);
}

/**
 * Updates fields on an existing pipeline row.
 * Keys must be snake_case DB column names.
 */
export async function updateProject(
  id: string,
  updates: PipelineUpdate,
): Promise<void> {
  const keys = Object.keys(updates) as (keyof PipelineUpdate)[];
  if (keys.length === 0) return;

  const now = new Date().toISOString();
  const setClauses = keys.map(k => `${k} = ?`).join(', ');
  const values = keys.map(k => updates[k]);

  await powerSyncDb.execute(
    `UPDATE pipelines SET ${setClauses}, updated_at = ? WHERE id = ?`,
    [...values, now, id],
  );
}
