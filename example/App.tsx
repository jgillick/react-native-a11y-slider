import React, { useCallback, useState, useMemo } from "react";
import { StyleSheet, Text, View, SafeAreaView, ScrollView } from "react-native";
import Slider, { MarkerType } from "react-native-a11y-slider";

export default function App() {
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // Disable the view scrolling when the slider is being dragged.
  const sliderStart = useCallback(() => {
    setScrollEnabled(false);
  }, []);
  const sliderStop = useCallback(() => {
    setScrollEnabled(true);
  }, []);

  // Memoize the sliders so that they don't re-render when scrollEnabled changes
  const scrollers = useMemo(() => {
    return (
      <>
        <View style={styles.example}>
          <Text>Basic single slider</Text>
          <Slider<number>
            min={1}
            max={100}
            values={[5]}
            onSlidingStart={sliderStart}
            onSlidingComplete={sliderStop}
          />
        </View>
        <View style={styles.example}>
          <Text>Double slider</Text>
          <Slider<number>
            min={1}
            max={100}
            values={[10, 70]}
            onSlidingStart={sliderStart}
            onSlidingComplete={sliderStop}
          />
        </View>
        <View style={styles.example}>
          <Text>Custom stop values</Text>
          <Slider<string>
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
            onSlidingStart={sliderStart}
            onSlidingComplete={sliderStop}
          />
        </View>
        <View style={styles.example}>
          <Text>Custom Markers</Text>
          <Slider
            min={1}
            max={100}
            values={[20, 55]}
            markerComponent={CustomMarker}
            onSlidingStart={sliderStart}
            onSlidingComplete={sliderStop}
          />
        </View>
        <View style={styles.example}>
          <Text>Custom Label Styles</Text>
          <Slider
            min={1}
            max={100}
            values={[5]}
            labelStyle={styles.labelStyle}
            labelTextStyle={styles.labelTextStyle}
            onSlidingStart={sliderStart}
            onSlidingComplete={sliderStop}
          />
        </View>
      </>
    );
  }, [sliderStart, sliderStop]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroller}
        scrollEnabled={scrollEnabled}
      >
        {scrollers}
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
  labelStyle: {
    backgroundColor: "#000",
    borderRadius: 5,
  },
  labelTextStyle: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#fff",
  },
});
