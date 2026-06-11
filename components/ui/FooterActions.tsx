/**
 * ============================================
 * FOOTER ACTIONS COMPONENT
 * ============================================
 *
 * Universal footer bar with Back + Continue buttons.
 * Handles safe-area insets automatically so every screen
 * renders buttons above the device's navigation area.
 *
 * Modes:
 * - **pair** (default): side-by-side Back + Continue
 * - **single**: standalone Continue button (no Back)
 *
 * @example
 * ```tsx
 * <FooterActions
 *   onBack={() => router.back()}
 *   onContinue={handleNext}
 *   continueLabel="See Results"
 *   continueDisabled={!isReady}
 * />
 * ```
 *
 * @module components/ui/FooterActions
 */

import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';
import { Button } from './Button';

// ============================================
// CONSTANTS
// ============================================

/** Minimum bottom padding on devices with no safe-area inset. */
const MIN_BOTTOM = 16;

// ============================================
// TYPES
// ============================================

export interface FooterActionsProps {
  /** Handler for the Back (left) button. Omit to hide it. */
  onBack?: () => void;
  /** Label for the Back button. @default "Back" */
  backLabel?: string;

  /** Handler for the Continue (right / primary) button. */
  onContinue: () => void;
  /** Label for the Continue button. @default "Continue" */
  continueLabel?: string;
  /** Disable the Continue button. */
  continueDisabled?: boolean;
  /** Override background color for the Continue button */
  continueColor?: string;
}

// ============================================
// COMPONENT
// ============================================

export const FooterActions: React.FC<FooterActionsProps> = ({
  onBack,
  backLabel = 'Back',
  onContinue,
  continueLabel = 'Continue',
  continueDisabled = false,
  continueColor,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Math.max(insets.bottom, MIN_BOTTOM) + spacing.sm },
      ]}
    >
      {onBack && (
        <Button
          title={backLabel}
          onPress={onBack}
          variant="secondary"
          icon={
            <Feather
              name="arrow-left"
              size={18}
              color={colors.button.secondaryText}
            />
          }
          style={styles.button}
        />
      )}
      <Button
        title={continueLabel}
        onPress={onContinue}
        disabled={continueDisabled}
        variant="action"
        showZapIcon={false}
        actionColor={continueColor}
        icon={
          <Feather name="arrow-right" size={18} color={colors.surface} />
        }
        style={styles.button}
      />
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignItems: 'stretch',
  },
  button: {
    flex: 1,
  },
});
