/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        success: '#00B050',
        warning: '#FFC000',
        danger: '#E53935',
        neutral: '#6C757D',
        primary: '#0F6CBD',
      }
    },
  },
  plugins: [],
}
