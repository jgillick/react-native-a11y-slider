import { useCallback, useMemo } from "react";
import { AccessibilityProps, AccessibilityActionEvent } from "react-native";

import {
  SliderStop,
  setA11yMarkerPropsFunction,
  MarkerType,
  SliderType,
} from "./types";

/**
 * Define the accessibility props and actions for the slider marker
 */
type UseA11yMarkerPropsProps = AccessibilityProps & {
  position: SliderStop;
  type: MarkerType;
  sliderType: SliderType;
  minValue?: number;
  maxValue?: number;
  setValue: (position: number, pushOther?: boolean) => void;
  setA11yMarkerProps?: setA11yMarkerPropsFunction;
};
export default function useA11yMarkerProps({
  position,
  type,
  sliderType,
  minValue,
  maxValue,
  setValue,
  setA11yMarkerProps,
  ...a11yProps
}: UseA11yMarkerPropsProps): AccessibilityProps {
  const onAccessibilityAction = useCallback(
    (event: AccessibilityActionEvent) => {
      const action = event.nativeEvent.actionName;
      switch (action) {
        case "increment":
          setValue(position.index + 1, true);
          break;
        case "decrement":
          setValue(position.index - 1, true);
      }
    },
    [position?.index, setValue]
  );

  const calculatedA11yProps = useMemo<AccessibilityProps>(() => {
    let custom: AccessibilityProps = {};
    if (typeof setA11yMarkerProps === "function") {
      custom = setA11yMarkerProps({
        markerType: type,
        value: position.value,
        minValue,
        maxValue,
      });
    }

    let accessibilityLabel = "Select value";
    if (sliderType === SliderType.RANGE) {
      accessibilityLabel = type === MarkerType.LOWER ? "Min" : "Max";
    }

    return {
      accessibilityLabel,
      accessible: true,
      accessibilityRole: "adjustable",
      accessibilityValue: {
        min: typeof minValue === "number" ? minValue : undefined,
        max: typeof maxValue === "number" ? maxValue : undefined,
        now: typeof position.value === "number" ? position.value : undefined,
        text: String(position.value),
      },

      ...a11yProps,
      ...custom,

      onAccessibilityAction,
      accessibilityActions: [{ name: "increment" }, { name: "decrement" }],
    };
  }, [
    setA11yMarkerProps,
    sliderType,
    minValue,
    maxValue,
    position.value,
    a11yProps,
    onAccessibilityAction,
    type,
  ]);

  return calculatedA11yProps;
}
