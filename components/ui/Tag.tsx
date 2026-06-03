/**
 * ============================================
 * TAG COMPONENT
 * ============================================
 * 
 * Interactive label/chip component for selection states.
 * Used in style selection and categorization interfaces.
 * 
 * Features:
 * - Animated selection state
 * - Neobrutalist styling with shadows
 * - Touch feedback
 * 
 * @module components/ui/Tag
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Platform, StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { borderRadius, colors, shadows, spacing, typography } from '../../constants/theme';

// ============================================
// TYPES
// ============================================

interface TagProps {
  /** Display text for the tag */
  label: string;
  /** Whether the tag is in selected state */
  selected: boolean;
  /** Press handler for toggling selection */
  onPress: () => void;
  /** Additional container styles */
  style?: StyleProp<ViewStyle>;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Interactive tag/chip component with selection state.
 * 
 * @example
 * ```tsx
 * <Tag
 *   label="Cinematic"
 *   selected={isSelected}
 *   onPress={() => toggleSelection('cinematic')}
 * />
 * ```
 */
export const Tag: React.FC<TagProps> = ({
  label,
  selected,
  onPress,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(selected ? 1 : 0.98)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: selected ? 1 : 0.98,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, [selected, scaleAnim]);

  const handlePress = useCallback(() => {
    // Haptic feedback on tag toggle
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.tag,
          selected ? styles.selected : styles.unselected,
          style,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={[
          styles.text,
          selected ? styles.selectedText : styles.unselectedText,
        ]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2, // Taller for better touch targets
    borderRadius: borderRadius.md,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // Apple HIG minimum touch target
    margin: spacing.xs,
    backgroundColor: colors.tag.inactiveBg,
    borderColor: colors.tag.inactiveBorder,
  },
  selected: {
    backgroundColor: colors.tag.activeBg,
    borderColor: colors.tag.activeBorder,
    ...shadows.medium,
  },
  unselected: {
    backgroundColor: colors.tag.inactiveBg,
    borderColor: colors.tag.inactiveBorder,
  },
  text: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  selectedText: {
    color: colors.tag.activeText,
  },
  unselectedText: {
    color: colors.tag.inactiveText,
  },
});