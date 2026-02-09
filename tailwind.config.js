/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B6B", // 温暖的主色调
        secondary: "#4ECDC4",
        accent: "#FFE66D",
        background: "#F8F9FA",
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px rgba(0, 0, 0, 0.08)',
        'button': '0 8px 15px rgba(255, 107, 107, 0.3)',
      }
    },
  },
  plugins: [],
};
