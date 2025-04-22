/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        onyx: {
          50: '#f6f7f7',
          100: '#e0e2e3',
          200: '#c1c5c6',
          300: '#9ca1a4',
          400: '#778084',
          500: '#5c666a',
          600: '#475054',
          700: '#3a4144',
          800: '#2e3538',
          900: '#1f2325',
          950: '#0B0B0B',
        },
        gold: {
          50: '#fcf9ee',
          100: '#f9f0d8',
          200: '#f2e1b0',
          300: '#ebd087',
          400: '#e4ba58',
          500: '#dba038',
          600: '#C9A86A', // Warm-gold accent color
          700: '#a37721',
          800: '#865e20',
          900: '#704c1f',
          950: '#432b0c',
        },
        ivory: {
          50: '#fefefe',
          100: '#fcfcfc',
          200: '#f9f9f9',
          300: '#f2f2f2',
          400: '#e5e5e5',
          500: '#cbcbcb',
          600: '#adadad',
          700: '#8e8e8e',
          800: '#747474',
          900: '#565656',
          950: '#282828',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['DM Serif Display', 'serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px -5px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        'premium-sm': '0 4px 15px -3px rgba(0, 0, 0, 0.15), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'premium-lg': '0 20px 40px -8px rgba(0, 0, 0, 0.25), 0 8px 16px -4px rgba(0, 0, 0, 0.1)',
        'glass': '0 4px 20px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      borderRadius: {
        'premium': '0.75rem',
      },
      transitionProperty: {
        'premium': 'transform, box-shadow, opacity, background-color, border-color',
      },
      transitionDuration: {
        '400': '400ms',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass': 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
};