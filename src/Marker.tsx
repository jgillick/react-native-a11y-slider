import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { MarkerType, SliderStop } from './types';

export type MarkerProps = {
  type: MarkerType;
  markerCount: number;
  position: SliderStop;
  selected: boolean;
  color?: string;
};

export default function Marker({ color }: MarkerProps) {
  const colorStyle = useMemo(() => {
    if (color) {
      return { backgroundColor: color } as ViewStyle;
    }
  }, [color]);

  return <View style={[styles.marker, colorStyle]} />;
}
Marker.size = 24;

const styles = StyleSheet.create({
  marker: {
    width: Marker.size,
    height: Marker.size,
    borderRadius: Marker.size / 2,
    backgroundColor: '#333',
  },
});
