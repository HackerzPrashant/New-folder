// frontend/tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'rapido-yellow': '#FBBF24',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}