/**
 * ============================================
 * STYLE MATCHER HOOK & CONTEXT
 * ============================================
 * 
 * React Context and hook for managing style questionnaire state.
 * Tracks user answers across all questions with sub-question support.
 * 
 * Features:
 * - Parent and sub-question answer tracking
 * - Automatic answer sorting by question order
 * - Reset functionality
 * 
 * @example
 * ```tsx
 * // Wrap app in provider
 * <StyleMatcherProvider>
 *   <App />
 * </StyleMatcherProvider>
 * 
 * // Use in components
 * const { choices, setParentAnswer } = useStyleMatcher();
 * ```
 * 
 * @module hooks/useStyleMatcher
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { styleMatcherData } from '../constants/styleMatcherData';
import type { UserChoice } from '../types/style-matcher';

// ============================================
// TYPES
// ============================================

type ParentQuestion = (typeof styleMatcherData)[number];

/**
 * Context value provided by StyleMatcherProvider.
 */
interface StyleMatcherContextValue {
  /** All user choices */
  choices: UserChoice[];
  /** Get choice for a specific question ID */
  getChoice: (questionId: string) => UserChoice | undefined;
  /** Set parent question answer */
  setParentAnswer: (question: ParentQuestion, parentLabel: string) => void;
  /** Set sub-question answer at depth */
  setSubAnswer: (question: ParentQuestion, depth: number, answerLabel: string) => void;
  /** Reset all choices */
  resetAll: () => void;
}

// ============================================
// CONTEXT
// ============================================

const StyleMatcherContext = createContext<StyleMatcherContextValue | null>(null);

function sortChoices(choices: UserChoice[]): UserChoice[] {
  return [...choices].sort((a, b) => a.questionOrder - b.questionOrder);
}

export const StyleMatcherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [choices, setChoices] = useState<UserChoice[]>([]);

  const getChoice = useCallback(
    (questionId: string) => choices.find(choice => choice.questionId === questionId),
    [choices]
  );

  const setParentAnswer = useCallback((question: ParentQuestion, parentLabel: string) => {
    setChoices(prev => {
      const existingIndex = prev.findIndex(choice => choice.questionId === question.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          parentAnswer: parentLabel,
          subAnswers: [],
        };
        return sortChoices(updated);
      }

      return sortChoices([
        ...prev,
        {
          questionId: question.id,
          questionOrder: question.order,
          parentAnswer: parentLabel,
          subAnswers: [],
        },
      ]);
    });
  }, []);

  const setSubAnswer = useCallback((question: ParentQuestion, depth: number, answerLabel: string) => {
    setChoices(prev => {
      const existingIndex = prev.findIndex(choice => choice.questionId === question.id);
      if (existingIndex === -1) {
        return prev;
      }

      const updated = [...prev];
      const existing = updated[existingIndex];
      const subAnswers = existing.subAnswers.slice(0, depth);
      subAnswers[depth] = answerLabel;

      updated[existingIndex] = {
        ...existing,
        subAnswers,
      };

      return sortChoices(updated);
    });
  }, []);

  const resetAll = useCallback(() => {
    setChoices([]);
  }, []);

  const value = useMemo<StyleMatcherContextValue>(
    () => ({ choices, getChoice, setParentAnswer, setSubAnswer, resetAll }),
    [choices, getChoice, setParentAnswer, setSubAnswer, resetAll]
  );

  return <StyleMatcherContext.Provider value={value}>{children}</StyleMatcherContext.Provider>;
};

export function useStyleMatcher(): StyleMatcherContextValue {
  const context = useContext(StyleMatcherContext);
  if (!context) {
    throw new Error('useStyleMatcher must be used within a StyleMatcherProvider');
  }
  return context;
}
