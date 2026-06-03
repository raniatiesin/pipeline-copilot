/**
 * ============================================
 * COMMON STYLES
 * ============================================
 * 
 * Reusable StyleSheet definitions for consistent patterns.
 * Import and spread these into component styles.
 * 
 * @example
 * ```tsx
 * import { commonStyles } from '@/styles';
 * 
 * <SafeAreaView style={commonStyles.screen}>
 *   <Text style={commonStyles.badge}>Label</Text>
 *   <Text style={commonStyles.title}>Page Title</Text>
 * </SafeAreaView>
 * ```
 * 
 * @module styles/common
 */

import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../constants/theme';

/**
 * Common style patterns used across multiple screens.
 */
export const commonStyles = StyleSheet.create({
  /**
   * Base screen container with background color.
   * Use as the root SafeAreaView style.
   */
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  /**
   * Neobrutalist badge/label style.
   * Sunglow background with bold border.
   */
  badge: {
    ...typography.caption,
    borderWidth: 3,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.badge.background,
    alignSelf: 'flex-start',
    color: colors.badge.text,
  },
  
  /**
   * Large page title - uppercase, bold.
   */
  title: {
    ...typography.title,
    textTransform: 'uppercase',
  },
  
  /**
   * Section subtitle - medium emphasis.
   */
  subtitle: {
    ...typography.subtitle,
    color: colors.text.secondary,
  },

});
