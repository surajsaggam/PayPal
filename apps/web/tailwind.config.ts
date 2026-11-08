import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        payops: {
          canvas: "var(--payops-bg-canvas)",
          surface: "var(--payops-bg-surface)",
          elevated: "var(--payops-bg-elevated)",
          admiral: "var(--payops-brand-admiral)",
          sky: "var(--payops-brand-sky)",
          pyusd: "var(--payops-brand-pyusd)",
          allow: "var(--payops-status-allow)",
          hold: "var(--payops-status-hold)",
          deny: "var(--payops-status-deny)",
          primary: "var(--payops-text-primary)",
          secondary: "var(--payops-text-secondary)",
          border: "var(--payops-border-subtle)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
        indic: ["var(--font-indic)", "Noto Sans Devanagari", "Noto Sans", "sans-serif"],
      },
      transitionTimingFunction: {
        "spring-snappy": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
