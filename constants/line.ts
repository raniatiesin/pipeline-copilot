import { colors } from './theme';

export const LINE_WEIGHT = {
  hairline: 1,
  thin: 2,
  base: 3,
  heavy: 4,
} as const;

export type LineWeight = keyof typeof LINE_WEIGHT;

export const THE_LINE = {
  color: colors.border,
  weight: LINE_WEIGHT,
} as const;

export function getLineThickness(weight: LineWeight = 'base'): number {
  return LINE_WEIGHT[weight];
}
