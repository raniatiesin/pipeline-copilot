import { colors } from '@/constants/theme';
import type { KanbanItem, KanbanStatus } from '@/types/kanban';

import { isSoleIncompleteCard } from './kanbanLogic';

const FINISH_COLOR = '#7c3aed';

export const STAGE_CARD_PILL: Partial<Record<KanbanStatus, { label: string; color: string }>> = {
  'up-next': { label: 'Continue', color: colors.secondary },
  'in-progress': { label: 'Continue', color: colors.secondary },
  'in-review': { label: 'Mark Done', color: colors.accent },
};

export const FOOTER_PILL: Partial<Record<KanbanStatus, { label: string; color: string }>> = {
  'up-next': { label: 'Start', color: colors.accentAlt },
  'in-progress': { label: 'Continue', color: colors.secondary },
  'in-review': { label: 'Review', color: FINISH_COLOR },
};

export const PROJECT_CARD_PILLS: Partial<
  Record<KanbanStatus, Array<{ label: string; color: string; side: 'left' | 'right' }>>
> = {
  'up-next': [{ label: 'Start', color: colors.secondary, side: 'right' }],
  // TODO(archive): left "Archive" pill — needs an `archived` column
  'in-progress': [{ label: 'Continue', color: colors.secondary, side: 'right' }],
  'in-review': [
    { label: 'Edit', color: colors.secondary, side: 'left' },
    { label: 'Finish', color: colors.accent, side: 'right' },
  ],
  done: [{ label: 'Review', color: FINISH_COLOR, side: 'left' }],
};

export function getStageCardPillConfig(
  item: KanbanItem,
  allItems: KanbanItem[],
): { label: string; color: string } | undefined {
  const base = item.status ? STAGE_CARD_PILL[item.status] : undefined;
  if (!base) return undefined;

  if (
    item.status === 'in-progress' &&
    isSoleIncompleteCard(item, allItems)
  ) {
    return { label: 'Finish', color: FINISH_COLOR };
  }

  return base;
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
