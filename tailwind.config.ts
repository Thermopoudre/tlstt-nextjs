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
        // Palette TLSTT - Noir + Bleu Ultra Contrasté
        primary: {
          DEFAULT: '#0a0a0a',
          light: '#111111',
          dark: '#000000',
        },
        secondary: {
          DEFAULT: '#1a1a1a',
          light: '#222222',
          dark: '#111111',
        },
        accent: {
          DEFAULT: '#3b9fd8',
          light: '#5bb5e8',
          dark: '#2d8bc9',
        },
        // Couleurs fonctionnelles
        dark: {
          DEFAULT: '#0a0a0a',
          light: '#111111',
          card: '#1a1a1a',
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
