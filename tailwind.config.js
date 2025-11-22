// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Asegúrate de que esta línea apunte a todos tus archivos de código:
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
