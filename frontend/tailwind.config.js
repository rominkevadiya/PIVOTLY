/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16201d",
        moss: "#315c4d",
        copper: "#b56b3f",
        paper: "#f7f7f2",
      },
      boxShadow: {
        panel: "0 18px 45px rgba(22, 32, 29, 0.08)",
      },
    },
  },
  plugins: [],
};
