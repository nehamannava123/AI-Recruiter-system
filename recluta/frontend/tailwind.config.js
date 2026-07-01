/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: 'var(--bg-void)',
        panel: 'var(--bg-panel)',
        surface: 'var(--bg-surface)',
        surfaceSoft: 'var(--bg-surface-soft)',
        card: 'var(--bg-card)',
        elevated: 'var(--bg-surface-soft)',
        accent: 'var(--accent)',
        aurora: 'var(--accent-aurora)',
        cobalt: 'var(--accent-cobalt)',
        accentStrong: 'var(--accent-strong)',
        warn: 'var(--accent-warn)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        subtle: 'var(--text-subtle)',
        border: 'var(--border)',
      },
      fontFamily: {
        display: ['Bitter', 'serif'],
        body: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '24px',
        input: '18px',
        pill: '999px',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease',
      },
      boxShadow: {
        card: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        lift: '0 8px 24px rgba(37, 99, 235, 0.25)',
      },
      animation: {
        pulseLive: 'pulseLive 2s ease-in-out infinite',
        blink: 'blink 4s ease-in-out infinite',
        fadeUp: 'fadeUp 0.6s ease forwards',
      },
      keyframes: {
        pulseLive: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.15)' },
        },
        blink: {
          '0%, 96%, 100%': { transform: 'scaleY(1)' },
          '98%': { transform: 'scaleY(0.1)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
