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
          bg: '#0b0f1d',
          surface: '#141a2f',
          panel: '#182039',
          border: '#252f4f',
        },
        portal: {
          bg: '#0b0f1d',
          deep: '#080b15',
          surface: '#141a2f',
          panel: '#182039',
          elevated: '#1d2644',
          blue: '#3b82f6',
          'blue-dark': '#2563eb',
          cyan: '#38bdf8',
          coral: '#f43f5e',
          lime: '#bef264',
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
        glow: '0 0 0 2px rgba(59, 130, 246, 0.2), 0 0 36px -8px rgba(59, 130, 246, 0.45)',
        'xbox-glow': '0 0 0 1px rgba(82, 214, 39, 0.35), 0 12px 32px -10px rgba(16, 124, 16, 0.6)',
        'portal-card': '0 18px 40px -18px rgba(3, 6, 18, 0.85)',
        'portal-blue': '0 10px 30px -6px rgba(37, 99, 235, 0.65)',
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
