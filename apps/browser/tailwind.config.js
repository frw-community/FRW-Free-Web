/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'frw-primary': '#3b82f6',
        'frw-secondary': '#8b5cf6',
        'frw-success': '#10b981',
        'frw-warning': '#f59e0b',
        'frw-danger': '#ef4444',
      }
    },
  },
  plugins: [],
}
