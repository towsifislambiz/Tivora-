/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#F7F8FF',
          surface: '#FFFFFF',
          lavender: '#F0F3FF',
          purple: '#6C5CE7',
          violet: '#8B5CF6',
          pink: '#EC4899',
          blue: '#3B82F6',
          cyan: '#06B6D4',
          success: '#10B981',
          mainText: '#17172A',
          mutedText: '#73758A',
          border: '#EEF0F6',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #6C5CE7 0%, #8B5CF6 50%, #EC4899 100%)',
        'purple-blue-gradient': 'linear-gradient(135deg, #6C5CE7 0%, #3B82F6 100%)',
        'pink-orange-gradient': 'linear-gradient(135deg, #EC4899 0%, #F59E0B 100%)',
        'cover-gradient': 'linear-gradient(135deg, #4A00E0 0%, #8E2DE2 40%, #F06292 100%)',
        'banner-gradient': 'linear-gradient(135deg, #FFF0F5 0%, #E8EAF6 50%, #FFE0EC 100%)',
      },
      boxShadow: {
        'soft-sm': '0 2px 8px rgba(108, 92, 231, 0.04)',
        'soft-md': '0 8px 24px rgba(108, 92, 231, 0.08)',
        'soft-lg': '0 16px 40px rgba(108, 92, 231, 0.12)',
        'gradient-glow': '0 6px 20px rgba(108, 92, 231, 0.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
