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
    },
  },
  plugins: [],
} 