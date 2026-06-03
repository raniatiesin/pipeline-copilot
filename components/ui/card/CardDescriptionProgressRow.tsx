/**
 * ============================================
 * CARD DESCRIPTION + PROGRESS ROW
 * ============================================
 *
 * Bottom-row layout used by Kanban cards:
 * left bookmark icon + right description text.
 *
 * @module components/ui/card/CardDescriptionProgressRow
 */

import { Feather } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

export interface CardDescriptionProgressRowProps {
  description: string;
  hasNote: boolean;
  onBookmarkPress: (event: GestureResponderEvent) => void;
}

export const CardDescriptionProgressRow = memo(function CardDescriptionProgressRow({
  description,
  hasNote,
  onBookmarkPress,
}: CardDescriptionProgressRowProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onBookmarkPress}
        style={styles.bookmarkButton}
        accessibilityRole="button"
        accessibilityLabel={hasNote ? 'Edit card note' : 'Add card note'}
        accessibilityHint="Double tap to open notes"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather
          name="bookmark"
          size={18}
          color={hasNote ? colors.secondary : colors.text.primary}
        />
      </Pressable>

      <Text style={styles.description}>
        {description}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  bookmarkButton: {
    paddingTop: spacing.xxs,
  },
  description: {
    flex: 1,
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
    lineHeight: 17,
  },
});
