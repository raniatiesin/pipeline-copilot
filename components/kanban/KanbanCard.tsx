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
 * - "MARK AS DONE" action button — visible only on IN_REVIEW cards
 * - Long-press delete strip — visible only on project cards (moduleId === 'project')
 *   Slides in below the card with a DELETE button and a cancel target.
 *   Confirmation Alert prevents accidental deletion.
 *
 * @module components/kanban/KanbanCard
 */

import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { MODULE_CONFIG } from '@/constants/kanbanTheme';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';
import { deleteProject } from '@/lib/database';
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
  const { updateNote, markDone } = useKanban();

  const isProjectCard = item.moduleId === 'project';
  const isInReview = item.status === KANBAN_STATUS.IN_REVIEW;
  const effectiveWidth = cardWidth || 300;

  // ── Delete strip (project cards only) ────────────────────────────
  const [isActionOpen, setIsActionOpen] = useState(false);
  const stripHeight = useSharedValue(0);

  const stripStyle = useAnimatedStyle(() => ({
    height: withSpring(stripHeight.value, { damping: 20, stiffness: 300 }),
    overflow: 'hidden',
  }));

  const openDeleteStrip = useCallback(() => {
    if (!isProjectCard) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsActionOpen(true);
    stripHeight.value = 52;
  }, [isProjectCard, stripHeight]);

  const closeDeleteStrip = useCallback(() => {
    setIsActionOpen(false);
    stripHeight.value = 0;
  }, [stripHeight]);

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      'Delete this project?',
      'This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: closeDeleteStrip,
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsActionOpen(false);
            stripHeight.value = 0;
            await deleteProject(item.id);
          },
        },
      ],
    );
  }, [item.id, closeDeleteStrip, stripHeight]);

  // ── Icon ─────────────────────────────────────────────────────────
  const iconName = useMemo(() => {
    const moduleConfig = item.moduleId
      ? MODULE_CONFIG[item.moduleId as keyof typeof MODULE_CONFIG]
      : null;
    return (item.icon || moduleConfig?.icon || 'box') as keyof typeof Feather.glyphMap;
  }, [item.moduleId, item.icon]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handlePress = useCallback(() => {
    if (isActionOpen) {
      closeDeleteStrip();
      return;
    }
    onPress?.(item);
  }, [item, onPress, isActionOpen, closeDeleteStrip]);

  const handleNoteChange = useCallback((note: string) => {
    updateNote(item.id, note);
  }, [item.id, updateNote]);

  const handleMarkDone = useCallback(() => {
    if (item.moduleId) {
      markDone(item.moduleId);
    }
  }, [item.moduleId, markDone]);

  return (
    <View>
      <UniversalModuleCard
        onPress={handlePress}
        onLongPress={isProjectCard ? openDeleteStrip : undefined}
        iconName={iconName}
        title={item.title}
        progressPercent={item.progress ?? 0}
        description={item.description}
        noteText={item.quickNote ?? ''}
        isOutdated={item.isOutdated}
        onChangeNote={handleNoteChange}
        accessibilityLabel={`${item.title}. ${item.description || ''}`}
        accessibilityHint={isProjectCard ? 'Double tap to open, long press for options' : 'Double tap to open'}
        style={{ width: effectiveWidth }}
      />

      {/* Delete strip — project cards only, slides in on long press */}
      {isProjectCard && (
        <Animated.View style={[styles.deleteStrip, { width: effectiveWidth }, stripStyle]}>
          <TouchableOpacity
            onPress={handleDeletePress}
            activeOpacity={0.8}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel="Delete project"
          >
            <Feather name="trash-2" size={14} color={colors.text.inverse} />
            <Text style={styles.deleteText}>DELETE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={closeDeleteStrip}
            activeOpacity={0.8}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* "Mark as Done" — only on IN_REVIEW stage cards */}
      {isInReview && !isProjectCard && (
        <TouchableOpacity
          onPress={handleMarkDone}
          activeOpacity={0.8}
          style={[styles.markDoneButton, { width: effectiveWidth }]}
          accessibilityRole="button"
          accessibilityLabel={`Mark ${item.title} as done`}
        >
          <Feather name="check-circle" size={14} color={colors.text.inverse} />
          <Text style={styles.markDoneText}>MARK AS DONE</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // ── Delete strip ─────────────────────────────────────────────────
  deleteStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 3,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.error,
    ...shadows.hard,
  },
  deleteButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  deleteText: {
    ...typography.button,
    color: colors.text.inverse,
    letterSpacing: 0.8,
  },
  cancelButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.3)',
  },
  cancelText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '700',
    opacity: 0.8,
  },

  // ── Mark as Done ─────────────────────────────────────────────────
  markDoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    shadowColor: colors.border,
    shadowOffset: shadows.hard.shadowOffset,
    shadowOpacity: shadows.hard.shadowOpacity,
    shadowRadius: 0,
    elevation: 4,
  },
  markDoneText: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.inverse,
    letterSpacing: 0.8,
  },
});
