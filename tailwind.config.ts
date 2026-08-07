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
        // FR8X-CON Dark Theme — Strict 4-Color Palette
        brand: {
          50: "#2A3038",
          100: "#2A3038",
          200: "#252B33",
          300: "#252B33",
          400: "#20252B",
          500: "#20252B",
          600: "#1E2329",
          700: "#1E2329",
          800: "#1E2329",
          900: "#1E2329",
          950: "#1E2329",
        },
        // FR8X Theme Colors — Dark Palette
        fr8x: {
          bg: "#1E2329",       // Deep Charcoal (Main Background)
          panel: "#252B33",    // Dark Slate (Secondary Panels)
          nav: "#20252B",      // Graphite (Navigation)
          grid: "#2A3038",     // Dark Grey (Grid / Table)
          mist: "#2A3038",
          lavender: "#2A3038",
          periwinkle: "#0EA5E9",
          frozen: "#1E2329",
          jet: "#E2E8F0",      // Primary Text
          dimgrey: "#94A3B8",  // Muted Text
          charcoal: "#E2E8F0",
          accent: "#0EA5E9",
          "accent-hover": "#0284C7",
          border: "#333B44",
          text: "#E2E8F0",
          "text-muted": "#94A3B8",
          "text-label": "#CBD5E1",
        },
        // Semantic colors
        primary: {
          DEFAULT: "#0EA5E9",
          foreground: "#FFFFFF",
          hover: "#0284C7",
          muted: "#2A3038",
        },
        background: {
          DEFAULT: "#1E2329",
          card: "#252B33",
          sidebar: "#20252B",
          elevated: "#2A3038",
        },
        foreground: {
          DEFAULT: "#E2E8F0",
          secondary: "#94A3B8",
          muted: "#94A3B8",
          inverse: "#1E2329",
        },
        border: {
          DEFAULT: "#333B44",
          strong: "#4A5568",
          focus: "#0EA5E9",
        },
        success: {
          DEFAULT: "#22C55E",
          light: "rgba(34, 197, 94, 0.15)",
          dark: "#16A34A",
        },
        warning: {
          DEFAULT: "#EAB308",
          light: "rgba(234, 179, 8, 0.15)",
          dark: "#CA8A04",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "rgba(239, 68, 68, 0.15)",
          dark: "#DC2626",
        },
        // ShadCN CSS variable mappings
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
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
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        // ── FONT SIZES (All using Normal Font Weight 400) ──
        heading: ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        "heading-main": ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        "heading-sub": ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        "heading-lg": ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        "heading-md": ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        "heading-sm": ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        "display-xl": ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        "display-lg": ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        "display-md": ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        "display-sm": ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        "3xl": ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        "2xl": ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        xl: ["14px", { lineHeight: "1.3", fontWeight: "400" }],
        lg: ["14px", { lineHeight: "1.3", fontWeight: "400" }],

        body: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        "body-lg": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        "body-md": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        base: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        md: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        sm: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        button: ["12px", { lineHeight: "1.2", fontWeight: "400" }],
        table: ["12px", { lineHeight: "1.4", fontWeight: "400" }],
        nav: ["12px", { lineHeight: "1.4", fontWeight: "400" }],

        helper: ["10px", { lineHeight: "1.3", fontWeight: "400" }],
        small: ["10px", { lineHeight: "1.3", fontWeight: "400" }],
        caption: ["10px", { lineHeight: "1.3", fontWeight: "400" }],
        xs: ["10px", { lineHeight: "1.3", fontWeight: "400" }],
        "2xs": ["10px", { lineHeight: "1.3", fontWeight: "400" }],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.2)",
        "card-hover":
          "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)",
        elevated:
          "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)",
        sidebar:
          "2px 0 8px -2px rgba(0, 0, 0, 0.3)",
        dropdown:
          "0 10px 20px -5px rgba(0, 0, 0, 0.4), 0 4px 8px -4px rgba(0, 0, 0, 0.3)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 1px)",
        sm: "calc(var(--radius) - 2px)",
      },
      spacing: {
        "sidebar-width": "200px",
        "sidebar-collapsed": "56px",
        "topnav-height": "48px",
        "ticker-height": "28px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "ticker-scroll": "tickerScroll 30s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        tickerScroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
