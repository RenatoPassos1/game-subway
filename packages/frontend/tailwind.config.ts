import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C5CE7',
          light: '#8B7CF0',
          dark: '#5A4BD6',
        },
        secondary: {
          DEFAULT: '#00D2FF',
          light: '#33DBFF',
          dark: '#00B8E0',
        },
        accent: {
          DEFAULT: '#FFD700',
          light: '#FFE033',
          dark: '#E6C200',
        },
        background: {
          DEFAULT: '#0F0F23',
          light: '#161633',
        },
        surface: {
          DEFAULT: '#1A1A2E',
          light: '#24243E',
          lighter: '#2E2E4A',
        },
        text: {
          DEFAULT: '#E0E0FF',
          muted: '#9090B0',
          dim: '#6060A0',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6C5CE7 0%, #00D2FF 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0F0F23 0%, #1A1A2E 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(108, 92, 231, 0.1) 0%, rgba(0, 210, 255, 0.1) 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(108, 92, 231, 0.3)',
        'glow-secondary': '0 0 20px rgba(0, 210, 255, 0.3)',
        'glow-accent': '0 0 20px rgba(255, 215, 0, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(108, 92, 231, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(108, 92, 231, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
