/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f6f6f7',
          100: '#eef0f2',
          200: '#dadfe4',
          300: '#b8c2cc',
          400: '#909eac',
          500: '#707f90',
          600: '#596778',
          700: '#4a5462',
          800: '#404752',
          900: '#1e222b',
          950: '#0f1115',
        },
        brand: {
          50: '#f0f3ff',
          100: '#e1e8ff',
          200: '#c8d4ff',
          300: '#a3b7ff',
          400: '#7991ff',
          500: '#5466f9',
          600: '#3d48ed',
          700: '#3137da',
          800: '#2a2db1',
          900: '#272c8d',
          950: '#171852',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
