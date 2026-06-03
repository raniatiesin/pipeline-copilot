/**
 * ============================================
 * SCENE MAPPER GESTURE TYPES
 * ============================================
 *
 * Types for the Scene Mapper gesture system.
 *
 * Gesture hierarchy:
 * 1. Split  — long-press word → ghost card appears → drag down → release to confirm
 * 2. Merge  — horizontal swipe → merge with adjacent scene
 * 3. Reorder — long-press header → drag to reorder scenes
 *
 * Split uses react-native-gesture-handler (Pan.activateAfterLongPress)
 * with react-native-reanimated SharedValues for UI-thread animation.
 *
 * @module types/scene-mapper-gestures
 */

import type Animated from 'react-native-reanimated';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';

// ============================================
// GESTURE IDENTIFICATION
// ============================================

/** Possible active gesture types in the Scene Mapper. */
export type SceneMapperGestureType = 'split' | 'swipe' | 'reorder' | 'none';

/** Split lifecycle phase. */
export type SplitPhase = 'idle' | 'dragging' | 'settling' | 'collapsing';

// ============================================
// SPLIT GESTURE
// ============================================

/**
 * Identifies the scene and word being split.
 * The drag offset lives in a SharedValue (not here) for UI-thread perf.
 */
export interface SplitTarget {
  /** Scene being split */
  sceneId: string;
  /** Word data-index where the split occurs (this word and beyond → new scene) */
  splitWordIndex: number;
}

// ============================================
// SWIPE MERGE GESTURE
// ============================================

/** Direction of a swipe merge gesture. */
export type SwipeDirection = 'left' | 'right';

/** State for the swipe-to-merge interaction. */
export interface SwipeGestureState {
  /** Scene being swiped */
  sceneId: string;
  /** Swipe direction */
  direction: SwipeDirection;
  /** Current horizontal displacement in pixels */
  displacement: number;
  /** Whether the merge threshold has been reached */
  thresholdReached: boolean;
}

// ============================================
// DRAG REORDER GESTURE
// ============================================

/** State for the drag-to-reorder interaction. */
export interface ReorderGestureState {
  /** Scene being dragged */
  sceneId: string;
  /** Original index of the scene in the list */
  originalIndex: number;
  /** Current Y translation of the dragged card */
  translationY: number;
  /** Index of the currently highlighted drop zone (-1 = none) */
  activeDropZoneIndex: number;
}

// ============================================
// UNIFIED GESTURE STATE
// ============================================

/**
 * Union of all possible gesture states.
 * Only one gesture can be active at a time.
 */
export type ActiveGesture =
  | { type: 'none' }
  | { type: 'split'; data: SplitTarget }
  | { type: 'swipe'; data: SwipeGestureState }
  | { type: 'reorder'; data: ReorderGestureState };

// ============================================
// LAYOUT MEASUREMENT
// ============================================

/** Layout rectangle for word position measurement. */
export interface WordLayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Layout rectangle for card position measurement (in ScrollView coordinates). */
export interface CardLayoutRect {
  y: number;
  height: number;
}

// ============================================
// COMPONENT PROP INTERFACES
// ============================================

/** Props for the WordToken component. */
export interface WordTokenProps {
  /** The text to display */
  word: string;
  /** Data index of this word (word.index) */
  wordIndex: number;
  /** Whether this word can initiate a split (passes min-words check) */
  canSplit: boolean;
  /** SharedValue wrapping parent card's array index — UI-thread split target + dimming */
  sceneIndexSV: SharedValue<number>;
  /** SharedValue — gesture lock source index (-1 = no gesture). UI-thread guard + dim. */
  gestureLockSV: SharedValue<number>;
  /** Shared value — WordToken writes vertical drag distance here during split */
  splitDragOffset: SharedValue<number>;
  /** Shared value — index of card being split (-1=none), set in worklet */
  splitSceneIdx: SharedValue<number>;
  /** AnimatedRef to the parent card View — used for measure() in the worklet */
  cardRef: AnimatedRef<Animated.View>;
  /** Shared value — initial Y offset for ghost centering, written in onStart worklet */
  splitGhostOffsetY: SharedValue<number>;
  /** Shared value — word index where split starts (-1=none). Used for UI-thread hide. */
  splitWordIdxSV: SharedValue<number>;
  /** Called on JS thread when long-press fires (split start) */
  onSplitStart?: (wordIndex: number) => void;
  /** Called on JS thread when pan ends — passes final clamped offset */
  onSplitEnd?: (finalOffset: number) => void;
  /** Called on JS thread when gesture finalizes without a successful end */
  onSplitCancel?: () => void;
}

