/**
 * ============================================
 * UNIVERSAL MODULE CARD
 * ============================================
 *
 * Flat neobrutalist card for Kanban project and stage items.
 * Reuses CardIdentityPill + progress bar between title and description.
 *
 * @module components/ui/card/UniversalModuleCard
 */

import type { KanbanStatus } from '@/types/kanban';
import { Feather } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { getStatusAccentColor } from '@/constants/kanbanTheme';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

import { CardContainer } from './CardContainer';
import { CardDescriptionProgressRow } from './CardDescriptionProgressRow';
import { CardFooter } from './CardFooter';
import { CardIdentityPill } from './CardIdentityPill';
import { CardNotesSheet } from './CardNotesSheet';
import { CardProgressBar } from './CardProgressBar';

// ============================================
// TYPES
// ============================================

export interface UniversalModuleCardProps {
  title: string;
  description?: string;
  iconName?: keyof typeof Feather.glyphMap;
  progressPercent?: number;
  status?: KanbanStatus;
  noteText?: string;
  isOutdated?: boolean;
  isProjectCard?: boolean;
  projectNumber?: number;
  footerContent?: React.ReactNode;
  onChangeNote?: (note: string) => void;
  onPress?: () => void;
  onLongPress?: () => void;
  onExport?: () => void;
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
  status,
  noteText = '',
  isOutdated = false,
  isProjectCard = false,
  projectNumber,
  footerContent,
  onChangeNote,
  onPress,
  onLongPress,
  onExport,
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

  const accentColor = status ? getStatusAccentColor(status) : null;
  const progressColor = accentColor ?? colors.accent;
  const isTodo = status === 'todo';
  const isDone = status === 'done';
  const isPressDisabled = isTodo || (isDone && !isProjectCard);

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
        disabled={isPressDisabled}
        style={[styles.card, style]}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
      >
        <View style={styles.cardBody}>
          {accentColor ? (
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
          ) : (
            <View style={styles.accentBarPlaceholder} />
          )}

          <View style={styles.content}>
            <CardIdentityPill
              title={title}
              iconName={iconName}
              progressPercent={normalizedProgress}
              isOutdated={isOutdated}
            />

            <CardProgressBar
              progress={normalizedProgress}
              color={progressColor}
              trackColor={colors.border}
              height={4}
              style={styles.progressBar}
            />

            {onChangeNote || projectNumber != null ? (
              <CardDescriptionProgressRow
                description={previewText}
                hasNote={hasNote}
                onBookmarkPress={onChangeNote ? openNotes : undefined}
                projectNumber={projectNumber}
              />
            ) : (
              <Text style={styles.description} numberOfLines={2}>
                {previewText}
              </Text>
            )}

            {isProjectCard && onExport && (
              <TouchableOpacity
                onPress={onExport}
                activeOpacity={0.8}
                style={styles.exportButton}
                accessibilityRole="button"
                accessibilityLabel={`Export ${title}`}
              >
                <Feather name="copy" size={16} color={colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {footerContent ? (
          <CardFooter bordered={false} muted={false}>
            {footerContent}
          </CardFooter>
        ) : null}
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
  cardBody: {
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  accentBarPlaceholder: {
    width: 4,
  },
  content: {
    flex: 1,
    gap: spacing.xs,
  },
  progressBar: {
    marginHorizontal: spacing.sm,
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
  },
  exportButton: {
    alignSelf: 'flex-end',
    marginHorizontal: spacing.sm,
    padding: spacing.xxs,
  },
});
