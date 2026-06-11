/**
 * ============================================
 * ACTION PILL COMPONENT
 * ============================================
 *
 * Unified pressable pill for kanban card actions and footers.
 * Dimensions match FooterActions / Button (pillSizes.big).
 *
 * @module components/ui/ActionPill
 */

import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { pillSizes } from '@/constants/pills';
import { colors, shadows, typography } from '@/constants/theme';

export interface ActionPillProps {
  label: string;
  color: string;
  onPress: () => void;
}

export function ActionPill({ label, color, onPress }: ActionPillProps) {
  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: color },
        pressed && styles.pillPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: pillSizes.big.minHeight,
    paddingHorizontal: pillSizes.big.paddingHorizontal,
    paddingVertical: pillSizes.big.paddingVertical,
    borderRadius: pillSizes.big.borderRadius,
    borderWidth: pillSizes.big.borderWidth,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.hard,
  },
  pillPressed: {
    opacity: 0.85,
  },
  label: {
    ...typography.button,
    color: colors.text.inverse,
    textTransform: 'uppercase',
  },
});
