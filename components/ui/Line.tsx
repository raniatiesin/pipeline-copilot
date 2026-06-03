import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { getLineThickness, THE_LINE, type LineWeight } from '@/constants/line';

export interface LineProps {
  orientation?: 'horizontal' | 'vertical';
  weight?: LineWeight;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function Line({
  orientation = 'horizontal',
  weight = 'base',
  color = THE_LINE.color,
  style,
}: LineProps) {
  const thickness = getLineThickness(weight);

  return (
    <View
      style={[
        orientation === 'horizontal'
          ? { height: thickness, width: '100%' }
          : { width: thickness, height: '100%' },
        { backgroundColor: color },
        styles.base,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'stretch',
  },
});
