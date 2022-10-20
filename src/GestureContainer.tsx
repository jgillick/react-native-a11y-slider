import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  LayoutChangeEvent,
  AccessibilityProps,
} from "react-native";

import {
  SliderStop,
  PanBoundaries,
  MarkerType,
  setA11yMarkerPropsFunction,
  SliderType,
} from "./types";
import Label from "./Label";
import Marker from "./Marker";
import useA11yMarkerProps from "./useA11yMarkerProps";

/**
 * The container that holds the marker and label and handles the panning gesture.
 */
type GestureContainerProps = AccessibilityProps & {
  type: MarkerType;
  sliderType: SliderType;
  markerCount: number;
  position: SliderStop;
  stops: SliderStop[];
  minValue?: number;
  maxValue?: number;
  panBoundaries: PanBoundaries;
  showLabel?: boolean;
  markerColor?: string;
  labelComponent?: typeof Label;
  markerComponent?: typeof Marker;
  setIndex: (position: number, pushOther?: boolean) => void;
  setA11yMarkerProps?: setA11yMarkerPropsFunction;
};

export default React.memo(
  ({
    type,
    sliderType,
    markerCount,
    minValue,
    maxValue,
    position,
    stops,
    showLabel = true,
    markerColor,
    panBoundaries: panBoundariesProp,
    setIndex: setIndexProp,
    labelComponent: LabelComponent = Label,
    markerComponent: MarkerComponent = Marker,
    setA11yMarkerProps,
    ...accessibilityProps
  }: GestureContainerProps) => {
    const startPosition = useRef<number>();
    const currentPosition = useRef<number>();
    const isPanningRef = useRef<boolean>(false);
    const panValue = useRef(new Animated.Value(0)).current;
    const stopPositions = useRef<SliderStop[]>([]);
    const panBoundaries = useRef<PanBoundaries>(panBoundariesProp);
    const setIndex = useRef(setIndexProp);

    const [isPanning, setPanning] = useState(false);
    const [markerWidth, setMarkerWidth] = useState(MarkerComponent.size);
    const a11yProps = useA11yMarkerProps({
      type,
      sliderType,
      position,
      minValue,
      maxValue,
      setValue: setIndexProp,
      setA11yMarkerProps,
      ...accessibilityProps,
    });

    /**
     * Return the correct pixel position for a stop.
     * The markers are aligned in relative positions with the lower marker at the start of the scale and the upper marker at the end.
     * This allows the container element to automatically size to the slider without hard-coded heights/widths.
     * However, because of this, the pixel offsets for the upper marker is inverse to the lower marker.
     */
    const getStopPx = useCallback(
      (stop: SliderStop) =>
        type === MarkerType.UPPER ? stop.pxInverse : stop.px,
      [type]
    );

    /**
     * Get the closest stop position to this pixel value
     */
    const getStopPosition = useCallback(
      (px: number): SliderStop | null => {
        let closest = Infinity;
        let found: SliderStop | null = null;

        // Find the stop that is the closest to px.
        for (let i = 0; i < stopPositions.current.length; i++) {
          const stop = stopPositions.current[i];
          const stopPx = getStopPx(stop);
          const distance = Math.abs(stopPx - px);

          if (!found || distance < closest) {
            found = stop;
            closest = distance;
          } else if (distance > closest) {
            // If this stop is further than the previous closest, we know we're done
            break;
          }
        }

        return found;
      },
      [getStopPx]
    );

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,

        onPanResponderStart: (
          _evt: GestureResponderEvent,
          _state: PanResponderGestureState
        ) => {
          isPanningRef.current = true;
          setPanning(true);
        },

        onPanResponderMove: (
          _evt: GestureResponderEvent,
          state: PanResponderGestureState
        ) => {
          // Keep pan within boundaries
          const initialPx = startPosition.current
            ? startPosition.current + state.dx
            : state.dx;
          let px = initialPx;
          if (px > panBoundaries?.current?.max) {
            px = panBoundaries.current.max;
          } else if (px < panBoundaries?.current?.min) {
            px = panBoundaries.current.min;
          }

          const newPosition = getStopPosition(px);
          if (newPosition) {
            const newPx = getStopPx(newPosition);
            setIndex.current(newPosition.index);
            panValue.setValue(newPx);
            currentPosition.current = newPx;
          }
        },

        onPanResponderEnd: () => {
          isPanningRef.current = false;
          setPanning(false);
          if (typeof currentPosition.current === "number") {
            startPosition.current = currentPosition.current;
            panValue.setValue(currentPosition.current);
          }
        },
      })
    ).current;

    /**
     * Get the marker layout
     */
    const onMarkerLayout = useCallback((event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      if (width) {
        setMarkerWidth(width);
      }
    }, []);

    /**
     * Update pan value and position from props to references
     */
    useEffect(() => {
      if (!isPanningRef.current && typeof position?.px !== "undefined") {
        startPosition.current = getStopPx(position);
        panValue.setValue(startPosition.current);
      }
    }, [panValue, position, getStopPx]);

    /**
     * Update stop positions reference
     */
    useEffect(() => {
      stopPositions.current = stops;
    }, [stops]);

    /**
     * Update pan boundaries from props to the ref
     */
    useEffect(() => {
      panBoundaries.current = panBoundariesProp;
    }, [panBoundariesProp]);

    /**
     * Update setValue from props to the ref
     */
    useEffect(() => {
      setIndex.current = setIndexProp;
    }, [setIndexProp]);

    const atMax = position === stops[stops.length - 1]; // marker is at the maximum step
    return (
      <Animated.View
        {...a11yProps}
        style={[
          styles.container,
          atMax && styles.atMax,
          isPanning && styles.selected,
          {
            width: markerWidth,
            transform: [{ translateX: panValue }],
          },
        ]}
      >
        {showLabel && (
          <LabelComponent
            position={position}
            selected={isPanning}
            type={type}
            markerCount={markerCount}
          />
        )}
        <View {...panResponder.panHandlers} onLayout={onMarkerLayout}>
          <MarkerComponent
            position={position}
            selected={isPanning}
            type={type}
            markerCount={markerCount}
            color={markerColor}
          />
        </View>
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "column",
  },

  selected: {
    zIndex: 3,
  },

  // If the marker is at the max step of the scale, put it below the min maker so that the min marker can be moved.
  // (in case the markers are overlapping)
  atMax: {
    zIndex: 2,
    elevation: 0,
  },
});
