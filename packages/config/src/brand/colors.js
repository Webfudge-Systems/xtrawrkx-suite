// ============================================
// WEBFUDGE PLATFORM - OFFICIAL BRAND COLORS
// Based on Brand Guidelines
// ============================================

/**
 * Brand Color System
 * 
 * Primary Colors:
 * - Orange: #F5630F (RGB 245, 99, 15)
 * - Dark: #1A1A1A (RGB 26, 26, 26)
 * - Light: #FFFAF7 (RGB 255, 250, 247)
 */

const brandColors = {
  // Primary Brand Colors
  primary: '#F5630F',      // Brand Orange
  dark: '#1A1A1A',         // Brand Dark
  light: '#FFFAF7',        // Brand Light
  white: '#FFFFFF',        // Pure White
  
  // Extended Palette
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#F5630F',        // PRIMARY
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  
  yellow: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },
  
  dark: {
    50: '#f8f8f8',
    100: '#e8e8e8',
    200: '#d1d1d1',
    300: '#b0b0b0',
    400: '#888888',
    500: '#6d6d6d',
    600: '#4d4d4d',
    700: '#333333',
    800: '#262626',
    900: '#1A1A1A',        // PRIMARY DARK
  },
  
  light: {
    50: '#FFFAF7',         // PRIMARY LIGHT
    100: '#FFF5F0',
    200: '#FFEBE0',
    300: '#FFE1D1',
    400: '#FFD7C1',
    500: '#FFCDB1',
    600: '#FFC3A2',
    700: '#FFB992',
    800: '#FFAF82',
    900: '#FFA573',
  },
};

// Gradient Definitions
const brandGradients = {
  primary: 'linear-gradient(135deg, #F5630F 0%, #fb923c 50%, #eab308 100%)',
  orange: 'linear-gradient(135deg, #F5630F 0%, #fb923c 100%)',
  sunset: 'linear-gradient(135deg, #F5630F 0%, #fdba74 50%, #fde047 100%)',
  warm: 'linear-gradient(135deg, #fff7ed 0%, #FFFAF7 100%)',
  dark: 'linear-gradient(135deg, #1A1A1A 0%, #262626 100%)',
  light: 'linear-gradient(135deg, #FFFAF7 0%, #FFF5F0 100%)',
  vibrant: 'linear-gradient(135deg, #F5630F 0%, #eab308 100%)',
  
  // Glass effects
  glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 250, 247, 0.7) 100%)',
  glassOrange: 'linear-gradient(135deg, rgba(245, 99, 15, 0.2) 0%, rgba(251, 146, 60, 0.1) 100%)',
};

// Shadow Definitions
const brandShadows = {
  brand: '0 4px 14px 0 rgba(245, 99, 15, 0.25)',
  brandLg: '0 10px 40px 0 rgba(245, 99, 15, 0.2)',
  brandSm: '0 2px 8px 0 rgba(245, 99, 15, 0.15)',
  dark: '0 4px 14px 0 rgba(26, 26, 26, 0.15)',
  darkLg: '0 10px 40px 0 rgba(26, 26, 26, 0.2)',
  soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
};

// Usage Guidelines
const brandUsage = {
  primary: {
    color: '#F5630F',
    use: 'Primary actions, CTAs, active states',
    avoid: 'Body text, backgrounds'
  },
  dark: {
    color: '#1A1A1A',
    use: 'Headers, body text, icons',
    avoid: 'Primary buttons'
  },
  light: {
    color: '#FFFAF7',
    use: 'Backgrounds, cards, sections',
    avoid: 'Text (low contrast)'
  },
};

// Tailwind Config Helper
const getTailwindColors = () => ({
  brand: {
    primary: brandColors.primary,
    dark: brandColors.dark,
    light: brandColors.light,
    white: brandColors.white,
  },
  orange: brandColors.orange,
  yellow: brandColors.yellow,
  dark: brandColors.dark,
});

// CommonJS exports
module.exports = {
  brandColors,
  brandGradients,
  brandShadows,
  brandUsage,
  getTailwindColors,
};

// Default export for backward compatibility
module.exports.default = brandColors;
