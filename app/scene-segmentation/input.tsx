/**
 * ============================================
 * SCENE SEGMENTATION - SCRIPT INPUT SCREEN
 * ============================================
 * 
 * First stage of scene segmentation workflow.
 * Users paste their script text here for processing.
 * 
 * @module app/scene-segmentation/input
 */

import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';

import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { colors, spacing, typography } from '@/constants/theme';
import { useSceneSegmentation } from '@/hooks/useSceneSegmentation';

export default function SceneSegmentationInputScreen() {
  const { state, setScript, processScript } = useSceneSegmentation();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pre-populate from project creation if a script was passed via route param
  const { prefill, projectId } = useLocalSearchParams<{ prefill?: string; projectId?: string }>();
  useEffect(() => {
    if (prefill && !state.originalScript.trim()) {
      setScript(prefill);
    }
  // Only run on mount — intentionally omitting deps to prevent re-triggering
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetStarted = () => {
    if (!state.originalScript.trim()) return;
    processScript();
    router.push({
      pathname: '/scene-segmentation/beat-butcher' as any,
      params: { projectId },
    });
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setScript(text);
        // Pulse animation feedback
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch {
      // Clipboard permission denied - silently ignore
    }
  };

  // Calculate word count and progress (200 words = 100%)
  const wordCount = state.originalScript.trim()
    ? state.originalScript.trim().split(/\s+/).length
    : 0;
  const progress = Math.min(100, Math.round((wordCount / 200) * 100));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
        <ScreenLayout
        tabs={[
          { label: 'Project', route: '/project' },
          { label: 'Segmentation', route: '/scene-segmentation/input' },
        ]}
        title="Paste"
        progress={progress}
        onBack={() => router.push('/project')}
        onContinue={handleGetStarted}
        continueLabel="Continue"
        continueDisabled={!state.originalScript.trim()}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Animated.View style={[styles.inputArea, { transform: [{ scale: pulseAnim }] }]}>
            <TouchableOpacity onPress={handlePaste} style={styles.copyButton}>
              <Feather name="copy" size={20} color={colors.text.primary} />
            </TouchableOpacity>

            <TextInput
              style={styles.textArea}
              value={state.originalScript}
              onChangeText={setScript}
              placeholder="Once upon a time, in a forest far away, there lived a brave knight who sought adventure..."
              placeholderTextColor="#a0a0a0"
              multiline
              textAlignVertical="top"
              autoCorrect={true}
              autoCapitalize="sentences"
              returnKeyType="done"
              enablesReturnKeyAutomatically={true}
              keyboardType="default"
              spellCheck={true}
            />
          </Animated.View>
        </KeyboardAvoidingView>
      </ScreenLayout>
    </>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  inputArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  copyButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
    zIndex: 1,
  },
  textArea: {
    flex: 1,
    width: '100%',
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    includeFontPadding: false,
    ...typography.body,
    color: colors.text.primary,
    lineHeight: 24,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none' as any,
    }),
  },
});
