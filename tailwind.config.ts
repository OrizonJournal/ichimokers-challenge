import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#111111',
        'surface-2': '#1a1a1a',
        'surface-3': '#222222',
        accent: '#49b19b',
        'accent-light': '#72c4b2',
        'accent-dark': '#33927d',
        'accent-glow': 'rgba(73, 177, 155, 0.3)',
        success: '#10b981',
        'success-dim': 'rgba(16, 185, 129, 0.15)',
        danger: '#ef4444',
        'danger-dim': 'rgba(239, 68, 68, 0.15)',
        muted: '#404040',
        'text-primary': '#f5f5f5',
        'text-secondary': '#a3a3a3',
        'text-muted': '#525252',
        gold: '#f59e0b',
        silver: '#9ca3af',
        bronze: '#b45309',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        'app': '430px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(73, 177, 155, 0.4)',
        'glow-sm': '0 0 10px rgba(73, 177, 155, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
