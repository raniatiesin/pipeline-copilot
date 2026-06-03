/**
 * ============================================
 * UI COMPONENT TYPES
 * ============================================
 *
 * Shared prop types for reusable UI primitives.
 * Component-specific props that are only used internally
 * are defined inside the component file itself.
 *
 * @module types/ui
 */

import type { StyleProp, ViewStyle } from 'react-native';
import type { ModuleStatus, PressHandler } from './core';

// ============================================
// BUTTON
// ============================================

/** Button visual variants. */
export type ButtonVariant = 'primary' | 'secondary' | 'action';

/** Props for the Button component. */
export interface ButtonProps {
  title: string;
  onPress: PressHandler;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  /** Show the zap icon on action buttons. @default true */
  showZapIcon?: boolean;
}

// ============================================
// TAG
// ============================================

/** Props for the Tag chip component. */
export interface TagProps {
  label: string;
  /** Whether the tag is currently selected. */
  selected?: boolean;
  onPress?: PressHandler;
  style?: StyleProp<ViewStyle>;
}

// ============================================
// MODULE CARD
// ============================================

/** Props for the project-hub ModuleCard component. */
export interface ModuleCardProps {
  title: string;
  description: string;
  status: ModuleStatus;
  progress: number;
  icon: string;
  onPress: PressHandler;
  disabled?: boolean;
}
