/**
 * ============================================
 * STYLE MATCHER UTILITIES
 * ============================================
 *
 * Business logic for the style-matcher module:
 * - Question completion checking
 * - Navigation helpers (find first incomplete)
 * - Tag collection and prompt generation
 *
 * @module lib/styleMatcher
 */

import { styleMatcherData } from '../constants/styleMatcherData';
import type { UserChoice } from '../types/style-matcher';

// ============================================
// LOCAL TYPE ALIASES
// ============================================

type ParentQuestion = (typeof styleMatcherData)[number];
type NestedQuestion = NonNullable<ParentQuestion['options'][number]['subQuestion']>;

type GetChoice = (questionId: string) => UserChoice | undefined;

// ============================================
// COMPLETION CHECKING
// ============================================

/**
 * Check if a question is fully answered (parent + all drill-downs).
 */
export function isQuestionComplete(
  question?: ParentQuestion,
  choice?: UserChoice
): boolean {
  if (!question || !choice?.parentAnswer) {
    return false;
  }

  const selectedOption = question.options.find(option => option.label === choice.parentAnswer);
  if (!selectedOption) {
    return false;
  }

  let pointer: NestedQuestion | undefined = selectedOption.subQuestion;
  let depth = 0;

  while (pointer) {
    const answer = choice.subAnswers[depth];
    if (!answer) {
      return false;
    }

    const nextOption = pointer.options.find(option => option.label === answer);
    if (!nextOption) {
      return false;
    }

    pointer = nextOption.subQuestion;
    depth += 1;
  }

  return true;
}

// ============================================
// NAVIGATION HELPERS
// ============================================

/** Find the first question that hasn't been fully answered. */
export function findFirstIncompleteQuestion(getChoice: GetChoice): ParentQuestion | undefined {
  return styleMatcherData.find(question => !isQuestionComplete(question, getChoice(question.id)));
}

/** Find the first incomplete question before a given order. */
export function findFirstIncompleteBefore(order: number, getChoice: GetChoice): ParentQuestion | undefined {
  return styleMatcherData.find(question => (
    question.order < order && !isQuestionComplete(question, getChoice(question.id))
  ));
}

// ============================================
// TAG COLLECTION & PROMPT GENERATION
// ============================================

/**
 * Collect all answer labels from a set of user choices.
 * Each parent answer and every sub-answer becomes a tag.
 */
export function collectTags(choices: UserChoice[]): string[] {
  const tags: string[] = [];

  choices.forEach(choice => {
    tags.push(choice.parentAnswer);
    tags.push(...choice.subAnswers);
  });

  return tags;
}

/** Join tags into a comma-separated style prompt string. */
export function generatePrompt(tags: string[]): string {
  return tags.join(', ');
}
