/**
 * ============================================
 * CARD PRIMITIVES BARREL EXPORT
 * ============================================
 *
 * Composable building blocks for every card in the app.
 * Inspired by react-kanban's render-delegation pattern:
 * CardContainer handles behavior (press, animate, accessibility),
 * inner primitives handle structure (header, content, footer, badge).
 *
 * Usage:
 * ```tsx
 * import {
 *   CardContainer,
 *   CardHeader,
 *   CardContent,
 *   CardFooter,
 *   CardBadge,
 *   CardProgressBar,
 *   useCardAnimation,
 * } from '@/components/ui/card';
 * ```
 *
 * @module components/ui/card
 */

// Behavioral
export { CARD_SPRING, CARD_SPRING_SOFT, useCardAnimation } from './useCardAnimation';
export type { CardAnimationConfig, CardAnimationReturn } from './useCardAnimation';

// Container
export { CardContainer } from './CardContainer';
export type { CardContainerProps, CardVariant } from './CardContainer';

// Structure
export { CardHeader } from './CardHeader';
export type { CardHeaderProps } from './CardHeader';

export { CardContent } from './CardContent';
export type { CardContentProps } from './CardContent';

export { CardFooter } from './CardFooter';
export type { CardFooterProps } from './CardFooter';

// Data display
export { CardBadge } from './CardBadge';
export type { CardBadgeProps } from './CardBadge';

export { CardProgressBar } from './CardProgressBar';
export type { CardProgressBarProps } from './CardProgressBar';

export { CardIdentityPill } from './CardIdentityPill';
export type { CardIdentityPillProps } from './CardIdentityPill';

export { CardDescriptionProgressRow } from './CardDescriptionProgressRow';
export type { CardDescriptionProgressRowProps } from './CardDescriptionProgressRow';

export { CardNotesSheet } from './CardNotesSheet';
export type { CardNotesSheetProps } from './CardNotesSheet';

// Scene-style composite card
export { UniversalModuleCard } from './UniversalModuleCard';
export type { UniversalModuleCardProps } from './UniversalModuleCard';

