/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'arb-blue': '#28A0F0',
        'arb-indigo': '#4C5FE5',
        'arb-dark': '#1B2333',
      },
    },
  },
  plugins: [],
}