const nord = require("daisyui/src/theming/themes").nord;

module.exports = {
  mode: "jit",
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/tailwind-datepicker-react/dist/**/*.js",
  ],
  darkMode: "media",
  theme: {},
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    styled: true,
    themes: ["nord"],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
  },
};
