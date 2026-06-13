import { MODULE_ORDER } from '@/constants/kanbanTheme';
import type { KanbanItem, KanbanStatus } from '@/types/kanban';

/** Priority: in-progress > up-next > in-review > done > todo */
export function getActiveColumnStatus(items: KanbanItem[]): KanbanStatus {
  const statuses = items.map((i) => i.status);
  if (statuses.includes('in-progress')) return 'in-progress';
  if (statuses.includes('up-next')) return 'up-next';
  if (statuses.includes('in-review')) return 'in-review';
  if (statuses.every((s) => s === 'done')) return 'done';
  return 'waiting';
}

/** Returns the item to act on when a column has multiple cards — first by MODULE_ORDER */
export function getPriorityItemInStatus(
  items: KanbanItem[],
  status: KanbanStatus,
): KanbanItem | undefined {
  const inStatus = items.filter((i) => i.status === status);
  return MODULE_ORDER.map((id) => inStatus.find((i) => i.moduleId === id)).find(Boolean);
}

/** True when this is the only stage card with progress < 100 */
export function isSoleIncompleteCard(item: KanbanItem, allItems: KanbanItem[]): boolean {
  if (item.status !== 'in-progress') return false;
  const incomplete = allItems.filter((i) => (i.progress ?? 0) < 100);
  return incomplete.length === 1 && incomplete[0].id === item.id;
}
