import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { pillSizes } from '../../constants/pills';
import { styleMatcherData } from '../../constants/styleMatcherData';
import { borderRadius, colors, shadows, spacing, typography } from '../../constants/theme';
import { useStyleMatcher } from '../../hooks/useStyleMatcher';
import { findFirstIncompleteQuestion } from '../../lib/styleMatcher';

export default function StyleMatcherResultsScreen() {
  const { choices, getChoice, resetAll } = useStyleMatcher();

  const sortedChoices = useMemo(
    () => [...choices].sort((a, b) => a.questionOrder - b.questionOrder),
    [choices]
  );

  useEffect(() => {
    const incomplete = findFirstIncompleteQuestion(getChoice);
    if (incomplete) {
      router.replace(
        {
          pathname: '/style-matcher/[order]',
          params: { order: String(incomplete.order) },
        } satisfies Parameters<typeof router.replace>[0]
      );
    }
  }, [getChoice]);

  const handleStartOver = useCallback(() => {
    resetAll();
    router.replace(
      {
        pathname: '/style-matcher/[order]',
        params: { order: '1' },
      } satisfies Parameters<typeof router.replace>[0]
    );
  }, [resetAll]);

  const handleClose = useCallback(() => {
    router.replace(
      {
        pathname: '/',
      } satisfies Parameters<typeof router.replace>[0]
    );
  }, []);

  const handleInspectStage = useCallback((order: number) => {
    router.push(
      {
        pathname: '/style-matcher/[order]',
        params: { order: String(order), mode: 'correction' },
      } satisfies Parameters<typeof router.push>[0]
    );
  }, []);

  return (
    <ScreenLayout
      tabs={[
        { label: 'Project', route: '/project' },
        { label: 'Selection', route: '/style-matcher/' },
      ]}
      title="Results"
      progress={100}
      onBack={handleStartOver}
      backLabel="Start Over"
      onContinue={handleClose}
      continueLabel="Close"
    >

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Question trail</Text>
            <Text style={styles.summaryCount}>{sortedChoices.length} selections</Text>
          </View>

          {styleMatcherData.map(question => {
            const choice = sortedChoices.find(item => item.questionId === question.id);
            if (!choice) {
              return null;
            }

            return (
              <Pressable
                key={question.id}
                style={styles.summaryItem}
                onPress={() => handleInspectStage(question.order)}
              >
                <View style={styles.summaryRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepIndex}>{question.order.toString().padStart(2, '0')}</Text>
                  </View>
                  <View style={styles.summaryContent}>
                    <Text style={styles.summaryQuestion}>{question.parentQuestion}</Text>
                    <Text style={styles.summaryAnswer}>{choice.parentAnswer}</Text>
                    {choice.subAnswers.length ? (
                      <View style={styles.subAnswerRow}>
                        {choice.subAnswers.map(sub => (
                          <View key={sub} style={styles.subAnswerPill}>
                            <Text style={styles.subAnswerText}>{sub}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  summaryCard: {
    borderWidth: 4,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.hard,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    ...typography.subtitle,
    color: colors.text.primary,
  },
  summaryCount: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  summaryItem: {
    borderTopWidth: 2,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepBadge: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndex: {
    ...typography.subtitle,
    color: colors.text.primary,
  },
  summaryContent: {
    flex: 1,
    gap: spacing.sm,
  },
  summaryQuestion: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  summaryAnswer: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '700',
  },
  subAnswerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  subAnswerPill: {
    minHeight: pillSizes.small.minHeight,
    borderWidth: pillSizes.small.borderWidth,
    borderColor: colors.border,
    borderRadius: pillSizes.small.borderRadius,
    paddingHorizontal: pillSizes.small.paddingHorizontal,
    paddingVertical: pillSizes.small.paddingVertical,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
  },
  subAnswerText: {
    ...typography.caption,
    color: colors.text.primary,
  },
});
