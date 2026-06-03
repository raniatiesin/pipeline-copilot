/**
 * ============================================
 * SCENE MAPPER CONSTANTS
 * ============================================
 *
 * Configuration values for the Scene Mapper gesture system.
 * Includes thresholds, spring configs, timing, and visual params.
 *
 * All animations use spring physics from react-native-reanimated.
 * Timing values are in milliseconds; distances in logical pixels.
 *
 * @module constants/sceneMapper
 */

// ============================================
// GESTURE THRESHOLDS
// ============================================

/** Swipe merge: horizontal displacement (px) to confirm merge. */
export const SWIPE_THRESHOLD = 80;

/** Swipe merge: maximum displacement allowed (px). */
export const SWIPE_MAX_DISTANCE = 120;

/** Swipe merge: movement multiplier before threshold (feels weighted). */
export const SWIPE_RESISTANCE = 0.6;

/** Swipe merge: movement multiplier after threshold (heavier). */
export const SWIPE_RESISTANCE_PAST = 0.3;

/** Swipe merge: max displacement on a disabled direction (rubber band). */
export const SWIPE_RUBBER_BAND_MAX = 30;

/** Swipe merge: minimum horizontal movement to start (prevents accidental). */
export const SWIPE_MIN_START = 10;

/** Long-press duration to activate word split (ms). Ultra-tight for instant feel. */
export const SPLIT_LONG_PRESS_MS = 100;

/** Long-press duration to activate reorder drag (ms). */
export const REORDER_LONG_PRESS_MS = 500;

/** Split confirm threshold on release (px). */
export const SPLIT_CONFIRM_THRESHOLD = 60;

/** Minimum words that must remain on each side of a split. */
export const SPLIT_MIN_WORDS = 1;

// ============================================
// SPRING PHYSICS (react-native-reanimated)
// ============================================

/** Spring config for card movements (split, merge, shift). Critically damped for butter-smooth settle. */
export const SPRING_CARD = {
  damping: 20,
  stiffness: 90,
  mass: 0.8,
} as const;

/** Spring config for small UI elements (badges, buttons). */
export const SPRING_UI = {
  damping: 14,
  stiffness: 120,
  mass: 1,
} as const;

// ============================================
// TIMING CONSTANTS (ms)
// ============================================

/** Fade-in/out duration for transient overlays. */
export const TIMING_FADE = 220;

/** Card merge slide + fade. */
export const TIMING_CARD_MERGE = 200;

/** Card separation spring animation. */
export const TIMING_CARD_SPLIT = 300;

/** Reorder card drop animation. */
export const TIMING_REORDER_DROP = 400;

/** Split cancel — dimmed words return to normal. */
export const TIMING_SPLIT_CANCEL = 150;

// ============================================
// VISUAL PARAMETERS
// ============================================

/** Drop zone height during reorder (px). */
export const DROP_ZONE_HEIGHT = 80;

/** Scene header touch-target height (px). */
export const SCENE_HEADER_HEIGHT = 44;

/** Dragged card scale factor. */
export const DRAG_SCALE = 1.05;

/** Swipe action background width (px). */
export const SWIPE_ACTION_WIDTH = 120;

/** Gap between card bottom and placeholder top (px). */
export const SPLIT_PLACEHOLDER_GAP = 10;

/** Spring config for split cancel snap-back. Critically damped — no oscillation, fluid deceleration. */
export const SPLIT_SPRING = {
  damping: 22,
  stiffness: 95,
  mass: 0.75,
} as const;

// ============================================
// GESTURE-SPECIFIC COLORS
// ============================================

/** Colors for the interrupt-&-drop split interaction. Inherits card palette. */
export const SPLIT_COLORS = {
  /** Interrupted card border color (same as normal card border) */
  interruptedBorder: '#141614',
  /** Placeholder border (subtle, at rest) */
  placeholderBorder: 'rgba(20, 22, 20, 0.2)',
  /** Placeholder border when ghost approaches threshold */
  placeholderBorderActive: 'rgba(20, 22, 20, 0.5)',
  /** Placeholder fill — very faint */
  placeholderBg: 'rgba(20, 22, 20, 0.02)',
} as const;

/** Colors for the swipe merge interaction. Uses brand palette. */
export const MERGE_COLORS = {
  /** Blue action bg — merge with next (swipe right reveals left bg) */
  nextBg: '#69c2ef',
  /** Orange action bg — merge with prev (swipe left reveals right bg) */
  prevBg: '#e8824f',
  /** Dark text on colored bg */
  actionText: '#141614',
  /** White text alternative for darker bg */
  actionTextLight: '#ffffff',
  /** Subtle pattern for disabled direction */
  disabledStripes: 'rgba(0, 0, 0, 0.08)',
} as const;

/** Colors for the reorder interaction. */
export const REORDER_COLORS = {
  /** Blue drop zone border */
  dropZoneBorder: '#3B82F6',
  /** Light blue active drop zone background */
  dropZoneActiveBg: 'rgba(59, 130, 246, 0.08)',
  /** Gray drop zone text */
  dropZoneText: '#9CA3AF',
} as const;
