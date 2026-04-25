import type { Config } from "tailwindcss";
import etherealAiLightPreset from "./design-system/tailwind.preset";

const config: Config = {
  presets: [etherealAiLightPreset],
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
