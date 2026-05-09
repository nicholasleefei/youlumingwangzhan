/* ============================================
   DESIGN SYSTEM - Professional Auto Export UI
   Main palette: Deep Starry Blue + Ocean Blue
   Refined for B2B International Trade
   ============================================ */

// ========== Color Palette - Light Studio Theme ==========
export const COLORS = {
  // Primary colors
  primaryDark: '#f7f7f8',
  primaryBlue: '#ffffff',
  primaryBlueDeep: '#f2f2f4',
  primaryAccent: '#ff7e00',
  primaryAccentLight: '#ffb25a',
  primaryAccentGlow: 'rgba(255, 126, 0, 0.35)',
  
  // Secondary colors
  secondary: '#f0f0f2',
  
  // Accent colors
  accentGreen: '#ff7e00',
  accentGreenDark: '#e66f00',
  accentGreenGlow: 'rgba(255, 126, 0, 0.35)',
  
  // Text colors
  textPrimary: 'rgba(16, 16, 18, 0.92)',
  textSecondary: 'rgba(16, 16, 18, 0.72)',
  textTertiary: 'rgba(16, 16, 18, 0.55)',
  textMuted: 'rgba(16, 16, 18, 0.38)',
  
  // Background colors
  bgPrimary: 'linear-gradient(135deg, #f7f7f8 0%, #ffffff 100%)',
  bgSecondary: 'linear-gradient(135deg, #f2f2f4 0%, #ffffff 100%)',
  bgCard: 'rgba(0, 0, 0, 0.03)',
  bgCardHover: 'rgba(0, 0, 0, 0.05)',
  bgTertiary: 'rgba(0, 0, 0, 0.02)',
  bgGlass: 'rgba(255, 255, 255, 0.68)',
  
  // Border colors
  border: 'rgba(0, 0, 0, 0.10)',
  borderAccent: 'rgba(255, 126, 0, 0.4)',
  borderHover: 'rgba(255, 126, 0, 0.65)',
  
  // Shadow & Glow
  shadow: 'rgba(0, 0, 0, 0.10)',
  shadowHover: 'rgba(255, 126, 0, 0.25)',
  glowBlue: '0 0 30px var(--color-primary-accent-glow)',
  glowGreen: '0 0 30px var(--color-accent-green-glow)',
};

// ========== Typography Scale ==========
export const TYPOGRAPHY = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
  fontWeights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
};

// ========== Spacing System ==========
export const SPACING = {
  xs: '0.5rem',
  sm: '1rem',
  md: '1.5rem',
  lg: '2rem',
  xl: '3rem',
  '2xl': '4.5rem',
  '3xl': '7rem',
  '4xl': '9rem',
};

// ========== Border Radius ==========
export const RADIUS = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
  full: '9999px',
};

// ========== Shadows & Glows ==========
export const SHADOWS = {
  sm: '0 2px 8px 0 var(--color-shadow)',
  md: '0 8px 24px -4px var(--color-shadow), 0 4px 12px -6px var(--color-shadow)',
  lg: '0 16px 48px -12px var(--color-shadow), 0 8px 24px -16px var(--color-shadow)',
  xl: '0 32px 64px -20px var(--color-shadow), 0 16px 32px -24px var(--color-shadow)',
  outline: '0 0 0 3px rgba(255, 126, 0, 0.15)',
  glowCard: '0 0 0 1px var(--color-border), 0 8px 40px -12px var(--color-shadow)',
  glowCardHover: '0 0 0 1px var(--color-border-accent), 0 12px 60px -16px var(--color-shadow-hover)',
};

// ========== Transitions ==========
export const TRANSITIONS = {
  fast: '180ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '280ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '400ms cubic-bezier(0.4, 0, 0.2, 1)',
};

// ========== Animation Keyframes ==========
export const ANIMATIONS = {
  fadeInUp: `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(32px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  twinkle: `
    @keyframes twinkle {
      0%, 100% {
        opacity: 0.25;
      }
      50% {
        opacity: 0.8;
      }
    }
  `,
  float: `
    @keyframes float-slow {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }
  `,
};
