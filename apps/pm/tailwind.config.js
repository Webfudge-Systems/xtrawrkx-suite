/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../packages/config/tailwind.preset')],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/book-components/**/*.{ts,tsx}',
    '../../packages/ui/utils/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/feedback/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/themes/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#F5630F',
          dark: '#1A1A1A',
          light: '#FFFAF7',
          white: '#FFFFFF',
          foreground: '#2d2d2d',
          'text-light': '#666666',
          'text-muted': '#999999',
          border: '#e8e8e8',
          hover: '#f8f8f8',
        },
      },
      fontFamily: {
        sans: ['Host Grotesk', 'system-ui', 'sans-serif'],
        primary: ['Host Grotesk', 'system-ui', 'sans-serif'],
        heading: ['Host Grotesk', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #fff9f0 0%, #fff4e6 100%)',
        'gradient-card': 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
