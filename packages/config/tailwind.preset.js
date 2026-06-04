// ============================================
// WEBFUDGE PLATFORM - TAILWIND PRESET
// Shared Tailwind configuration with brand colors
// ============================================

const { brandColors, brandGradients, brandShadows } = require('./src/brand/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Brand Colors
        brand: {
          primary: brandColors.primary,
          dark: brandColors.dark[900],
          light: brandColors.light[50],
          white: brandColors.white,
        },

        // Extended Palettes
        orange: brandColors.orange,
        yellow: brandColors.yellow,
        dark: brandColors.dark,
        light: brandColors.light,
      },

      // Brand Gradients
      backgroundImage: {
        'gradient-brand': brandGradients.primary,
        'gradient-orange': brandGradients.orange,
        'gradient-sunset': brandGradients.sunset,
        'gradient-warm': brandGradients.warm,
        'gradient-dark': brandGradients.dark,
        'gradient-light': brandGradients.light,
        'gradient-vibrant': brandGradients.vibrant,
        'gradient-glass': brandGradients.glass,
        'gradient-glass-orange': brandGradients.glassOrange,
      },

      // Brand Shadows
      boxShadow: {
        'brand': brandShadows.brand,
        'brand-lg': brandShadows.brandLg,
        'brand-sm': brandShadows.brandSm,
        'dark': brandShadows.dark,
        'dark-lg': brandShadows.darkLg,
        'soft': brandShadows.soft,
      },

      // Font Families — Host Grotesk for apps; Jura for landing (landing overrides in its tailwind)
      fontFamily: {
        sans: ['Host Grotesk', 'system-ui', 'sans-serif'],
        heading: ['Host Grotesk', 'system-ui', 'sans-serif'],
        jura: ['Jura', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
};
