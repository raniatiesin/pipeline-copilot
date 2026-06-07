/**
 * ============================================
 * BEAT BUTCHER — SCENE SEGMENTATION SCREEN
 * ============================================
 *
 * Gesture-driven scene editing interface.
 *
 * Three gesture systems, all using react-native-gesture-handler:
 * 1. **Split**   — long-press word (300ms) → ghost card → drag down → release
 * 2. **Merge**   — swipe card left/right
 * 3. **Reorder** — long-press header (500ms) → drag to reposition
 *
 * Split is managed by the useSplitGesture hook which owns:
 * - SharedValue<number> for drag offset (UI-thread animation)
 * - React state for split identity (rendering)
 * - Confirm / cancel / spring-back logic
 *
 * No PanResponder anywhere. No responder handoff race conditions.
 *
 * @module app/scene-segmentation/beat-butcher
 */

import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { LinearTransition, useSharedValue } from 'react-native-reanimated';
import {
  DropZone,
  SceneMapperCard,
} from '../../components/scene-segmentation/scene-mapper';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { stageCallbacks } from '../../lib/stageCallbacks';
import { DROP_ZONE_HEIGHT } from '../../constants/sceneMapper';
import { colors, spacing, typography } from '../../constants/theme';
import { useSceneSegmentation } from '../../hooks/useSceneSegmentation';
import { useSplitGesture } from '../../hooks/useSplitGesture';
import type { CardLayoutRect } from '../../types/scene-mapper-gestures';

// ============================================
// MAIN SCREEN
// ============================================

