import type { Config } from "tailwindcss";

/**
 * Brand palette lives here AND as CSS variables in globals.css.
 * Re-skin the shop by editing the CSS variables — these tokens read from them.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-deep": "rgb(var(--accent-deep) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        "gold-bright": "rgb(var(--gold-bright) / <alpha-value>)",
        cream: "rgb(var(--cream) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Bodoni Moda", "Didot", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 3.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
