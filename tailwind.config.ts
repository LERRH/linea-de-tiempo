import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#005B73",
          primaryDark: "#00475C",
          accent: "#00B5A6",
          accentDark: "#009488",
          coral: "#FF8A65",
          coralDark: "#F5754D",
          cream: "#F4E3C3",
          surface: "#F5F5F5",
          ink: "#2E2E2E",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  // `.container` is defined by the RutaPRO design system in globals.css.
  corePlugins: { container: false },
  plugins: [],
};

export default config;
