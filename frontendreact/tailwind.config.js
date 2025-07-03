/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          light: '#3b82f6',  // blue-500
          dark: '#1e40af',   // blue-800
        },
        accent: {
          DEFAULT: '#8b5cf6', // purple-500
          light: '#a78bfa',   // purple-400
          dark: '#6d28d9',    // purple-700
        },
        background: {
          DEFAULT: '#ffffff', // white
          subtle: '#f3f4f6',  // gray-100
        },
        card: {
          DEFAULT: '#f9fafb', // gray-50
        },
        text: {
          DEFAULT: '#1e293b', // slate-800
          muted: '#64748b',   // slate-400
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
} 