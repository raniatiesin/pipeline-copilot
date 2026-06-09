/**
 * ============================================
 * ADD PROJECT BUTTON
 * ============================================
 *
 * Dashed "+" button shown at the bottom of the To Do column only.
 *
 * @module components/kanban/AddProjectButton
 */

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { getLineThickness } from '@/constants/line';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

// ============================================
// PROPS
// ============================================

interface AddProjectButtonProps {
  onPress: () => void;
  width?: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AddProjectButton({ onPress, width }: AddProjectButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.button, width != null && { width }]}
      accessibilityLabel="Add new project"
      accessibilityRole="button"
    >
      <Feather name="plus" size={18} color={colors.text.secondary} />
      <Text style={styles.label}>New Project</Text>
    </TouchableOpacity>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 52,
    marginTop: spacing.sm,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
  },
  label: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
});
