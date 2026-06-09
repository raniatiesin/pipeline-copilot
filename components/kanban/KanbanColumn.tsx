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

import { KANBAN_STATUS, KANBAN_STATUS_CONFIG } from '@/constants/kanbanStatus';
import { kanbanColors } from '@/constants/kanbanTheme';
import { getLineThickness } from '@/constants/line';
import { pillSizes } from '@/constants/pills';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import type { KanbanColumnProps, KanbanItem } from '@/types/kanban';

import { AddProjectButton } from './AddProjectButton';
import { KanbanCard } from './KanbanCard';

// ============================================
// COLUMN TAB (COLORED PILL)
// ============================================

interface ColumnTabProps {
  label: string;
  count: number;
  colorSet: (typeof kanbanColors)[keyof typeof kanbanColors];
}

function ColumnTab({ label, count, colorSet }: ColumnTabProps) {
  return (
    <View style={styles.tabContainer} pointerEvents="none">
      <View style={[styles.tab, { backgroundColor: colorSet.pill }]}>
        <Text style={styles.tabLabel}>{label}</Text>
        <View style={[styles.countBadge, { backgroundColor: colorSet.background }]}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>
    </View>
  );
}

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
}: KanbanColumnProps) {
  const config = KANBAN_STATUS_CONFIG[status];
  const colorSet = kanbanColors[config.colorKey];
  const cardWidth = columnWidth - spacing.sm * 2;

  const renderCard = (item: KanbanItem) => (
    <View key={item.id} style={styles.cardWrapper}>
      <KanbanCard
        item={item}
        onPress={onCardPress}
        cardWidth={cardWidth}
      />
    </View>
  );

  const showAddButton = status === KANBAN_STATUS.TODO && !!onAddProject;

  return (
    <View style={[styles.columnWrapper, { width: columnWidth }]}>
      <ColumnTab label={config.label} count={count} colorSet={colorSet} />

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
  tabContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: pillSizes.big.minHeight,
    paddingHorizontal: pillSizes.big.paddingHorizontal,
    paddingVertical: pillSizes.big.paddingVertical,
    borderRadius: pillSizes.big.borderRadius,
    borderWidth: pillSizes.big.borderWidth,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  tabLabel: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  countBadge: {
    minWidth: pillSizes.small.minHeight,
    height: pillSizes.small.minHeight,
    borderRadius: pillSizes.small.minHeight / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
    borderWidth: getLineThickness('thin'),
    borderColor: colors.border,
  },
  countText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
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
