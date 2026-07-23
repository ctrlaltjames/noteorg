/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0d1117',
          panel: '#161b22',
          border: '#30363d',
          text: '#c9d1d9',
          secondary: '#8b949e',
          header: '#010409',
          input: '#0d1117',
        },
        light: {
          bg: '#ffffff',
          panel: '#f6f8fa',
          border: '#d0d7de',
          text: '#1f2328',
          secondary: '#656d76',
          header: '#f6f8fa',
          input: '#ffffff',
        },
        accent: {
          dark: '#58a6ff',
          light: '#0969da',
        },
        primary: {
          dark: '#238636',
          light: '#1a7f37',
        },
        danger: {
          dark: '#f85149',
          light: '#cf222e',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', "'Segoe UI'", 'Helvetica', 'Arial', 'sans-serif'],
        mono: ["'SFMono-Regular'", 'Consolas', "'Liberation Mono'", 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
