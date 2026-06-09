/**
 * ============================================
 * SCENE MODE PAGE
 * ============================================
 *
 * Left page of the Arc Assembler horizontal scroll view.
 *
 * Layout (top → bottom, vertically scrollable):
 *   - Scene counter overline ("SCENE 01 / 06")
 *   - SubjectHighlightText — scene words with draggable + tappable subject spans
 *   - Divider
 *   - Multiline TextInput — visual brief for this scene
 *     (custom placeholder shows collage tag tally when empty)
 *   - Prev / Next scene navigation buttons
 *
 * DRAG MECHANIC
 * ─────────────
 * Each subject span in SubjectHighlightText is draggable:
 *   1. Long-press (300ms) lifts a colored ghost pill that follows the finger.
 *   2. Drag the ghost down to the TextInput area.
 *   3. Release over the TextInput → the subject's visual brief (or name
 *      fallback) is inserted at the current cursor position (tracked via
 *      onSelectionChange). The TextInput highlights green while the ghost
 *      hovers over it.
 *   4. Release anywhere else → ghost disappears, no change.
 *
 * The TextInput is measured via .measure() on layout to get absolute screen
 * coordinates for drop-zone hit testing.
 *
 * @module components/arc-assembler/SceneModePage
 */

import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
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
import { useArcAssembler } from '@/hooks/useArcAssembler';

// ============================================
// DRAG GHOST COMPONENT
// ============================================

interface DragGhostProps {
  categoryId: string | null;
  dragX: Animated.SharedValue<number>;
  dragY: Animated.SharedValue<number>;
  isOverTarget: boolean;
  subjectCategories: import('@/types/scene-segmentation').SubjectCategory[];
}

