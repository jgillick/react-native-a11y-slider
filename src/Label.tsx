import React, { useCallback, useState, useMemo } from "react";
import { StyleSheet, Text, View, LayoutChangeEvent } from "react-native";

import { LabelProps } from "./types";

const MIN_HEIGHT = 30;

export default function Label({
  position,
  selected,
  style,
  textStyle,
}: LabelProps) {
  const [height, setHeight] = useState(30);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const height = Math.max(event.nativeEvent.layout.height, MIN_HEIGHT);
    setHeight(height);
  }, []);

  const containerStyles = useMemo(() => {
    return [styles.container, { height: height }];
  }, [height]);

  const labelStyles = useMemo(
    () => [styles.inner, selected && styles.selected, style],
    [styles, selected, style]
  );

  const textStyles = useMemo(() => [styles.text, textStyle], [textStyle]);

  if (typeof position?.value === "undefined") {
    return <></>;
  }
  return (
    <View>
      <View style={containerStyles}>
        <View style={labelStyles} onLayout={onLayout}>
          <Text style={textStyles}>{position.value}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The container positions the label above the marker thumb.
  container: {
    marginBottom: 8,
    height: MIN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  // The inner container allows the label to grow with the text
  inner: {
    position: "absolute",
    top: 0,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "#f1f1f1",
  },
  selected: {
    borderWidth: 2,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderColor: "#888",
  },
  text: {
    fontSize: 12,
  },
});
