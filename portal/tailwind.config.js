/** Cores, fontes, raios e sombras vêm de src/theme/tokens.css. */
/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Nomes semânticos
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        fg: token('fg'),
        brand: token('brand'),
        'brand-fg': token('brand-fg'),
        link: token('link'),
        info: token('info'),
        // Nomes antigos, mantidos para as telas existentes, agora seguindo o tema
        night: token('bg'),
        panel: token('surface'),
        card: token('surface'),
        line: token('border'),
        muted: token('muted'),
        dim: token('dim'),
        lilac: token('link'),
        teal: token('link'),
        violet: token('brand'),
        azure: token('info'),
        ok: token('ok'),
        warn: token('warn'),
        bad: token('bad'),
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius)',
        xl: 'var(--radius)',
        '2xl': 'var(--radius-lg)',
        '3xl': 'var(--radius-lg)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        '2xl': 'var(--shadow-lg)',
      },
    },
  },
  plugins: [],
};
