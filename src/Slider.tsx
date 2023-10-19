import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
} from "react";
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
  TextStyle,
  AccessibilityProps,
  Insets,
} from "react-native";

import {
  MarkerType,
  SliderStop,
  SliderValue,
  PanBoundaries,
  setA11yMarkerPropsFunction,
  SliderType,
} from "./types";
import GestureContainer from "./GestureContainer";
import Label from "./Label";
import Marker from "./Marker";

export type SliderProps<SliderValueType extends SliderValue = SliderValue> =
  AccessibilityProps & {
    /** The values of the sliders. If the array has two values, there will be two slider markers. */
    values: SliderValueType[];

    /** The minimum value of the slider scale */
    min?: number;
    /** The maximum value of the slider scale */
    max?: number;
    /** If `min` and `max` are defined, this is the increment between slider steps. */
    increment?: number;
    /** Hardcode the slider step values. If this is used, `min` and `max` are ignored. */
    sliderValues?: SliderValueType[];

    /** Show the floating marker label over the slider marker. */
    showLabel?: boolean;
    /** The hex color to use for the slider marker thumb. */
    markerColor?: string;
    /** Defines how far a touch event can start away from the marker */
    hitSlop?: Insets;

    /** The style to apply to the slider container. */
    style?: StyleProp<ViewStyle>;
    /** The style to apply to the slider track. */
    trackStyle?: StyleProp<ViewStyle>;
    /** The style to apply to the selected section of the slider track. */
    selectedTrackStyle?: StyleProp<ViewStyle>;
    /** The style to apply to the floating label. */
    labelStyle?: StyleProp<ViewStyle>;
    /** The style to apply to the floating label text. */
    labelTextStyle?: StyleProp<TextStyle>;

    /** The component used for the floating marker label */
    labelComponent?: typeof Label;
    /** The component used for the marker thumb. Note, this needs to have a static `size` property. */
    markerComponent?: typeof Marker;

    /** Fired when the slider value changes */
    onChange?:
      | ((values: SliderValueType[]) => void)
      | Dispatch<SetStateAction<SliderValueType[]>>;
    /** Fired when one of the markers starts to be dragged */
    onSlidingStart?: (slider: MarkerType) => void;
    /** Fired when one of the markers finishes being dragged */
    onSlidingComplete?: (slider: MarkerType) => void;

    /** Customize the accessibility values */
    setA11yMarkerProps?: setA11yMarkerPropsFunction;
  };
export default function Slider<
  SliderValueType extends SliderValue = SliderValue
