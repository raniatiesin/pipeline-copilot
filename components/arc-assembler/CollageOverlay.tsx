/**
 * ============================================
 * COLLAGE OVERLAY
 * ============================================
 *
 * A floating reference button (top-right of its container) that
 * opens the selected style collage as a full-screen image overlay.
 * Available on both Scene Mode and Subject Mode pages.
 *
 * - Tap the button → full-screen modal with collage image
 * - Tap anywhere on the modal → dismiss
 *
 * If no collage is selected (collageId is null), the button is hidden.
 *
 * @module components/arc-assembler/CollageOverlay
 */

import { Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { collageImages } from '@/constants/collageImages';
import { getLineThickness } from '@/constants/line';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';

// ============================================
// TYPES
// ============================================

export interface CollageOverlayProps {
  /** Numeric collage ID (1–686). Null = button hidden. */
  collageId: number | null;
}

// ============================================
// COMPONENT
// ============================================

function CollageOverlayBase({ collageId }: CollageOverlayProps) {
  const [visible, setVisible] = useState(false);

  const open = useCallback(() => setVisible(true), []);
  const close = useCallback(() => setVisible(false), []);

  if (!collageId) return null;

  const source = collageImages[collageId];

  return (
    <>
      {/* Floating reference button */}
      <TouchableOpacity
        style={styles.button}
        onPress={open}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="image" size={16} color={colors.text.inverse} />
        <Text style={styles.buttonLabel}>REF</Text>
      </TouchableOpacity>

      {/* Full-screen overlay */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.backdrop}
          onPress={close}
          activeOpacity={1}
        >
          {source ? (
            <Image
              source={source}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.fallback}>
              <Feather name="image" size={48} color={colors.text.muted} />
              <Text style={styles.fallbackText}>COLLAGE #{collageId}</Text>
            </View>
          )}

          {/* Dismiss hint */}
          <View style={styles.dismissHint}>
            <Text style={styles.dismissText}>TAP ANYWHERE TO CLOSE</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

export const CollageOverlay = memo(CollageOverlayBase);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.error,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: colors.primary,
    ...shadows.hard,
  },
  buttonLabel: {
    ...typography.overline,
    color: colors.text.inverse,
    fontSize: 10,
  },

  // Modal
  backdrop: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '90%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fallbackText: {
    ...typography.overline,
    color: colors.text.muted,
  },
  dismissHint: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
  },
  dismissText: {
    ...typography.overline,
    color: colors.text.muted,
    fontSize: 10,
  },
});
