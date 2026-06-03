/**
 * ============================================
 * SCENE MAPPER CARD — COMPOSITE COMPONENT
 * ============================================
 *
 * Primary card for the Scene Mapper screen.
 * Composes three gesture sub-systems:
 *
 * 1. **Split**   — per-word Pan(activateAfterLongPress) → ghost card
 * 2. **Merge**   — horizontal swipe via SwipeableWrapper
 * 3. **Reorder** — long-press header via SceneHeader
 *
 * Split animation is driven entirely by a SharedValue<number>
 * passed down from the screen (via useSplitGesture hook).
 * The card does NOT own split state — it receives a SplitTarget
 * and forwards lifecycle callbacks.
 *
 * @module components/scene-segmentation/scene-mapper/SceneMapperCard
 */

import {
    SPLIT_COLORS,
    SPLIT_MIN_WORDS,
    SPLIT_PLACEHOLDER_GAP,
} from '@/constants/sceneMapper';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';
import type { SceneMapperCardProps } from '@/types/scene-mapper-gestures';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useAnimatedRef,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { InterruptedCard } from './InterruptedCard';
import { SceneHeader } from './SceneHeader';
import { SwipeableWrapper } from './SwipeableWrapper';
import { WordToken } from './WordToken';

// ============================================
// COMPONENT
// ============================================

