import tailwindcssAnimate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#07274c",
          50: "#eef3f9",
          100: "#d6e2ee",
          200: "#adc5dd",
          300: "#7fa2c8",
          400: "#4c78a8",
          500: "#2b578a",
          600: "#1a4270",
          700: "#123256",
          800: "#0c243e",
          900: "#07274c",
          950: "#04162c",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#fef9cd",
          soft: "#faf79d",
          foreground: "#07274c",
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "#15803d",
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#b45309",
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "flash-green": {
          "0%": { backgroundColor: "rgba(21,128,61,0)" },
          "15%": { backgroundColor: "rgba(21,128,61,0.97)" },
          "100%": { backgroundColor: "rgba(21,128,61,0.97)" },
        },
        "flash-red": {
          "0%": { backgroundColor: "rgba(185,28,28,0)" },
          "15%": { backgroundColor: "rgba(185,28,28,0.97)" },
          "100%": { backgroundColor: "rgba(185,28,28,0.97)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.2, 0.6, 0.4, 1) infinite",
        "flash-green": "flash-green 0.15s ease-out forwards",
        "flash-red": "flash-red 0.15s ease-out forwards",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
