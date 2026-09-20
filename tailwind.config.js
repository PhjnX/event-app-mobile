/** @type {import('tailwindcss').Config} */

// Giữ đồng bộ với src/constants/theme.ts — hai nơi này từng lệch nhau:
// tailwind khai primary.gold = #b5a65f (vàng đậm) trong khi theme.ts khai
// primary = #D8C97B (vàng chính), nên cùng một "màu thương hiệu" lại ra hai
// sắc khác nhau tuỳ chỗ dùng className hay style.
const GOLD = "#D8C97B";
const GOLD_DARK = "#B5A65F";
const GOLD_LIGHT = "#F4E2A6";

module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        gold: GOLD,
        "gold-dark": GOLD_DARK,
        "gold-light": GOLD_LIGHT,
        ink: "#0a0a0a",
        card: "#111111",
        elevated: "#141414",
        // Giữ lại khoá cũ để className đang dùng primary-* không vỡ,
        // nhưng nay trỏ đúng sắc vàng chính.
        primary: {
          gold: GOLD,
          dark: "#0a0a0a",
        },
      },
    },
  },
  plugins: [],
};
