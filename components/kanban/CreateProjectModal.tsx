/**
 * ============================================
 * CREATE PROJECT MODAL
 * ============================================
 *
 * Three-input form for creating a new pipeline project.
 * Fields: Prospect Name, Post Name, Script.
 *
 * Rules:
 * - No HTML form tags — controlled inputs + button only
 * - Full neobrutalist styling
 * - All 3 fields required to enable Create button
 * - KeyboardAvoidingView for iOS/Android keyboard handling
 *
 * @module components/kanban/CreateProjectModal
 */

import React, { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';

// ============================================
// TYPES
// ============================================

export interface CreateProjectData {
  prospectName: string;
  postName: string;
  script: string;
}

interface CreateProjectModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: CreateProjectData) => void;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function CreateProjectModal({ visible, onClose, onConfirm }: CreateProjectModalProps) {
  const [prospectName, setProspectName] = useState('');
  const [postName, setPostName] = useState('');
  const [script, setScript] = useState('');

  const canCreate = prospectName.trim().length > 0
    && postName.trim().length > 0
    && script.trim().length > 0;

  const handleConfirm = useCallback(() => {
    if (!canCreate) return;
    onConfirm({
      prospectName: prospectName.trim(),
      postName: postName.trim(),
      script: script.trim(),
    });
    // Reset fields after creation
    setProspectName('');
    setPostName('');
    setScript('');
  }, [canCreate, onConfirm, prospectName, postName, script]);

  const handleClose = useCallback(() => {
    setProspectName('');
    setPostName('');
    setScript('');
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kvWrapper}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>NEW PROJECT</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
              <Text style={styles.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* Field: Prospect Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PROSPECT NAME</Text>
              <TextInput
                style={styles.input}
                value={prospectName}
                onChangeText={setProspectName}
                placeholder="e.g. Fatima Al-Zahra"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Field: Post Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>POST NAME</Text>
              <TextInput
                style={styles.input}
                value={postName}
                onChangeText={setPostName}
                placeholder="e.g. The Night of Power"
                placeholderTextColor={colors.text.muted}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Field: Script */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>SCRIPT</Text>
              <TextInput
                style={[styles.input, styles.scriptInput]}
                value={script}
                onChangeText={setScript}
                placeholder="Paste or type the exact quote or excerpt..."
                placeholderTextColor={colors.text.muted}
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
                autoCorrect
                returnKeyType="done"
              />
            </View>

            {/* Create Button */}
            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={canCreate ? 0.85 : 1}
              style={[styles.createButton, !canCreate && styles.createButtonDisabled]}
              disabled={!canCreate}
            >
              <Text style={[styles.createButtonText, !canCreate && styles.createButtonTextDisabled]}>
                CREATE PROJECT
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  kvWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopWidth: 3,
    borderTopColor: colors.border,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text.primary,
    // Neobrutalist hard shadow
    shadowColor: colors.border,
    shadowOffset: shadows.soft.shadowOffset,
    shadowOpacity: shadows.soft.shadowOpacity,
    shadowRadius: 0,
    elevation: 2,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' as any }),
  },
  scriptInput: {
    minHeight: 120,
    paddingTop: spacing.sm,
  },
  createButton: {
    backgroundColor: colors.error,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    // Hard offset shadow
    shadowColor: colors.border,
    shadowOffset: shadows.hard.shadowOffset,
    shadowOpacity: shadows.hard.shadowOpacity,
    shadowRadius: 0,
    elevation: 6,
    marginTop: spacing.xs,
  },
  createButtonDisabled: {
    backgroundColor: colors.backgroundMuted,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  createButtonText: {
    ...typography.button,
    color: colors.text.inverse,
    letterSpacing: 1,
  },
  createButtonTextDisabled: {
    color: colors.text.secondary,
  },
});
