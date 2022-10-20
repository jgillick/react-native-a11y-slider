import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { LabelProps } from "./types";

export default function Label({ position, selected }: LabelProps) {
  if (typeof position?.value === "undefined") {
    return <></>;
  }
  return (
    <View style={styles.container}>
      <View style={[styles.inner, selected && styles.selected]}>
        <Text style={styles.text}>{position.value}</Text>
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
    height: 30,
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
});
