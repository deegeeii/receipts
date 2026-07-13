/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
      extend: {
        colors: {
          bg:         "#0A0A0A",
          surface:    "#111111",
          border:     "#1F1F1F",
          gold:       "#C9A84C",
          "gold-light": "#E5C97A",
          text:       "#F0EDEA",
          muted:      "#6B6B6B",
          danger:     "#7B2D2D",
        },
      },
    },
    plugins: [],
  };
  