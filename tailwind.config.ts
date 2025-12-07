import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        
        feature: {
          ramp: "#ef4444",
          elevator: "#3b82f6",
          accessibleRestroom: "#10b981",
          parking: "#f97316",
          restroom: "#8b5cf6",
          bench: "#eab308",
        },
        m3: {
          primary: {
            DEFAULT: "hsl(var(--m3-primary))",
            container: "hsl(var(--m3-primary-container))",
            on: "hsl(var(--m3-on-primary))",
            "on-container": "hsl(var(--m3-on-primary-container))",
            hover: "hsl(var(--m3-primary-hover))",
            pressed: "hsl(var(--m3-primary-pressed))",
          },
          secondary: {
            DEFAULT: "hsl(var(--m3-secondary))",
            container: "hsl(var(--m3-secondary-container))",
            on: "hsl(var(--m3-on-secondary))",
            "on-container": "hsl(var(--m3-on-secondary-container))",
            hover: "hsl(var(--m3-secondary-hover))",
            pressed: "hsl(var(--m3-secondary-pressed))",
          },
          tertiary: {
            DEFAULT: "hsl(var(--m3-tertiary))",
            container: "hsl(var(--m3-tertiary-container))",
            on: "hsl(var(--m3-on-tertiary))",
            "on-container": "hsl(var(--m3-on-tertiary-container))",
            hover: "hsl(var(--m3-tertiary-hover))",
            pressed: "hsl(var(--m3-tertiary-pressed))",
          },
          error: {
            DEFAULT: "hsl(var(--m3-error))",
            container: "hsl(var(--m3-error-container))",
            on: "hsl(var(--m3-on-error))",
            "on-container": "hsl(var(--m3-on-error-container))",
            hover: "hsl(var(--m3-error-hover))",
            pressed: "hsl(var(--m3-error-pressed))",
          },
          surface: {
            DEFAULT: "hsl(var(--m3-surface))",
            variant: "hsl(var(--m3-surface-variant))",
            dim: "hsl(var(--m3-surface-dim))",
            bright: "hsl(var(--m3-surface-bright))",
            on: "hsl(var(--m3-on-surface))",
            "on-variant": "hsl(var(--m3-on-surface-variant))",
          },
          outline: {
            DEFAULT: "hsl(var(--m3-outline))",
            variant: "hsl(var(--m3-outline-variant))",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
