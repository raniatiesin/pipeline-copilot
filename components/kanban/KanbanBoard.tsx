/**
 * ============================================
 * KANBAN BOARD COMPONENT
 * ============================================
 *
 * Main Kanban board with horizontally paged columns.
 * Swipe left/right to navigate between columns.
 * Tabs stay fixed at top and sync with scroll position.
 *
 * Features:
 * - Paged horizontal scroll with snap
 * - Tab sync with scroll position
 * - AddProjectButton surfaced in To Do column via onAddProject prop
 * - No drag-and-drop (status derived from progress)
 *
 * @example
 * ```tsx
 * <KanbanProvider initialItems={items}>
 *   <KanbanBoard onItemPress={handleItemPress} onAddProject={handleAddProject} />
 * </KanbanProvider>
 * ```
 *
 * @module components/kanban/KanbanBoard
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { KANBAN_STATUS, KANBAN_STATUS_ORDER } from '@/constants/kanbanStatus';
import { colors } from '@/constants/theme';
import { useKanban } from '@/hooks/useKanban';
import type { KanbanBoardProps, KanbanItem, KanbanStatus } from '@/types/kanban';

import { KanbanColumn } from './KanbanColumn';

// ============================================
// MAIN COMPONENT
// ============================================

export function KanbanBoard({
  onItemPress,
  onAction,
  onPageChange,
  onAddProject,
}: KanbanBoardProps) {
  const { width } = useWindowDimensions();
  const kanban = useKanban();

  // 85% columns with 15% peek of the next column
  const columnWidth = Math.floor(width * 0.85);
  const snapInterval = columnWidth;

  // Get counts for all statuses
  const counts = useMemo(() => {
    const result = {} as Record<KanbanStatus, number>;
    KANBAN_STATUS_ORDER.forEach((status) => {
      result[status] = kanban.getCountByStatus(status);
    });
    return result;
  }, [kanban]);

  // Get items grouped by status
  const itemsByStatus = useMemo(() => {
    const result = {} as Record<KanbanStatus, KanbanItem[]>;
    KANBAN_STATUS_ORDER.forEach((status) => {
      result[status] = kanban.getItemsByStatus(status);
    });
    return result;
  }, [kanban]);

  // Track previous page for haptic feedback
  const previousPageRef = useRef(0);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const pageIndex = Math.round(offsetX / snapInterval);
      const clampedIndex = Math.max(0, Math.min(pageIndex, KANBAN_STATUS_ORDER.length - 1));

      if (Platform.OS !== 'web' && clampedIndex !== previousPageRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        previousPageRef.current = clampedIndex;
      }

      kanban.setPageIndex(clampedIndex);
      onPageChange?.(clampedIndex);
    },
    [snapInterval, kanban, onPageChange]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled={false}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {KANBAN_STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            items={itemsByStatus[status] || []}
            count={counts[status] || 0}
            onCardPress={onItemPress}
            columnWidth={columnWidth}
            // AddProjectButton only wired into the To Do column
            onAddProject={status === KANBAN_STATUS.TODO ? onAddProject : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // No gap, no padding — full-width columns, paging handles alignment
  },
});
