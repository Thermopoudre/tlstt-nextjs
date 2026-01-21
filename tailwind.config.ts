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
        // Thème sombre moderne
        dark: {
          DEFAULT: '#0a1628',
          light: '#1e293b',
          card: 'rgba(30, 41, 59, 0.9)',
        },
        // Accents orange/rouge (style ThermoGestion)
        accent: {
          orange: '#f97316',
          red: '#ef4444',
          yellow: '#ffd700',
          cyan: '#00bfff',
        },
        // Legacy
        primary: {
          DEFAULT: '#10325F',
          light: '#1a4a7a',
        },
        secondary: {
          DEFAULT: '#1f2937',
          dark: '#111827',
        },
      },
      fontFamily: {
        sans: ['var(--font-open-sans)', 'sans-serif'],
        heading: ['var(--font-montserrat)', 'sans-serif'],
      },
      animation: {
        'ping-pong': 'pingPongBounce 0.5s ease-in-out infinite',
      },
      keyframes: {
        pingPongBounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
