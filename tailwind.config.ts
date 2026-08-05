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
        // FR8X-CON Brand Palette (Mapped to 2-Color UI/UX + Jet Black & Dark Grey)
        brand: {
          50: "#F7F7FF",
          100: "#F7F7FF",
          200: "#EDE6F2",
          300: "#EDE6F2",
          400: "#EDE6F2",
          500: "#EDE6F2",
          600: "#EDE6F2",
          700: "#EDE6F2",
          800: "#253031",
          900: "#253031",
          950: "#253031",
        },
        // FR8X Theme Colors
        fr8x: {
          bg: "#F7F7FF",       // Ghost White (Background)
          mist: "#EDE6F2",     // Lavender Mist (Active Button Background)
          lavender: "#EDE6F2",
          periwinkle: "#EDE6F2",
          frozen: "#F7F7FF",
          jet: "#253031",      // Jet Black Text
          dimgrey: "#746D75",  // Dark Grey Text
          charcoal: "#253031",
        },
        // Semantic colors
        primary: {
          DEFAULT: "#EDE6F2",
          foreground: "#253031",
          hover: "#EDE6F2",
          muted: "#F7F7FF",
        },
        background: {
          DEFAULT: "#F7F7FF",
          card: "#F7F7FF",
          sidebar: "#F7F7FF",
          elevated: "#F7F7FF",
        },
        foreground: {
          DEFAULT: "#253031",
          secondary: "#746D75",
          muted: "#746D75",
          inverse: "#F7F7FF",
        },
        border: {
          DEFAULT: "#EDE6F2",
          strong: "#746D75",
          focus: "#EDE6F2",
        },
        success: {
          DEFAULT: "#EDE6F2",
          light: "#F7F7FF",
          dark: "#253031",
        },
        warning: {
          DEFAULT: "#EDE6F2",
          light: "#F7F7FF",
          dark: "#253031",
        },
        danger: {
          DEFAULT: "#EDE6F2",
          light: "#F7F7FF",
          dark: "#253031",
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
          "Eurostile",
          "Microgramma",
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
        // 1. Heading text: 14px font size
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

        // 2. Body text: 12px font size
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

        // 3. General / Helper / Small text: 10px font size
        helper: ["10px", { lineHeight: "1.3", fontWeight: "400" }],
        small: ["10px", { lineHeight: "1.3", fontWeight: "400" }],
        caption: ["10px", { lineHeight: "1.3", fontWeight: "400" }],
        xs: ["10px", { lineHeight: "1.3", fontWeight: "400" }],
        "2xs": ["10px", { lineHeight: "1.3", fontWeight: "400" }],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        "card-hover":
          "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        elevated:
          "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        sidebar:
          "2px 0 8px -2px rgba(0, 0, 0, 0.06)",
        dropdown:
          "0 10px 20px -5px rgba(0, 0, 0, 0.1), 0 4px 8px -4px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
