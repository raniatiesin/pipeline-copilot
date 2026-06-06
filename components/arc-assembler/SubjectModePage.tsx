/**
 * ============================================
 * SUBJECT MODE PAGE
 * ============================================
 *
 * Right page of the Arc Assembler horizontal scroll view.
 *
 * Layout (top → bottom, vertically scrollable):
 *   - Subject color dot + name header
 *   - Multiline TextInput — visual brief for this subject
 *     (custom placeholder shows collage tag tally when empty)
 *   - Divider
 *   - "APPEARS IN" list — compact read-only rows for every scene
 *     that contains this subject (scene index + first ~8 words)
 *   - Prev / Next subject navigation buttons
 *
 * Edits to the subject brief propagate instantly to Scene Mode
 * via the shared subjectBriefs state in useArcAssembler.
 *
 * @module components/arc-assembler/SubjectModePage
 */

import { Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getLineThickness } from '@/constants/line';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';
import { getSceneIndicesForCategory } from '@/lib/arcAssembler';
import { useArcAssembler } from '@/hooks/useArcAssembler';
import type { Scene } from '@/types/scene-segmentation';

// ============================================
// SMALL INNER COMPONENTS
// ============================================

interface SceneAppearanceRowProps {
  sceneIndex: number;
  scene: Scene;
}

const SceneAppearanceRow = memo(function SceneAppearanceRow({
  sceneIndex,
  scene,
}: SceneAppearanceRowProps) {
  const preview = scene.words.slice(0, 8).map(w => w.text).join(' ');
  const hasMore = scene.words.length > 8;

  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.badge}>
        <Text style={rowStyles.badgeText}>
          {String(sceneIndex + 1).padStart(2, '0')}
        </Text>
      </View>
      <Text style={rowStyles.preview} numberOfLines={2}>
        {preview}{hasMore ? '…' : ''}
      </Text>
    </View>
  );
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: getLineThickness('hairline'),
    borderBottomColor: colors.borderSubtle,
  },
  badge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('thin'),
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 32,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.overline,
    color: colors.text.secondary,
    fontSize: 10,
  },
  preview: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
});

// ============================================
// MAIN COMPONENT
// ============================================

