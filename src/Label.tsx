import React, { useCallback, useState, useMemo } from "react";
import { StyleSheet, Text, View, LayoutChangeEvent } from "react-native";

import { LabelProps } from "./types";

const MIN_HEIGHT = 30;

export default function Label({ position, selected }: LabelProps) {
  const [height, setHeight] = useState(30);

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const height = Math.max(event.nativeEvent.layout.height, MIN_HEIGHT);
    setHeight(height);
  }, []);

  const containerStyles = useMemo(
    () => [styles.container, { height }],
    [height]
  );

  if (typeof position?.value === "undefined") {
    return <></>;
  }
  return (
    <View>
      {/* Calculate the text height */}
      <View
        style={styles.textSizer}
        accessibilityElementsHidden={false}
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.text} onLayout={onLayout}>
          {position.value}
        </Text>
      </View>

      <View style={containerStyles}>
        <View style={[styles.inner, selected && styles.selected]}>
          <Text style={styles.text}>{position.value}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The container positions the label above the marker thumb.
  container: {
    marginBottom: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    height: MIN_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  // The inner container allows the label to grow with the text
  inner: {
    position: "absolute",
    top: 0,
    bottom: 0,
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
  textSizer: {
    position: "absolute",
    width: 1,
    zIndex: 0,
    opacity: 0,
  },
});
