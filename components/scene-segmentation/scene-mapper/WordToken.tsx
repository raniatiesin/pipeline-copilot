/**
 * ============================================
 * WORD TOKEN COMPONENT
 * ============================================
 *
 * Atomic unit of the Scene Mapper — a single interactive word.
 *
 * Uses a single RNGH Pan gesture with activateAfterLongPress(300ms).
 * On activation the gesture writes directly to a shared value for
 * UI-thread drag animation, and calls JS-thread callbacks for
 * split lifecycle (start / end).
 *
 * No PanResponder, no Pressable, no responder handoff.
 *
 * @module components/scene-segmentation/scene-mapper/WordToken
 */

import { SPLIT_LONG_PRESS_MS } from '@/constants/sceneMapper';
import { colors, typography } from '@/constants/theme';
import type { WordTokenProps } from '@/types/scene-mapper-gestures';
import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    measure,
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
} from 'react-native-reanimated';

// ============================================
// COMPONENT
// ============================================

const WordTokenInner: React.FC<WordTokenProps> = ({
  word,
  wordIndex,
  canSplit,
  sceneIndexSV,
  gestureLockSV,
  splitDragOffset,
  splitSceneIdx,
  splitWordIdxSV,
  cardRef,
  splitGhostOffsetY,
  onSplitStart,
  onSplitEnd,
  onSplitCancel,
}) => {
  // ── Hide style: computed entirely on UI thread from shared values ──
  // No React re-render when the split starts — gesture stays alive.
  const hideProgress = useDerivedValue(() => {
    const shouldHide =
      splitSceneIdx.value === sceneIndexSV.value &&
      splitWordIdxSV.value >= 0 &&
      wordIndex >= splitWordIdxSV.value;
    return shouldHide ? 1 : 0;
  });

  const hideAndDimStyle = useAnimatedStyle(() => {
    const p = hideProgress.value;
    return {
      opacity: 1 - p,
    };
  });
  // ── Single gesture: Pan activated after long-press ──
  const splitGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(SPLIT_LONG_PRESS_MS)
        .enabled(canSplit)
        .shouldCancelWhenOutside(false)
        .onStart((e) => {
          'worklet';
          // Guard: block if any gesture is already active (split, merge, or reorder)
          if (gestureLockSV.value >= 0 || splitSceneIdx.value >= 0) return;
          // Position ghost so its vertical center aligns with the finger
          const m = measure(cardRef);
          if (m) {
            const localY = e.absoluteY - m.pageY;
            // localY = finger position within card
            // We want: ghostTop + ghostHeight/2 = finger position relative to card bottom
            // ghostTop = initialOffsetY + dragOffset, dragOffset starts at 0
            // So initialOffsetY = localY - cardHeight (negative, above card bottom)
            splitGhostOffsetY.value = localY - m.height;
          } else {
            splitGhostOffsetY.value = -40;
          }
          splitSceneIdx.value = sceneIndexSV.value;
          splitWordIdxSV.value = wordIndex;
          splitDragOffset.value = 0;
          if (onSplitStart) {
            runOnJS(onSplitStart)(wordIndex);
          }
        })
        .onUpdate((e) => {
          'worklet';
          const isOwner =
            splitSceneIdx.value === sceneIndexSV.value &&
            splitWordIdxSV.value === wordIndex;
          if (!isOwner) return;
          // Clamp to downward-only movement
          splitDragOffset.value = Math.max(0, e.translationY);
        })
        .onEnd((e) => {
          'worklet';
          const isOwner =
            splitSceneIdx.value === sceneIndexSV.value &&
            splitWordIdxSV.value === wordIndex;
          if (!isOwner) return;
          if (onSplitEnd) {
            runOnJS(onSplitEnd)(Math.max(0, e.translationY));
          }
        })
        .onFinalize((_e, success) => {
          'worklet';
          // Recovery path for interrupted gestures where onEnd doesn't fire.
          // Only the owner token is allowed to close the session.
          const isOwner =
            splitSceneIdx.value === sceneIndexSV.value &&
            splitWordIdxSV.value === wordIndex;
          if (!success && isOwner && onSplitCancel) {
            runOnJS(onSplitCancel)();
          }
        }),
    [canSplit, splitDragOffset, splitSceneIdx, splitWordIdxSV, splitGhostOffsetY, sceneIndexSV, gestureLockSV, cardRef, wordIndex, onSplitStart, onSplitEnd, onSplitCancel],
  );

  return (
    <GestureDetector gesture={splitGesture}>
      <Animated.View style={[styles.container, hideAndDimStyle]}>
        <Text style={styles.word}>
          {word}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
};

export const WordToken = React.memo(WordTokenInner);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  word: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 28,
  },
});
