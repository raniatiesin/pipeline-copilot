/**
 * ============================================
 * CARD NOTES SHEET
 * ============================================
 *
 * Bottom-sheet notes editor for Kanban cards.
 * Opens from the bookmark icon and autosaves on input.
 *
 * @module components/ui/card/CardNotesSheet
 */

import React, { memo } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';

export interface CardNotesSheetProps {
  visible: boolean;
  title: string;
  note: string;
  onChangeNote: (value: string) => void;
  onClose: () => void;
}

export const CardNotesSheet = memo(function CardNotesSheet({
  visible,
  title,
  note,
  onChangeNote,
  onClose,
}: CardNotesSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>

            <TextInput
              value={note}
              onChangeText={onChangeNote}
              multiline
              autoFocus
              placeholder="Write a quick note..."
              placeholderTextColor={colors.text.muted}
              textAlignVertical="top"
              style={styles.input}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.shadow,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
    borderWidth: 3,
    borderColor: colors.border,
    borderBottomWidth: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
    minHeight: 280,
    ...shadows.medium,
  },
  handle: {
    alignSelf: 'center',
    width: 46,
    height: 6,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.borderSubtle,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    minHeight: 180,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
  },
});
