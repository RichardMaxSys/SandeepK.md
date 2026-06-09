/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Backgrounds — deep charcoal / graphite / navy
        canvas: {
          DEFAULT: '#0a0e1a',   // page background
          subtle: '#0f1422',    // sidebar / app shell
          raised: '#161c2e',    // cards
          inset: '#0a0e1a',    // inputs / nested
        },
        // Borders
        line: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          strong: 'rgba(255, 255, 255, 0.14)',
          subtle: 'rgba(255, 255, 255, 0.05)',
        },
        // Foreground / text
        ink: {
          DEFAULT: '#e6ebf5',
          muted: '#9aa3b8',
          subtle: '#6b7491',
          inverse: '#0a0e1a',
        },
        // Teal accent
        accent: {
          50:  '#e6fffa',
          100: '#b2f5ea',
          200: '#81e6d9',
          300: '#4fd1c5',
          400: '#38b2ac',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // Status colors
        success: { DEFAULT: '#22c55e', soft: 'rgba(34,197,94,0.12)' },
        warning: { DEFAULT: '#f59e0b', soft: 'rgba(245,158,11,0.12)' },
        danger:  { DEFAULT: '#ef4444', soft: 'rgba(239,68,68,0.12)'  },
        info:    { DEFAULT: '#3b82f6', soft: 'rgba(59,130,246,0.12)' },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'glow-accent': '0 0 0 1px rgba(20,184,166,0.25), 0 8px 30px -8px rgba(20,184,166,0.35)',
        'soft':        '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 4px 24px -8px rgba(0,0,0,0.4)',
        'soft-lg':     '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 18px 40px -20px rgba(0,0,0,0.6)',
        'inner-line':  'inset 0 0 0 1px rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at top, rgba(20,184,166,0.08), transparent 50%), radial-gradient(circle at bottom right, rgba(59,130,246,0.06), transparent 50%)',
        'mesh-soft':
          'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%)',
        'accent-gradient':
          'linear-gradient(135deg, #14b8a6 0%, #0ea5e9 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'spotlight': {
          '0%': { opacity: '0', transform: 'translate(-72%, -62%) scale(0.5)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -40%) scale(1)' },
        },
      },
      animation: {
        'fade-in':    'fade-in 0.3s ease-out',
        'shimmer':    'shimmer 2s linear infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'spotlight':  'spotlight 2s ease 0.75s 1 forwards',
      },
    },
  },
  plugins: [],
};
