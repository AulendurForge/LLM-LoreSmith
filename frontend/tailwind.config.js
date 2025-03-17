/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'oswald': ['Oswald', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'nunito': ['Nunito Sans', 'sans-serif'],
        'source': ['Source Code Pro', 'monospace'],
      },
      colors: {
        'primary': {
          DEFAULT: '#182241',
          50: '#E9EEFF',
          100: '#D6DCFF',
          200: '#B3B9FF',
          300: '#8A8FFF',
          400: '#6064FF',
          500: '#182241',
          600: '#121A32',
          700: '#0C1324',
          800: '#060B15',
          900: '#000307',
        },
        'secondary': {
          DEFAULT: '#213C4E',
          50: '#E9F5FF',
          100: '#D6ECFF',
          200: '#B3D9FF',
          300: '#8AC6FF',
          400: '#5AAFFF',
          500: '#213C4E',
          600: '#1A303F',
          700: '#142431',
          800: '#0D1822',
          900: '#070C14',
        },
      },
    },
  },
  plugins: [],
} 