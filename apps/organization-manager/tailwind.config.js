/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('../../packages/config/tailwind.preset')],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/components/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/layouts/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/index.js',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Host Grotesk', 'system-ui', 'sans-serif'],
        primary: ['Host Grotesk', 'system-ui', 'sans-serif'],
        heading: ['Host Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
