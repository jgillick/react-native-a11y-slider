import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, LayoutChangeEvent, StyleProp, ViewStyle, AccessibilityProps } from 'react-native';

import { MarkerType, SliderStop, SliderValue, PanBoundaries, setA11yMarkerPropsFunction, SliderType } from './types';
import GestureContainer from './GestureContainer';
import Label from './Label';
import Marker from './Marker';

type A11ySliderProps = AccessibilityProps & {
  values: SliderValue[];
  min?: number;
  max?: number;
  increment?: number;
  sliderValues?: SliderValue[];
  showLabel?: boolean;
  markerColor?: string;
  trackStyle?: StyleProp<ViewStyle>;
  selectedTrackStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  labelComponent?: typeof Label;
  markerComponent?: typeof Marker;
  onChange?: (values: SliderValue[]) => void;
  setA11yMarkerProps?: setA11yMarkerPropsFunction;
};
export default React.memo(
  ({
    min,
    max,
    values,
    sliderValues,
    markerColor,
    showLabel,
    style,
    trackStyle,
    selectedTrackStyle,
    increment = 1,
    onChange,
    labelComponent,
    setA11yMarkerProps,
    markerComponent = Marker,
    ...accessibilityProps
  }: A11ySliderProps) => {
    const markerCount = values.length;
    const [sliderWidth, setSliderWidth] = useState<number>(0);
    const [lowerIndex, setLowerIndexState] = useState<number>();
    const [upperIndex, setUpperIndexState] = useState<number>();
    const hasUpperIndex = typeof upperIndex === 'number';
    const sliderType = values.length > 1 ? SliderType.RANGE : SliderType.SINGLE;

    const [stops, setStops] = useState<SliderStop[]>(null);

    /**
     * Set the absolute upper and lower boundaries for each marker thumb so they cannot get
     * dragged past one another.
     */
    const [lowerPanBoundaries, upperPanBoundaries] = useMemo<PanBoundaries[]>(() => {
      if (!stops || typeof lowerIndex === 'undefined') {
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
      if (typeof markerComponent?.size !== 'undefined') {
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

      if (!stops?.length) {
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
     * Get the slider width and calculate the slider stops
     */
    const defineSliderScale = useCallback(
      (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        const stopCount = sliderValues?.length ? sliderValues.length : (max - min) / increment;
        const widthPerStep = width / (stopCount - 1); // subtract one so the last stop is at the end of the track
        const stopValues = [];
        const valuePositionMap = {};

        if (sliderValues?.length) {
          for (let i = 0; i < sliderValues.length; i++) {
            const value = sliderValues[i];
            const px = Math.round(i * widthPerStep);
            const pxInverse = px - width;
            stopValues[i] = {
              value,
              index: i,
              px,
              pxInverse,
            };
            valuePositionMap[value] = stopValues[i];
          }
        } else {
          for (let i = 0, value = min; value <= max; i++, value += increment) {
            const px = Math.round(i * widthPerStep);
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
        let _upperIndex = upperIndex;

        // Push upper value, if necessary
        if (pushUpper && hasUpperIndex && idx >= upperIndex) {
          if (upperIndex < stops.length - 1) {
            _upperIndex++;
            setUpperIndexState(_upperIndex);
          } else {
            return; // cannot push if upper is already at the end
          }
        }

        // Cannot go above upper value
        if (hasUpperIndex && idx >= _upperIndex) {
          return;
        }

        const maxIdx = stops.length - 1;
        if (idx <= 0) {
          idx = 0;
        } else if (idx >= maxIdx) {
          idx = maxIdx;
        }

        setLowerIndexState(idx);
      },
      [upperIndex, hasUpperIndex, stops?.length]
    );

    /**
     * Set upper value
     */
    const onSetUpperIndex = useCallback(
      (idx: number, pushLower: boolean = false) => {
        let _lowerIndex = lowerIndex;

        // Push lower value, if necessary
        if (pushLower && idx <= _lowerIndex && idx >= 0) {
          if (lowerIndex > 0) {
            _lowerIndex--;
            setLowerIndexState(_lowerIndex);
          } else {
            return; // cannot push if lower index is already at the start
          }
        }

        // Cannot go below lower value
        if (idx <= _lowerIndex) {
          return;
        }

        const maxIdx = stops.length - 1;
        if (idx >= maxIdx) {
          idx = maxIdx;
        } else if (idx < 1) {
          idx = 1;
        }
        setUpperIndexState(idx);
      },
      [lowerIndex, stops?.length]
    );

    /**
     * Set the stop values from props
     */
    useEffect(() => {
      if (!values?.length || !stops) {
        return;
      }

      const [lower, upper] = values;
      const hasUpperValue = typeof upper !== 'undefined';

      let lowerIdx: number;
      let upperIdx: number;

      // Find the position index for each value
      for (let i = 0; i < stops.length; i++) {
        const position = stops[i];

        if (typeof lowerIdx === 'undefined') {
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

      if (typeof lowerIdx === 'undefined') {
        lowerIdx = 0;
      }
      if (hasUpperValue && typeof upperIdx === 'undefined') {
        upperIdx = stops.length - 1;
      }

      setLowerIndexState(lowerIdx);
      if (hasUpperValue) {
        setUpperIndexState(upperIdx);
      }
    }, [values, stops]);

    /**
     * Fire onChange when the upper or lower value changes
     */
    useEffect(() => {
      if (typeof onChange !== 'function') {
        return;
      }

      const changedValues = [stops[lowerIndex].value];
      if (hasUpperIndex) {
        changedValues.push(stops[upperIndex].value);
      }
      onChange(changedValues);
    }, [lowerIndex, upperIndex, onChange, stops, hasUpperIndex]);

    return (
      <View style={style}>
        <View style={[styles.container]}>
          {/* Thumb markers */}
          <View style={styles.markerContainer}>
            {typeof lowerIndex === 'number' && stops && (
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
                {...accessibilityProps}
              />
            )}
            {hasUpperIndex && stops && (
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
                {...accessibilityProps}
              />
            )}
          </View>

          <View style={[styles.trackContainer, trackPlacement]}>
            {/* Full track */}
            <View style={[styles.track, trackStyle]} onLayout={defineSliderScale} />
            {/* Selected track */}
            <View style={[styles.selectedTrack, selectedTrackCoordinates, selectedTrackStyle]} />
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  trackContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  track: {
    height: 1,
    width: '100%',
    borderBottomWidth: 2,
    borderColor: '#999',
  },
  selectedTrack: {
    flex: 1,
    height: 1,
    position: 'absolute',
    left: 0,
    bottom: 0,
    zIndex: 0,
    borderBottomWidth: 2,
    borderColor: '#333',
  },
  markerContainer: {
    flexDirection: 'row',
    zIndex: 1,
    justifyContent: 'space-between',
  },
});
