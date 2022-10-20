import React, { useMemo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { MarkerProps } from "./types";

function Marker({ color }: MarkerProps) {
  const styled = useMemo(() => {
    let colorStyle: ViewStyle = {};
    if (color) {
      colorStyle.backgroundColor = color;
    }
    return [styles.marker, colorStyle];
  }, [color]);

  return <View style={styled} />;
}
Marker.size = 24;
export default Marker;

const styles = StyleSheet.create({
  marker: {
    width: Marker.size,
    height: Marker.size,
    borderRadius: Marker.size / 2,
  },
});
