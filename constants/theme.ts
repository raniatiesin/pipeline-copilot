import { headingText, normalText, smallText } from './typography';

/**
 * ============================================
 * TIESIN DESIGN SYSTEM
 * ============================================
 * 
 * Neobrutalist-inspired design tokens for the Tiesin app.
 * All visual styling should derive from these tokens.
 * 
 * Design Principles:
 * - Bold borders and hard shadows
 * - Warm, approachable color palette
 * - Strong typographic hierarchy
 * - Consistent spacing rhythm
 * 
 * @module constants/theme
 */

// ============================================
// BRAND PALETTE (PRIVATE)
// ============================================

/**
 * Raw brand colors extracted from mascot artwork.
 * DO NOT use directly - use semantic `colors` export instead.
 */
const palette = {
  heavyMetal: '#141614',      // Primary dark
  heavyMetalDeep: '#121513',  // Deepest dark
  dune: '#2e2a26',            // Secondary dark / muted
  burntSienna: '#e8824f',     // Warm accent
  macaroniAndCheese: '#ffc085', // Light warm
  skyBlue: '#69c2ef',         // Cool accent / success
  halfSpanishWhite: '#fef4dd', // Background cream
  alizarinCrimson: '#d72a21', // Primary CTA / error
  sunglow: '#ffc22a',         // Warning / highlight
  white: '#ffffff',           // Pure white
};

// ============================================
// SEMANTIC COLORS
// ============================================

/**
 * Semantic color tokens for consistent theming.
 * 
 * @example
 * ```tsx
 * <View style={{ backgroundColor: colors.surface }}>
 *   <Text style={{ color: colors.text.primary }}>Hello</Text>
 * </View>
 * ```
 */
export const colors = {
  /** Main app background */
  background: palette.halfSpanishWhite,
  /** Muted background for sections */
  backgroundMuted: palette.macaroniAndCheese,
  
  /** Card/elevated surface background */
  surface: palette.white,
  /** Muted surface variant */
  surfaceMuted: palette.halfSpanishWhite,
  /** Elevated surface (hover states, active items) */
  surfaceElevated: palette.macaroniAndCheese,
  /** Alternative surface (info sections) */
  surfaceAlt: palette.skyBlue,
  
  /** Primary brand color */
  primary: palette.heavyMetal,
  /** Secondary brand color */
  secondary: palette.burntSienna,
  /** Accent color for highlights */
  accent: palette.skyBlue,
  /** Alternative accent */
  accentAlt: palette.sunglow,
  
  /** Warning state color */
  warning: palette.sunglow,
  /** Success state color */
  success: palette.skyBlue,
  /** Error state color */
  error: palette.alizarinCrimson,
  
  /** Primary border (neobrutalist thick borders) */
  border: palette.heavyMetal,
  /** Muted border for subtle divisions */
  borderMuted: palette.dune,
  /** Subtle border for inner divisions */
  borderSubtle: palette.macaroniAndCheese,
  /** Horizontal/vertical dividers */
  divider: palette.macaroniAndCheese,
  
  /** Shadow color with opacity */
  shadow: 'rgba(20, 22, 20, 0.45)',
  
  /** Text color variants */
  text: {
    /** Primary text - high contrast */
    primary: palette.heavyMetal,
    /** Secondary text - medium contrast */
    secondary: palette.dune,
    /** Tertiary text - accent color */
    tertiary: palette.burntSienna,
    /** Muted text - low contrast */
    muted: palette.macaroniAndCheese,
    /** Light text - cool accent */
    light: palette.skyBlue,
    /** Inverse text - for dark backgrounds */
    inverse: palette.white,
  },
  
  /** Button colors by variant */
  button: {
    /** Primary button background */
    primary: palette.alizarinCrimson,
    /** Primary button text */
    primaryText: palette.white,
    /** Secondary button background */
    secondary: palette.white,
    /** Secondary button text */
    secondaryText: palette.heavyMetal,
  },
  
  /** Tag/chip colors */
  tag: {
    /** Active tag background */
    activeBg: palette.heavyMetalDeep,
    /** Active tag border */
    activeBorder: palette.heavyMetal,
    /** Active tag text */
    activeText: palette.white,
    /** Inactive tag background */
    inactiveBg: palette.white,
    /** Inactive tag border */
    inactiveBorder: palette.dune,
    /** Inactive tag text */
    inactiveText: palette.dune,
  },
  
  /** Badge/pill colors */
  badge: {
    /** Badge background (sunglow) */
    background: palette.sunglow,
    /** Badge text */
    text: palette.heavyMetal,
  },
  
  /** Highlight colors for special emphasis */
  highlight: {
    red: palette.alizarinCrimson,
    orange: palette.burntSienna,
    blue: palette.skyBlue,
    yellow: palette.sunglow,
    black: palette.heavyMetal,
    offWhite: palette.halfSpanishWhite,
  },
};

