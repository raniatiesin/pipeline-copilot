/**
 * ============================================
 * CONFIRM MODAL
 * ============================================
 *
 * Reusable confirmation dialog with a darkened backdrop.
 * Used for destructive actions (delete project, etc.)
 * and any flow that requires explicit user confirmation.
 *
 * Props:
 *   visible          — controls visibility
 *   title            — bold heading inside the card
 *   message          — body copy explaining the action
 *   confirmLabel     — text for the primary action button (default "Confirm")
 *   cancelLabel      — text for the cancel button (default "Cancel")
 *   destructive      — renders confirm button in error/red style
 *   onConfirm        — called when user taps the primary action
 *   onCancel         — called when user taps cancel or the backdrop
 *
 * @module components/ui/ConfirmModal
 */

import React, { useCallback } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';

// ============================================
// PROPS
// ============================================

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const handleBackdropPress = useCallback(() => {
    onCancel();
  }, [onCancel]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      {/* Backdrop — dark overlay acts as the blur substitute */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Dialog card — centred over the backdrop */}
      <View style={styles.centreContainer} pointerEvents="box-none">
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonRow}>
            {/* Cancel */}
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.8}
              style={styles.cancelButton}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            {/* Confirm */}
            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.8}
              style={[styles.confirmButton, destructive && styles.confirmDestructive]}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              <Text style={[styles.confirmText, destructive && styles.confirmTextDestructive]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // ── Backdrop ─────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },

  // ── Centring wrapper ─────────────────────────────────────────────
  centreContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  // ── Card ─────────────────────────────────────────────────────────
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.hard,
  },
  title: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },

  // ── Buttons ──────────────────────────────────────────────────────
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  cancelText: {
    ...typography.button,
    color: colors.text.primary,
  },
  confirmButton: {
    flex: 1,
    height: 48,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    ...shadows.hard,
  },
  confirmDestructive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  confirmText: {
    ...typography.button,
    color: colors.text.inverse,
    fontWeight: '800',
  },
  confirmTextDestructive: {
    color: colors.text.inverse,
  },
});
