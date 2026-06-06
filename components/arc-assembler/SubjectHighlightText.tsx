/**
 * ============================================
 * SUBJECT HIGHLIGHT TEXT
 * ============================================
 *
 * Renders scene text word-by-word with subject spans highlighted
 * in their SubjectCategory brand color.
 *
 * Each subject span supports two interactions:
 *
 *   TAP  — calls onSubjectTap(categoryId) immediately (short press)
 *   DRAG — long-press (300ms) to activate, then pan to drag a ghost
 *          pill around the screen. Releasing over the TextInput
 *          triggers onDragDrop(categoryId, absoluteX, absoluteY).
 *
 * Gesture implementation uses RNGH v2 Gesture API:
 *   Gesture.Exclusive(Pan.activateAfterLongPress, Tap)
 *
 * The Pan gesture's onChange updates dragX / dragY SharedValues
 * directly on the UI thread (no runOnJS overhead for smooth animation).
 * onDragStart / onDragEnd / onDragCancel bridge back to JS for state updates.
 *
 * @module components/arc-assembler/SubjectHighlightText
 */

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { runOnJS } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import type { Scene, Subject, SubjectCategory, Word } from '@/types/scene-segmentation';

// ============================================
// TYPES
// ============================================

export interface SubjectHighlightTextProps {
  scene: Scene;
  subjectCategories: SubjectCategory[];
  /** Called on a short tap of a subject span (no drag). */
  onSubjectTap: (categoryId: string) => void;
  // ── Drag props ──────────────────────────────────────────────────
  /** Shared X position updated on the UI thread during a drag. */
  dragX: SharedValue<number>;
  /** Shared Y position updated on the UI thread during a drag. */
  dragY: SharedValue<number>;
  /** Called (JS thread) when a drag begins. */
  onDragStart: (categoryId: string, startX: number, startY: number) => void;
  /** Called (JS thread) when the user lifts their finger. */
  onDragEnd: (categoryId: string, endX: number, endY: number) => void;
  /** Called (JS thread) when the gesture is cancelled (e.g. scrolled away). */
  onDragCancel: () => void;
}

// Internal segment shapes for the rendering pass
interface PlainSegment { type: 'plain'; words: Word[] }
interface SubjectSegment {
  type: 'subject';
  words: Word[];
  subject: Subject;
  category: SubjectCategory;
}
type Segment = PlainSegment | SubjectSegment;

// ============================================
// PURE HELPERS
// ============================================

function buildSegments(
  words: Word[],
  subjects: Subject[],
  categoryMap: Map<string, SubjectCategory>,
): Segment[] {
  const wordToSubject = new Map<number, { subject: Subject; category: SubjectCategory }>();
  for (const sub of subjects) {
    if (!sub.categoryId) continue;
    const cat = categoryMap.get(sub.categoryId);
    if (!cat) continue;
    for (let i = sub.startWordIndex; i <= sub.endWordIndex; i++) {
      wordToSubject.set(i, { subject: sub, category: cat });
    }
  }

  const segments: Segment[] = [];
  let i = 0;
  while (i < words.length) {
    const info = wordToSubject.get(i);
    if (info) {
      const segWords: Word[] = [];
      const end = info.subject.endWordIndex;
      while (i <= end && i < words.length) { segWords.push(words[i]); i++; }
      segments.push({ type: 'subject', words: segWords, subject: info.subject, category: info.category });
    } else {
      const segWords: Word[] = [];
      while (i < words.length && !wordToSubject.has(i)) { segWords.push(words[i]); i++; }
      segments.push({ type: 'plain', words: segWords });
    }
  }
  return segments;
}

// ============================================
// DRAGGABLE SUBJECT SPAN
// ============================================

interface DraggableSpanProps {
  segment: SubjectSegment;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  onSubjectTap: (categoryId: string) => void;
  onDragStart: (categoryId: string, x: number, y: number) => void;
  onDragEnd: (categoryId: string, x: number, y: number) => void;
  onDragCancel: () => void;
}

const DraggableSpan = memo(function DraggableSpan({
  segment,
  dragX,
  dragY,
  onSubjectTap,
  onDragStart,
  onDragEnd,
  onDragCancel,
}: DraggableSpanProps) {
  const { category } = segment;
  const text = segment.words.map(w => w.text).join(' ');
  const catId = category.id;

  const gesture = useMemo(() => {
    const dragGesture = Gesture.Pan()
      .activateAfterLongPress(300)
      .onBegin((e) => {
        // Set initial position immediately on UI thread
        dragX.value = e.absoluteX;
        dragY.value = e.absoluteY;
        runOnJS(onDragStart)(catId, e.absoluteX, e.absoluteY);
      })
      .onChange((e) => {
        dragX.value = e.absoluteX;
        dragY.value = e.absoluteY;
      })
      .onEnd((e) => {
        runOnJS(onDragEnd)(catId, e.absoluteX, e.absoluteY);
      })
      .onFinalize((_, success) => {
        if (!success) runOnJS(onDragCancel)();
      });

    const tapGesture = Gesture.Tap()
      .onEnd((_, success) => {
        if (success) runOnJS(onSubjectTap)(catId);
      });

    // Exclusive: tap wins on short press, pan wins after long-press hold
    return Gesture.Exclusive(dragGesture, tapGesture);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catId]);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.subjectSpan,
          { backgroundColor: category.color ?? colors.secondary },
        ]}
      >
        <Text style={styles.subjectWord}>{text}</Text>
      </Animated.View>
    </GestureDetector>
  );
});

// ============================================
// MAIN COMPONENT
// ============================================

function SubjectHighlightTextBase({
  scene,
  subjectCategories,
  onSubjectTap,
  dragX,
  dragY,
  onDragStart,
  onDragEnd,
  onDragCancel,
}: SubjectHighlightTextProps) {
  const categoryMap = useMemo(() => {
    const map = new Map<string, SubjectCategory>();
    for (const cat of subjectCategories) map.set(cat.id, cat);
    return map;
  }, [subjectCategories]);

  const segments = useMemo(
    () => buildSegments(scene.words, scene.subjects, categoryMap),
    [scene.words, scene.subjects, categoryMap],
  );

  if (scene.words.length === 0) {
    return <Text style={styles.emptyText}>No text for this scene.</Text>;
  }

  return (
    <View style={styles.container}>
      {segments.map((seg, segIdx) => {
        if (seg.type === 'plain') {
          const text = seg.words.map(w => w.text).join(' ');
          return (
            <Text key={segIdx} style={styles.plainWord}>
              {text}{' '}
            </Text>
          );
        }
        return (
          <DraggableSpan
            key={segIdx}
            segment={seg}
            dragX={dragX}
            dragY={dragY}
            onSubjectTap={onSubjectTap}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={onDragCancel}
          />
        );
      })}
    </View>
  );
}

export const SubjectHighlightText = memo(SubjectHighlightTextBase);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  plainWord: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 26,
  },
  subjectSpan: {
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: 'rgba(20,22,20,0.25)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    marginVertical: 2,
  },
  subjectWord: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.inverse,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
});
