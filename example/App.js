import React, { useMemo } from "react";
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from "react-native";
import Slider, { MarkerType } from "react-native-a11y-slider";

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroller}>
        <View style={styles.example}>
          <Text>Basic single slider</Text>
          <Slider min={1} max={100} values={[10]} />
        </View>
        <View style={styles.example}>
          <Text>Double slider</Text>
          <Slider min={1} max={100} values={[10, 70]} />
        </View>
        <View style={styles.example}>
          <Text>Custom stop values</Text>
          <Slider
            values={["D"]}
            sliderValues={[
              "A",
              "B",
              "C",
              "D",
              "E",
              "F",
              "G",
              "H",
              "I",
              "J",
              "K",
              "L",
              "M",
              "N",
              "O",
              "P",
              "Q",
              "R",
              "S",
              "T",
              "U",
              "V",
              "W",
              "X",
              "Y",
              "Z",
            ]}
          />
        </View>
        <View style={styles.example}>
          <Text>Custom Markers</Text>
          <Slider
            min={1}
            max={100}
            values={[20, 55]}
            markerComponent={CustomMarker}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CustomMarker({ type }) {
  return (
    <View
      style={{
        backgroundColor: type == MarkerType.UPPER ? "#f00" : "#00f",
        height: CustomMarker.size,
        width: CustomMarker.size,
        borderRadius: CustomMarker.size / 2,
      }}
    />
  );
}
CustomMarker.size = 30;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroller: {
    flex: 1,
    gap: 20,
    margin: 10,
    flexDirection: "column",
    justifyContent: "center",
  },
  example: {
    gap: 20,
    borderWidth: 1,
    borderRadius: 10,
    borderColor: "#666",
    padding: 10,
  },
});
