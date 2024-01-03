const nord = require("daisyui/src/theming/themes").nord;

module.exports = {
  mode: "jit",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "media",
  theme: {},
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    styled: true,
    themes: [
      {
        nord: {
          ...nord,
          primary: "#1a647c",
          secondary: "#87dbd3",
          accent: "#4eeceb",
          "base-content": "#093347",
        },
      },
    ],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
  },
};
