/**
 * ============================================
 * KANBAN COLUMN COMPONENT
 * ============================================
 *
 * Single column for items of a specific status.
 * Colored status pill pinned at the top; cards scroll below.
 *
 * @module components/kanban/KanbanColumn
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { StatusPill } from '@/components/ui/StatusPill';
import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import type { KanbanColumnProps, KanbanItem } from '@/types/kanban';

import { AddProjectButton } from './AddProjectButton';
import { KanbanCard } from './KanbanCard';

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyDashedBox}>
        <Text style={styles.emptyText}>Nothing here yet</Text>
      </View>
    </View>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function KanbanColumn({
  status,
  items,
  count,
  onCardPress,
  columnWidth,
  onAddProject,
  projectNumbers,
}: KanbanColumnProps) {
  const cardWidth = columnWidth - spacing.sm * 2;

  const renderCard = (item: KanbanItem) => (
    <View key={item.id} style={styles.cardWrapper}>
      <KanbanCard
        item={item}
        onPress={onCardPress}
        cardWidth={cardWidth}
        projectNumber={projectNumbers?.[item.id]}
      />
    </View>
  );

  const showAddButton = status === KANBAN_STATUS.WAITING && !!onAddProject;

  return (
    <View style={[styles.columnWrapper, { width: columnWidth }]}>
      <StatusPill status={status} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator
        indicatorStyle="black"
        decelerationRate="fast"
        bounces
        overScrollMode="always"
        scrollEventThrottle={16}
      >
        {items.length === 0 && !showAddButton ? (
          <EmptyState />
        ) : (
          <>
            <View style={styles.cardsGrid}>
              {items.map(renderCard)}
            </View>

            {showAddButton && (
              <AddProjectButton onPress={onAddProject!} width={cardWidth} />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  columnWrapper: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.lg,
    flexGrow: 1,
    alignItems: 'center',
    width: '100%',
  },
  cardsGrid: {
    gap: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  cardWrapper: {
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyDashedBox: {
    width: '100%',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});