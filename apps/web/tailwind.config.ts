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
        canvas: "var(--bg-canvas)",
        surface: "var(--bg-surface)",
        elevated: "var(--bg-elevated)",
        subtle: "var(--bg-subtle)",
        contrast: "var(--bg-contrast)",

        ink: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
          inverse: "var(--text-inverse)",
        },

        hairline: "var(--border-hairline)",
        "border-subtle": "var(--border-subtle)",
        "border-strong": "var(--border-strong)",

        accent: {
          brand: "var(--accent-brand)",
          lime: {
            DEFAULT: "var(--accent-lime-bg)",
            border: "var(--accent-lime-border)",
            ink: "var(--accent-lime-text)",
          },
          mint: {
            DEFAULT: "var(--accent-mint-bg)",
            hover: "var(--accent-mint-hover)",
            border: "var(--accent-mint-border)",
            ink: "var(--accent-mint-text)",
          },
          dark: {
            DEFAULT: "var(--accent-dark-bg)",
            hover: "var(--accent-dark-hover)",
            ink: "var(--accent-dark-text)",
          },
        },

        status: {
          success: {
            bg: "var(--status-success-bg)",
            text: "var(--status-success-text)",
            border: "var(--status-success-border)",
            bar: "var(--status-success-bar)",
          },
          warning: {
            bg: "var(--status-warning-bg)",
            text: "var(--status-warning-text)",
            border: "var(--status-warning-border)",
            bar: "var(--status-warning-bar)",
          },
          danger: {
            bg: "var(--status-danger-bg)",
            text: "var(--status-danger-text)",
            border: "var(--status-danger-border)",
            bar: "var(--status-danger-bar)",
          },
          info: {
            bg: "var(--status-info-bg)",
            text: "var(--status-info-text)",
            border: "var(--status-info-border)",
            bar: "var(--status-info-bar)",
          },
        },

        chart: {
          invoiced: "var(--chart-invoiced)",
          early: "var(--chart-early)",
          dunning: "var(--chart-dunning)",
          disputes: "var(--chart-disputes)",
        },

        paypal: {
          blue: "#003087",
          sky: "#0070ba",
          gold: "#ffc439",
          dark: "#0f172a",
          card: "#f8fafc",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "var(--font-jetbrains-mono)",
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        xs: "var(--shadow-xs)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        popover: "var(--shadow-popover)",
        glass: "var(--shadow-glass)",
        "row-active": "var(--shadow-row-active)",
      },
      transitionTimingFunction: {
        spring: "var(--ease-spring)",
        "spring-snappy": "var(--ease-spring-snappy)",
      },
    },
  },
  plugins: [],
};

export default config;
