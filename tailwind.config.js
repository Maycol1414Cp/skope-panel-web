/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#004AC6',
        warning: '#996100',
        'status-pending': '#BA1A1A',
        'status-review': '#004AC6',
        'status-resolved': '#006C49',
      },
    },
  },
  plugins: [],
};
