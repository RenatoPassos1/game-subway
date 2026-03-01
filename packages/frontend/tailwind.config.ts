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
        action: {
          DEFAULT: '#FF3B30',
          light: '#FF7A18',
        },
        success: {
          DEFAULT: '#00E676',
          light: '#69F0AE',
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
        heading: ['var(--font-syne)', 'Syne', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'Space Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6C5CE7 0%, #00D2FF 100%)',
        'gradient-accent': 'linear-gradient(135deg, #FFD700 0%, #FF8C00 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0F0F23 0%, #1A1A2E 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(108, 92, 231, 0.1) 0%, rgba(0, 210, 255, 0.1) 100%)',
        'gradient-action': 'linear-gradient(135deg, #FF3B30 0%, #FF7A18 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(108, 92, 231, 0.3)',
        'glow-secondary': '0 0 20px rgba(0, 210, 255, 0.3)',
        'glow-accent': '0 0 20px rgba(255, 215, 0, 0.3)',
        'glow-lg': '0 0 40px rgba(108, 92, 231, 0.4), 0 0 80px rgba(0, 210, 255, 0.15)',
        'glow-action': '0 0 20px rgba(255, 59, 48, 0.4), 0 0 40px rgba(255, 122, 24, 0.2)',
        'glow-success': '0 0 20px rgba(0, 230, 118, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
        'border-flow': 'borderFlow 3s linear infinite',
        'flicker': 'flicker 4s ease-in-out infinite',
        'data-stream': 'dataStream 20s linear infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'urgency-pulse': 'urgencyPulse 1s ease-in-out infinite',
        'prize-shimmer': 'prizeShimmer 3s ease-in-out infinite',
        'hero-glow': 'heroGlow 4s ease-in-out infinite alternate',
        'cta-pulse': 'ctaPulse 3.5s ease-in-out infinite',
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
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        borderFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
          '75%': { opacity: '0.95' },
        },
        dataStream: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.95' },
        },
        urgencyPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(239, 68, 68, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(239, 68, 68, 0.6), 0 0 60px rgba(239, 68, 68, 0.2)' },
        },
        prizeShimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        heroGlow: {
          '0%': { opacity: '0.4', transform: 'scale(1)' },
          '100%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        ctaPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255, 59, 48, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(255, 59, 48, 0.5), 0 0 50px rgba(255, 122, 24, 0.2)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
