/**
 * ============================================
 * SPLIT GESTURE HOOK
 * ============================================
 *
 * Encapsulates all split-gesture state and logic:
 * - SharedValue for drag offset (UI-thread animation)
 * - React state for split target (rendering)
 * - Start / end / cancel handlers
 * - Animated cancel (spring-back) and instant confirm
 *
 * The screen creates this hook and passes its outputs
 * down through SceneMapperCard → WordToken / InterruptedCard.
 *
 * @module hooks/useSplitGesture
 */

import {
    SPLIT_CONFIRM_THRESHOLD
} from '@/constants/sceneMapper';
import type { SplitTarget } from '@/types/scene-mapper-gestures';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { Easing, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';

type SplitSessionPhase = 'dragging' | 'committing' | 'cancelling';

interface SplitSession {
  sessionId: number;
  target: SplitTarget;
  phase: SplitSessionPhase;
}

export interface PendingSplitCommit {
  sessionId: number;
  sceneId: string;
  splitWordIndex: number;
}

// ============================================
// OPTIONS
// ============================================

export interface UseSplitGestureOptions {
  /** Data mutation — splits the scene at the given word index */
  splitSceneAt: (sceneId: string, wordIndex: number) => void;
  /** Called when the split gesture grabs the screen (lock other gestures) */
  onActivate: (sceneId: string) => void;
  /** Called when the split gesture releases the screen */
  onDeactivate: () => void;
}

// ============================================
// RETURN VALUE
// ============================================

export interface UseSplitGestureReturn {
  /** Shared value for vertical drag offset — pass to cards / tokens */
  splitDragOffset: SharedValue<number>;
  /** Shared value — index of card being split (-1=none) */
  splitSceneIdx: SharedValue<number>;
  /** Shared value — initial Y offset for ghost positioning (written by WordToken) */
  splitGhostOffsetY: SharedValue<number>;
  /** Shared value — word index where the split starts (-1=none), set in worklet */
  splitWordIdxSV: SharedValue<number>;
  /** Shared value — ghost card opacity (1=visible, animated to 0 during commit) */
  splitGhostOpacity: SharedValue<number>;
  /** Current split target (sceneId + wordIndex), or null */
  splitTarget: SplitTarget | null;
  /** Commit that has been applied to data and is waiting for render reconciliation */
  pendingCommit: PendingSplitCommit | null;
  /** Convenience boolean */
  isSplitActive: boolean;
  /** Called by WordToken (via runOnJS) when long-press fires */
  handleSplitStart: (sceneId: string, wordIndex: number) => void;
  /** Called by WordToken (via runOnJS) when pan ends — pass final offset */
  handleSplitEnd: (finalOffset: number) => void;
  /** Called by WordToken (via runOnJS) when gesture finalizes without successful end */
  handleSplitCancel: () => void;
  /** Cancel from outside (e.g. tap-outside-to-cancel) */
  cancelSplit: () => void;
  /** Finalize an already committed split after source scene reconciliation */
  finalizePendingCommit: () => void;
}

// ============================================
// HOOK
// ============================================

export function useSplitGesture({
  splitSceneAt,
  onActivate,
  onDeactivate,
}: UseSplitGestureOptions): UseSplitGestureReturn {
  const splitDragOffset = useSharedValue(0);
  const splitSceneIdx = useSharedValue(-1);
  const splitGhostOffsetY = useSharedValue(0);
  const splitWordIdxSV = useSharedValue(-1);
  const splitGhostOpacity = useSharedValue(1);
  const [splitTarget, setSplitTarget] = useState<SplitTarget | null>(null);
  const [pendingCommit, setPendingCommit] = useState<PendingSplitCommit | null>(null);

  const splitSessionRef = useRef<SplitSession | null>(null);
  const pendingCommitRef = useRef<PendingSplitCommit | null>(null);
  const sessionCounterRef = useRef(0);

  // Ref-stable: options are read from a ref so returned callbacks never change identity
  const optionsRef = useRef({ splitSceneAt, onActivate, onDeactivate });
  optionsRef.current = { splitSceneAt, onActivate, onDeactivate };

  // ── Internal: instant state cleanup (no animation) ──

  const resetSplitState = useCallback(() => {
    splitSessionRef.current = null;
    pendingCommitRef.current = null;
    setPendingCommit(null);
    setSplitTarget(null);
    splitSceneIdx.value = -1;
    splitWordIdxSV.value = -1;
    splitDragOffset.value = 0;
    splitGhostOpacity.value = 1;
    optionsRef.current.onDeactivate();
  }, [splitSceneIdx, splitWordIdxSV, splitDragOffset, splitGhostOpacity]);

  // ── Internal: post-ghost-fade commit (called via runOnJS) ──
  // Ghost is invisible. Commit data and let LinearTransition handle
  // ALL layout changes as one single, definitive motion. No slot
  // close animation — the slot simply unmounts when isSplitActive
  // becomes false, and the layout spring animates everything at once.

  const markPendingCommit = useCallback((sessionId: number, sceneId: string, splitWordIndex: number) => {
    const pending: PendingSplitCommit = { sessionId, sceneId, splitWordIndex };
    pendingCommitRef.current = pending;
    setPendingCommit(pending);
  }, []);

  // ── Internal: confirm split — instant commit, no fade ──
  // Ghost is already snapped at the placeholder position.
  // Commit immediately — ghost/placeholder unmount, splitSceneAt creates
  // the real card, LinearTransition handles the visual transition.
  // No fade = no flash, no disappear, no gap.

  const doCommitSplit = useCallback((session: SplitSession) => {
    const { sessionId, target } = session;
    requestAnimationFrame(() => {
      const currentSession = splitSessionRef.current;
      if (!currentSession) return;
      if (currentSession.sessionId !== sessionId) return;
      if (currentSession.phase !== 'committing') return;
      optionsRef.current.splitSceneAt(target.sceneId, target.splitWordIndex);
      markPendingCommit(sessionId, target.sceneId, target.splitWordIndex);
    });
  }, [markPendingCommit]);

  // ── Internal: animated cancel — all resets in parallel, fast ──

  const finalizeCancelledSession = useCallback((sessionId: number) => {
    const current = splitSessionRef.current;
    if (!current || current.sessionId !== sessionId) return;
    resetSplitState();
  }, [resetSplitState]);

  const animatedCancel = useCallback((sessionId: number) => {
    const dur = 200;
    const easing = Easing.out(Easing.cubic);
    splitDragOffset.value = withTiming(0, { duration: dur, easing }, (done) => {
      'worklet';
      if (done) {
        runOnJS(finalizeCancelledSession)(sessionId);
      }
    });
  }, [
    splitDragOffset,
    finalizeCancelledSession,
  ]);

  // ── Haptics ──

  const hapticLight = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const hapticMedium = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, []);

  // ── Start ──

  const handleSplitStart = useCallback(
    (sceneId: string, wordIndex: number) => {
      // Guard: don't start a second split while one is active
      if (splitSessionRef.current) return;

      // NOTE: shared values are already set by the worklet onStart.
      // Do NOT touch them here — that creates a race condition where
      // this JS callback zeroes values the worklet just wrote.

      // Reset opacity for this new gesture (left at 0 from previous commit fade)
      splitGhostOpacity.value = 1;

      const target: SplitTarget = { sceneId, splitWordIndex: wordIndex };
      const sessionId = ++sessionCounterRef.current;
      splitSessionRef.current = {
        sessionId,
        target,
        phase: 'dragging',
      };
      setSplitTarget(target);
      pendingCommitRef.current = null;
      setPendingCommit(null);
      optionsRef.current.onActivate(sceneId);
      hapticLight();
    },
    [hapticLight, splitGhostOpacity],
  );

  // ── End (confirm or cancel) ──

  const handleSplitEnd = useCallback(
    (finalOffset: number) => {
      const currentSession = splitSessionRef.current;
      if (!currentSession || currentSession.phase !== 'dragging') return;

      if (finalOffset >= SPLIT_CONFIRM_THRESHOLD) {
        splitSessionRef.current = {
          ...currentSession,
          phase: 'committing',
        };
        hapticMedium();
        doCommitSplit(currentSession);
      } else {
        splitSessionRef.current = {
          ...currentSession,
          phase: 'cancelling',
        };
        hapticLight();
        animatedCancel(currentSession.sessionId);
      }
    },
    [doCommitSplit, animatedCancel, hapticLight, hapticMedium],
  );

  // ── External cancel (tap outside, etc.) ──

  const cancelSplit = useCallback(() => {
    const currentSession = splitSessionRef.current;
    if (!currentSession || currentSession.phase !== 'dragging') return;
    splitSessionRef.current = {
      ...currentSession,
      phase: 'cancelling',
    };
    hapticLight();
    animatedCancel(currentSession.sessionId);
  }, [animatedCancel, hapticLight]);

  const handleSplitCancel = useCallback(() => {
    const currentSession = splitSessionRef.current;
    if (!currentSession || currentSession.phase !== 'dragging') return;
    splitSessionRef.current = {
      ...currentSession,
      phase: 'cancelling',
    };
    animatedCancel(currentSession.sessionId);
  }, [animatedCancel]);

  const finalizePendingCommit = useCallback(() => {
    const pending = pendingCommitRef.current;
    const session = splitSessionRef.current;
    if (!pending || !session) return;
    if (session.sessionId !== pending.sessionId) return;
    if (session.phase !== 'committing') return;
    resetSplitState();
  }, [resetSplitState]);

  return {
    splitDragOffset,
    splitSceneIdx,
    splitGhostOffsetY,
    splitWordIdxSV,
    splitGhostOpacity,
    splitTarget,
    pendingCommit,
    isSplitActive: splitTarget !== null,
    handleSplitStart,
    handleSplitEnd,
    handleSplitCancel,
    cancelSplit,
    finalizePendingCommit,
  };
}
