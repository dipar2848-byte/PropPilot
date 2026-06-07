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
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd2ff',
          300: '#8eb5ff',
          400: '#598cff',
          500: '#3563ff',
          600: '#1f3ff5',
          700: '#172ee1',
          800: '#1928b6',
          900: '#1b298f',
          950: '#151a57',
        },
        ink: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d4d9e2',
          300: '#aeb7c8',
          400: '#8290a8',
          500: '#62718c',
          600: '#4d5973',
          700: '#3f495d',
          800: '#373f4f',
          900: '#0f172a',
          950: '#0a0e1a',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(16, 24, 40, 0.08), 0 4px 24px -4px rgba(16, 24, 40, 0.06)',
        card: '0 1px 3px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)',
        glow: '0 0 0 1px rgba(53, 99, 255, 0.1), 0 8px 32px -8px rgba(53, 99, 255, 0.3)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
