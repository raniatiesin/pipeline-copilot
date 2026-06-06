/**
 * ============================================
 * SUBJECT HIGHLIGHT TEXT
 * ============================================
 *
 * Renders scene text word-by-word with subject spans highlighted
 * in their SubjectCategory brand color.
 *
 * Algorithm:
 *   1. Build a word-index → { subject, category } lookup map
 *   2. Walk words left-to-right, grouping consecutive words
 *      that belong to the same subject into a single tappable span
 *   3. Plain words render as <Text>, subject spans render as
 *      <TouchableOpacity> with the category's background color
 *
 * Tapping a subject span calls onSubjectTap(category.id) so the
 * parent (SceneModePage) can open the SubjectBriefPopup.
 *
 * @module components/arc-assembler/SubjectHighlightText
 */

import React, { memo, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import type { Scene, Subject, SubjectCategory, Word } from '@/types/scene-segmentation';

// ============================================
// TYPES
// ============================================

export interface SubjectHighlightTextProps {
  scene: Scene;
  subjectCategories: SubjectCategory[];
  /** Called when the user taps a subject span. Receives the category ID. */
  onSubjectTap: (categoryId: string) => void;
}

// Internal segment shapes for the rendering pass
interface PlainSegment {
  type: 'plain';
  words: Word[];
}
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

/**
 * Groups the scene's word array into plain and subject segments.
 * Words belonging to the same subject are merged into one segment.
 */
function buildSegments(
  words: Word[],
  subjects: Subject[],
  categoryMap: Map<string, SubjectCategory>,
): Segment[] {
  // word index (scene-relative) → { subject, category }
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
      // Consume all words up to and including endWordIndex for this subject
      const segWords: Word[] = [];
      const end = info.subject.endWordIndex;
      while (i <= end && i < words.length) {
        segWords.push(words[i]);
        i++;
      }
      segments.push({ type: 'subject', words: segWords, subject: info.subject, category: info.category });
    } else {
      // Consume consecutive plain words
      const segWords: Word[] = [];
      while (i < words.length && !wordToSubject.has(i)) {
        segWords.push(words[i]);
        i++;
      }
      segments.push({ type: 'plain', words: segWords });
    }
  }

  return segments;
}

// ============================================
// COMPONENT
// ============================================

function SubjectHighlightTextBase({
  scene,
  subjectCategories,
  onSubjectTap,
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
    return (
      <Text style={styles.emptyText}>No text for this scene.</Text>
    );
  }

  return (
    <View style={styles.container}>
      {segments.map((seg, segIdx) => {
        const text = seg.words.map(w => w.text).join(' ');

        if (seg.type === 'plain') {
          return (
            <Text key={segIdx} style={styles.plainWord}>
              {text}{' '}
            </Text>
          );
        }

        // Subject span — tappable colored chip
        const { category } = seg;
        return (
          <TouchableOpacity
            key={segIdx}
            onPress={() => onSubjectTap(category.id)}
            activeOpacity={0.75}
            style={[
              styles.subjectSpan,
              { backgroundColor: category.color ?? colors.secondary },
            ]}
          >
            <Text style={styles.subjectWord}>{text}</Text>
          </TouchableOpacity>
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
