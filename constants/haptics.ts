/**
 * ============================================
 * HAPTIC FEEDBACK CONSTANTS
 * ============================================
 *
 * Unified haptic feedback strategy for consistent
 * tactile feedback across the app.
 *
 * Uses Expo Haptics API for iOS/Android compatibility.
 *
 * @module constants/haptics
 */

import * as Haptics from 'expo-haptics';

/**
 * Standard haptic feedback types for common interactions.
 */
export const hapticFeedback = {
  /** Light tap — subtle feedback for minor interactions */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Medium impact — standard feedback for successful actions */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Heavy impact — strong feedback for significant actions or warnings */
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /** Success feedback — positive confirmation pattern */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Warning feedback — cautious confirmation pattern */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  /** Error feedback — failure or invalid action pattern */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
} as const;

/**
 * Haptic trigger points for specific interactions.
 * Maps action types to their appropriate haptic response.
 */
export const hapticTriggers = {
  /** Page/column navigation — light tap */
  pageChange: hapticFeedback.light,

  /** Card selection or state change — medium impact */
  cardAction: hapticFeedback.medium,

  /** Button press confirmation — light tap */
  buttonPress: hapticFeedback.light,

  /** Successful action completion — success pattern */
  success: hapticFeedback.success,

  /** Warning or caution — warning pattern */
  warning: hapticFeedback.warning,

  /** Error or failure — error pattern */
  error: hapticFeedback.error,
} as const;