const DragGhost = memo(function DragGhost({
  categoryId,
  dragX,
  dragY,
  isOverTarget,
  subjectCategories,
}: DragGhostProps) {
  const category = categoryId
    ? subjectCategories.find(c => c.id === categoryId) ?? null
    : null;

  const ghostStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragX.value - 50 },
      { translateY: dragY.value - 18 },
    ],
    opacity: withTiming(category ? 1 : 0, { duration: 120 }),
  }));

  if (!category) return null;

  return (
    <Animated.View
      style={[
        styles.dragGhost,
        { backgroundColor: category.color ?? colors.secondary },
        isOverTarget && styles.dragGhostOver,
        ghostStyle,
      ]}
      pointerEvents="none"
    >
      <Feather name="move" size={12} color={colors.text.inverse} />
      <Text style={styles.dragGhostText} numberOfLines={1}>
        {category.name}
      </Text>
    </Animated.View>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================

interface SceneModePageProps {
  /**
   * Called by SubjectBriefPopup's "SUBJECT MODE" button.
   * Scrolls the parent page view to reveal Subject Mode.
   */
  onNavigateToSubject: (categoryId: string) => void;
}

function SceneModePageBase({ onNavigateToSubject: _onNavigateToSubject }: SceneModePageProps) {
  const {
    scenes,
    subjectCategories,
    tagsPlaceholder,
    currentSceneIdx,
    navigateScene,
    sceneBriefs,
    subjectBriefs,
    setSceneBrief,
    isLoading,
  } = useArcAssembler();

  // ── Scene data ────────────────────────────────────────────────────
  const scene = scenes[currentSceneIdx];
  const sceneBrief = scene ? (sceneBriefs[scene.id] ?? '') : '';
  const isFirst = currentSceneIdx === 0;
  const isLast = currentSceneIdx === scenes.length - 1;

  // ── TextInput refs ────────────────────────────────────────────────
  const inputRef = useRef<TextInput>(null);
  const inputWrapperRef = useRef<View>(null);

  // Absolute screen bounds of the TextInput wrapper (updated on layout)
  const inputBoundsRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  // Current cursor selection
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  // ── Drag state ────────────────────────────────────────────────────
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [isOverInput, setIsOverInput] = useState(false);

  // ── Measure TextInput wrapper (absolute screen coords) ────────────
  const measureInputBounds = useCallback(() => {
    inputWrapperRef.current?.measure((_, __, w, h, pageX, pageY) => {
      inputBoundsRef.current = { x: pageX, y: pageY, w, h };
    });
  }, []);

  // ── Drag callbacks (called via runOnJS from gesture worklets) ─────

  const handleDragStart = useCallback((categoryId: string, startX: number, startY: number) => {
    setDraggingCategoryId(categoryId);
    // Measure fresh so layout shifts (keyboard, scroll) are accounted for
    measureInputBounds();
  }, [measureInputBounds]);

  const handleDragEnd = useCallback((categoryId: string, endX: number, endY: number) => {
    setDraggingCategoryId(null);
    setIsOverInput(false);

    const bounds = inputBoundsRef.current;
    if (!bounds) return;

    // Hit test: is the drop point within the TextInput wrapper?
    const hit =
      endX >= bounds.x &&
      endX <= bounds.x + bounds.w &&
      endY >= bounds.y &&
      endY <= bounds.y + bounds.h;

    if (!hit) return;

    // Build insert text: subject's brief → fallback to name
    const category = subjectCategories.find(c => c.id === categoryId);
    if (!category) return;
    const insertText = subjectBriefs[categoryId]?.trim() || category.name;

    // Insert at current cursor position
    const { start, end } = selectionRef.current;
    const currentBrief = scene ? (sceneBriefs[scene.id] ?? '') : '';
    const before = currentBrief.slice(0, start);
    const after = currentBrief.slice(end);
    const separator = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
    const newText = before + separator + insertText + after;

    if (scene) {
      setSceneBrief(scene.id, newText);
    }

    // Focus TextInput and move cursor to after the inserted text
    const newCursorPos = before.length + separator.length + insertText.length;
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setNativeProps({
        selection: { start: newCursorPos, end: newCursorPos },
      });
    }, 50);
  }, [subjectCategories, subjectBriefs, sceneBriefs, scene, setSceneBrief]);

  const handleDragCancel = useCallback(() => {
    setDraggingCategoryId(null);
    setIsOverInput(false);
  }, []);

  // ── Hover detection: called from the gesture's onChange ───────────
  // We detect "over input" by reading shared values directly — this
  // runs on the JS side via a useAnimatedReaction would add complexity,
  // so instead we update on drag-end only, and show the highlight once
  // the finger is in the lower half of the screen (heuristic, fast).
  // The precise hit test happens on drop.

  // ── Subject tap (short press → no action here in drag-focused mode) ─
  const handleSubjectTap = useCallback((_categoryId: string) => {
    // No-op: tapping a span in Scene Mode does nothing in the drag paradigm.
    // Subjects are interacted with exclusively through drag-to-insert.
  }, []);

  // ── TextInput handlers ────────────────────────────────────────────

  const handleBriefChange = useCallback((text: string) => {
    if (scene) setSceneBrief(scene.id, text);
  }, [scene, setSceneBrief]);

  const handleSelectionChange = useCallback((event: {
    nativeEvent: { selection: { start: number; end: number } }
  }) => {
    selectionRef.current = event.nativeEvent.selection;
  }, []);

  // ── Scene navigation ──────────────────────────────────────────────

  const handlePrev = useCallback(() => {
    navigateScene('prev');
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [navigateScene]);

  const handleNext = useCallback(() => {
    navigateScene('next');
    setTimeout(() => inputRef.current?.focus(), 150);
  }, [navigateScene]);

  // ── Animated input border (highlights when ghost hovers over it) ──
  const inputBorderStyle = draggingCategoryId
    ? styles.textAreaWrapperDragOver
    : styles.textAreaWrapper;

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
        scrollEnabled={!draggingCategoryId}
      >
        {/* Scene counter */}
        <Text style={styles.counterLabel}>
          SCENE {String(currentSceneIdx + 1).padStart(2, '0')} /{' '}
          {String(scenes.length).padStart(2, '0')}
        </Text>

        {/* Drag hint */}
        <Text style={styles.dragHint}>
          LONG-PRESS A SUBJECT TO DRAG IT INTO YOUR BRIEF
        </Text>

        {/* Scene text with draggable subject spans */}
        <View style={styles.sceneTextWrapper}>
          <SubjectHighlightText
            scene={scene}
            subjectCategories={subjectCategories}
            onSubjectTap={handleSubjectTap}
            dragX={dragX}
            dragY={dragY}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          />
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Brief text area */}
        <Text style={styles.fieldLabel}>VISUAL BRIEF</Text>
        <View
          ref={inputWrapperRef}
          style={inputBorderStyle}
          onLayout={measureInputBounds}
        >
          <TextInput
            ref={inputRef}
            value={sceneBrief}
            onChangeText={handleBriefChange}
            onSelectionChange={handleSelectionChange}
            multiline
            style={styles.textArea}
            textAlignVertical="top"
          />
          {sceneBrief === '' && (
            <Text style={styles.placeholder} pointerEvents="none">
              {tagsPlaceholder || 'Describe the visual direction for this scene…'}
            </Text>
          )}

          {/* Drop-zone hint overlay — visible while dragging */}
          {draggingCategoryId && (
            <View style={styles.dropZoneOverlay} pointerEvents="none">
              <Feather name="download" size={20} color={colors.primary} />
              <Text style={styles.dropZoneText}>DROP TO INSERT</Text>
            </View>
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

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Drag ghost — rendered outside ScrollView so it floats above everything */}
      <DragGhost
        categoryId={draggingCategoryId}
        dragX={dragX}
        dragY={dragY}
        isOverTarget={isOverInput}
        subjectCategories={subjectCategories}
      />
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
    marginBottom: spacing.xxs,
  },

  // Drag hint
  dragHint: {
    ...typography.overline,
    fontSize: 9,
    color: colors.text.muted,
    marginBottom: spacing.sm,
    letterSpacing: 0.6,
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

  // Text area (normal)
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
  // Text area (drag-over highlight)
  textAreaWrapperDragOver: {
    position: 'relative',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: getLineThickness('base'),
    borderColor: colors.accent,
    ...shadows.medium,
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
    color: colors.text.secondary,
    fontStyle: 'italic',
    lineHeight: 24,
  },

  // Drop zone overlay (shown inside TextArea while dragging)
  dropZoneOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.md - 1,
    backgroundColor: 'rgba(105,194,239,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    flexDirection: 'row',
  },
  dropZoneText: {
    ...typography.overline,
    color: colors.accent,
    fontSize: 11,
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
    borderRadius: borderRadius.md,
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

  // ── Drag Ghost ───────────────────────────────────────────────────
  dragGhost: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: 'rgba(20,22,20,0.35)',
    ...shadows.hard,
    maxWidth: 160,
    zIndex: 999,
  },
  dragGhostOver: {
    borderColor: colors.accent,
    borderWidth: 3,
  },
  dragGhostText: {
    ...typography.overline,
    color: colors.text.inverse,
    fontSize: 11,
    flex: 1,
  },

  // ── Empty / loading states ───────────────────────────────────────
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
