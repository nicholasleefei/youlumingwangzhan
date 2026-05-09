/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // ========== Color Palette - Light Studio Theme ==========
        primary: {
          dark: "#f7f7f8",
          blue: "#ffffff",
          blueDeep: "#f2f2f4",
          accent: "#ff7e00",
          accentLight: "#ffb25a",
          accentGlow: "rgba(255, 126, 0, 0.35)",
        },
        secondary: "#f0f0f2",
        accent: {
          green: "#ff7e00",
          greenDark: "#e66f00",
          greenGlow: "rgba(255, 126, 0, 0.35)",
        },
        text: {
          primary: "rgba(16, 16, 18, 0.92)",
          secondary: "rgba(16, 16, 18, 0.72)",
          tertiary: "rgba(16, 16, 18, 0.55)",
          muted: "rgba(16, 16, 18, 0.38)",
        },
        bg: {
          primary: "linear-gradient(135deg, #f7f7f8 0%, #ffffff 100%)",
          secondary: "linear-gradient(135deg, #f2f2f4 0%, #ffffff 100%)",
          card: "rgba(0, 0, 0, 0.03)",
          cardHover: "rgba(0, 0, 0, 0.05)",
          tertiary: "rgba(0, 0, 0, 0.02)",
          glass: "rgba(255, 255, 255, 0.68)",
        },
        border: {
          default: "rgba(0, 0, 0, 0.10)",
          accent: "rgba(255, 126, 0, 0.4)",
          hover: "rgba(255, 126, 0, 0.65)",
        },
        shadow: {
          default: "rgba(0, 0, 0, 0.10)",
          hover: "rgba(255, 126, 0, 0.25)",
        },
      },
      fontFamily: {
        inter: ['"Inter"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "Oxygen", "Ubuntu", "sans-serif"],
      },
      fontSize: {
        // Section Block Title (H2)
        "section-title": "2.75rem",
        "section-title-mobile": "2rem",
        // Hero Title
        "hero-title": "3.5rem",
        "hero-title-mobile": "2.5rem",
      },
      spacing: {
        "xs": "0.5rem",
        "sm": "1rem",
        "md": "1.5rem",
        "lg": "2rem",
        "xl": "3rem",
        "2xl": "4.5rem",
        "3xl": "7rem",
        "4xl": "9rem",
      },
      borderRadius: {
        "sm": "0.5rem",
        "md": "0.75rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "full": "9999px",
      },
      boxShadow: {
        "sm": "0 2px 8px 0 var(--tw-shadow-color)",
        "md": "0 8px 24px -4px var(--tw-shadow-color), 0 4px 12px -6px var(--tw-shadow-color)",
        "lg": "0 16px 48px -12px var(--tw-shadow-color), 0 8px 24px -16px var(--tw-shadow-color)",
        "xl": "0 32px 64px -20px var(--tw-shadow-color), 0 16px 32px -24px var(--tw-shadow-color)",
        "outline": "0 0 0 3px rgba(255, 126, 0, 0.15)",
        "glow-card": "0 0 0 1px var(--tw-border-color), 0 8px 40px -12px var(--tw-shadow-color)",
        "glow-card-hover": "0 0 0 1px var(--tw-border-color-accent), 0 12px 60px -16px var(--tw-shadow-color-hover)",
      },
      transitionDuration: {
        "fast": "180ms",
        "base": "280ms",
        "slow": "400ms",
      },
      transitionTimingFunction: {
        "custom": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease-out forwards",
        "twinkle": "twinkle 3s ease-in-out infinite",
        "float-slow": "float-slow 12s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "slide-in-right": "slideInRight 0.5s ease-out forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(32px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "0.8" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px var(--color-primary-accent-glow)" },
          "50%": { boxShadow: "0 0 40px var(--color-primary-accent-glow), 0 0 60px var(--color-primary-accent-glow)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(30px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
