/**
 * ============================================
 * SUBJECT BRIEF POPUP
 * ============================================
 *
 * Overlay popup that appears when the user taps a subject
 * highlight span in Scene Mode.
 *
 * Two internal states:
 *   view  — shows subject name + current brief text + EDIT button
 *   edit  — shows subject name + multiline TextInput + DONE button
 *
 * Editing here calls setSubjectBrief(categoryId, text), which
 * propagates instantly to Subject Mode (shared hook state).
 *
 * Backdrop tap dismisses the popup.
 *
 * @module components/arc-assembler/SubjectBriefPopup
 */

import { Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getLineThickness } from '@/constants/line';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';
import type { SubjectCategory } from '@/types/scene-segmentation';

// ============================================
// TYPES
// ============================================

export interface SubjectBriefPopupProps {
  /** The subject category being shown. */
  category: SubjectCategory;
  /** Current brief text for this category. */
  currentBrief: string;
  /** Placeholder text (from collage tag tally). */
  tagsPlaceholder: string;
  /** Called when the brief text is changed by the user. */
  onSetBrief: (categoryId: string, text: string) => void;
  /** Dismiss the popup. */
  onDismiss: () => void;
  /**
   * Navigate to this subject in Subject Mode.
   * Called when the user taps "VIEW IN SUBJECT MODE".
   */
  onNavigateToSubject: (categoryId: string) => void;
}

// ============================================
// COMPONENT
// ============================================

function SubjectBriefPopupBase({
  category,
  currentBrief,
  tagsPlaceholder,
  onSetBrief,
  onDismiss,
  onNavigateToSubject,
}: SubjectBriefPopupProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(currentBrief);
  const inputRef = useRef<TextInput>(null);

  // Sync draft when popup opens with a new category
  useEffect(() => {
    setDraftText(currentBrief);
    setIsEditing(false);
  }, [category.id, currentBrief]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    // Focus fires after the next frame so the TextInput is mounted
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleDone = useCallback(() => {
    onSetBrief(category.id, draftText);
    setIsEditing(false);
  }, [category.id, draftText, onSetBrief]);

  const handleNavigate = useCallback(() => {
    // Save any in-progress edit before navigating
    if (isEditing) onSetBrief(category.id, draftText);
    onNavigateToSubject(category.id);
    onDismiss();
  }, [category.id, draftText, isEditing, onSetBrief, onNavigateToSubject, onDismiss]);

  const dotColor = category.color ?? colors.secondary;

  return (
    // Full-screen backdrop
    <TouchableOpacity
      style={styles.backdrop}
      onPress={onDismiss}
      activeOpacity={1}
    >
      {/* Popup card — stop propagation so tapping inside doesn't dismiss */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={1}
        onPress={() => {/* swallow */}}
      >
        {/* Header row */}
        <View style={styles.header}>
          <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
          <Text style={styles.subjectName} numberOfLines={1}>
            {category.name.toUpperCase()}
          </Text>
          <TouchableOpacity
            onPress={onDismiss}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.closeBtn}
          >
            <Feather name="x" size={18} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Brief content */}
        {isEditing ? (
          <View style={styles.editWrapper}>
            <TextInput
              ref={inputRef}
              value={draftText}
              onChangeText={setDraftText}
              multiline
              style={styles.textInput}
              placeholder={tagsPlaceholder || 'Describe this subject visually…'}
              placeholderTextColor={colors.text.muted}
              autoFocus
            />
          </View>
        ) : (
          <View style={styles.viewWrapper}>
            {currentBrief ? (
              <Text style={styles.briefText}>{currentBrief}</Text>
            ) : (
              <Text style={styles.emptyText}>
                {tagsPlaceholder || 'No brief written yet.'}
              </Text>
            )}
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {isEditing ? (
            <TouchableOpacity style={styles.actionBtn} onPress={handleDone}>
              <Feather name="check" size={14} color={colors.text.inverse} />
              <Text style={styles.actionBtnLabel}>DONE</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionBtn} onPress={handleEdit}>
              <Feather name="edit-2" size={14} color={colors.text.inverse} />
              <Text style={styles.actionBtnLabel}>EDIT</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleNavigate}>
            <Feather name="arrow-right" size={14} color={colors.text.primary} />
            <Text style={styles.secondaryBtnLabel}>SUBJECT MODE</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export const SubjectBriefPopup = memo(SubjectBriefPopupBase);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,22,20,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  card: {
    width: '82%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    ...shadows.hard,
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(20,22,20,0.2)',
  },
  subjectName: {
    ...typography.overline,
    color: colors.text.primary,
    flex: 1,
  },
  closeBtn: {
    padding: spacing.xxs,
  },

  divider: {
    height: getLineThickness('base'),
    backgroundColor: colors.border,
  },

  // Brief views
  viewWrapper: {
    padding: spacing.md,
    minHeight: 72,
  },
  briefText: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 22,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.muted,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  editWrapper: {
    padding: spacing.md,
  },
  textInput: {
    ...typography.body,
    color: colors.text.primary,
    minHeight: 90,
    textAlignVertical: 'top',
    lineHeight: 22,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
    borderTopWidth: getLineThickness('thin'),
    borderTopColor: colors.borderSubtle,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    ...shadows.medium,
  },
  actionBtnLabel: {
    ...typography.overline,
    color: colors.text.inverse,
    fontSize: 11,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
  },
  secondaryBtnLabel: {
    ...typography.overline,
    color: colors.text.primary,
    fontSize: 11,
  },
});
