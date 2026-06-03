/**
 * ============================================
 * KANBAN THEME EXTENSION
 * ============================================
 * 
 * Color definitions for Kanban status columns.
 * Extends the main theme with Kanban-specific tokens.
 * Uses brand palette colors for consistency.
 * 
 * @module constants/kanbanTheme
 */

import { colors } from './theme';

// ============================================
// KANBAN STATUS COLORS
// ============================================

/**
 * Color palette for Kanban statuses.
 * Each status has background, border, text, and accent colors.
 * 
 * Brand colors used:
 * - skyBlue (#69c2ef) → Done
 * - burntSienna (#e8824f) → In Progress  
 * - sunglow (#ffc22a) → Up Next
 * - purple (#a78bfa) → In Review
 */
export const kanbanColors = {
  /** To Do - Gray/Neutral */
  gray: {
    background: '#f5f5f5',
    backgroundMuted: '#e8e8e8',
    border: colors.borderMuted,
    text: colors.text.secondary,
    accent: colors.borderMuted,
    pill: '#d4d4d4',
  },
  /** Up Next - Yellow/Sunglow */
  yellow: {
    background: '#fffbeb',
    backgroundMuted: colors.accentAlt,
    border: colors.border,
    text: colors.text.primary,
    accent: colors.accentAlt, // sunglow #ffc22a
    pill: colors.accentAlt,
  },
  /** In Progress - Orange/Burnt Sienna */
  orange: {
    background: '#fff7ed',
    backgroundMuted: colors.secondary,
    border: colors.border,
    text: colors.text.primary,
    accent: colors.secondary, // burntSienna #e8824f
    pill: colors.secondary,
  },
  /** In Review - Purple (review/approval needed) */
  purple: {
    background: '#faf5ff',
    backgroundMuted: '#e9d5ff',
    border: colors.border,
    text: colors.text.primary,
    accent: '#a78bfa', // purple
    pill: '#c4b5fd',
  },
  /** Done - Blue/Sky Blue (brand primary) */
  blue: {
    background: '#f0f9ff',
    backgroundMuted: colors.accent,
    border: colors.border,
    text: colors.text.primary,
    accent: colors.accent, // skyBlue #69c2ef
    pill: colors.accent,
  },
} as const;

export type KanbanColorKey = keyof typeof kanbanColors;

// ============================================
// MODULE ORDER (SEQUENTIAL PIPELINE)
// ============================================

/**
 * Hardcoded module build order.
 * Modules unlock sequentially - next module enters Up Next
 * when previous module reaches In Review (100% progress).
 */
export const MODULE_ORDER = [
  'script-pasting',
  'style-selector',
  'scene-segmentor',
  'subject-segmentor',
  'scene-mapper',
] as const;

export type ModuleId = typeof MODULE_ORDER[number];

/**
 * Module display configuration.
 * Maps module IDs to display names and icons.
 */
export const MODULE_CONFIG: Record<ModuleId, { label: string; icon: string }> = {
  'script-pasting': { label: 'Script', icon: 'file-text' },
  'style-selector': { label: 'Style', icon: 'image' },
  'scene-segmentor': { label: 'Scenes', icon: 'scissors' },
  'subject-segmentor': { label: 'Subjects', icon: 'users' },
  'scene-mapper': { label: 'Storyboard', icon: 'map' },
};

// ============================================
// KANBAN LAYOUT CONSTANTS
// ============================================

/**
 * Layout dimensions for Kanban components.
 */
export const kanbanLayout = {
  /** Tab bar height (pill + vertical padding) */
  tabHeight: 48,
  /** Tab pill padding */
  tabPaddingH: 20,
  tabPaddingV: 12,
  /** Card dimensions - more square-ish for stronger visual balance */
  cardAspectRatio: 1.65,
  cardPadding: 14,
  /** Column peek — 0 = full-width columns (matches scene-mapper aesthetic) */
  columnPeek: 0,
  /** Column gap — 0 = seamless paging between full-width columns */
  columnGap: 0,
  /** Horizontal padding inside each column (matches scene-mapper's 24px) */
  columnPaddingH: 24,
} as const;

// ============================================
// ANIMATION CONSTANTS
// ============================================

/**
 * Animation timing for Kanban interactions.
 */
export const kanbanAnimations = {
  /** Tab switch animation */
  tabSwitchDuration: 200,
  /** Spring damping for scroll snap */
  springDamping: 20,
  /** Spring stiffness for scroll snap */
  springStiffness: 300,
  /** Scale when pressed */
  pressScale: 0.97,
} as const;