// ============================================
// TYPOGRAPHY
// ============================================

/**
 * Typography presets for consistent text styling.
 * Spread these into Text component styles.
 * 
 * @example
 * ```tsx
 * <Text style={typography.title}>Page Title</Text>
 * <Text style={typography.body}>Body content here</Text>
 * ```
 */
export const typography = {
  /** Large page titles - 30px, extra bold */
  title: {
    ...headingText,
    color: colors.text.primary,
  },
  /** Section subtitles - 18px, semibold */
  subtitle: {
    ...normalText,
    fontWeight: '600' as const,
    color: colors.text.secondary,
  },
  /** Body text - 16px, medium */
  body: {
    ...normalText,
    fontWeight: '500' as const,
    color: colors.text.primary,
  },
  /** Button labels - 16px, bold, uppercase */
  button: {
    ...normalText,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  /** Small captions - 13px, semibold */
  caption: {
    ...smallText,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    color: colors.text.muted,
  },
  /** Overline labels - 12px, bold, uppercase */
  overline: {
    ...smallText,
    fontWeight: '700' as const,
    letterSpacing: 0.9,
    textTransform: 'uppercase' as const,
    color: colors.text.muted,
  },
};

// ============================================
// SPACING
// ============================================

/**
 * Spacing scale for consistent margins/padding.
 * Uses a modular scale for visual rhythm.
 * 
 * Scale: 4 → 8 → 12 → 18 → 24 → 32 → 48 → 64
 * 
 * @example
 * ```tsx
 * <View style={{ padding: spacing.md, marginBottom: spacing.lg }}>
 * ```
 */
export const spacing = {
  /** 4px - minimal spacing */
  xxs: 4,
  /** 8px - tight spacing */
  xs: 8,
  /** 12px - small spacing */
  sm: 12,
  /** 18px - medium spacing (default) */
  md: 18,
  /** 24px - large spacing */
  lg: 24,
  /** 32px - extra large */
  xl: 32,
  /** 48px - section spacing */
  xxl: 48,
  /** 64px - major section breaks */
  xxxl: 64,
};

// ============================================
// BORDER RADIUS
// ============================================

/**
 * Border radius presets for rounded corners.
 * Neobrutalist style uses subtle to moderate rounding.
 * 
 * @example
 * ```tsx
 * <View style={{ borderRadius: borderRadius.lg }}>
 * ```
 */
export const borderRadius = {
  /** 6px - subtle rounding */
  sm: 6,
  /** 12px - moderate rounding */
  md: 12,
  /** 18px - pronounced rounding */
  lg: 18,
  /** 26px - pill-like rounding */
  xl: 26,
};

// ============================================
// SHADOWS
// ============================================

/**
 * Shadow presets for elevation effects.
 * Neobrutalist shadows are offset and hard-edged.
 * 
 * @example
 * ```tsx
 * <View style={[styles.card, shadows.medium]}>
 * ```
 */
export const shadows = {
  /** Subtle shadow - cards, inputs */
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 4,
  },
  /** Medium shadow - buttons, interactive */
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 1,
    elevation: 6,
  },
  /** Hard shadow - primary CTAs, active states */
  hard: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 10,
  },
};
