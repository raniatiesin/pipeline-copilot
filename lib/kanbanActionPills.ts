import type { KanbanItem, KanbanStatus } from '@/types/kanban';

import { isSoleIncompleteCard } from './kanbanLogic';

const FINISH_COLOR = '#7c3aed';

export const FOOTER_PILL: Partial<Record<KanbanStatus, { label: string; color: string }>> = {
  'up-next': { label: 'Start', color: '#ffc22a' },
  'in-progress': { label: 'Continue', color: '#e8824f' },
  'in-review': { label: 'Review', color: FINISH_COLOR },
};

/**
 * Project card action pills — each pill is labeled and colored as its DESTINATION column.
 * Spec: card's current column → pills (label and style match destination column header pill).
 */
export const PROJECT_CARD_PILLS: Partial<
  Record<KanbanStatus, Array<{ side: 'left' | 'right'; label: string; targetStatus: KanbanStatus }>>
> = {
  // Waiting: 1 pill, right → "Up Next"
  waiting: [{ side: 'right', label: 'Up Next', targetStatus: 'up-next' }],
  // Up Next: left "Waiting" — right "In Progress"
  'up-next': [
    { side: 'left', label: 'Waiting', targetStatus: 'waiting' },
    { side: 'right', label: 'In Progress', targetStatus: 'in-progress' },
  ],
  // In Progress: left "Up Next" — right "In Review"
  'in-progress': [
    { side: 'left', label: 'Up Next', targetStatus: 'up-next' },
    { side: 'right', label: 'In Review', targetStatus: 'in-review' },
  ],
  // In Review: left "In Progress" — right "Done"
  'in-review': [
    { side: 'left', label: 'In Progress', targetStatus: 'in-progress' },
    { side: 'right', label: 'Done', targetStatus: 'done' },
  ],
  // Done: 1 pill, left "In Review"
  done: [{ side: 'left', label: 'In Review', targetStatus: 'in-review' }],
};

export function getProjectCardPillConfig(
  item: KanbanItem,
): Array<{ side: 'left' | 'right'; label: string; targetStatus: KanbanStatus }> | undefined {
  return item.status ? PROJECT_CARD_PILLS[item.status] : undefined;
}

export function getFooterPillConfig(
  focusedStatus: KanbanStatus,
  allItems: KanbanItem[],
): { label: string; color: string } | undefined {
  const base = FOOTER_PILL[focusedStatus];
  if (!base) return undefined;

  if (focusedStatus === 'in-progress') {
    const priority = allItems.find(
      (i) =>
        i.status === 'in-progress' &&
        isSoleIncompleteCard(i, allItems),
    );
    if (priority) {
      return { label: 'Finish', color: FINISH_COLOR };
    }
  }

  return base;
}