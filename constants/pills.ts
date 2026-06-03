import { borderRadius, spacing } from './theme';

/**
 * ============================================
 * PILL SIZE TOKENS
 * ============================================
 *
 * Two global pill geometries used across the app.
 * - `small`: compact pills (tabs, progress chips, scene labels)
 * - `big`: primary pills (kanban headers, main action buttons)
 *
 * @module constants/pills
 */

export const pillSizes = {
  small: {
    minHeight: 34,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 3,
    iconSize: 14,
  },
  big: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: borderRadius.lg,
    borderWidth: 3,
    iconSize: 18,
  },
} as const;
