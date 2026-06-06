/**
 * ============================================
 * SCENE MODE PAGE
 * ============================================
 *
 * Left page of the Arc Assembler horizontal scroll view.
 *
 * Layout (top → bottom, vertically scrollable):
 *   - Scene counter overline ("SCENE 01 / 06")
 *   - SubjectHighlightText — scene words with colored subject spans
 *   - Divider
 *   - Multiline TextInput — visual brief for this scene
 *     (custom placeholder shows collage tag tally when empty)
 *   - Prev / Next scene navigation buttons
 *
 * A SubjectBriefPopup overlays the page when a subject span is tapped.
 * Editing in the popup propagates to Subject Mode via shared hook state.
 *
 * @module components/arc-assembler/SceneModePage
 */

import { Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { getLineThickness } from '@/constants/line';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';
import { SubjectHighlightText } from './SubjectHighlightText';
import { SubjectBriefPopup } from './SubjectBriefPopup';
import { useArcAssembler } from '@/hooks/useArcAssembler';

// ============================================
// COMPONENT
// ============================================

interface SceneModePageProps {
  /** Called when the popup requests navigating to Subject Mode for a subject. */
  onNavigateToSubject: (categoryId: string) => void;
}

function SceneModePageBase({ onNavigateToSubject }: SceneModePageProps) {
  const {
    scenes,
    subjectCategories,
    tagsPlaceholder,
    currentSceneIdx,
    navigateScene,
    sceneBriefs,
    subjectBriefs,
    setSceneBrief,
    setSubjectBrief,
    isLoading,
  } = useArcAssembler();

  const [activePopupCategoryId, setActivePopupCategoryId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const scene = scenes[currentSceneIdx];
  const sceneBrief = scene ? (sceneBriefs[scene.id] ?? '') : '';
  const isFirst = currentSceneIdx === 0;
  const isLast = currentSceneIdx === scenes.length - 1;

  const activePopupCategory = activePopupCategoryId
    ? subjectCategories.find(c => c.id === activePopupCategoryId) ?? null
    : null;

  // ── Handlers ──────────────────────────────────────────────────────

  const handleSubjectTap = useCallback((categoryId: string) => {
    setActivePopupCategoryId(categoryId);
  }, []);

  const handlePopupDismiss = useCallback(() => {
    setActivePopupCategoryId(null);
  }, []);

  const handlePrev = useCallback(() => {
    navigateScene('prev');
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [navigateScene]);

  const handleNext = useCallback(() => {
    navigateScene('next');
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [navigateScene]);

  const handleBriefChange = useCallback((text: string) => {
    if (scene) setSceneBrief(scene.id, text);
  }, [scene, setSceneBrief]);

  // ── Loading / empty states ────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.stateText}>Loading scenes…</Text>
      </View>
    );
  }

  if (scenes.length === 0) {
    return (
      <View style={styles.centerState}>
        <Feather name="scissors" size={36} color={colors.text.muted} />
        <Text style={styles.stateTitle}>No Scenes Yet</Text>
        <Text style={styles.stateText}>
          Complete Beat Butcher first to segment your script into scenes.
        </Text>
      </View>
    );
  }

  if (!scene) return null;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Counter */}
        <Text style={styles.counterLabel}>
          SCENE {String(currentSceneIdx + 1).padStart(2, '0')} / {String(scenes.length).padStart(2, '0')}
        </Text>

        {/* Scene text with subject highlights */}
        <View style={styles.sceneTextWrapper}>
          <SubjectHighlightText
            scene={scene}
            subjectCategories={subjectCategories}
            onSubjectTap={handleSubjectTap}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Brief text area */}
        <Text style={styles.fieldLabel}>VISUAL BRIEF</Text>
        <View style={styles.textAreaWrapper}>
          <TextInput
            ref={inputRef}
            value={sceneBrief}
            onChangeText={handleBriefChange}
            multiline
            style={styles.textArea}
            textAlignVertical="top"
          />
          {sceneBrief === '' && (
            <Text style={styles.placeholder} pointerEvents="none">
              {tagsPlaceholder || 'Describe the visual direction for this scene…'}
            </Text>
          )}
        </View>

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

        {/* Bottom padding so content clears the footer */}
        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Subject brief popup (absolute overlay) */}
      {activePopupCategory && (
        <SubjectBriefPopup
          category={activePopupCategory}
          currentBrief={subjectBriefs[activePopupCategory.id] ?? ''}
          tagsPlaceholder={tagsPlaceholder}
          onSetBrief={setSubjectBrief}
          onDismiss={handlePopupDismiss}
          onNavigateToSubject={onNavigateToSubject}
        />
      )}
    </View>
  );
}

export const SceneModePage = memo(SceneModePageBase);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  // Counter
  counterLabel: {
    ...typography.overline,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },

  // Scene text
  sceneTextWrapper: {
    marginBottom: spacing.md,
  },

  // Divider
  divider: {
    height: getLineThickness('base'),
    backgroundColor: colors.border,
    marginBottom: spacing.md,
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
