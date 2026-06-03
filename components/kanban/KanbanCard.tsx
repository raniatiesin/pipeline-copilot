/**
 * ============================================
 * KANBAN CARD COMPONENT
 * ============================================
 *
 * Kanban item card rendered with the universal scene-style card module.
 *
 * Visual features:
 * - Wide rectangular cards (aspect ratio from kanbanLayout)
 * - Scene-style header: module icon, title pill, progress percent
 * - Description in the lower body section
 *
 * @module components/kanban/KanbanCard
 */

import { Feather } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';

import { MODULE_CONFIG } from '@/constants/kanbanTheme';
import { useKanban } from '@/hooks/useKanban';
import type { KanbanCardProps } from '@/types/kanban';

import { UniversalModuleCard } from '../ui/card';

// ============================================
// MAIN COMPONENT
// ============================================

export const KanbanCard = React.memo(function KanbanCard({
  item,
  onPress,
  cardWidth,
}: KanbanCardProps) {
  const { updateNote } = useKanban();

  // Derive icon once
  const iconName = useMemo(() => {
    const moduleConfig = item.moduleId
      ? MODULE_CONFIG[item.moduleId as keyof typeof MODULE_CONFIG]
      : null;
    return (item.icon || moduleConfig?.icon || 'box') as keyof typeof Feather.glyphMap;
  }, [item.moduleId, item.icon]);

  const handlePress = useCallback(() => {
    onPress?.(item);
  }, [item, onPress]);

  const handleNoteChange = useCallback((note: string) => {
    updateNote(item.id, note);
  }, [item.id, updateNote]);

  // Card dimensions — width from column, aspect ratio for height
  const effectiveWidth = cardWidth || 300;

  return (
    <UniversalModuleCard
      onPress={handlePress}
      iconName={iconName}
      title={item.title}
      progressPercent={item.progress ?? 0}
      description={item.description}
      noteText={item.quickNote ?? ''}
      isOutdated={item.isOutdated}
      onChangeNote={handleNoteChange}
      accessibilityLabel={`${item.title}. ${item.description || ''}`}
      accessibilityHint="Double tap to open"
      style={{ width: effectiveWidth }}
    />
  );
});
