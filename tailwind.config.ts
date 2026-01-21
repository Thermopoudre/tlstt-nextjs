import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette TLSTT - Bleus du logo (flat, sans dégradé)
        primary: {
          DEFAULT: '#0f3057',
          light: '#1a5a8a',
          dark: '#0a2040',
        },
        secondary: {
          DEFAULT: '#1a5a8a',
          light: '#2e86ab',
          dark: '#0f3057',
        },
        accent: {
          DEFAULT: '#5bc0de',
          light: '#8dd3e8',
          dark: '#4ab0ce',
        },
        // Couleurs fonctionnelles
        dark: {
          DEFAULT: '#0f3057',
          light: '#1a5a8a',
          card: 'rgba(15, 48, 87, 0.95)',
        },
      },
      fontFamily: {
        sans: ['var(--font-open-sans)', 'sans-serif'],
        heading: ['var(--font-montserrat)', 'sans-serif'],
      },
      animation: {
        'ping-pong': 'pingPongBounce 0.5s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.8s ease forwards',
      },
      keyframes: {
        pingPongBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
