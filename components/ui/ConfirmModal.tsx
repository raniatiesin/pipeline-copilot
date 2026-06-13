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
 *   extraActions     — optional React node rendered above the button row
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

import { pillSizes } from '@/constants/pills';
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
  extraActions?: React.ReactNode;
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
  extraActions,
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
      {/* Backdrop — dark overlay */}
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Dialog card — centred over the backdrop */}
      <View style={styles.centreContainer} pointerEvents="box-none">
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          {extraActions && (
            <View style={styles.extraActionsContainer}>
              {extraActions}
            </View>
          )}

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

            {/* Confirm (destructive = Delete) */}
            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.8}
              style={[
                styles.confirmButton,
                destructive && styles.confirmDestructive,
              ]}
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
// STYLES — neobrutalist design system
// ============================================

const styles = StyleSheet.create({
  // ── Backdrop ─────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },

  // ── Centring wrapper ─────────────────────────────────────────────
  centreContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  // ── Card ── colors.background (#fef4dd), 3px colors.border, borderRadius.lg, shadows.hard
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.background,
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

  // ── Extra actions ────────────────────────────────────────────────
  extraActionsContainer: {
    marginBottom: spacing.sm,
    alignItems: 'center',
  },

  // ── Buttons — pillSizes.big geometry, 3px solid colors.border ────
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  // Cancel — colors.surface bg, colors.text.primary text
  cancelButton: {
    flex: 1,
    minHeight: pillSizes.big.minHeight,
    paddingHorizontal: pillSizes.big.paddingHorizontal,
    paddingVertical: pillSizes.big.paddingVertical,
    borderWidth: pillSizes.big.borderWidth,
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

  // Confirm (default) — colors.accent (#69c2ef) bg, colors.primary text
  confirmButton: {
    flex: 1,
    minHeight: pillSizes.big.minHeight,
    paddingHorizontal: pillSizes.big.paddingHorizontal,
    paddingVertical: pillSizes.big.paddingVertical,
    borderWidth: pillSizes.big.borderWidth,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  confirmText: {
    ...typography.button,
    color: colors.text.primary,
  },

  // Confirm (destructive = Delete) — colors.error bg, colors.text.inverse text
  confirmDestructive: {
    backgroundColor: colors.error,
    borderColor: colors.border,
  },
  confirmTextDestructive: {
    color: colors.text.inverse,
  },
});