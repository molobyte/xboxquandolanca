/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        xbox: {
          green: '#107C10',
          bright: '#13a10e',
          neon: '#52d627',
          bg: '#07090d',
          surface: '#0d1117',
          panel: '#121820',
          border: '#232a35',
        },
      },
      fontFamily: {
        sans: ['"Segoe Sans Variable Text"', '"Segoe UI"', 'SegoeUI', 'system-ui', '-apple-system', 'sans-serif'],
        title: ['"Bahnschrift Light"', 'Bahnschrift', '"Segoe UI"', 'sans-serif'],
        display: ['Bahnschrift', '"Segoe Sans Variable Display"', '"Segoe UI"', 'sans-serif'],
        action: ['"Bahnschrift Bold"', 'Bahnschrift', '"Segoe UI"', 'sans-serif'],
        button: ['"Bahnschrift Bold"', 'Bahnschrift', '"Segoe UI"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 2px rgba(82, 214, 39, 0.16), 0 0 32px -8px rgba(82, 214, 39, 0.45)',
        'xbox-glow': '0 0 0 1px rgba(82, 214, 39, 0.35), 0 10px 30px -10px rgba(16, 124, 16, 0.55)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(-4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
