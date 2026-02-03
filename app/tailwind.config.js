/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebefff',
          200: '#d6deff',
          300: '#b8c5ff',
          400: '#94a3ff',
          500: '#667eea',
          600: '#5568d3',
          700: '#4553b8',
          800: '#3a4694',
          900: '#323d78',
        },
        secondary: {
          500: '#764ba2',
        }
      },
    },
  },
  plugins: [],
}