/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          dark: '#000011',
          mid: '#000022',
          blue: '#0a0a2e',
        },
        star: {
          dust: '#aaccff',
          glow: '#ffd700',
          warm: '#ffaa44',
        },
        line: {
          resonance: '#44ddff',
          orbit: '#ff9944',
          repel: '#ff4466',
          wrap: '#aa66ff',
        },
        ui: {
          primary: '#e0e0ff',
          secondary: '#8899cc',
          panel: 'rgba(5, 5, 30, 0.85)',
        },
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"SF Mono"', 'Menlo', 'monospace'],
      },
      backdropBlur: {
        panel: '20px',
      },
    },
  },
  plugins: [],
}
