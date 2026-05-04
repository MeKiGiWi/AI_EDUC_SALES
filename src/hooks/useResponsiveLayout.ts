import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { breakpoints } from "../theme/breakpoints";

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isMobile = width <= breakpoints.mobileMax;
    const isSmallMobile = width <= 390;
    const isCompactMobile = width <= 430;
    const isTablet = width >= breakpoints.tabletMin && width < breakpoints.desktopMin;
    const isDesktop = width >= breakpoints.desktopMin;
    const isWide = width >= breakpoints.wideMin;
    const columns = isWide ? 4 : isDesktop ? 3 : isTablet ? 2 : 1;
    const contentMaxWidth = isWide ? 1320 : isDesktop ? 1200 : isTablet ? 960 : width;
    const screenPadding = isWide ? 40 : isDesktop ? 32 : isTablet ? 24 : isSmallMobile ? 16 : 20;

    return {
      width,
      height,
      isMobile,
      isSmallMobile,
      isCompactMobile,
      isTablet,
      isDesktop,
      isWide,
      columns,
      contentMaxWidth,
      screenPadding
    };
  }, [height, width]);
}
