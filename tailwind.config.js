/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkTeal: '#264653',
        tealGreen: '#2a9d8f',
        lightGreen: '#52b788',
        yellowWarm: '#e9c46a',
        orangeWarm: '#f4a261',
        redOrange: '#e76f51',
      }
    },
  },
  plugins: [],
}
