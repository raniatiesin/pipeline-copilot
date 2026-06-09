/**
 * ============================================
 * COLLAGE IMAGE CARD
 * ============================================
 *
 * Renders a single collage thumbnail in the style-selector gallery.
 * Square source assets use portrait container + cover to avoid letterboxing.
 *
 * @module components/style-selector/CollageImage
 */

import { Feather } from '@expo/vector-icons';
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
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';

/** Portrait slot — square collages crop top/bottom with cover, no side bars */
export const COLLAGE_ASPECT_RATIO = 3 / 4;

const BADGE_SIZE = spacing.lg;

// ============================================
// PROPS
// ============================================

export interface CollageImageProps {
  id: number;
  isSelected: boolean;
  onSelect: (id: number) => void;
  width: number;
}

// ============================================
// COMPONENT
// ============================================

function CollageImageBase({ id, isSelected, onSelect, width }: CollageImageProps) {
  const source = collageImages[id];
  const height = width / COLLAGE_ASPECT_RATIO;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onSelect(id)}
      style={[
        styles.card,
        { width, height },
        isSelected && styles.cardSelected,
      ]}
    >
      {source ? (
        <Image source={source} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imageFallback}>
          <Text style={styles.fallbackText}>{id}</Text>
        </View>
      )}

      {isSelected && (
        <View style={styles.badge}>
          <Feather name="check" size={14} color={colors.text.inverse} />
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
    borderRadius: borderRadius.md,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  cardSelected: {
    borderColor: colors.primary,
  },
  image: {
    width: '100%',
    height: '100%',
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
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
