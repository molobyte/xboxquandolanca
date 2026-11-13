/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        xbox: {
          green: '#107C10',
          bright: '#16a34a',
          neon: '#4ade80',
          lime: '#9bf00b',
          mint: '#86efac',
          bg: '#080a09',
          deep: '#050706',
          surface: '#111513',
          panel: '#151a17',
          elevated: '#1a201c',
          border: '#222a25',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Segoe Sans Variable Text"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        title: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        action: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        button: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Consolas', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(74, 222, 128, 0.22), 0 12px 32px -10px rgba(16, 124, 16, 0.32)',
        'xbox-glow': '0 0 0 1px rgba(74, 222, 128, 0.28), 0 12px 32px -10px rgba(16, 124, 16, 0.4)',
        'portal-card': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 20px 48px -20px rgba(0, 0, 0, 0.72)',
        'xbox-cta': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), 0 10px 26px -8px rgba(16, 124, 16, 0.45)',
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
