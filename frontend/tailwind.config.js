/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Fira Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      colors: {
        primary: {
          50:  '#f0f4ff',
          100: '#dce6fd',
          200: '#bdd0fb',
          300: '#90b0f8',
          400: '#6089f4',
          500: '#3b64ef',
          600: '#2348e3',
          700: '#1c3bd0',
          800: '#1d33a9',
          900: '#1e3085',
        },
        sidebar: {
          DEFAULT: '#0F172A',
          hover:   '#1E293B',
          border:  '#1E293B',
          text:    '#94A3B8',
          active:  '#2348e3',
        },
      },
    },
  },
  plugins: [],
}
