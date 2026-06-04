/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../packages/config/tailwind.preset')],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
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
    },
  },
  plugins: [],
}
