import type { Config } from "tailwindcss";
import greenIntelligencePreset from "./design-system/tailwind.preset";

const config: Config = {
  presets: [greenIntelligencePreset],
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
