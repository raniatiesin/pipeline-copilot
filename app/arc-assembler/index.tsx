/**
 * ============================================
 * ARC ASSEMBLER SCREEN
 * ============================================
 *
 * The final pipeline synthesis card. Brings together:
 *   - Scenes from Beat Butcher (beat_butcher_output)
 *   - Subject profiles from Entity Editor (entity_editor_output)
 *   - Style collage + tag tally from Style Selector (style_selection)
 *
 * Two modes on the same screen, toggled by horizontal page swipe:
 *   Scene Mode  (left)  — write a visual brief per scene
 *   Subject Mode (right) — write a visual brief per subject
 *
 * All state is managed by ArcAssemblerProvider. Briefs are written
 * back to arc_assembler_output via debounced updateProject calls.
 * Continue flushes immediately and marks the card In Review.
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
import { colors, shadows, spacing, typography } from '@/constants/theme';
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
// INNER CONTENT (needs ArcAssemblerProvider context)
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

  // ── Mode switching ────────────────────────────────────────────────

  /**
   * Called by the ModeIndicator tabs.
   * Updates mode state AND scrolls the page view.
   */
  const handleModeSelect = useCallback((newMode: ArcAssemblerMode) => {
    setMode(newMode);
    scrollRef.current?.scrollTo({
      x: newMode === 'scene' ? 0 : width,
      animated: true,
    });
  }, [setMode, width]);

  /**
   * Called when the user completes a native swipe gesture.
   * Updates mode state without scrolling (already on correct page).
   */
  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const pageIndex = Math.round(
        event.nativeEvent.contentOffset.x / width,
      );
      setMode(pageIndex === 0 ? 'scene' : 'subject');
    },
    [setMode, width],
  );

  /**
   * Called by SubjectBriefPopup "SUBJECT MODE" button.
   * The hook already called navigateToSubject() and setMode('subject').
   * We just need to scroll the view.
   */
  const handleNavigateToSubject = useCallback((categoryId: string) => {
    // navigateToSubject is called inside the hook via the popup's onNavigateToSubject prop.
    // Here we only need to scroll the page view to reveal Subject Mode.
    scrollRef.current?.scrollTo({ x: width, animated: true });
  }, [width]);

  // ── Continue ──────────────────────────────────────────────────────

  const handleContinue = useCallback(async () => {
    await confirmAndSave();
    router.back();
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

      {/* Mode indicator tabs */}
      <ModeIndicator mode={mode} onSelect={handleModeSelect} />

      {/* Collage reference button — absolute overlay on the content area */}
      <View style={styles.collageButtonWrapper}>
        <CollageOverlay collageId={styleSelection?.collageId ?? null} />
      </View>

      {/* Horizontal paged scroll — Scene Mode (left) + Subject Mode (right) */}
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
        {/* Page 1 — Scene Mode */}
        <View style={[styles.page, { width }]}>
          <SceneModePage onNavigateToSubject={handleNavigateToSubject} />
        </View>

        {/* Page 2 — Subject Mode */}
        <View style={[styles.page, { width }]}>
          <SubjectModePage />
        </View>
      </ScrollView>
    </ScreenLayout>
  );
}

// ============================================
// MAIN SCREEN (provider entry point)
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

  // Collage button positioned top-right, above the page content
  collageButtonWrapper: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    zIndex: 50,
  },
});
