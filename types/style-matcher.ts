/**
 * ============================================
 * STYLE MATCHER TYPES
 * ============================================
 * 
 * Types for the Style Selection module which guides users
 * through visual style preferences via questionnaire.
 * 
 * The style matching flow:
 * 1. User answers parent questions (main categories)
 * 2. Based on answers, sub-questions are revealed
 * 3. Each answer contributes tags to the style profile
 * 4. Tags are compiled into a style prompt
 * 
 * @module types/style-matcher
 */

// ============================================
// QUESTIONNAIRE STRUCTURE
// ============================================

/**
 * An option in a style question.
 * Options can have nested sub-questions for drill-down.
 */
export interface StyleOption {
  /** Display label for the option */
  label: string;
  /** Tags contributed when this option is selected */
  tags?: string[];
  /** Optional sub-question revealed when selected */
  subQuestion?: StyleQuestion;
}

/**
 * A style question in the questionnaire.
 * Questions can be nested to any depth via subQuestion.
 */
export interface StyleQuestion {
  /** The question text */
  question: string;
  /** Available answer options */
  options: StyleOption[];
}

/**
 * A parent (top-level) question in the style matcher.
 * Parent questions have additional metadata for navigation.
 */
export interface StyleParentQuestion extends StyleQuestion {
  /** Unique identifier */
  id: string;
  /** Display order (1-based) */
  order: number;
  /** The main question text */
  parentQuestion: string;
  /** Available options with potential sub-questions */
  options: StyleOption[];
}

// ============================================
// USER CHOICES
// ============================================

/**
 * A user's choice for a single question.
 * Tracks both parent answer and any sub-question answers.
 */
export interface UserChoice {
  /** Question identifier */
  questionId: string;
  /** Question display order */
  questionOrder: number;
  /** Selected parent option label */
  parentAnswer: string;
  /** Selected sub-question answers (by depth) */
  subAnswers: string[];
}

// ============================================
// STYLE OUTPUT
// ============================================

/**
 * Collected style tags from all answers.
 */
export interface StyleTags {
  /** All collected tags */
  tags: string[];
  /** Grouped tags by category (optional) */
  categories?: Record<string, string[]>;
}

/**
 * Generated style prompt for image generation.
 */
export interface StylePrompt {
  /** Main prompt text */
  prompt: string;
  /** Negative prompt (things to avoid) */
  negativePrompt?: string;
  /** Individual tags used to build prompt */
  tags: string[];
}

// ============================================
// STYLE IMAGES
// ============================================

/**
 * A reference image representing a style.
 * Used for style preview and selection.
 */
export interface StyleImage {
  /** Unique identifier */
  id: string;
  /** Image URL */
  url: string;
  /** Display title */
  title?: string;
  /** Style description */
  description?: string;
  /** Associated style tags */
  tags?: string[];
}

// ============================================
// MODULE STATE
// ============================================

/**
 * State for the Style Matcher module.
 */
export interface StyleMatcherState {
  /** All user choices */
  choices: UserChoice[];
  /** Current question order */
  currentQuestion: number;
  /** Total questions count */
  totalQuestions: number;
  /** Whether in correction mode */
  isCorrection: boolean;
}

// ============================================
// NAVIGATION
// ============================================

/**
 * Route parameters for style matcher screens.
 */
export interface StyleMatcherParams {
  /** Current question order (1-based) */
  order?: string;
  /** Mode: 'correction' or undefined */
  mode?: 'correction';
}