export default function BeatButcherScreen() {
  const {
    state,
    splitSceneAt,
    mergeScenesById,
    reorderSceneById,
    deleteScene,
  } = useSceneSegmentation();

  // ── Global gesture lock ──

  const [activeGesture, setActiveGesture] = useState<
    | { type: 'none' }
    | { type: 'split'; sceneId: string }
    | { type: 'reorder'; sceneId: string }
  >({ type: 'none' });

  // Refs for stable callbacks (avoids re-rendering all cards when scenes/state change)
  const scenesRef = useRef(state.scenes);
  scenesRef.current = state.scenes;

  // SharedValue mirror of gesture lock — read by WordToken on UI thread for guard + dimming
  const gestureLockSV = useSharedValue(-1);

  const setGestureLockBySceneId = useCallback((sceneId: string) => {
    const idx = scenesRef.current.findIndex(s => s.id === sceneId);
    gestureLockSV.value = idx >= 0 ? idx : 0;
  }, [gestureLockSV]);

  const handleGestureStart = useCallback((sceneId: string) => {
    setActiveGesture({ type: 'reorder', sceneId });
    setGestureLockBySceneId(sceneId);
  }, [setGestureLockBySceneId]);

  const handleGestureEnd = useCallback(() => {
    setActiveGesture({ type: 'none' });
    reorderStateRef.current = null;
    setReorderState(null);
    gestureLockSV.value = -1;
  }, [gestureLockSV]);

  // ── Split gesture (hook) ──

  const split = useSplitGesture({
    splitSceneAt,
    onActivate: (sceneId) => {
      setActiveGesture({ type: 'split', sceneId });
      setGestureLockBySceneId(sceneId);
    },
    onDeactivate: () => {
      setActiveGesture({ type: 'none' });
      gestureLockSV.value = -1;
    },
  });

  // Split callbacks — stable references after useSplitGesture ref-stable fix
  const handleSplitStart = split.handleSplitStart;
  const handleSplitEnd = split.handleSplitEnd;
  const handleSplitCancel = split.handleSplitCancel;
  const cancelSplit = split.cancelSplit;

  // ── Tap-outside-to-cancel ──

  const handleBackgroundPress = useCallback(() => {
    cancelSplit();
  }, [cancelSplit]);

  const pendingSplitCommit = split.pendingCommit;
  const finalizePendingSplitCommit = split.finalizePendingCommit;

  // ── Split finalize barrier: keep cut words hidden until source scene has reconciled ──
  useEffect(() => {
    const pending = pendingSplitCommit;
    if (!pending) return;

    const sourceScene = state.scenes.find(scene => scene.id === pending.sceneId);

    // If the source no longer exists (edge case), always finalize.
    if (!sourceScene) {
      finalizePendingSplitCommit();
      return;
    }

    // Finalize only after the split word is no longer in the source scene.
    const sourceStillContainsSplitWord = sourceScene.words.some(
      word => word.index === pending.splitWordIndex,
    );

    if (!sourceStillContainsSplitWord) {
      finalizePendingSplitCommit();
    }
  }, [state.scenes, pendingSplitCommit, finalizePendingSplitCommit]);

  // ── Reorder state ──

  const [reorderState, setReorderState] = useState<{
    sceneId: string;
    originalIndex: number;
    activeDropZone: number;
  } | null>(null);

  const reorderStateRef = useRef(reorderState);
  reorderStateRef.current = reorderState;

  const cardLayouts = useRef<Map<string, CardLayoutRect>>(new Map());

  // ── Delete first / last scene ──

  const handleDeleteScene = useCallback(
    (sceneId: string) => {
      // Guard: minimum 1 scene must always remain
      if (scenesRef.current.length <= 1) return;
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      deleteScene(sceneId);
    },
    [deleteScene],
  );

  // ── Merge confirmed ──

  const handleMergeWithPrevious = useCallback(
    (sceneId: string) => {
      const scenes = scenesRef.current;
      const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
      if (sceneIndex <= 0) return;
      const prevScene = scenes[sceneIndex - 1];
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      mergeScenesById(prevScene.id, sceneId);
    },
    [mergeScenesById],
  );

  const handleMergeWithNext = useCallback(
    (sceneId: string) => {
      const scenes = scenesRef.current;
      const sceneIndex = scenes.findIndex((s) => s.id === sceneId);
      if (sceneIndex < 0 || sceneIndex >= scenes.length - 1) return;
      const nextScene = scenes[sceneIndex + 1];
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      mergeScenesById(sceneId, nextScene.id);
    },
    [mergeScenesById],
  );

  // ── Reorder callbacks ──

  const handleReorderStart = useCallback(
    (sceneId: string) => {
      const scenes = scenesRef.current;
      const idx = scenes.findIndex((s) => s.id === sceneId);
      if (idx < 0) return;
      const initialState = {
        sceneId,
        originalIndex: idx,
        activeDropZone: -1,
      };
      reorderStateRef.current = initialState;
      setReorderState(initialState);
    },
    [],
  );

  const handleReorderMove = useCallback(
    (translationY: number) => {
      const rs = reorderStateRef.current;
      const scenes = scenesRef.current;
      if (!rs) return;
      const draggedLayout = cardLayouts.current.get(rs.sceneId);
      if (!draggedLayout) return;
      const draggedCenterY = draggedLayout.y + draggedLayout.height / 2 + translationY;

      let bestZone = -1;
      let bestDist = Infinity;

      for (let i = 0; i <= scenes.length; i++) {
        let zoneY: number;
        if (i === 0) {
          const firstLayout = cardLayouts.current.get(scenes[0]?.id);
          zoneY = firstLayout ? firstLayout.y - DROP_ZONE_HEIGHT / 2 : 0;
        } else if (i === scenes.length) {
          const lastLayout = cardLayouts.current.get(scenes[scenes.length - 1]?.id);
          zoneY = lastLayout ? lastLayout.y + lastLayout.height + DROP_ZONE_HEIGHT / 2 : 0;
        } else {
          const prevLayout = cardLayouts.current.get(scenes[i - 1]?.id);
          const nextLayout = cardLayouts.current.get(scenes[i]?.id);
          if (prevLayout && nextLayout) {
            zoneY = (prevLayout.y + prevLayout.height + nextLayout.y) / 2;
          } else {
            continue;
          }
        }
        const dist = Math.abs(draggedCenterY - zoneY);
        if (dist < bestDist) {
          bestDist = dist;
          bestZone = i;
        }
      }

      if (rs.activeDropZone !== bestZone) {
        const nextState = {
          ...rs,
          activeDropZone: bestZone,
        };
        reorderStateRef.current = nextState;
        setReorderState(nextState);
      }
    },
    [],
  );

  const handleReorderEnd = useCallback(() => {
    const rs = reorderStateRef.current;
    if (!rs || rs.activeDropZone < 0) return;
    const targetIndex = rs.activeDropZone > rs.originalIndex
      ? rs.activeDropZone - 1
      : rs.activeDropZone;
    if (targetIndex !== rs.originalIndex) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      reorderSceneById(rs.sceneId, targetIndex);
    }
  }, [reorderSceneById]);

  // ── Card layout measurement ──

  const handleCardLayout = useCallback(
    (sceneId: string, event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      cardLayouts.current.set(sceneId, { y, height });
    },
    [],
  );

  // ── Navigation ──

  // Mark card IN_PROGRESS when screen mounts
  useEffect(() => {
    stageCallbacks.markInProgress('beat-butcher');
  }, []);

  const handleContinue = useCallback(() => {
    stageCallbacks.markInReview('beat-butcher');
    router.dismissAll();
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  // ── Derived ──

  const isAnyGestureActive = activeGesture.type !== 'none';
  const isReorderActive = reorderState != null;
  const sceneItems = useMemo(() => state.scenes, [state.scenes]);
  const cardLayoutTransition = useMemo(
    () => LinearTransition.springify().damping(24).stiffness(120).mass(1),
    [],
  );

  // ── Render ──

  return (
    <ScreenLayout
      tabs={[
        { label: 'Project', route: '/project' },
        { label: 'Beat Butcher', route: '/scene-segmentation/beat-butcher' },
      ]}
      title="Beat Butcher"
      progress={33}
      onBack={handleBack}
      onContinue={handleContinue}
    >

      {/* Scene Cards */}
      <View style={styles.scrollWrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={!isAnyGestureActive}
          showsVerticalScrollIndicator={true}
          indicatorStyle="black"
        >
          {sceneItems.map((scene, index) => {
            const isGestureSource = activeGesture.type !== 'none' && activeGesture.sceneId === scene.id;
            const cardSplitTarget =
              split.splitTarget && split.splitTarget.sceneId === scene.id
                ? split.splitTarget
                : null;
            const splitOverlayElevated = cardSplitTarget != null;

            return (
              <View key={scene.id}>
                {/* Drop zone above this card (reorder mode) */}
                {isReorderActive && reorderState.sceneId !== scene.id && (
                  <DropZone
                    isActive={reorderState.activeDropZone === index}
                    isDisabled={
                      index === reorderState.originalIndex ||
                      index === reorderState.originalIndex + 1
                    }
                  />
                )}

                {/* Scene Card */}
                <Animated.View
                  layout={cardLayoutTransition}
                  style={[
                    styles.cardSpacer,
                    splitOverlayElevated && styles.cardSpacerElevated,
                  ]}
                  onLayout={(e) => handleCardLayout(scene.id, e)}
                >
                  <SceneMapperCard
                    sceneId={scene.id}
                    sceneOrder={scene.order}
                    words={scene.words}
                    duration={scene.estimatedDuration || 0}
                    isFirst={index === 0}
                    isLast={index === sceneItems.length - 1}
                    gestureDisabled={isAnyGestureActive && !isGestureSource}
                    isGestureSource={isGestureSource}
                    splitTarget={cardSplitTarget}
                    splitDragOffset={split.splitDragOffset}
                    sceneIndex={index}
                    splitSceneIdx={split.splitSceneIdx}
                    splitGhostOffsetY={split.splitGhostOffsetY}
                    splitWordIdxSV={split.splitWordIdxSV}
                    splitGhostOpacity={split.splitGhostOpacity}
                    gestureLockSV={gestureLockSV}
                    onGestureStart={handleGestureStart}
                    onGestureEnd={handleGestureEnd}
                    onSplitStart={handleSplitStart}
                    onSplitEnd={handleSplitEnd}
                    onSplitCancel={handleSplitCancel}
                    onMergeWithPrevious={handleMergeWithPrevious}
                    onMergeWithNext={handleMergeWithNext}
                    onReorderStart={handleReorderStart}
                    onReorderMove={handleReorderMove}
                    onReorderEnd={handleReorderEnd}
                  />
                </Animated.View>

                {/* Delete affordance — first and last card only, minimum 1 card guard */}
                {(index === 0 || index === sceneItems.length - 1) &&
                  sceneItems.length > 1 &&
                  !isAnyGestureActive && (
                    <Pressable
                      onPress={() => handleDeleteScene(scene.id)}
                      style={styles.deleteButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather name="trash-2" size={12} color={colors.error} />
                      <Text style={styles.deleteButtonText}>DELETE BEAT</Text>
                    </Pressable>
                  )}
              </View>
            );
          })}

          {/* Drop zone after last card (reorder mode) */}
          {isReorderActive && (
            <DropZone
              isActive={reorderState.activeDropZone === sceneItems.length}
              isDisabled={reorderState.originalIndex === sceneItems.length - 1}
            />
          )}

          {/* Empty state */}
          {sceneItems.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="film" size={40} color={colors.text.secondary} />
              <Text style={styles.emptyText}>No scenes yet</Text>
              <Text style={styles.emptySubtext}>
                Go back and paste a script to generate scenes
              </Text>
            </View>
          )}

          {/* Tap-to-cancel: fills remaining space at bottom */}
          {split.isSplitActive && (
            <Pressable
              onPress={handleBackgroundPress}
              style={styles.cancelTapZone}
            />
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>

    </ScreenLayout>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  scrollWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  cardSpacer: {
    marginBottom: spacing.sm,
  },
  cardSpacerElevated: {
    zIndex: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.subtitle,
    color: colors.text.secondary,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  bottomPadding: {
    height: 120,
  },
  cancelTapZone: {
    minHeight: 200,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
    alignSelf: 'flex-end',
  },
  deleteButtonText: {
    ...typography.caption,
    color: colors.error,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 10,
  },
});