function SubjectModePageBase() {
  const {
    scenes,
    subjectCategories,
    tagsPlaceholder,
    currentSubjectIdx,
    navigateSubject,
    subjectBriefs,
    setSubjectBrief,
    isLoading,
  } = useArcAssembler();

  const inputRef = useRef<TextInput>(null);

  const category = subjectCategories[currentSubjectIdx];
  const subjectBrief = category ? (subjectBriefs[category.id] ?? '') : '';
  const isFirst = currentSubjectIdx === 0;
  const isLast = currentSubjectIdx === subjectCategories.length - 1;

  const appearsInIndices = useMemo(() => {
    if (!category) return [];
    return getSceneIndicesForCategory(category.id, scenes);
  }, [category, scenes]);

  // ── Handlers ──────────────────────────────────────────────────────

  const handleBriefChange = useCallback((text: string) => {
    if (category) setSubjectBrief(category.id, text);
  }, [category, setSubjectBrief]);

  const handlePrev = useCallback(() => {
    navigateSubject('prev');
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [navigateSubject]);

  const handleNext = useCallback(() => {
    navigateSubject('next');
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [navigateSubject]);

  const renderAppearanceRow = useCallback(({ item }: { item: number }) => (
    <SceneAppearanceRow sceneIndex={item} scene={scenes[item]} />
  ), [scenes]);

  const keyExtractor = useCallback((item: number) => String(item), []);

  // ── Loading / empty states ────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.stateText}>Loading subjects…</Text>
      </View>
    );
  }

  if (subjectCategories.length === 0) {
    return (
      <View style={styles.centerState}>
        <Feather name="users" size={36} color={colors.text.muted} />
        <Text style={styles.stateTitle}>No Subjects Yet</Text>
        <Text style={styles.stateText}>
          Complete Entity Editor first to tag recurring subjects across your scenes.
        </Text>
      </View>
    );
  }

  if (!category) return null;

  const dotColor = category.color ?? colors.secondary;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Subject header */}
      <View style={styles.subjectHeader}>
        <View style={[styles.colorDot, { backgroundColor: dotColor }]} />
        <Text style={styles.subjectName} numberOfLines={1}>
          {category.name}
        </Text>
        <Text style={styles.subjectCounter}>
          {currentSubjectIdx + 1} / {subjectCategories.length}
        </Text>
      </View>

      {/* Brief text area */}
      <Text style={styles.fieldLabel}>VISUAL BRIEF</Text>
      <View style={styles.textAreaWrapper}>
        <TextInput
          ref={inputRef}
          value={subjectBrief}
          onChangeText={handleBriefChange}
          multiline
          style={styles.textArea}
          textAlignVertical="top"
        />
        {subjectBrief === '' && (
          <Text style={styles.placeholder} pointerEvents="none">
            {tagsPlaceholder || "Describe this subject\u2019s visual identity\u2026"}
          </Text>
        )}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Appears in */}
      <Text style={styles.fieldLabel}>
        APPEARS IN ({appearsInIndices.length} SCENE{appearsInIndices.length !== 1 ? 'S' : ''})
      </Text>

      {appearsInIndices.length > 0 ? (
        <FlatList
          data={appearsInIndices}
          renderItem={renderAppearanceRow}
          keyExtractor={keyExtractor}
          scrollEnabled={false}
          style={styles.appearanceList}
        />
      ) : (
        <View style={styles.emptyAppearance}>
          <Text style={styles.emptyAppearanceText}>
            This subject has not been tagged in any scene yet.
          </Text>
        </View>
      )}

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, isFirst && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={isFirst}
          activeOpacity={0.75}
        >
          <Feather
            name="arrow-left"
            size={16}
            color={isFirst ? colors.text.muted : colors.text.primary}
          />
          <Text style={[styles.navBtnLabel, isFirst && styles.navBtnLabelDisabled]}>
            PREV
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, isLast && styles.navBtnDisabled]}
          onPress={handleNext}
          disabled={isLast}
          activeOpacity={0.75}
        >
          <Text style={[styles.navBtnLabel, isLast && styles.navBtnLabelDisabled]}>
            NEXT
          </Text>
          <Feather
            name="arrow-right"
            size={16}
            color={isLast ? colors.text.muted : colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom padding */}
      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

export const SubjectModePage = memo(SubjectModePageBase);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // Subject header
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: getLineThickness('thin'),
    borderColor: 'rgba(20,22,20,0.2)',
    flexShrink: 0,
  },
  subjectName: {
    ...typography.subtitle,
    color: colors.text.primary,
    flex: 1,
  },
  subjectCounter: {
    ...typography.caption,
    color: colors.text.muted,
  },

  // Field label
  fieldLabel: {
    ...typography.overline,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },

  // Text area
  textAreaWrapper: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    ...shadows.soft,
    minHeight: 140,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  textArea: {
    ...typography.body,
    color: colors.text.primary,
    flex: 1,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  placeholder: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    ...typography.body,
    color: colors.text.muted,
    lineHeight: 24,
  },

  // Divider
  divider: {
    height: getLineThickness('base'),
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },

  // Appearance list
  appearanceList: {
    marginBottom: spacing.md,
  },
  emptyAppearance: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  emptyAppearanceText: {
    ...typography.caption,
    color: colors.text.muted,
    fontStyle: 'italic',
  },

  // Navigation row
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    ...shadows.medium,
    flex: 1,
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.38,
    shadowOpacity: 0,
  },
  navBtnLabel: {
    ...typography.overline,
    color: colors.text.primary,
  },
  navBtnLabelDisabled: {
    color: colors.text.muted,
  },

  bottomPad: {
    height: spacing.xxl,
  },

  // Empty / loading states
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  stateTitle: {
    ...typography.subtitle,
    color: colors.text.primary,
    textAlign: 'center',
  },
  stateText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
