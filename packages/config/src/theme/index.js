export { colors, default as themeColors } from './colors';

// Theme configuration object
export const theme = {
  // Glass morphism effect
  glass: {
    background: 'bg-white/95 backdrop-blur-xl',
    border: 'border border-white/30',
    shadow: 'shadow-lg',
  },
  
  // Gradient backgrounds
  gradients: {
    primary: 'bg-gradient-to-r from-orange-500 to-pink-500',
    warm: 'bg-gradient-to-br from-orange-50 to-pink-50',
    sunset: 'bg-gradient-to-br from-orange-100 to-red-50',
    glass: 'bg-gradient-to-br from-white/95 via-white/85 to-white/75',
  },
  
  // Border radius
  radius: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-full',
  },
  
  // Shadows
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  },
  
  // Transitions
  transitions: {
    fast: 'transition-all duration-200',
    normal: 'transition-all duration-300',
    slow: 'transition-all duration-500',
  },
  
  // Backdrop blur
  blur: {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
    '2xl': 'backdrop-blur-2xl',
  },
};

export default theme;
