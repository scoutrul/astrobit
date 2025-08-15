/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f1a',
        primary: '#8dd4ff',
        accent: '#ffdd57',
        error: '#ff5c5c',
        text: '#ffffff',
      },
      transitionDuration: {
        '0': '0ms',
        'instant': '0ms',
      },
      animation: {
        'none': 'none',
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.transition-instant': {
          'transition': 'none !important',
          'animation': 'none !important',
        },
        '.opacity-instant': {
          'opacity': '1 !important',
          'transform': 'none !important',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} 