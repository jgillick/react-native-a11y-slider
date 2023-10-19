import type {
  AccessibilityProps,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";

/**
 * The type of slider this is.
 */
export enum SliderType {
  /** The slider ony has one marker thumb and is defining a single value */
  SINGLE,

  /** The slider has two marker thumbs and defines a min and max value */
  RANGE,
}

/**
 * Defines the type of marker thumb.
 * Either the lower value or the upper value in the range.
 */
export enum MarkerType {
  LOWER,
  UPPER,
}

/**
 * The slider position value
 */
export type SliderValue = number | string;

/**
 * A position on the slider scale that the marker can stop at
 */
export type SliderStop = {
  index: number;
  value: SliderValue;

  /** Pixel position for the lower thumb marker */
  px: number;

  /** Pixel position for the upper thumb marker */
  pxInverse: number;
};

/**
 * The min/max pixel values that the slider can pan.
 */
export type PanBoundaries = {
  min: number;
  max: number;
};

/**
 * The optional function that can be called to set the accessibility values on the slider marker.
 */
export type setA11yMarkerPropsFunction = (
  args: setA11yMarkerPropsFunctionArgs
) => AccessibilityProps;
export type setA11yMarkerPropsFunctionArgs = {
  /** The marker type. Either the lower value or the upper value. */
  markerType: MarkerType;

  /** The current marker value */
  value: SliderValue;

  /** The minimum value this marker can be */
  minValue?: SliderValue;

  /** The maximum value this marker can be */
  maxValue?: SliderValue;
};

/**
 * Custom marker component props
 */
export type MarkerProps = {
  type: MarkerType;
  markerCount: number;
  position: SliderStop;
  selected: boolean;
  color?: string;
};

/**
 * Custom label component props
 */
export type LabelProps = {
  type: MarkerType;
  markerCount: number;
  position: SliderStop;
  selected: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};
