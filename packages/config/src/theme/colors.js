/**
 * Theme color configuration
 * Based on xtrawrkx CRM design system
 */

export const colors = {
  // Brand colors (Orange/Pink gradient theme)
  brand: {
    primary: '#f97316', // orange-500
    secondary: '#ec4899', // pink-500
    accent: '#f59e0b', // amber-500
    
    // Gradient combinations
    gradientStart: '#f97316', // orange-500
    gradientEnd: '#ec4899', // pink-500
    
    // Text colors
    foreground: '#1f2937', // gray-800
    textLight: '#6b7280', // gray-500
    textDark: '#111827', // gray-900
    
    // Background colors
    background: '#ffffff',
    hover: '#fef3c7', // amber-50
    border: '#e5e7eb', // gray-200
  },
  
  // Status colors
  status: {
    new: {
      bg: '#dbeafe', // blue-100
      text: '#1e3a8a', // blue-800
      border: '#60a5fa', // blue-400
      shadow: '#93c5fd', // blue-200
    },
    contacted: {
      bg: '#fef3c7', // yellow-100
      text: '#78350f', // yellow-800
      border: '#fbbf24', // yellow-400
      shadow: '#fcd34d', // yellow-200
    },
    qualified: {
      bg: '#d1fae5', // green-100
      text: '#065f46', // green-800
      border: '#34d399', // green-400
      shadow: '#6ee7b7', // green-200
    },
    lost: {
      bg: '#fee2e2', // red-100
      text: '#991b1b', // red-800
      border: '#f87171', // red-400
      shadow: '#fca5a5', // red-200
    },
    converted: {
      bg: '#d1fae5', // green-100
      text: '#065f46', // green-800
      border: '#34d399', // green-400
      shadow: '#6ee7b7', // green-200
    },
  },
  
  // Company type colors
  companyType: {
    'startup-corporate': {
      bg: '#fed7aa', // orange-100
      text: '#7c2d12', // orange-800
      border: '#fb923c', // orange-400
      shadow: '#fdba74', // orange-200
      label: 'Startup and Corporates',
    },
    'investor': {
      bg: '#c7d2fe', // indigo-100
      text: '#3730a3', // indigo-800
      border: '#818cf8', // indigo-400
      shadow: '#a5b4fc', // indigo-200
      label: 'Investors',
    },
    'enablers-academia': {
      bg: '#99f6e4', // teal-100
      text: '#134e4a', // teal-800
      border: '#2dd4bf', // teal-400
      shadow: '#5eead4', // teal-200
      label: 'Enablers & Academia',
    },
  },
  
  // UI element colors
  ui: {
    border: '#e5e7eb', // gray-200
    borderLight: '#f3f4f6', // gray-100
    hover: '#f9fafb', // gray-50
    focus: '#3b82f6', // blue-500
    disabled: '#9ca3af', // gray-400
    divider: '#e5e7eb', // gray-200
  },
  
  // Feedback colors
  feedback: {
    success: {
      bg: '#d1fae5',
      text: '#065f46',
      border: '#34d399',
    },
    error: {
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#f87171',
    },
    warning: {
      bg: '#fef3c7',
      text: '#78350f',
      border: '#fbbf24',
    },
    info: {
      bg: '#dbeafe',
      text: '#1e3a8a',
      border: '#60a5fa',
    },
  },
};

export default colors;
