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
        // FR8X-CON Brand Palette
        brand: {
          50: "#EBF8FF",
          100: "#D1EEFC",
          200: "#A7D8F0",
          300: "#7CC1E4",
          400: "#56C5F0",
          500: "#3ABFF0",
          600: "#2B9ED6",
          700: "#1E7BB0",
          800: "#15608A",
          900: "#0D4664",
          950: "#072D42",
        },
        // FR8X-9 Page 13 Theme Colors
        fr8x: {
          bg: "#F7F7FF",
          charcoal: "#535657",
          lavender: "#E5D9F2",
          periwinkle: "#A594F9",
          mist: "#EDE6F2",
          dimgrey: "#746D75",
          jet: "#253031",
          frozen: "#C5E7E2",
        },
        // Semantic colors
        primary: {
          DEFAULT: "#56C5F0",
          foreground: "#FFFFFF",
          hover: "#3ABFF0",
          muted: "#EBF8FF",
        },
        background: {
          DEFAULT: "#F8FAFC",
          card: "#FFFFFF",
          sidebar: "#FFFFFF",
          elevated: "#FFFFFF",
        },
        foreground: {
          DEFAULT: "#1E293B",
          secondary: "#64748B",
          muted: "#94A3B8",
          inverse: "#FFFFFF",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
          focus: "#56C5F0",
        },
        success: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
          dark: "#065F46",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          dark: "#92400E",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
          dark: "#991B1B",
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
        // ── 3 STRICT FONT SIZES FOR ENTIRE WEB APPLICATION ──
        // 1. Heading: 12px font size
        heading: ["12px", { lineHeight: "1.3", fontWeight: "600" }],
        "heading-lg": ["12px", { lineHeight: "1.3", fontWeight: "700" }],
        "heading-md": ["12px", { lineHeight: "1.3", fontWeight: "600" }],
        "heading-sm": ["12px", { lineHeight: "1.3", fontWeight: "600" }],
        "display-xl": ["12px", { lineHeight: "1.3", fontWeight: "700" }],
        "display-lg": ["12px", { lineHeight: "1.3", fontWeight: "700" }],
        "display-md": ["12px", { lineHeight: "1.3", fontWeight: "600" }],
        "display-sm": ["12px", { lineHeight: "1.3", fontWeight: "600" }],
        "3xl": ["12px", { lineHeight: "1.3" }],
        "2xl": ["12px", { lineHeight: "1.3" }],
        xl: ["12px", { lineHeight: "1.3" }],
        lg: ["12px", { lineHeight: "1.3" }],

        // 2. Body: 10px font size
        body: ["10px", { lineHeight: "1.4", fontWeight: "400" }],
        "body-lg": ["10px", { lineHeight: "1.4", fontWeight: "500" }],
        "body-md": ["10px", { lineHeight: "1.4", fontWeight: "400" }],
        "body-sm": ["10px", { lineHeight: "1.4", fontWeight: "400" }],
        base: ["10px", { lineHeight: "1.4", fontWeight: "400" }],
        md: ["10px", { lineHeight: "1.4", fontWeight: "400" }],
        sm: ["10px", { lineHeight: "1.4", fontWeight: "400" }],

        // 3. Small: 8px font size
        small: ["8px", { lineHeight: "1.3", fontWeight: "400" }],
        caption: ["8px", { lineHeight: "1.3", fontWeight: "400" }],
        xs: ["8px", { lineHeight: "1.3", fontWeight: "400" }],
        "2xs": ["8px", { lineHeight: "1.3", fontWeight: "400" }],
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
