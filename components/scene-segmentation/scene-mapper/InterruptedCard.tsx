/**
 * ============================================
 * SPLIT CARD COMPONENT
 * ============================================
 *
 * The card that separates from the original during a split gesture.
 * Solid styling (identical to a normal SceneMapperCard).
 *
 * Follows the finger vertically, but CLAMPS when it reaches
 * the placeholder gap below the original card — snapping in
 * perfectly. Dragging back up unsnaps it.
 *
 * ALL positioning driven by SharedValues — zero re-renders during drag.
 *
 * @module components/scene-segmentation/scene-mapper/InterruptedCard
 */

import { pillSizes } from '@/constants/pills';
import { SPLIT_PLACEHOLDER_GAP } from '@/constants/sceneMapper';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';
import type { InterruptedCardProps } from '@/types/scene-mapper-gestures';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
} from 'react-native-reanimated';

// ============================================
// COMPONENT
// ============================================

const InterruptedCardInner: React.FC<InterruptedCardProps> = ({
  words,
  sceneNumber,
  dragOffset,
  initialOffsetY,
  ghostOpacity,
  onCardLayout,
}) => {
  // ── Animated style: follow finger, clamp at gap position ──

  const animatedCardStyle = useAnimatedStyle(() => {
    const raw = initialOffsetY.value + dragOffset.value;
    const translateY = Math.min(raw, SPLIT_PLACEHOLDER_GAP);

    return {
      transform: [{ translateY }],
      opacity: ghostOpacity.value,
    };
  });

  const handleCardLayout = (event: LayoutChangeEvent) => {
    onCardLayout?.(event.nativeEvent.layout.height);
  };

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.card, animatedCardStyle]} onLayout={handleCardLayout}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.dragHandle}>
            <Feather name="menu" size={16} color={colors.text.secondary} />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Scene {sceneNumber}</Text>
          </View>
        </View>

        {/* Word flow */}
        <View style={styles.wordFlow}>
          {words.map((word) => (
            <View key={word.id} style={styles.wordContainer}>
              <Text style={styles.word}>{word.text}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

export const InterruptedCard = React.memo(InterruptedCardInner);

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 2,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    ...shadows.soft,
    overflow: 'hidden',
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  dragHandle: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.inverse,
    backgroundColor: colors.primary,
    minHeight: pillSizes.small.minHeight,
    paddingHorizontal: pillSizes.small.paddingHorizontal,
    paddingVertical: pillSizes.small.paddingVertical,
    borderRadius: pillSizes.small.borderRadius,
    overflow: 'hidden',
    textTransform: 'uppercase',
    textAlignVertical: 'center',
  },
  wordFlow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: spacing.xxs,
  },
  wordContainer: {
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  word: {
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 28,
  },
});
