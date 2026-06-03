// Landing-aligned palette (navy + lime). Mirrors LandingScreen colors so the
// app chrome (sidebar, tabs, header) and reports share the landing look.
export const colors = {
  canvas: "#F6F8FF",
  canvasWarm: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceMuted: "#EEF2FF",
  surfaceMint: "#EEF2FF",
  ink: "#121A68",
  inkSoft: "#1F2559",
  body: "#60688D",
  muted: "#8B93B8",
  faint: "#9AA3C9",
  border: "#DFE3F2",
  borderSoft: "#EEF1FA",
  primary: "#121A68",
  primaryDeep: "#0D1450",
  primarySoft: "#B8FF43",
  primaryPale: "#DBE6F7",
  accent: "#9CF000",
  mintGlow: "#D6F5A8",
  success: "#5BBF2E",
  warning: "#C8951F",
  danger: "#C84242",
  info: "#121A68",
  overlay: "rgba(18, 26, 104, 0.18)",
  overlayStrong: "rgba(18, 26, 104, 0.3)"
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  screenHorizontal: 20,
  screenTop: 18,
  screenBottom: 28,
  section: 28
} as const;

export const radius = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 30,
  xxl: 36,
  pill: 999
} as const;

export const typography = {
  fontFamilySans: "System",
  fontFamilyDisplay: "System",
  fontFamilyMono: "Courier",
  sizes: {
    caption: 12,
    bodySmall: 14,
    body: 16,
    bodyLarge: 18,
    titleSmall: 20,
    title: 24,
    heading: 30,
    hero: 38
  },
  lineHeights: {
    caption: 16,
    bodySmall: 20,
    body: 24,
    bodyLarge: 28,
    titleSmall: 26,
    title: 32,
    heading: 38,
    hero: 44
  },
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    heavy: "800"
  },
  tracking: {
    eyebrow: 2.4,
    tight: -0.4,
    hero: -1
  }
} as const;

export const shadows = {
  soft: {
    shadowColor: "#121A68",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  card: {
    shadowColor: "#121A68",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6
  },
  glow: {
    shadowColor: "#121A68",
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3
  }
} as const;

export const elevation = {
  base: 2,
  raised: 4,
  floating: 6,
  overlay: 8
} as const;

export const semantic = {
  background: colors.canvas,
  backgroundWarm: colors.canvasWarm,
  screen: colors.canvasWarm,
  card: colors.surface,
  cardSubtle: colors.surfaceMuted,
  cardAccent: colors.surfaceMint,
  textPrimary: colors.ink,
  textSecondary: colors.body,
  textMuted: colors.muted,
  border: colors.border,
  borderSubtle: colors.borderSoft,
  actionPrimary: colors.primary,
  actionPrimaryPressed: colors.primaryDeep,
  actionSecondary: colors.primaryPale,
  actionSecondaryText: colors.primaryDeep,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  glow: colors.mintGlow
} as const;

export const themeTokens = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  elevation,
  semantic
} as const;

export type ThemeTokens = typeof themeTokens;
