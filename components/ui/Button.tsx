/**
 * ============================================
 * BUTTON COMPONENT
 * ============================================
 * 
 * Primary action button with multiple variants.
 * Implements neobrutalist design with bold borders and shadows.
 * 
 * Features:
 * - Primary, secondary, and action variants
 * - Loading state with spinner
 * - Disabled state handling
 * - Press animation feedback
 * - Optional icon support
 * 
 * @module components/ui/Button
 */

import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { ReactNode, useCallback, useRef } from 'react';
import {
    ActivityIndicator,
    Animated,
    Platform,
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';
import { pillSizes } from '../../constants/pills';
import { colors, shadows, spacing, typography } from '../../constants/theme';

// Mobile-optimized touch targets
const MOBILE_MIN_HEIGHT = pillSizes.big.minHeight;

// ============================================
// TYPES
// ============================================

interface ButtonProps {
  /** Button label text */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Visual variant (default: 'primary') */
  variant?: 'primary' | 'secondary' | 'action';
  /** Disable interaction */
  disabled?: boolean;
  /** Show loading spinner */
  loading?: boolean;
  /** Additional container styles */
  style?: StyleProp<ViewStyle>;
  /** Button size (default: 'default') */
  size?: 'default' | 'small';
  /** Optional leading icon */
  icon?: ReactNode;
  /** Show zap icon for action variant (default: true) */
  showZapIcon?: boolean;
  /** Override background color for action variant */
  actionColor?: string;
}

// ============================================
// ACTION BUTTON STYLES (Reference: CSS attachment)
// ============================================

/**
 * Exact styling from the reference:
 * - background-color: #D72A21 (rgba(215,42,33,1.00))
 * - border-radius: 18px
 * - border-width: 3px
 * - border-color: #141614 (rgba(20,22,20,1.00))
 * - box-shadow: 6px 6px 0px rgba(20,22,20,0.18)
 * - min-height: 52px
 * - padding: 18px vertical, 24px horizontal
 * - Text: 16px, 700 weight, uppercase, 0.4px spacing, white, 0.7 opacity
 * - Icon: 24x24, white
 * 
 * Note: Margins removed — layout spacing is the parent's responsibility.
 * Wrap in a footer View or apply margin via the `style` prop.
 */
const ACTION_BUTTON_CONFIG = {
  backgroundColor: colors.button.primary,
  borderRadius: pillSizes.big.borderRadius,
  borderWidth: pillSizes.big.borderWidth,
  borderColor: colors.border,
  shadowOffset: shadows.hard.shadowOffset,
  shadowColor: shadows.hard.shadowColor,
  shadowOpacity: shadows.hard.shadowOpacity,
  minHeight: pillSizes.big.minHeight,
  paddingVertical: pillSizes.big.paddingVertical,
  paddingHorizontal: pillSizes.big.paddingHorizontal,
  textOpacity: 0.7,
  fontSize: typography.button.fontSize,
  letterSpacing: 0.4,
  iconSize: pillSizes.big.iconSize,
  gap: spacing.xs,
} as const;

// ============================================
// COMPONENT
// ============================================

/**
 * Primary action button with neobrutalist styling.
 * 
 * @example
 * ```tsx
 * // Action button (red CTA - exact reference match)
 * <Button
 *   title="Generate"
 *   onPress={handleGenerate}
 *   variant="action"
 * />
 * 
 * // Primary button with icon
 * <Button
 *   title="Continue"
 *   onPress={handleContinue}
 *   icon={<Feather name="arrow-right" size={18} color="#fff" />}
 * />
 * 
 * // Secondary button
 * <Button
 *   title="Cancel"
 *   onPress={handleCancel}
 *   variant="secondary"
 * />
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  size = 'default',
  icon,
  showZapIcon = true,
  actionColor,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Haptic feedback for mobile interactions
  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web' && !disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [disabled, loading]);

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 90,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 110,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = useCallback(() => {
    triggerHaptic();
    onPress();
  }, [onPress, triggerHaptic]);

  // Action variant uses specific styling from reference
  if (variant === 'action') {
    return (
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        accessibilityLabel={title}
        style={style}
      >
        <Animated.View
          style={[
            styles.actionButton,
            actionColor ? { backgroundColor: actionColor } : null,
            disabled && styles.actionButtonDisabled,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.surface} size="small" />
          ) : (
            <View style={styles.actionButtonContent}>
              {showZapIcon && (
                <Feather 
                  name="zap" 
                  size={ACTION_BUTTON_CONFIG.iconSize} 
                  color={disabled ? colors.text.secondary : colors.surface} 
                />
              )}
              {icon && !showZapIcon && <View style={styles.actionIcon}>{icon}</View>}
              <Text style={[
                styles.actionButtonText, 
                disabled && styles.actionButtonTextDisabled
              ]}>
                {title}
              </Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }

  // Default primary/secondary variants
  const buttonStyle = [
    styles.button,
    styles.frame,
    styles[variant],
    size === 'small' && styles.small,
    disabled && styles.disabled,
  ];

  const textStyle: TextStyle = StyleSheet.flatten([
    styles.text,
    styles[`${variant}Text` as keyof typeof styles],
    disabled && styles.disabledText,
  ]);

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityLabel={title}
      style={style}
    >
      <Animated.View
        style={[
          buttonStyle,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'primary' ? colors.button.primaryText : colors.button.secondaryText}
            size="small"
          />
        ) : (
          <View style={styles.content}>
            {icon ? <View style={styles.icon}>{icon}</View> : null}
            <Text style={textStyle}>{title}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // ============================================
  // ACTION BUTTON STYLES (Exact reference match)
  // ============================================
  actionButton: {
    backgroundColor: ACTION_BUTTON_CONFIG.backgroundColor,
    paddingVertical: ACTION_BUTTON_CONFIG.paddingVertical,
    paddingHorizontal: ACTION_BUTTON_CONFIG.paddingHorizontal,
    borderRadius: ACTION_BUTTON_CONFIG.borderRadius,
    borderWidth: ACTION_BUTTON_CONFIG.borderWidth,
    borderColor: ACTION_BUTTON_CONFIG.borderColor,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: ACTION_BUTTON_CONFIG.minHeight,
    ...shadows.hard,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ACTION_BUTTON_CONFIG.gap,
  },
  actionButtonText: {
    fontSize: ACTION_BUTTON_CONFIG.fontSize,
    fontWeight: '700',
    color: colors.surface,
    textTransform: 'uppercase',
    letterSpacing: ACTION_BUTTON_CONFIG.letterSpacing,
    opacity: ACTION_BUTTON_CONFIG.textOpacity,
  },
  actionButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderMuted,
    opacity: 0.5,
  },
  actionButtonTextDisabled: {
    color: colors.text.secondary,
  },
  actionIcon: {
    width: ACTION_BUTTON_CONFIG.iconSize,
    height: ACTION_BUTTON_CONFIG.iconSize,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============================================
  // PRIMARY/SECONDARY BUTTON STYLES
  // ============================================
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: pillSizes.big.paddingHorizontal,
    paddingVertical: pillSizes.big.paddingVertical,
    minHeight: MOBILE_MIN_HEIGHT,
    alignSelf: 'stretch',
  },
  frame: {
    borderWidth: pillSizes.big.borderWidth,
    borderColor: colors.border,
    borderRadius: pillSizes.big.borderRadius,
    backgroundColor: colors.surface,
    ...shadows.medium,
  },
  primary: {
    backgroundColor: colors.button.primary,
    borderColor: colors.border,
    ...shadows.hard,
  },
  secondary: {
    backgroundColor: colors.button.secondary,
    borderColor: colors.borderMuted,
    ...shadows.soft,
  },
  disabled: {
    opacity: 0.5,
  },
  small: {
    paddingVertical: pillSizes.small.paddingVertical,
    paddingHorizontal: pillSizes.small.paddingHorizontal,
    minHeight: pillSizes.small.minHeight,
    borderRadius: pillSizes.small.borderRadius,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm, // Increased gap for mobile readability
  },
  icon: {
    width: 22, // Slightly larger icons for mobile
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.button,
  },
  primaryText: {
    color: colors.button.primaryText,
  },
  secondaryText: {
    color: colors.button.secondaryText,
  },
  disabledText: {
    opacity: 0.7,
  },
});