/** Props for the InterruptedCard (ghost overlay during split). */
export interface InterruptedCardProps {
  /** Words that will form the new scene (bottom portion) */
  words: import('./scene-segmentation').Word[];
  /** Scene number to display in header badge */
  sceneNumber: number;
  /** Shared value for vertical drag offset — drives translateY, opacity, border */
  dragOffset: SharedValue<number>;
  /** Shared value — initial Y offset so ghost starts centered on finger */
  initialOffsetY: SharedValue<number>;
  /** Shared value — ghost opacity (1 = visible, animated to 0 on commit) */
  ghostOpacity: SharedValue<number>;
  /** Optional callback with rendered ghost card height for placeholder sizing */
  onCardLayout?: (height: number) => void;
}

/** Props for the split spacer that pushes content below the active card. */
export interface SplitSpacerProps {
  /** Shared value for drag offset — spacer height tracks this */
  dragOffset: SharedValue<number>;
}

/** Props for the SwipeableWrapper component. */
export interface SwipeableWrapperProps {
  /** Whether swiping left (merge next) is allowed */
  canSwipeLeft: boolean;
  /** Whether swiping right (merge previous) is allowed */
  canSwipeRight: boolean;
  /** Callback when left swipe is confirmed */
  onSwipeLeft: () => void;
  /** Callback when right swipe is confirmed */
  onSwipeRight: () => void;
  /** Whether swipe is disabled (during other gestures) */
  disabled: boolean;
  /** Child content to wrap */
  children: React.ReactNode;
}

/** Props for the SceneHeader component. */
export interface SceneHeaderProps {
  /** Scene number to display */
  sceneNumber: number;
  /** Scene duration string */
  duration: string;
  /** Whether this card's gesture input should be disabled */
  disabled: boolean;
  /** Callback when reorder drag mode is activated via long-press */
  onReorderStart: () => void;
  /** Callback with Y translation during reorder drag */
  onReorderMove: (translationY: number) => void;
  /** Callback when reorder drag ends */
  onReorderEnd: () => void;
}

/** Props for the DropZone component. */
export interface DropZoneProps {
  /** Whether this drop zone is currently highlighted */
  isActive: boolean;
  /** Whether the drop zone is disabled (original position) */
  isDisabled: boolean;
}

/** Props for the SceneMapperCard (composite component). */
export interface SceneMapperCardProps {
  /** The scene data */
  sceneId: string;
  sceneOrder: number;
  words: import('./scene-segmentation').Word[];
  duration: number;
  /** Position flags */
  isFirst: boolean;
  isLast: boolean;
  /** Whether any gesture is active across the entire screen */
  gestureDisabled: boolean;
  /** Whether THIS card is the source of the active gesture */
  isGestureSource: boolean;
  /** Split target for this card (null = no active split on this card) */
  splitTarget: SplitTarget | null;
  /** Shared value for drag offset — passed to WordTokens + InterruptedCard */
  splitDragOffset: SharedValue<number>;
  /** Array index of this card in the scene list */
  sceneIndex: number;
  /** Shared value — index of card being split (-1=none) */
  splitSceneIdx: SharedValue<number>;
  /** Shared value — initial Y offset for ghost centering */
  splitGhostOffsetY: SharedValue<number>;
  /** Shared value — word index where split starts (-1=none) */
  splitWordIdxSV: SharedValue<number>;
  /** Shared value — ghost card opacity (1=visible, animated to 0 on commit) */
  splitGhostOpacity: SharedValue<number>;
  /** SharedValue — gesture lock source index (-1 = no gesture). Passed down to WordTokens. */
  gestureLockSV: SharedValue<number>;
  /** Gesture lifecycle callbacks */
  onGestureStart: (sceneId: string) => void;
  onGestureEnd: () => void;
  /** Split callbacks */
  onSplitStart: (sceneId: string, wordIndex: number) => void;
  onSplitEnd: (finalOffset: number) => void;
  onSplitCancel: () => void;
  /** Merge callbacks */
  onMergeWithPrevious: (sceneId: string) => void;
  onMergeWithNext: (sceneId: string) => void;
  /** Reorder drag callbacks */
  onReorderStart: (sceneId: string) => void;
  onReorderMove: (translationY: number) => void;
  onReorderEnd: () => void;
}
