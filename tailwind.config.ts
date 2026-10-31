import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Gathbandhan brand palette
        ivory: {
          50: "#FFFEF9",
          100: "#FDFBF0",
          200: "#FAF5E1",
          300: "#F5EDD0",
          400: "#EDE2B8",
          500: "#E5D7A0",
          DEFAULT: "#FDFBF0",
        },
        charcoal: {
          50: "#F5F5F5",
          100: "#E5E5E5",
          200: "#CCCCCC",
          300: "#999999",
          400: "#666666",
          500: "#444444",
          600: "#333333",
          700: "#2A2A2A",
          800: "#1F1F1F",
          900: "#141414",
          DEFAULT: "#2A2A2A",
        },
        gold: {
          50: "#FBF8F0",
          100: "#F5EDD5",
          200: "#EBDAAB",
          300: "#D4BC78",
          400: "#C5A855",
          500: "#B8963F",
          600: "#A07B2E",
          light: "#E8D48B",
          dark: "#A07D2B",
          DEFAULT: "#C5A855",
        },
        maroon: {
          DEFAULT: "#6B1D2A",
          deep: "#4A0E1C",
          light: "#8B3040",
        },
        cream: "#F5EDE0",
        blush: "#F5E6E0",
        sage: "#A8B5A0",
        rose: "#D4A0A0",
        "warm-gray": {
          DEFAULT: "#8B8178",
          light: "#B8AFA6",
        },
        "soft-white": "#FFFFFF",
        // Semantic status colors
        status: {
          success: "#2D8A4E",
          "success-light": "#ECFDF3",
          warning: "#D4860A",
          "warning-light": "#FFF8EB",
          critical: "#C4342D",
          "critical-light": "#FEF2F2",
          info: "#2563EB",
          "info-light": "#EFF6FF",
        },
        // shadcn/ui compatible tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        heading: ["var(--font-display)", "Playfair Display", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

