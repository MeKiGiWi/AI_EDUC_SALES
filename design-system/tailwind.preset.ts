import type { Config } from "tailwindcss";

const greenIntelligencePreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        vc: {
          canvas: "#F7FBF8",
          warm: "#FCFEFC",
          surface: "#FFFFFF",
          ink: "#102114",
          ink2: "#18301E",
          body: "#4E6556",
          muted: "#6C8273",
          faint: "#9FB2A5",
          ghost: "#C8D8CD",
          border: "#D8E6DD",
          borderSoft: "#EAF3ED",
          primary: "#2F8F5B",
          primaryDeep: "#1E6E43",
          primarySoft: "#78C69A",
          primaryPale: "#D8F1E0",
          mint: "#BFE9D1",
          success: "#2FA36B",
          warning: "#D5A24D"
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
        "vc-soft": "0 24px 80px rgba(33, 66, 45, 0.10)",
        "vc-card": "0 32px 90px rgba(26, 54, 37, 0.12)",
        "vc-glow": "0 0 60px rgba(47, 143, 91, 0.24)"
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
        "vc-primary-glow": "radial-gradient(circle, rgba(47,143,91,0.28) 0%, rgba(120,198,154,0.16) 36%, rgba(247,251,248,0) 72%)",
        "vc-card-fade": "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.74))",
        "vc-line-fade": "linear-gradient(90deg, rgba(47,143,91,0), rgba(47,143,91,0.28), rgba(47,143,91,0))"
      },
      transitionTimingFunction: {
        vc: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  }
};

export default greenIntelligencePreset;
