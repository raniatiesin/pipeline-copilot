/**
 * ============================================
 * KANBAN BOARD COMPONENT
 * ============================================
 *
 * Horizontally scrollable Kanban board with 88%-width columns.
 * Each column peeks at ~12% so the user knows there is more to swipe.
 * Snaps cleanly to column boundaries via snapToInterval.
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

  // 88% column width — next column peeks at ~12%
  const columnWidth = width * 0.88;

  const counts = useMemo(() => {
    const result = {} as Record<KanbanStatus, number>;
    KANBAN_STATUS_ORDER.forEach((status) => {
      result[status] = kanban.getCountByStatus(status);
    });
    return result;
  }, [kanban]);

  const itemsByStatus = useMemo(() => {
    const result = {} as Record<KanbanStatus, KanbanItem[]>;
    KANBAN_STATUS_ORDER.forEach((status) => {
      result[status] = kanban.getItemsByStatus(status);
    });
    return result;
  }, [kanban]);

  const previousPageRef = useRef(0);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const pageIndex = Math.round(offsetX / columnWidth);
      const clampedIndex = Math.max(0, Math.min(pageIndex, KANBAN_STATUS_ORDER.length - 1));

      if (Platform.OS !== 'web' && clampedIndex !== previousPageRef.current) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        previousPageRef.current = clampedIndex;
      }

      kanban.setPageIndex(clampedIndex);
      onPageChange?.(clampedIndex);
    },
    [columnWidth, kanban, onPageChange],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        decelerationRate="fast"
        snapToInterval={columnWidth}
        snapToAlignment="start"
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
    // No extra padding — 88% column width creates the natural peek
  },
});
