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

export interface StageCardStatus {
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

export const DEFAULT_STAGE_STATUS: StageCardStatus = {
  progress: 0,
  isApproved: false,
  isOutdated: false,
  quickNote: '',
};

// ============================================
// STATUS DERIVATION (progress + unlock chain)
// ============================================

/** style-selector and beat-butcher are always unlocked; others follow the chain. */
export function isModuleUnlocked(moduleId: string, statuses: CardStatuses): boolean {
  switch (moduleId) {
    case 'style-selector':
    case 'beat-butcher':
      return true;
    case 'entity-editor':
      return (statuses['beat-butcher']?.progress ?? 0) >= 100;
    case 'arc-assembler':
      return (statuses['entity-editor']?.progress ?? 0) >= 100;
    default:
      return false;
  }
}

/**
 * Derive Kanban column status from progress, isApproved, and unlock chain.
 * Status is never stored — always computed.
 */
export function deriveStageStatus(
  moduleId: string,
  card: StageCardStatus,
  statuses: CardStatuses,
): KanbanStatus {
  const progress = card.progress ?? 0;

  if (card.isApproved && progress >= 100) return KANBAN_STATUS.DONE;
  if (progress >= 100) return KANBAN_STATUS.IN_REVIEW;
  if (progress > 0) return KANBAN_STATUS.IN_PROGRESS;
  if (isModuleUnlocked(moduleId, statuses)) return KANBAN_STATUS.UP_NEXT;
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

function toBool(value: unknown): boolean {
  return value === true || value === 1 || value === 'true' || value === '1';
}

function coerceCardStatus(raw: Partial<StageCardStatus> | undefined): StageCardStatus {
  if (!raw) return { ...DEFAULT_STAGE_STATUS };

  const progressRaw = raw.progress;
  const progressNum =
    typeof progressRaw === 'number'
      ? progressRaw
      : typeof progressRaw === 'string'
        ? Number(progressRaw)
        : 0;

  return {
    progress: Number.isFinite(progressNum)
      ? Math.max(0, Math.min(100, progressNum))
      : 0,
    isApproved: toBool(raw.isApproved),
    isOutdated: toBool(raw.isOutdated),
    quickNote: typeof raw.quickNote === 'string' ? raw.quickNote : '',
  };
}

/** Apply creation defaults when card_statuses is empty or missing module entries. */
function normalizeCardStatuses(statuses: CardStatuses): CardStatuses {
  const hasStoredProgress = (MODULE_ORDER as readonly string[]).some(
    moduleId => statuses[moduleId]?.progress !== undefined && statuses[moduleId]?.progress !== null,
  );

  if (!hasStoredProgress) {
    return {
      'beat-butcher': { ...DEFAULT_STAGE_STATUS, progress: 50 },
      'style-selector': { ...DEFAULT_STAGE_STATUS, progress: 0 },
      'entity-editor': { ...DEFAULT_STAGE_STATUS, progress: 0 },
      'arc-assembler': { ...DEFAULT_STAGE_STATUS, progress: 0 },
    };
  }

  const result: CardStatuses = {};
  for (const moduleId of MODULE_ORDER) {
    result[moduleId] = coerceCardStatus(statuses[moduleId]);
  }
  return result;
}

export function parseCardStatuses(raw: unknown): CardStatuses {
  if (raw == null) return normalizeCardStatuses({});

  if (typeof raw === 'object') {
    return normalizeCardStatuses(raw as CardStatuses);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return normalizeCardStatuses({});
    try {
      const parsed = JSON.parse(trimmed) as CardStatuses;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return normalizeCardStatuses(parsed);
      }
    } catch {
      // fall through
    }
  }

  return normalizeCardStatuses({});
}

function cardStatus(statuses: CardStatuses, moduleId: string): StageCardStatus {
  return coerceCardStatus(statuses[moduleId]);
}

/** Overall project progress = average of all 4 stage card progress values. */
export function computeProjectProgress(cardStatusesJson: unknown): number {
  const statuses = parseCardStatuses(cardStatusesJson);
  const bb = cardStatus(statuses, 'beat-butcher').progress;
  const ss = cardStatus(statuses, 'style-selector').progress;
  const ee = cardStatus(statuses, 'entity-editor').progress;
  const aa = cardStatus(statuses, 'arc-assembler').progress;
  return Math.round((bb + ss + ee + aa) / 4);
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
  const statuses = parseCardStatuses(row.card_statuses);

  return (MODULE_ORDER as readonly string[]).map(moduleId => {
    const s = cardStatus(statuses, moduleId);
    const cfg = STAGE_CONFIG[moduleId];
    return {
      id: moduleId,
      title: cfg.title,
      description: cfg.description,
      icon: cfg.icon,
      moduleId,
      status: deriveStageStatus(moduleId, s, statuses),
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
    'beat-butcher': {
      ...DEFAULT_STAGE_STATUS,
      progress: 50,
    },
    'style-selector': {
      ...DEFAULT_STAGE_STATUS,
      progress: 0,
    },
    'entity-editor': {
      ...DEFAULT_STAGE_STATUS,
      progress: 0,
    },
    'arc-assembler': {
      ...DEFAULT_STAGE_STATUS,
      progress: 0,
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
 * Updates a single stage card's progress (0–100) in card_statuses.
 * Progress only increases unless explicitly set lower via updateProgress in useKanban.
 */
export async function updateCardProgress(
  projectId: string,
  moduleId: string,
  progress: number,
): Promise<void> {
  const row = await getProject(projectId);
  if (!row) return;

  const statuses = parseCardStatuses(row.card_statuses);
  const current = cardStatus(statuses, moduleId);
  const clamped = Math.max(0, Math.min(100, progress));

  const next: CardStatuses = {
    ...statuses,
    [moduleId]: {
      ...current,
      progress: Math.max(current.progress, clamped),
    },
  };

  await updateProject(projectId, { card_statuses: JSON.stringify(next) });
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
