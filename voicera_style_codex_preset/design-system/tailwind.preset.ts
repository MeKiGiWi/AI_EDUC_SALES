import type { Config } from "tailwindcss";

const etherealAiLightPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        vc: {
          canvas: "#FBFCFF",
          warm: "#FDFDFB",
          surface: "#FFFFFF",
          ink: "#111227",
          ink2: "#1C1E35",
          body: "#4F536C",
          muted: "#6F7389",
          faint: "#A8ABB7",
          ghost: "#C8CDD8",
          border: "#DDE6F5",
          borderSoft: "#EBF0FA",
          blue: "#478BFF",
          blueDeep: "#2F65FF",
          blueSoft: "#8AB6FF",
          bluePale: "#CFE2FF",
          lilac: "#D7C9FF",
          success: "#42C99B",
          warning: "#F4B75B"
        }
      },
      fontFamily: {
        sans: ["Inter", "Geist", "Satoshi", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "Geist", "Satoshi", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Consolas", "monospace"]
      },
      borderRadius: {
        vc: "32px",
        "vc-lg": "40px",
        pill: "999px"
      },
      boxShadow: {
        "vc-soft": "0 24px 80px rgba(50, 72, 120, 0.10)",
        "vc-card": "0 32px 90px rgba(39, 61, 103, 0.12)",
        "vc-glow": "0 0 60px rgba(71, 139, 255, 0.28)"
      },
      letterSpacing: {
        hero: "-0.06em",
        tightish: "-0.04em",
        eyebrow: "0.26em"
      },
      lineHeight: {
        hero: "0.94",
        display: "0.98"
      },
      spacing: {
        section: "clamp(104px, 14vw, 184px)",
        "section-tight": "clamp(72px, 10vw, 128px)",
        gutter: "clamp(20px, 4vw, 64px)"
      },
      backgroundImage: {
        "vc-blue-glow": "radial-gradient(circle, rgba(71,139,255,0.34) 0%, rgba(120,164,255,0.16) 36%, rgba(251,252,255,0) 72%)",
        "vc-card-fade": "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.74))",
        "vc-line-fade": "linear-gradient(90deg, rgba(71,139,255,0), rgba(71,139,255,0.34), rgba(71,139,255,0))"
      },
      transitionTimingFunction: {
        vc: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  }
};

export default etherealAiLightPreset;
