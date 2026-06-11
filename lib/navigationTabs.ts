import type { NavigationTab } from '@/types/kanban';

export function getProjectTabs(
  projectNumber: number,
  postName: string,
  projectId: string,
): NavigationTab[] {
  return [
    { label: `Project #${projectNumber}`, route: '/project' },
    {
      label: postName,
      route: '/stages',
      params: {
        projectId,
        projectNumber: String(projectNumber),
        title: postName,
      },
    },
  ];
}
