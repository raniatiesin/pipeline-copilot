/**
 * ============================================
 * CARD ACTION MODAL
 * ============================================
 *
 * Modal for card actions (export, delete) with blur background.
 * Appears when user presses and holds a card export/delete button.
 * Full-screen with blurred background and centered action card.
 *
 * @module components/kanban/CardActionModal
 */

import { Feather } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';

// ============================================
// TYPES
// ============================================

interface CardActionModalProps {
  visible: boolean;
  cardTitle: string;
  onClose: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  isExporting?: boolean;
  isDeleting?: boolean;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CardActionModal({
  visible,
  cardTitle,
  onClose,
  onExport,
  onDelete,
  isExporting = false,
  isDeleting = false,
}: CardActionModalProps) {
  const handleExport = useCallback(() => {
    onExport?.();
  }, [onExport]);

  const handleDelete = useCallback(() => {
    onDelete?.();
  }, [onDelete]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Blurred background */}
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      />

      {/* Centered action card */}
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{cardTitle}</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="x" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Actions */}
          <View style={styles.divider} />

          {/* Export Action */}
          {onExport && (
            <TouchableOpacity
              style={styles.action}
              onPress={handleExport}
              disabled={isExporting}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Export as JSON"
            >
              <Feather
                name="clipboard"
                size={18}
                color={colors.text.primary}
              />
              <Text style={styles.actionText}>Export JSON</Text>
            </TouchableOpacity>
          )}

          {/* Delete Action */}
          {onDelete && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={[styles.action, styles.actionDanger]}
                onPress={handleDelete}
                disabled={isDeleting}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Delete permanently"
              >
                <Feather
                  name="trash-2"
                  size={18}
                  color={colors.error}
                />
                <Text style={[styles.actionText, { color: colors.error }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Cancel */}
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.action}
            onPress={onClose}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.actionTextCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 22, 20, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    width: '85%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 3,
    borderColor: colors.border,
    ...shadows.hard,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderMuted,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionDanger: {
    // Optional: could add danger-specific styling
  },
  actionText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  actionTextCancel: {
    ...typography.body,
    fontWeight: '500',
    color: colors.text.secondary,
  },
});
