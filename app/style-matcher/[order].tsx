import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { styleMatcherData } from '../../constants/styleMatcherData';
import { borderRadius, colors, shadows, spacing, typography } from '../../constants/theme';
import { useStyleMatcher } from '../../hooks/useStyleMatcher';
import { collectTags, findFirstIncompleteBefore, generatePrompt, isQuestionComplete as isQuestionCompleteUtil } from '../../lib/styleMatcher';
import { commonStyles } from '../../styles/common';

const TOTAL_QUESTIONS = styleMatcherData.length;

type ParentQuestion = (typeof styleMatcherData)[number];
type NestedQuestion = NonNullable<ParentQuestion['options'][number]['subQuestion']>;

type NestedOption = NestedQuestion['options'][number];

type Params = {
  order?: string;
  mode?: 'correction' | string;
};

export default function StyleMatcherQuestionScreen() {
  const { order, mode } = useLocalSearchParams<Params>();
  const isCorrection = mode === 'correction';
  const numericOrder = Number.isFinite(Number(order)) && Number(order) >= 1
    ? Number(order)
    : 1;
  const parentQuestion = useMemo(
    () => styleMatcherData.find(item => item.order === numericOrder),
    [numericOrder]
  );

  const { choices, getChoice, setParentAnswer, setSubAnswer } = useStyleMatcher();

  const currentChoice = parentQuestion ? getChoice(parentQuestion.id) : undefined;
  const parentSelection = currentChoice?.parentAnswer ?? '';
  const subSelections = useMemo(
    () => currentChoice?.subAnswers ?? [],
    [currentChoice]
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [numericOrder, fadeAnim]);

  const parentOption = parentQuestion?.options.find(option => option.label === parentSelection);

  const isCompleted = useMemo(
    () => isQuestionCompleteUtil(parentQuestion, currentChoice),
    [currentChoice, parentQuestion]
  );

  useEffect(() => {
    if (isCorrection || numericOrder <= 1) {
      return;
    }

    const incomplete = findFirstIncompleteBefore(numericOrder, getChoice);
    if (incomplete) {
      router.replace(
        {
          pathname: '/style-matcher/[order]',
          params: { order: String(incomplete.order) },
        } satisfies Parameters<typeof router.replace>[0]
      );
    }
  }, [getChoice, isCorrection, numericOrder]);

  const handleParentSelect = useCallback(
    (item: ParentQuestion['options'][number]) => {
      if (!parentQuestion) {
        return;
      }

      if (currentChoice?.parentAnswer === item.label) {
        return;
      }

      // Haptic feedback for selection
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setParentAnswer(parentQuestion, item.label);
    },
    [currentChoice?.parentAnswer, parentQuestion, setParentAnswer]
  );

  const handleSubSelect = useCallback(
    (depth: number, option: NestedOption) => {
      if (!parentQuestion) {
        return;
      }
      if (!parentSelection) {
        return;
      }

      if (subSelections[depth] === option.label) {
        return;
      }

      // Haptic feedback for sub-selection
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }

      setSubAnswer(parentQuestion, depth, option.label);
    },
    [parentQuestion, parentSelection, setSubAnswer, subSelections]
  );

  const renderSubQuestions = useCallback(
    (question: NestedQuestion, depth: number): React.ReactNode => {
      const activeAnswer = subSelections[depth];
      const selectedOption = question.options.find(option => option.label === activeAnswer);

      return (
        <View key={`${question.question}-${depth}`} style={styles.subQuestionSection}>
          <Text style={styles.subQuestionTitle}>{question.question}</Text>

          <View style={styles.optionsList}>
            {question.options.map(option => {
              const isActive = option.label === activeAnswer;
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.optionButton, isActive && styles.optionButtonSelected]}
                  onPress={() => handleSubSelect(depth, option)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedOption?.subQuestion ? renderSubQuestions(selectedOption.subQuestion, depth + 1) : null}
        </View>
      );
    },
    [handleSubSelect, subSelections]
  );

  const handleNext = useCallback(() => {
    if (!parentQuestion) {
      return;
    }

    if (isCorrection) {
      router.replace(
        {
          pathname: '/style-matcher/results',
        } satisfies Parameters<typeof router.replace>[0]
      );
      return;
    }

    if (numericOrder >= TOTAL_QUESTIONS) {
      const tags = collectTags(choices);
      const prompt = generatePrompt(tags);

      router.push(
        {
          pathname: '/style-matcher/results',
          params: {
            prompt,
          },
        } satisfies Parameters<typeof router.push>[0]
      );
      return;
    }

    router.push(
      {
        pathname: '/style-matcher/[order]',
        params: { order: String(numericOrder + 1) },
      } satisfies Parameters<typeof router.push>[0]
    );
  }, [choices, isCorrection, numericOrder, parentQuestion]);

  const handleBack = useCallback(() => {
    if (isCorrection) {
      router.replace(
        {
          pathname: '/style-matcher/results',
        } satisfies Parameters<typeof router.replace>[0]
      );
      return;
    }

    if (numericOrder <= 1) {
      router.back();
      return;
    }

    router.replace(
      {
        pathname: '/style-matcher/[order]',
        params: { order: String(numericOrder - 1) },
      } satisfies Parameters<typeof router.replace>[0]
    );
  }, [isCorrection, numericOrder]);

  if (!parentQuestion) {
    return (
      <SafeAreaView style={commonStyles.screen}>
        <View style={styles.errorState}>
          <Feather name="alert-triangle" size={32} color={colors.error} />
          <Text style={styles.errorTitle}>Question not found</Text>
          <Text style={styles.errorMessage}>Double-check the question order and try again.</Text>
          <Button
            title="Back"
            onPress={handleBack}
            variant="secondary"
            icon={<Feather name="arrow-left" size={18} color={colors.button.secondaryText} />}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScreenLayout
      tabs={[
        { label: 'Project', route: '/project' },
        { label: 'Selection', route: '/style-matcher/' },
      ]}
      title={parentQuestion.title}
      progress={Math.round((numericOrder / TOTAL_QUESTIONS) * 100)}
      onBack={handleBack}
      onContinue={handleNext}
      continueLabel={isCorrection ? 'Update' : numericOrder === TOTAL_QUESTIONS ? 'See Results' : 'Continue'}
      continueDisabled={!isCompleted}
    >

      <Animated.ScrollView
        style={[styles.scroll, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        indicatorStyle="black"
        decelerationRate="fast"
        overScrollMode="always"
        bounces={true}
      >
        <View style={styles.questionSection}>
          <Text style={styles.subQuestionTitle}>{parentQuestion.parentQuestion}</Text>
          <View style={styles.optionsList}>
            {parentQuestion.options.map(option => {
              const isActive = option.label === parentSelection;

              return (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.optionButton, isActive && styles.optionButtonSelected]}
                  onPress={() => handleParentSelect(option)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {parentOption?.subQuestion ? renderSubQuestions(parentOption.subQuestion, 0) : null}
      </Animated.ScrollView>

    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  questionSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text.secondary,
  },
  optionsList: {
    gap: spacing.sm,
  },
  optionButton: {
    borderWidth: 4,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.soft,
  },
  optionButtonSelected: {
    backgroundColor: colors.button.primary,
    borderColor: colors.border,
    ...shadows.hard,
  },
  optionLabel: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: colors.button.primaryText,
  },
  subQuestionSection: {
    gap: spacing.md,
  },
  subQuestionTitle: {
    ...typography.caption,
    textTransform: 'uppercase',
    color: colors.text.secondary,
    letterSpacing: 0.6,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  errorTitle: {
    ...typography.title,
    color: colors.error,
  },
  errorMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
