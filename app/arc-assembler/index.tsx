/**
 * ============================================
 * ARC ASSEMBLER SCREEN
 * ============================================
 *
 * Two modes toggled by horizontal page swipe:
 *   Scene Mode  (left)  — write a visual brief per scene
 *   Subject Mode (right) — write a visual brief per subject
 *
 * Marks the card IN_PROGRESS on mount, IN_REVIEW on Continue.
 *
 * @module app/arc-assembler/index
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import { CollageOverlay } from '@/components/arc-assembler/CollageOverlay';
import { SceneModePage } from '@/components/arc-assembler/SceneModePage';
import { SubjectModePage } from '@/components/arc-assembler/SubjectModePage';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { getLineThickness } from '@/constants/line';
import { colors, spacing, typography } from '@/constants/theme';
import { ArcAssemblerProvider, useArcAssembler } from '@/hooks/useArcAssembler';
import { stageCallbacks } from '@/lib/stageCallbacks';
import type { ArcAssemblerMode } from '@/types/arc-assembler';

// ============================================
// MODE INDICATOR
// ============================================

interface ModeIndicatorProps {
  mode: ArcAssemblerMode;
  onSelect: (mode: ArcAssemblerMode) => void;
}

function ModeIndicator({ mode, onSelect }: ModeIndicatorProps) {
  return (
    <View style={indicatorStyles.row}>
      <TouchableOpacity
        style={[
          indicatorStyles.tab,
          mode === 'scene' && indicatorStyles.tabActive,
        ]}
        onPress={() => onSelect('scene')}
        activeOpacity={0.75}
      >
        <Text
          style={[
            indicatorStyles.tabLabel,
            mode === 'scene' && indicatorStyles.tabLabelActive,
          ]}
        >
          SCENE
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          indicatorStyles.tab,
          mode === 'subject' && indicatorStyles.tabActive,
        ]}
        onPress={() => onSelect('subject')}
        activeOpacity={0.75}
      >
        <Text
          style={[
            indicatorStyles.tabLabel,
            mode === 'subject' && indicatorStyles.tabLabelActive,
          ]}
        >
          SUBJECT
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: getLineThickness('base'),
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
    backgroundColor: colors.surfaceMuted,
  },
  tabLabel: {
    ...typography.overline,
    color: colors.text.muted,
    fontSize: 11,
  },
  tabLabelActive: {
    color: colors.text.primary,
  },
});

// ============================================
// INNER CONTENT
// ============================================

function ArcAssemblerContent() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  // Mark this card IN_PROGRESS when screen first opens (UP_NEXT → IN_PROGRESS)
  useEffect(() => {
    stageCallbacks.markInProgress('arc-assembler');
  }, []);

  const {
    mode,
    setMode,
    styleSelection,
    confirmAndSave,
  } = useArcAssembler();

  // Mark card IN_PROGRESS when screen mounts
  useEffect(() => {
    stageCallbacks.markInProgress('arc-assembler');
  }, []);

  // ── Mode switching ────────────────────────────────────────────────

  const handleModeSelect = useCallback((newMode: ArcAssemblerMode) => {
    setMode(newMode);
    scrollRef.current?.scrollTo({
      x: newMode === 'scene' ? 0 : width,
      animated: true,
    });
  }, [setMode, width]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const pageIndex = Math.round(
        event.nativeEvent.contentOffset.x / width,
      );
      setMode(pageIndex === 0 ? 'scene' : 'subject');
    },
    [setMode, width],
  );

  const handleNavigateToSubject = useCallback((_categoryId: string) => {
    scrollRef.current?.scrollTo({ x: width, animated: true });
  }, [width]);

  // ── Continue ──────────────────────────────────────────────────────

  const handleContinue = useCallback(async () => {
    await confirmAndSave();
    stageCallbacks.markInReview('arc-assembler');
    router.dismissAll();
  }, [confirmAndSave, router]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // ── Render ────────────────────────────────────────────────────────

  return (
    <ScreenLayout
      tabs={[
        { label: 'Projects', route: '/project' },
        { label: 'Pipeline', route: '/stages' },
      ]}
      title="Arc Assembler"
      onBack={handleBack}
      onContinue={handleContinue}
      continueLabel="Mark Done"
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ModeIndicator mode={mode} onSelect={handleModeSelect} />

      <View style={styles.collageButtonWrapper}>
        <CollageOverlay collageId={styleSelection?.collageId ?? null} />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.pageScroll}
        contentContainerStyle={{ width: width * 2 }}
        decelerationRate="fast"
      >
        <View style={[styles.page, { width }]}>
          <SceneModePage onNavigateToSubject={handleNavigateToSubject} />
        </View>
        <View style={[styles.page, { width }]}>
          <SubjectModePage />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

// ============================================
// MAIN SCREEN
// ============================================

export default function ArcAssemblerScreen() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();

  return (
    <ArcAssemblerProvider projectId={projectId ?? ''}>
      <ArcAssemblerContent />
    </ArcAssemblerProvider>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  pageScroll: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  collageButtonWrapper: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    zIndex: 50,
  },
});