export const SceneMapperCard = React.memo(function SceneMapperCard({
  sceneId,
  sceneOrder,
  words,
  duration,
  isFirst,
  isLast,
  gestureDisabled,
  isGestureSource,
  splitTarget,
  splitDragOffset,
  sceneIndex,
  splitSceneIdx,
  splitGhostOffsetY,
  splitWordIdxSV,
  splitGhostOpacity,
  gestureLockSV,
  onGestureStart,
  onGestureEnd,
  onSplitStart,
  onSplitEnd,
  onSplitCancel,
  onMergeWithPrevious,
  onMergeWithNext,
  onReorderStart,
  onReorderMove,
  onReorderEnd,
}: SceneMapperCardProps) {
  // ── Split: is this card being split? ──
  const cardRef = useAnimatedRef<Animated.View>();
  const isSplitActive = splitTarget != null && splitTarget.sceneId === sceneId;
  const splitWordIndex = isSplitActive ? splitTarget.splitWordIndex : -1;

  // SharedValue mirror of sceneIndex — WordToken reads this in its worklet
  // so it can be removed from gesture useMemo deps (stable ref, value updates)
  const sceneIndexSV = useSharedValue(sceneIndex);
  useEffect(() => {
    sceneIndexSV.value = sceneIndex;
  }, [sceneIndex, sceneIndexSV]);

  // Ref for isSplitActive — makes handleWordSplitStart ref-stable
  const isSplitActiveRef = useRef(isSplitActive);
  isSplitActiveRef.current = isSplitActive;

  // Map data-index → array position for slicing
  const splitArrayIdx = isSplitActive
    ? words.findIndex((w) => w.index === splitWordIndex)
    : -1;
  const bottomWords = splitArrayIdx >= 0 ? words.slice(splitArrayIdx) : [];

  // ── Pre-compute canSplit per word (avoids doing it in each token) ──
  const canSplitMap = useMemo(() => {
    const map = new Map<number, boolean>();
    words.forEach((w, arrayIdx) => {
      map.set(
        w.index,
        arrayIdx >= SPLIT_MIN_WORDS && arrayIdx <= words.length - SPLIT_MIN_WORDS - 1,
      );
    });
    return map;
  }, [words]);

  // ── Split lifecycle forwarding ──
  const handleWordSplitStart = useCallback(
    (wordIndex: number) => {
      if (isSplitActiveRef.current) return; // guard: already splitting
      onSplitStart(sceneId, wordIndex);
    },
    [sceneId, onSplitStart],
  );

  const handleWordSplitEnd = useCallback(
    (finalOffset: number) => {
      onSplitEnd(finalOffset);
    },
    [onSplitEnd],
  );

  const handleWordSplitCancel = useCallback(() => {
    onSplitCancel();
  }, [onSplitCancel]);

  // ── Reorder callbacks ──
  const handleReorderStart = useCallback(() => {
    onGestureStart(sceneId);
    onReorderStart(sceneId);
  }, [sceneId, onGestureStart, onReorderStart]);

  const handleReorderMove = useCallback(
    (translationY: number) => onReorderMove(translationY),
    [onReorderMove],
  );

  const handleReorderEnd = useCallback(() => {
    onGestureEnd();
    onReorderEnd();
  }, [onGestureEnd, onReorderEnd]);

  // ── Swipe callbacks (fire-and-forget — no gesture lock needed) ──
  const handleSwipeRight = useCallback(() => {
    onMergeWithNext(sceneId);
  }, [sceneId, onMergeWithNext]);

  const handleSwipeLeft = useCallback(() => {
    onMergeWithPrevious(sceneId);
  }, [sceneId, onMergeWithPrevious]);

  // ── Placeholder height: stored in React state so it flows through Yoga ──
  // Animated height (useAnimatedStyle) does NOT trigger sibling relayout.
  // React state → static style → Yoga → siblings move. LinearTransition smooths it.
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const placeholderHeightCacheRef = useRef<Map<string, number>>(new Map());

  const estimatedPlaceholderHeight = useMemo(() => {
    if (bottomWords.length === 0) return 0;
    const estimatedWordsPerLine = 6;
    const lineCount = Math.max(1, Math.ceil(bottomWords.length / estimatedWordsPerLine));
    const wordBlockHeight = lineCount * 28;
    const rowGapHeight = Math.max(0, lineCount - 1) * spacing.xxs;
    return 44 + (spacing.md * 2) + wordBlockHeight + rowGapHeight;
  }, [bottomWords.length]);

  const placeholderHeight = measuredHeight > 0 ? measuredHeight : estimatedPlaceholderHeight;

  // ── Placeholder border fill: reacts to ghost snap position ──
  const placeholderFillStyle = useAnimatedStyle(() => {
    const isTarget = splitSceneIdx.value === sceneIndex;
    if (!isTarget) return {};
    const ghostPos = splitGhostOffsetY.value + splitDragOffset.value;
    const isSnapped = ghostPos >= SPLIT_PLACEHOLDER_GAP;
    return {
      borderColor: isSnapped
        ? SPLIT_COLORS.placeholderBorderActive
        : SPLIT_COLORS.placeholderBorder,
      backgroundColor: isSnapped ? colors.surface : SPLIT_COLORS.placeholderBg,
    };
  });

  // ── Track whether we've already measured this split cycle ──
  const hasMeasuredRef = useRef(false);
  const splitMeasureKey = useMemo(() => {
    if (!isSplitActive || splitWordIndex < 0) return null;
    return `${sceneId}:${splitWordIndex}:${words.length}`;
  }, [isSplitActive, splitWordIndex, sceneId, words.length]);

  // Restore cached measurement for current split key (if available)
  useEffect(() => {
    if (!isSplitActive || !splitMeasureKey) {
      hasMeasuredRef.current = false;
      return;
    }
    const cachedHeight = placeholderHeightCacheRef.current.get(splitMeasureKey);
    if (cachedHeight != null && cachedHeight > 0) {
      hasMeasuredRef.current = true;
      setMeasuredHeight(cachedHeight);
      return;
    }
    hasMeasuredRef.current = false;
    setMeasuredHeight(0);
  }, [isSplitActive, splitMeasureKey]);

  // ── Capture ghost card layout for immediate accurate placeholder sizing ──
  const handleGhostCardLayout = useCallback(
    (height: number) => {
      if (!isSplitActive || height <= 0) return;
      hasMeasuredRef.current = true;
      setMeasuredHeight((prev) => (prev === height ? prev : height));
      if (splitMeasureKey) {
        placeholderHeightCacheRef.current.set(splitMeasureKey, height);
      }
    },
    [isSplitActive, splitMeasureKey],
  );

  // ── Render ──
  return (
    <>
      <SwipeableWrapper
        canSwipeLeft={!isFirst}
        canSwipeRight={!isLast}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        disabled={gestureDisabled || isSplitActive}
      >
        <Animated.View
          ref={cardRef}
          style={styles.card}
        >
          {/* Header with reorder drag */}
          <SceneHeader
            sceneNumber={sceneOrder}
            duration={`~${duration.toFixed(1)}s`}
            disabled={(gestureDisabled && !isGestureSource) || isSplitActive}
            onReorderStart={handleReorderStart}
            onReorderMove={handleReorderMove}
            onReorderEnd={handleReorderEnd}
          />

          {/* Word flow — ALL words always rendered to keep gesture handlers alive.
              Bottom-half words become invisible when split is active
              (the InterruptedCard renders the visual copy below). */}
          <View style={styles.body}>
            <View style={styles.wordFlow}>
              {words.map((word) => {
                return (
                    <WordToken
                      key={word.id}
                      word={word.text}
                      wordIndex={word.index}
                      sceneIndexSV={sceneIndexSV}
                      gestureLockSV={gestureLockSV}
                      canSplit={canSplitMap.get(word.index) ?? false}
                      splitDragOffset={splitDragOffset}
                      splitSceneIdx={splitSceneIdx}
                      splitWordIdxSV={splitWordIdxSV}
                      cardRef={cardRef}
                      splitGhostOffsetY={splitGhostOffsetY}
                      onSplitStart={handleWordSplitStart}
                      onSplitEnd={handleWordSplitEnd}
                      onSplitCancel={handleWordSplitCancel}
                    />
                );
              })}
            </View>

          </View>
        </Animated.View>
      </SwipeableWrapper>

      {/* Ghost card — zero-height wrapper right after card, ghost starts at card bottom */}
      {isSplitActive && bottomWords.length > 0 && (
        <View style={styles.ghostWrapper}>
          <InterruptedCard
            words={bottomWords}
            sceneNumber={sceneOrder + 1}
            dragOffset={splitDragOffset}
            initialOffsetY={splitGhostOffsetY}
            ghostOpacity={splitGhostOpacity}
            onCardLayout={handleGhostCardLayout}
          />
        </View>
      )}

      {/* Placeholder — gray-bordered slot that fills when the ghost snaps in */}
      {isSplitActive && bottomWords.length > 0 && (
        <Animated.View
          style={[
            styles.placeholder,
            { height: placeholderHeight },
            placeholderFillStyle,
          ]}
          pointerEvents="none"
        />
      )}
    </>
  );
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    ...shadows.soft,
    overflow: 'hidden',
  },
  body: {
    minHeight: 40,
    position: 'relative',
  },
  wordFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.xxs,
  },
  /** Placeholder — gray-bordered slot that fills when the ghost card snaps in. */
  placeholder: {
    marginTop: SPLIT_PLACEHOLDER_GAP,
    borderWidth: 3,
    borderColor: SPLIT_COLORS.placeholderBorder,
    borderRadius: borderRadius.lg,
    backgroundColor: SPLIT_COLORS.placeholderBg,
  },
  /** Ghost wrapper — takes no flow space; ghost renders via overflow: visible. */
  ghostWrapper: {
    height: 0,
    overflow: 'visible' as const,
    zIndex: 2,
  },
});
