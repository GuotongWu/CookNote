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
    },
  },
  plugins: [],
};
