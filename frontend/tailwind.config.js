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
          navy: '#1A2B4C',
          navyDark: '#101D33',
          navyLight: '#243B66',
          gold: '#F5A623',
          goldLight: '#FBBF24',
          goldDark: '#D97706',
          teal: '#4A90D9',
          tealLight: '#6BA4E2',
          tealDark: '#2B6CB0',
          green: '#27AE60',
          greenLight: '#E8F8F0',
          yellow: '#F2C94D',
          yellowLight: '#FEF9E7',
          orange: '#E67E22',
          orangeLight: '#FDF2E9',
          gray: '#95A5A6',
          grayLight: '#F2F4F4',
          bg: '#F8F9FA',
          card: '#FFFFFF',
          text: '#2C3E50',
          subtext: '#64748B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(26, 43, 76, 0.08)',
        'glow-gold': '0 0 20px rgba(245, 166, 35, 0.35)',
        'glow-teal': '0 0 20px rgba(74, 144, 217, 0.35)',
        'card-hover': '0 12px 28px -4px rgba(26, 43, 76, 0.12), 0 4px 12px -2px rgba(26, 43, 76, 0.06)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 4s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          'from': { backgroundPosition: '200% 0' },
          'to': { backgroundPosition: '-200% 0' }
        }
      }
    },
  },
  plugins: [],
}
