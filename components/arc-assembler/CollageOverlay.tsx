/**
 * ============================================
 * COLLAGE OVERLAY
 * ============================================
 *
 * Floating reference button that opens the selected style collage
 * as a full-screen image overlay.
 *
 * @module components/arc-assembler/CollageOverlay
 */

import { Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { collageImages } from '@/constants/collageImages';
import { getLineThickness } from '@/constants/line';
import { borderRadius, colors, shadows, spacing } from '@/constants/theme';

// ============================================
// TYPES
// ============================================

export interface CollageOverlayProps {
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
      <TouchableOpacity
        style={styles.button}
        onPress={open}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="View style collage"
      >
        <Feather name="image" size={18} color={colors.text.inverse} />
      </TouchableOpacity>

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
              <Feather name="image" size={48} color={colors.text.secondary} />
            </View>
          )}
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
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.md,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    ...shadows.hard,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
