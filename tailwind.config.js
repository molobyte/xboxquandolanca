/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        xbox: {
          green: '#107C10',
          bright: '#16a34a',
          neon: '#52d627',
          lime: '#9bf00b',
          mint: '#86efac',
          bg: '#0a0d0b',
          deep: '#070908',
          surface: '#141a16',
          panel: '#18201b',
          elevated: '#1d2721',
          border: '#25312a',
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
        glow: '0 0 0 2px rgba(82, 214, 39, 0.2), 0 0 36px -8px rgba(16, 124, 16, 0.5)',
        'xbox-glow': '0 0 0 1px rgba(82, 214, 39, 0.35), 0 12px 32px -10px rgba(16, 124, 16, 0.6)',
        'portal-card': '0 18px 40px -18px rgba(2, 8, 4, 0.88)',
        'xbox-cta': '0 10px 30px -6px rgba(16, 124, 16, 0.65)',
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
