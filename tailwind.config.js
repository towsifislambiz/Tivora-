/** @type {import('tailwindcss').Config} */

// Every brand colour resolves through a CSS custom property holding an "R G B"
// triplet. That keeps `<alpha-value>` working (bg-brand-surface/60 etc.) while
// letting a single [data-theme] swap on <html> retheme the whole app.
const token = (name) => `rgb(var(${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: token('--brand-bg'),
          surface: token('--brand-surface'),
          lavender: token('--brand-lavender'),
          purple: token('--brand-purple'),
          violet: token('--brand-violet'),
          pink: token('--brand-pink'),
          blue: token('--brand-blue'),
          cyan: token('--brand-cyan'),
          success: token('--brand-success'),
          mainText: token('--brand-main-text'),
          mutedText: token('--brand-muted-text'),
          border: token('--brand-border'),
        },
        // Translucent fills for glass chrome — tint flips with the theme.
        glass: {
          fill: token('--glass-fill'),
          stroke: token('--glass-stroke'),
          highlight: token('--glass-highlight'),
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Poppins', 'sans-serif'],
      },
      backgroundImage: {
        // Instagram uses a flat blue for primary actions; the rainbow is
        // reserved for story rings and brand moments.
        'primary-gradient': 'linear-gradient(135deg, rgb(var(--brand-purple)) 0%, rgb(var(--brand-violet)) 100%)',
        'story-gradient': 'linear-gradient(45deg, #F58529 0%, #FEDA77 20%, #DD2A7B 50%, #8134AF 75%, #515BD4 100%)',
        'purple-blue-gradient': 'linear-gradient(135deg, rgb(var(--brand-purple)) 0%, rgb(var(--brand-blue)) 100%)',
        'pink-orange-gradient': 'linear-gradient(45deg, #F58529 0%, #DD2A7B 100%)',
        'cover-gradient': 'linear-gradient(45deg, #F58529 0%, #DD2A7B 45%, #8134AF 70%, #515BD4 100%)',
        'banner-gradient': 'var(--banner-gradient)',
      },
      boxShadow: {
        // Instagram is a border-led design, not a shadow-led one. These stay
        // deliberately near-invisible so 1px borders do the separating.
        'soft-xs': '0 1px 2px rgb(var(--shadow-rgb) / var(--shadow-xs-alpha))',
        'soft-sm': '0 1px 3px rgb(var(--shadow-rgb) / var(--shadow-sm-alpha))',
        'soft-md': '0 2px 8px rgb(var(--shadow-rgb) / var(--shadow-md-alpha))',
        'soft-lg': '0 4px 16px rgb(var(--shadow-rgb) / var(--shadow-lg-alpha))',
        'gradient-glow': '0 2px 8px rgb(var(--brand-purple) / var(--glow-alpha))',
        'glass': '0 8px 32px rgb(var(--shadow-rgb) / var(--shadow-lg-alpha)), inset 0 1px 0 rgb(var(--glass-highlight) / 0.25)',
      },
      borderRadius: {
        // Tightened from 1rem/1.5rem: Instagram's geometry is much squarer
        // than the original pill-heavy Tivora look. Retargeting the two
        // scale steps re-shapes every card in the app at once.
        '2xl': '0.5rem',
        '3xl': '0.75rem',
      },
      keyframes: {
        auroraDrift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '33%': { transform: 'translate3d(6%, -8%, 0) scale(1.12)' },
          '66%': { transform: 'translate3d(-7%, 6%, 0) scale(0.94)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        // `animate-fadeIn` / `animate-scaleUp` were referenced by 15 components
        // but never defined anywhere — so every modal in the app popped in with
        // no transition at all. Defining them here activates all of them at once.
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        scaleUp: {
          from: { opacity: '0', transform: 'scale(0.94) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        // Slow, continuous ring for an unanswered call — `animate-ping` restarts
        // too abruptly to read as a phone ringing.
        callPulse: {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '70%': { transform: 'scale(1.55)', opacity: '0' },
          '100%': { transform: 'scale(1.55)', opacity: '0' },
        },
      },
      animation: {
        'aurora-slow': 'auroraDrift 26s ease-in-out infinite',
        'aurora-slower': 'auroraDrift 38s ease-in-out infinite reverse',
        fadeIn: 'fadeIn 0.2s ease-out both',
        scaleUp: 'scaleUp 0.26s cubic-bezier(0.16, 1, 0.3, 1) both',
        callPulse: 'callPulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