>({
  min,
  max,
  values,
  sliderValues,
  markerColor = "#333",
  showLabel = true,
  style,
  trackStyle,
  selectedTrackStyle,
  labelStyle,
  labelTextStyle,
  increment = 1,
  hitSlop,
  onChange,
  onSlidingStart,
  onSlidingComplete,
  labelComponent,
  setA11yMarkerProps,
  markerComponent = Marker,
  ...accessibilityProps
}: SliderProps<SliderValueType>) {
  const [sliderWidth, setSliderWidth] = useState<number>(0);
  const [lowerIndex, setLowerIndexState] = useState<number>(0);
  const [upperIndex, setUpperIndexState] = useState<number>();
  const [stops, setStops] = useState<SliderStop[]>([]);

  const markerCount = values.length;
  const hasUpperIndex = typeof upperIndex === "number";
  const sliderType = values.length > 1 ? SliderType.RANGE : SliderType.SINGLE;

  /**
   * Set the absolute upper and lower boundaries for each marker thumb so they cannot get
   * dragged past one another.
   */
  const [lowerPanBoundaries, upperPanBoundaries] = useMemo<
    PanBoundaries[]
  >(() => {
    if (!stops.length || typeof lowerIndex === "undefined") {
      return [];
    }

    const maxIdx = stops.length - 1;
    return [
      // Lower boundaries
      {
        min: stops[0].px,
        max: stops[hasUpperIndex ? upperIndex - 1 : maxIdx].px,
      },
      // Upper boundaries
      {
        min: stops[hasUpperIndex ? lowerIndex + 1 : 0].pxInverse,
        max: stops[maxIdx].pxInverse,
      },
    ];
  }, [stops, lowerIndex, hasUpperIndex, upperIndex]);

  /**
   * Adjust the track to be centered on the markers
   */
  const trackPlacement = useMemo(() => {
    let margin = 15;
    if (typeof markerComponent?.size !== "undefined") {
      margin = markerComponent?.size / 2;
    }
    return {
      bottom: margin,
      left: margin,
      right: margin,
    };
  }, [markerComponent]);

  /**
   * Get the coordinates for the selected part of the track.
   * This is the track that is highlighted between the lower and upper marker thumb.
   */
  const selectedTrackCoordinates = useMemo(() => {
    const coords: ViewStyle = {
      left: 0,
      right: 0,
    };

    if (!stops?.length || typeof lowerIndex === "undefined") {
      return {};
    }

    const lowerPosition = stops[lowerIndex];
    const upperPosition = hasUpperIndex ? stops[upperIndex] : null;

    if (upperPosition) {
      coords.left = lowerPosition.px;
      coords.right = sliderWidth - upperPosition.px;
    } else if (lowerPosition) {
      coords.right = sliderWidth - lowerPosition.px;
    } else {
      return {};
    }

    return coords;
  }, [stops, lowerIndex, hasUpperIndex, upperIndex, sliderWidth]);

  /**
   * Fire the onChange handler
   */
  const fireChange = useCallback(
    (lowerIdx: number, upperIdx: number | undefined) => {
      if (typeof onChange !== "function") {
        return;
      }
      const changedValues = [stops[lowerIdx].value];
      if (hasUpperIndex && typeof upperIdx !== "undefined") {
        changedValues.push(stops[upperIdx]?.value);
      }
      onChange(changedValues as SliderValueType[]);
    },
    [onChange, stops, hasUpperIndex]
  );

  /**
   * Get the slider width and calculate the slider stops
   */
  const defineSliderScale = useCallback(
    (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      const hasMinMax = typeof min === "number" && typeof max === "number";
      const stopValues: SliderStop[] = [];
      const valuePositionMap: Record<SliderValue, SliderStop> = {};

      // Calculate stop count and width-per-step
      let stopCount: number = 0;
      if (sliderValues?.length) {
        stopCount = sliderValues?.length - 1;
      } else if (hasMinMax) {
        stopCount = (max - min) / increment;
      }
      const widthPerStep = width / stopCount;

      const calcPx = (index: number) => {
        let px = Math.round(index * widthPerStep);
        if (px < 0) {
          px = 0;
        } else if (px > width) {
          px = width;
        }
        return px;
      };

      // If the stop values were passed in
      if (sliderValues?.length) {
        for (let i = 0; i < sliderValues.length; i++) {
          const value = sliderValues[i];
          const px = calcPx(i);
          const pxInverse = px - width;
          stopValues[i] = {
            value,
            index: i,
            px,
            pxInverse,
          };
          valuePositionMap[value] = stopValues[i];
        }
      }
      // Calculate from a min/max
      else if (hasMinMax) {
        for (let i = 0, value = min; value <= max; i++, value += increment) {
          const px = calcPx(i);
          const pxInverse = px - width;
          stopValues[i] = {
            value,
            index: i,
            px,
            pxInverse,
          };
          valuePositionMap[value] = stopValues[i];
        }
      }

      setStops(stopValues);
      setSliderWidth(width);
    },
    [sliderValues, max, min, increment]
  );

  /**
   * Set lower index and be sure it is within the bounds.
   * Push the upper index, if necessary
   */
  const onSetLowerIndex = useCallback(
    (idx: number, pushUpper: boolean = false) => {
      let newUpperIndex = upperIndex || 0;

      // Push upper value, if necessary
      if (pushUpper && hasUpperIndex && idx >= upperIndex) {
        if (upperIndex < stops.length - 1) {
          newUpperIndex++;
          setUpperIndexState(newUpperIndex);
        } else {
          return; // cannot push if upper is already at the end
        }
      }

      // Cannot go above upper value
      if (hasUpperIndex && newUpperIndex && idx >= newUpperIndex) {
        return;
      }

      const maxIdx = stops.length - 1;
      if (idx <= 0) {
        idx = 0;
      } else if (idx >= maxIdx) {
        idx = maxIdx;
      }

      setLowerIndexState(idx);
      fireChange(idx, newUpperIndex);
    },
    [upperIndex, hasUpperIndex, stops?.length, fireChange]
  );

  /**
   * Set upper value
   */
  const onSetUpperIndex = useCallback(
    (idx: number, pushLower: boolean = false) => {
      let newLowerIndex = lowerIndex;

      // Push lower value, if necessary
      if (pushLower && idx <= lowerIndex && idx >= 0) {
        if (lowerIndex > 0) {
          newLowerIndex--;
          setLowerIndexState(newLowerIndex);
        } else {
          return; // cannot push if lower index is already at the start
        }
      }

      // Cannot go below lower value
      if (idx <= newLowerIndex) {
        return;
      }

      const maxIdx = stops.length - 1;
      if (idx >= maxIdx) {
        idx = maxIdx;
      } else if (idx < 1) {
        idx = 1;
      }
      setUpperIndexState(idx);
      fireChange(newLowerIndex, idx);
    },
    [lowerIndex, stops?.length, fireChange]
  );

  /**
   * Set the stop values from props
   */
  useEffect(() => {
    if (!values?.length || !stops.length) {
      return;
    }

    const [lower, upper] = values;
    const hasUpperValue = typeof upper !== "undefined";

    let lowerIdx: number | null = null;
    let upperIdx: number | null = null;

    // Find the position index for each value
    for (let i = 0; i < stops.length; i++) {
      const position = stops[i];

      if (lowerIdx === null) {
        if (position.value === lower) {
          lowerIdx = i;
        }
      } else if (hasUpperValue) {
        if (position.value === upper) {
          upperIdx = i;
        }
      } else {
        break;
      }
    }

    if (lowerIdx === null) {
      lowerIdx = 0;
    }

    setLowerIndexState(lowerIdx);
    if (hasUpperValue) {
      if (upperIdx === null) {
        upperIdx = stops.length - 1;
      }
      setUpperIndexState(upperIdx);
    }
  }, [values, stops]);

  /**
   * Style memoizing
   */
  const wrapperStyles = useMemo(
    () => [styles.wrapper, style],
    [styles.wrapper, style]
  );
  const trackWrapperStyles = useMemo(
    () => [styles.trackContainer, trackPlacement],
    [styles.trackContainer, trackPlacement]
  );
  const trackStyles = useMemo(
    () => [styles.track, trackStyle],
    [styles.track, trackStyle]
  );
  const trackSelectedStyles = useMemo(
    () => [styles.selectedTrack, selectedTrackCoordinates, selectedTrackStyle],
    [styles.selectedTrack, selectedTrackCoordinates, selectedTrackStyle]
  );

  return (
    <View style={wrapperStyles}>
      <View style={styles.container}>
        {/* Thumb markers */}
        <View style={styles.markerContainer}>
          {typeof lowerIndex === "number" && stops && stops[lowerIndex] && (
            <GestureContainer
              markerCount={markerCount}
              type={MarkerType.LOWER}
              sliderType={sliderType}
              minValue={min}
              maxValue={max}
              position={stops[lowerIndex]}
              stops={stops}
              panBoundaries={lowerPanBoundaries}
              showLabel={showLabel}
              labelComponent={labelComponent}
              markerComponent={markerComponent}
              markerColor={markerColor}
              setIndex={onSetLowerIndex}
              setA11yMarkerProps={setA11yMarkerProps}
              onSlidingStart={onSlidingStart}
              onSlidingComplete={onSlidingComplete}
              hitSlop={hitSlop}
              labelStyle={labelStyle}
              labelTextStyle={labelTextStyle}
              {...accessibilityProps}
            />
          )}
          {hasUpperIndex && stops && stops[upperIndex] && (
            <GestureContainer
              markerCount={markerCount}
              type={MarkerType.UPPER}
              sliderType={sliderType}
              minValue={min}
              maxValue={max}
              position={stops[upperIndex]}
              stops={stops}
              panBoundaries={upperPanBoundaries}
              showLabel={showLabel}
              labelComponent={labelComponent}
              markerComponent={markerComponent}
              markerColor={markerColor}
              setIndex={onSetUpperIndex}
              setA11yMarkerProps={setA11yMarkerProps}
              onSlidingStart={onSlidingStart}
              onSlidingComplete={onSlidingComplete}
              hitSlop={hitSlop}
              labelStyle={labelStyle}
              labelTextStyle={labelTextStyle}
              {...accessibilityProps}
            />
          )}
        </View>

        <View style={trackWrapperStyles}>
          {/* Full track */}
          <View style={trackStyles} onLayout={defineSliderScale} />
          {/* Selected track */}
          <View style={trackSelectedStyles} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 0,
    width: "100%",
  },
  container: {
    position: "relative",
  },
  trackContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  track: {
    height: 1,
    width: "100%",
    borderBottomWidth: 2,
    borderColor: "#999",
  },
  selectedTrack: {
    flex: 1,
    height: 1,
    position: "absolute",
    left: 0,
    bottom: 0,
    zIndex: 0,
    borderBottomWidth: 2,
    borderColor: "#333",
  },
  markerContainer: {
    flexDirection: "row",
    zIndex: 1,
    justifyContent: "space-between",
  },
});
