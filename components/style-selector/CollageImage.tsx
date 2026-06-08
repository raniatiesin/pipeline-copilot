/**
 * ============================================
 * COLLAGE IMAGE CARD
 * ============================================
 *
 * Renders a single collage thumbnail in the style-selector
 * gallery. Handles local image loading via the static require()
 * map. Shows a selection border + checkmark badge when active.
 *
 * Memoised with React.memo — only re-renders when the selection
 * state for THIS specific id changes.
 *
 * @module components/style-selector/CollageImage
 */

import React, { memo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { collageImages } from '@/constants/collageImages';
import { getLineThickness } from '@/constants/line';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

// ============================================
// PROPS
// ============================================

export interface CollageImageProps {
  /** Numeric collage ID (1–686) */
  id: number;
  /** Whether this collage is the currently selected one */
  isSelected: boolean;
  /** Called when the user taps this card */
  onSelect: (id: number) => void;
}

// ============================================
// COMPONENT
// ============================================

function CollageImageBase({ id, isSelected, onSelect }: CollageImageProps) {
  const source = collageImages[id];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onSelect(id)}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
    >
      {source ? (
        <Image source={source} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.fallbackText}>{id}</Text>
        </View>
      )}

      {/* Selection badge */}
      {isSelected && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export const CollageImage = memo(CollageImageBase);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 16 / 9,
    borderRadius: borderRadius.md,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.primary,
    padding: spacing.xs,
  },
  cardSelected: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  fallbackText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  badge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    borderWidth: getLineThickness('base'),
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '800',
    lineHeight: 14,
  },
});
