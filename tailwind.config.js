/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./pages/**/*.{html,js}",
    "./components/**/*.{html,js}",
    "./sections/**/*.{html,js}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: '#fafafa',
        ink: '#111111',
      },
      boxShadow: {
        'premium': '0 4px 24px -4px rgba(0, 0, 0, 0.05), 0 0 4px rgba(0,0,0,0.02)',
        'premium-hover': '0 20px 40px -8px rgba(0, 0, 0, 0.08), 0 0 4px rgba(0,0,0,0.03)',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
