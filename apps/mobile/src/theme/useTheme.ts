import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { themeTokens } from "./tokens";

export function useTheme() {
  const { width, height } = useWindowDimensions();

  return useMemo(
    () => ({
      ...themeTokens,
      viewport: {
        width,
        height,
        isTablet: width >= 768,
        isWide: width >= 1024
      }
    }),
    [height, width]
  );
}
