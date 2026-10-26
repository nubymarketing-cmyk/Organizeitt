/** Cores e fontes tiradas do protótipo "Nuby · Painel do Cliente". */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#0C0B1D',
        panel: '#0D0D24',
        card: 'rgba(255,255,255,0.04)',
        line: 'rgba(255,255,255,0.08)',
        muted: '#A0A0BE',
        dim: '#7D7DA0',
        lilac: '#B8A9E8',
        teal: '#9FC8C0',
        violet: '#8B5CF6',
        azure: '#3B82F6',
        ok: '#34D399',
        warn: '#FBBF24',
        bad: '#F87171',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        brand: 'linear-gradient(135deg,#8B5CF6,#3B82F6)',
      },
    },
  },
  plugins: [],
};
