/**
 * ============================================
 * ADD PROJECT BUTTON
 * ============================================
 *
 * Neobrutalist "+" button shown at the bottom of the
 * To Do column only. Triggers the CreateProjectModal.
 *
 * @module components/kanban/AddProjectButton
 */

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';

// ============================================
// PROPS
// ============================================

interface AddProjectButtonProps {
  onPress: () => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AddProjectButton({ onPress }: AddProjectButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.button}
      accessibilityLabel="Add new project"
      accessibilityRole="button"
    >
      <View style={styles.inner}>
        <View style={styles.iconWrap}>
          <Feather name="plus" size={20} color={colors.text.primary} />
        </View>
        <Text style={styles.label}>NEW PROJECT</Text>
      </View>
    </TouchableOpacity>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  button: {
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    backgroundColor: colors.background,
    marginTop: spacing.sm,
    // Hard offset shadow
    shadowColor: colors.border,
    shadowOffset: shadows.hard.shadowOffset,
    shadowOpacity: shadows.hard.shadowOpacity,
    shadowRadius: shadows.hard.shadowRadius,
    elevation: 4,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.button,
    color: colors.text.primary,
    letterSpacing: 1,
  },
});
