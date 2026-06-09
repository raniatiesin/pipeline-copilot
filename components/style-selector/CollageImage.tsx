/**
 * ============================================
 * COLLAGE IMAGE CARD
 * ============================================
 *
 * Renders a single collage thumbnail in the style-selector gallery.
 * Square container — equal footprint for every card in the grid.
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

export const COLLAGE_ASPECT_RATIO = 1;

const BADGE_SIZE = spacing.lg;

// ============================================
// PROPS
// ============================================

export interface CollageImageProps {
  id: number;
  isSelected: boolean;
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
      style={[styles.card, isSelected && styles.cardSelected]}
    >
      {source ? (
        <Image source={source} style={styles.image} resizeMode="contain" />
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
    width: '100%',
    aspectRatio: COLLAGE_ASPECT_RATIO,
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
    backgroundColor: colors.surface,
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
