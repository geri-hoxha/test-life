import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          soft: "hsl(var(--accent-soft))",
          "soft-foreground": "hsl(var(--accent-soft-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        topbar: {
          DEFAULT: "hsl(var(--topbar))",
          foreground: "hsl(var(--topbar-foreground))",
          muted: "hsl(var(--topbar-muted))",
          border: "hsl(var(--topbar-border))",
          hover: "hsl(var(--topbar-hover))",
        },
      },
      backgroundImage: {
        'gradient-topbar': 'var(--gradient-topbar)',
        'gradient-accent': 'var(--gradient-accent)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(4px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "loader-spin": { to: { transform: "rotate(360deg)" } },
        "loader-dash": {
          "0%": { "stroke-dasharray": "1 200", "stroke-dashoffset": "0" },
          "50%": { "stroke-dasharray": "90 200", "stroke-dashoffset": "-20" },
          "100%": { "stroke-dasharray": "90 200", "stroke-dashoffset": "-138" },
        },
        "loader-bar": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(250%)" },
        },
        "loader-sheen": {
          "0%, 55%": { transform: "translateX(-150%) skewX(-12deg)" },
          "100%": { transform: "translateX(250%) skewX(-12deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "loader-orbit": "loader-spin 1.8s linear infinite",
        "loader-dash": "loader-dash 1.5s ease-in-out infinite",
        "loader-bar": "loader-bar 1.4s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        "loader-sheen": "loader-sheen 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
