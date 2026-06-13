/**
 * ============================================
 * KANBAN BOARD COMPONENT
 * ============================================
 *
 * Horizontally scrollable Kanban board with 88%-width columns,
 * each snapped and centered in the viewport.
 *
 * @module components/kanban/KanbanBoard
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { hapticTriggers } from '@/constants/haptics';
import { KANBAN_STATUS, KANBAN_STATUS_ORDER } from '@/constants/kanbanStatus';
import { kanbanLayout } from '@/constants/kanbanTheme';
import { colors, spacing } from '@/constants/theme';
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
  autoFocusStatus,
  autoFocusKey = 0,
  projectNumbers,
}: KanbanBoardProps) {
  const { width } = useWindowDimensions();
  const kanban = useKanban();
  const scrollRef = useRef<ScrollView>(null);

  const columnWidth = width * 0.88;
  const columnGap = kanbanLayout.columnGap;
  const snapInterval = columnWidth + columnGap;
  const sideInset = (width - columnWidth) / 2;

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

  const scrollToStatus = useCallback(
    (status: KanbanStatus) => {
      const index = KANBAN_STATUS_ORDER.indexOf(status);
      if (index < 0) return;
      const offsetX = index * snapInterval;
      scrollRef.current?.scrollTo({ x: offsetX, animated: true });
      previousPageRef.current = index;
      kanban.setPageIndex(index);
      onPageChange?.(index);
    },
    [snapInterval, kanban, onPageChange],
  );

  useEffect(() => {
    if (!autoFocusStatus) return;
    scrollToStatus(autoFocusStatus);
  }, [autoFocusStatus, autoFocusKey, scrollToStatus]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const pageIndex = Math.round(offsetX / snapInterval);
      const clampedIndex = Math.max(0, Math.min(pageIndex, KANBAN_STATUS_ORDER.length - 1));

      if (Platform.OS !== 'web' && clampedIndex !== previousPageRef.current) {
        hapticTriggers.pageChange();
        previousPageRef.current = clampedIndex;
      }

      kanban.setPageIndex(clampedIndex);
      onPageChange?.(clampedIndex);
      onAction?.(KANBAN_STATUS_ORDER[clampedIndex]);
    },
    [snapInterval, kanban, onPageChange, onAction],
  );

  const initialFocusIndex = autoFocusStatus
    ? KANBAN_STATUS_ORDER.indexOf(autoFocusStatus)
    : 0;
  const initialOffset = Math.max(0, initialFocusIndex) * snapInterval;

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: sideInset },
        ]}
        style={styles.scrollView}
        scrollEventThrottle={16}
        contentOffset={{ x: initialOffset, y: 0 }}
      >
        {KANBAN_STATUS_ORDER.map((status, index) => (
          <View
            key={status}
            style={[
              { width: columnWidth },
              index < KANBAN_STATUS_ORDER.length - 1 && { marginRight: columnGap },
            ]}
          >
            <KanbanColumn
              status={status}
              items={itemsByStatus[status] || []}
              count={counts[status] || 0}
              onCardPress={onItemPress}
              columnWidth={columnWidth}
              onAddProject={status === KANBAN_STATUS.WAITING ? onAddProject : undefined}
              projectNumbers={projectNumbers}
            />
          </View>
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
    paddingBottom: spacing.lg,
    alignItems: 'stretch',
  },
});
