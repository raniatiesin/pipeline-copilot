/**
 * ============================================
 * NAVIGATION HEADER COMPONENT
 * ============================================
 * 
 * Hierarchical navigation header with tabbed breadcrumbs.
 * Provides visual navigation through project → module → stage hierarchy.
 * 
 * Features:
 * - Tabbed breadcrumb navigation (orange badges)
 * - Large bold title display
 * - Optional subtitle/context line
 * - Progress indicator with icon
 * - Fully navigable tabs
 * 
 * @example
 * ```tsx
 * <NavigationHeader
 *   tabs={[
 *     { label: 'Project #12', route: '/project' },
 *     { label: 'Style Selector', route: '/style-selector/1' },
 *     { label: 'Tag Selector' }, // Current (no route)
 *   ]}
 *   title="What's the primary vibe?"
 *   subtitle="Question 1 of 12"
 *   progress={8}
 * />
 * ```
 * 
 * @module components/ui/NavigationHeader
 */

import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getLineThickness } from '../../constants/line';
import { pillSizes } from '../../constants/pills';
import { borderRadius, colors, shadows, spacing, typography } from '../../constants/theme';
import { useSyncStatus } from '../../hooks/useSyncStatus';

// ============================================
// TYPES
// ============================================

/**
 * A single navigation tab in the breadcrumb trail.
 */
export interface NavigationTab {
  /** Display label for the tab */
  label: string;
  /** Route to navigate to (omit for current/non-navigable) */
  route?: string;
  /** Route parameters */
  params?: Record<string, string>;
}

/**
 * Props for the NavigationHeader component.
 * Displays: tabs → title + progress badge
 */
export interface NavigationHeaderProps {
  /** Array of navigation tabs (breadcrumb trail) */
  tabs: NavigationTab[];
  /** Main title text */
  title: string;
  /** Optional progress percentage (0-100) */
  progress?: number;
  /** Optional custom progress label (overrides percentage display) */
  progressLabel?: string;
  /** Icon name for progress indicator (default: 'pie-chart') */
  progressIcon?: keyof typeof Feather.glyphMap;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Hierarchical navigation header with tabbed breadcrumbs.
 * Layout: [Tab][Tab][Tab] → TITLE                    [Progress]
 */
export function NavigationHeader({
  tabs,
  title,
  progress,
  progressLabel,
  progressIcon = 'pie-chart',
}: NavigationHeaderProps) {
  const syncStatus = useSyncStatus();
  const dotColor = syncStatus === 'online' ? colors.success : colors.error;

  const handleTabPress = useCallback((tab: NavigationTab, index: number) => {
    // Don't navigate if it's the last tab (current page) or no route specified
    if (index === tabs.length - 1 || !tab.route) return;

    // Haptic feedback for navigation
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (tab.params) {
      // @ts-expect-error - Expo Router typed routes
      router.push({ pathname: tab.route, params: tab.params });
    } else {
      // @ts-expect-error - Expo Router typed routes
      router.push(tab.route);
    }
  }, [tabs.length]);

  const displayProgress = progressLabel ?? (progress !== undefined ? `${progress}%` : undefined);

  return (
    <View style={styles.container}>
      {/* Top right sync indicator — green = online, red = offline */}
      <View
        style={styles.syncDotContainer}
        accessibilityLabel={`Sync status: ${syncStatus}`}
      >
        <View style={[styles.syncDot, { backgroundColor: dotColor }]} />
      </View>

      {/* Tab Navigation Row */}
      <View style={styles.tabRow}>
        {tabs.map((tab, index) => {
          const isLast = index === tabs.length - 1;
          const isNavigable = !isLast && tab.route;
          
          return (
            <React.Fragment key={`${tab.label}-${index}`}>
              <TouchableOpacity
                onPress={() => handleTabPress(tab, index)}
                disabled={!isNavigable}
                activeOpacity={isNavigable ? 0.7 : 1}
                style={styles.tabTouchable}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                accessibilityRole="link"
                accessibilityLabel={`Navigate to ${tab.label}`}
              >
                <View style={styles.tab}>
                  <Text style={styles.tabText}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>

      {/* Title Row with Progress Badge */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        
        {displayProgress && (
          <View style={styles.progressBadge}>
            <Feather name={progressIcon} size={14} color={colors.text.primary} />
            <Text style={styles.progressText}>{displayProgress}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  
  // Tab Navigation
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xxs, // Better spacing for touch targets
  },
  tabTouchable: {
    // Improved touch target for mobile
    minHeight: pillSizes.small.minHeight,
    justifyContent: 'center',
  },
  tab: {
    ...typography.caption,
    minHeight: pillSizes.small.minHeight,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    paddingHorizontal: pillSizes.small.paddingHorizontal,
    paddingVertical: pillSizes.small.paddingVertical,
    borderRadius: pillSizes.small.borderRadius,
    backgroundColor: colors.badge.background,
    justifyContent: 'center',
  },
  tabText: {
    ...typography.caption,
    color: colors.badge.text,
    fontWeight: '600',
  },
  
  // Title Row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    textTransform: 'uppercase',
    flex: 1,
  },
  
  // Progress Badge
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: pillSizes.small.minHeight,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    borderRadius: pillSizes.small.borderRadius,
    paddingHorizontal: pillSizes.small.paddingHorizontal,
    paddingVertical: pillSizes.small.paddingVertical,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  progressText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  syncDotContainer: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100, // Ensure it floats above the header tabs
  },
  syncDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
  },
});
