// FR8X-CON Mobile — Universal Responsive Layout Utility
// Provides dynamic scaling, screen break-point detection,
// safe area inset calculations, and multi-column grid math for all Android & iOS devices.

import { useWindowDimensions, PixelRatio, Platform } from "react-native";

const BASE_WIDTH = 375; // Standard mobile base width
const BASE_HEIGHT = 812; // Standard mobile base height

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmallDevice = width < 360;
  const isMediumDevice = width >= 360 && width < 768;
  const isTablet = width >= 768;
  const isLandscape = width > height;

  // Scale size proportionally based on screen width
  const scale = (size: number): number => {
    const scaleFactor = width / BASE_WIDTH;
    const newSize = size * scaleFactor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };

  // Moderate scale with factor control (defaults to 0.5)
  const moderateScale = (size: number, factor = 0.5): number => {
    return Math.round(size + (scale(size) - size) * factor);
  };

  // Adaptive font scaling
  const fontSize = (size: number): number => {
    if (isTablet) return Math.round(size * 1.25);
    if (isSmallDevice) return Math.round(size * 0.88);
    return Math.round(size);
  };

  // Maximum content container width for tablets/large displays
  const containerMaxWidth = isTablet ? 720 : "100%";

  // Dynamic grid column count
  const gridColumns = isTablet ? (isLandscape ? 3 : 2) : 1;

  return {
    width,
    height,
    isSmallDevice,
    isMediumDevice,
    isTablet,
    isLandscape,
    scale,
    moderateScale,
    fontSize,
    containerMaxWidth,
    gridColumns,
  };
}

/**
 * Static responsive scale function for style definitions where hooks cannot be called
 */
export function scaleStatic(size: number, width: number = Dimensions_Width()): number {
  const scaleFactor = width / BASE_WIDTH;
  return Math.round(size * scaleFactor);
}

function Dimensions_Width(): number {
  try {
    const { Dimensions } = require("react-native");
    return Dimensions.get("window").width;
  } catch {
    return BASE_WIDTH;
  }
}
