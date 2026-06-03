/**
 * ============================================
 * SCREEN LAYOUT COMPONENT
 * ============================================
 *
 * Universal screen wrapper implementing the two-plane pattern:
 *   Header (tabs + title + progress)
 *   ── 3px divider ──
 *   Content (scrollable / swipeable)
 *   ── 3px divider ──
 *   Footer (Back + Continue)
 *
 * Every screen in the app should use this component to ensure
 * the consistent dual-horizontal-line aesthetic.
 *
 * @example
 * ```tsx
 * <ScreenLayout
 *   tabs={[{ label: 'Project', route: '/project' }]}
 *   title="Scene Mapper"
 *   progress={33}
 *   onBack={() => router.back()}
 *   onContinue={handleNext}
 * >
 *   <ScrollView>{...}</ScrollView>
 * </ScreenLayout>
 * ```
 *
 * @module components/ui/ScreenLayout
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { commonStyles } from '@/styles/common';

import { FooterActions } from './FooterActions';
import { Line } from './Line';
import type { NavigationTab } from './NavigationHeader';
import { NavigationHeader } from './NavigationHeader';

// ============================================
// TYPES
// ============================================

export interface ScreenLayoutProps {
  /** Breadcrumb tab trail (parent pages only — current page is NOT included) */
  tabs: NavigationTab[];
  /** Title text displayed below tabs (current page / context) */
  title: string;
  /** Optional progress percentage (0-100) */
  progress?: number;
  /** Optional custom progress label */
  progressLabel?: string;
  /** Progress icon name */
  progressIcon?: string;
  /** Screen content — rendered between the two divider lines */
  children: React.ReactNode;
  /** Handler for Back button. Omit to hide. */
  onBack?: () => void;
  /** Label for the Back button. @default "Back" */
  backLabel?: string;
  /** Handler for Continue button. Required for footer to render. */
  onContinue?: () => void;
  /** Label for the Continue button. @default "Continue" */
  continueLabel?: string;
  /** Disable the Continue button. */
  continueDisabled?: boolean;
  /** SafeAreaView edges. @default ['top'] */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** Whether to show footer divider + footer. @default true when onContinue is provided */
  showFooter?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function ScreenLayout({
  tabs,
  title,
  progress,
  progressLabel,
  progressIcon,
  children,
  onBack,
  backLabel,
  onContinue,
  continueLabel,
  continueDisabled,
  edges = ['top'],
  showFooter,
}: ScreenLayoutProps) {
  const hasFooter = showFooter ?? !!onContinue;

  return (
    <SafeAreaView style={commonStyles.screen} edges={edges}>
      <NavigationHeader
        tabs={tabs}
        title={title}
        progress={progress}
        progressLabel={progressLabel}
        progressIcon={progressIcon as any}
      />

      <Line />

      <View style={styles.content}>
        {children}
      </View>

      {hasFooter && (
        <>
          <Line />
          {onContinue && (
            <FooterActions
              onBack={onBack}
              backLabel={backLabel}
              onContinue={onContinue}
              continueLabel={continueLabel}
              continueDisabled={continueDisabled}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
