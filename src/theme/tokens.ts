export const colors = {
  canvas: "#F7FBF8",
  canvasWarm: "#FCFEFC",
  surface: "#FFFFFF",
  surfaceMuted: "#F4FBF6",
  surfaceMint: "#EEF8F1",
  ink: "#102114",
  inkSoft: "#18301E",
  body: "#4E6556",
  muted: "#6C8273",
  faint: "#9FB2A5",
  border: "#D8E6DD",
  borderSoft: "#EAF3ED",
  primary: "#2F8F5B",
  primaryDeep: "#1E6E43",
  primarySoft: "#78C69A",
  primaryPale: "#D8F1E0",
  accent: "#2FA36B",
  mintGlow: "#BFE9D1",
  success: "#2FA36B",
  warning: "#D5A24D",
  danger: "#C85C4A",
  overlay: "rgba(16, 33, 20, 0.12)",
  overlayStrong: "rgba(16, 33, 20, 0.22)",
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  section: 40,
  screenHorizontal: 20,
  screenTop: 24,
  screenBottom: 32,
} as const;

export const radius = {
  xs: 10,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 30,
  xxl: 36,
  pill: 999,
} as const;

export const typography = {
  fontFamilySans: "Inter",
  fontFamilyDisplay: "Geist",
  fontFamilyMono: "JetBrains Mono",
  sizes: {
    caption: 12,
    bodySmall: 14,
    body: 16,
    bodyLarge: 18,
    titleSmall: 20,
    title: 24,
    heading: 30,
    hero: 40,
  },
  lineHeights: {
    caption: 16,
    bodySmall: 20,
    body: 24,
    bodyLarge: 28,
    titleSmall: 26,
    title: 32,
    heading: 38,
    hero: 46,
  },
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    heavy: "800",
  },
  tracking: {
    eyebrow: 2.4,
    tight: -0.6,
    hero: -1.2,
  },
} as const;

export const shadows = {
  soft: {
    shadowColor: "#21422D",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  card: {
    shadowColor: "#1A3625",
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  glow: {
    shadowColor: "#2F8F5B",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
} as const;

export const elevation = {
  base: 2,
  raised: 4,
  floating: 6,
  overlay: 8,
} as const;

export const semantic = {
  background: colors.canvas,
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
  glow: colors.mintGlow,
} as const;

export const themeTokens = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
  elevation,
  semantic,
} as const;

export type ThemeTokens = typeof themeTokens;
