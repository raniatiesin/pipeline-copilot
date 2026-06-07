/**
 * ============================================
 * UNIVERSAL MODULE CARD
 * ============================================
 *
 * Reusable scene-style card shell for module/task surfaces.
 * Mirrors scene-mapper visual language:
 * - Thick neobrutalist border + soft shadow
 * - Embedded header divider
 * - Left icon, center title pill, right completion text
 * - Description content in card body
 *
 * @module components/ui/card/UniversalModuleCard
 */

import { Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
    StyleSheet,
    type GestureResponderEvent,
    type StyleProp,
    type ViewStyle
} from 'react-native';

import { borderRadius, spacing } from '@/constants/theme';

import { Line } from '../Line';
import { CardContainer } from './CardContainer';
import { CardDescriptionProgressRow } from './CardDescriptionProgressRow';
import { CardIdentityPill } from './CardIdentityPill';
import { CardNotesSheet } from './CardNotesSheet';

// ============================================
// TYPES
// ============================================

export interface UniversalModuleCardProps {
  title: string;
  description?: string;
  iconName?: keyof typeof Feather.glyphMap;
  progressPercent?: number;
  noteText?: string;
  isOutdated?: boolean;
  onChangeNote?: (note: string) => void;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

// ============================================
// COMPONENT
// ============================================

export const UniversalModuleCard = memo(function UniversalModuleCard({
  title,
  description,
  iconName = 'box',
  progressPercent = 0,
  noteText = '',
  isOutdated = false,
  onChangeNote,
  onPress,
  onLongPress,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: UniversalModuleCardProps) {
  const [isNotesVisible, setIsNotesVisible] = useState(false);
  const normalizedProgress = Math.max(0, Math.min(100, Math.round(progressPercent)));
  const trimmedNote = noteText.trim();
  const hasNote = trimmedNote.length > 0;

  const previewText = useMemo(() => {
    if (hasNote) {
      const firstLine = trimmedNote.split('\n').find((line) => line.trim().length > 0);
      if (firstLine) return firstLine;
    }
    return description || 'No description';
  }, [description, hasNote, trimmedNote]);

  const openNotes = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
    setIsNotesVisible(true);
  }, []);

  const closeNotes = useCallback(() => {
    setIsNotesVisible(false);
  }, []);

  const handleNoteChange = useCallback((value: string) => {
    onChangeNote?.(value);
  }, [onChangeNote]);

  return (
    <>
      <CardContainer
        onPress={onPress}
        onLongPress={onLongPress}
        style={[styles.card, style]}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
      >
        <CardIdentityPill
          title={title}
          iconName={iconName}
          progressPercent={normalizedProgress}
          isOutdated={isOutdated}
        />

        <Line style={styles.headerDivider} />

        <CardDescriptionProgressRow
          description={previewText}
          hasNote={hasNote}
          onBookmarkPress={openNotes}
        />
      </CardContainer>

      <CardNotesSheet
        visible={isNotesVisible}
        title={title}
        note={noteText}
        onChangeNote={handleNoteChange}
        onClose={closeNotes}
      />
    </>
  );
});

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  headerDivider: {
    marginTop: spacing.xxs,
    marginBottom: spacing.xxs,
  },
});
