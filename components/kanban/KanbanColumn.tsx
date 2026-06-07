/**
 * ============================================
 * KANBAN COLUMN COMPONENT
 * ============================================
 *
 * Single full-width column for displaying items of a specific status.
 * The status pill is pinned/floating at the top — cards scroll behind it.
 *
 * Features:
 * - Floating pinned pill (cards pass underneath when scrolling)
 * - Full-width cards with 24px horizontal padding
 * - AddProjectButton at the bottom of the To Do column (when onAddProject provided)
 *
 * @module components/kanban/KanbanColumn
 */

import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { KANBAN_STATUS, KANBAN_STATUS_CONFIG } from '@/constants/kanbanStatus';
import { kanbanColors, kanbanLayout } from '@/constants/kanbanTheme';
import { pillSizes } from '@/constants/pills';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import type { KanbanColumnProps, KanbanItem } from '@/types/kanban';

import { AddProjectButton } from './AddProjectButton';
import { KanbanCard } from './KanbanCard';

// ============================================
// PILL HEIGHT (for scroll top-padding)
// ============================================

/** Total pill height: paddingV*2 + fontSize lineHeight + border*2 + container paddingV*2 */
const PILL_TOTAL_HEIGHT = pillSizes.big.minHeight + spacing.sm * 2;

// ============================================
// COLUMN TAB (FLOATING PILL)
// ============================================

interface ColumnTabProps {
  label: string;
  count: number;
  colorSet: typeof kanbanColors[keyof typeof kanbanColors];
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
// EMPTY STATE COMPONENT
// ============================================

interface EmptyStateProps {
  colorSet: typeof kanbanColors[keyof typeof kanbanColors];
}

function EmptyState({ colorSet }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colorSet.background }]}>
        <Feather name="inbox" size={32} color={colorSet.accent} />
      </View>
      <Text style={styles.emptyText}>No items</Text>
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

  // Card width: column width minus horizontal padding on both sides
  const cardWidth = columnWidth - kanbanLayout.columnPaddingH * 2;

  const renderCard = (item: KanbanItem) => (
    <View key={item.id} style={styles.cardWrapper}>
      <KanbanCard
        item={item}
        onPress={onCardPress}
        cardWidth={cardWidth - spacing.sm * 2}
      />
    </View>
  );

  // AddProjectButton shown only in the To Do column when callback provided
  const showAddButton = status === KANBAN_STATUS.TODO && !!onAddProject;

  return (
    <View style={[styles.columnWrapper, { width: columnWidth }]}>
      {/* Floating pinned pill — sits above scroll, cards pass behind */}
      <ColumnTab label={config.label} count={count} colorSet={colorSet} />

      {/* Scrollable card area — extends behind the pill via negative margin */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={true}
        indicatorStyle="black"
        decelerationRate="fast"
        bounces={true}
        overScrollMode="always"
      >
        {items.length === 0 && !showAddButton ? (
          <EmptyState colorSet={colorSet} />
        ) : (
          <View style={styles.cardsGrid}>
            {items.map(renderCard)}
          </View>
        )}

        {/* Add Project Button — bottom of To Do column only */}
        {showAddButton && (
          <AddProjectButton onPress={onAddProject!} />
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
  },
  // Floating pill container — no border, no opaque background
  tabContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
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
    borderWidth: 2,
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
    // Top padding pushes cards below the floating pill initially
    paddingTop: PILL_TOTAL_HEIGHT + spacing.sm,
    paddingBottom: spacing.lg,
    paddingHorizontal: kanbanLayout.columnPaddingH,
    flexGrow: 1,
    alignItems: 'center',
  },
  cardsGrid: {
    gap: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  cardWrapper: {
    marginHorizontal: spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.caption,
    fontWeight: '500',
    color: colors.text.secondary,
  },
});
