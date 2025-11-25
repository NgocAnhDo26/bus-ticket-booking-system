import defaultTheme from 'tailwindcss/defaultTheme'

const colorWithAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`

const spacingScale = {
  xs: 'var(--space-xs)',
  sm: 'var(--space-sm)',
  md: 'var(--space-md)',
  lg: 'var(--space-lg)',
  xl: 'var(--space-xl)',
  '2xl': 'var(--space-2xl)',
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: colorWithAlpha('--color-background'),
        surface: colorWithAlpha('--color-surface'),
        primary: colorWithAlpha('--color-primary'),
        secondary: colorWithAlpha('--color-secondary'),
        muted: colorWithAlpha('--color-muted'),
        border: colorWithAlpha('--color-border'),
        success: colorWithAlpha('--color-success'),
        danger: colorWithAlpha('--color-danger'),
        warning: colorWithAlpha('--color-warning'),
        info: colorWithAlpha('--color-info'),
        text: {
          base: colorWithAlpha('--color-text-base'),
          muted: colorWithAlpha('--color-text-muted'),
          inverted: colorWithAlpha('--color-text-inverted'),
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', ...defaultTheme.fontFamily.sans],
        display: ['"Space Grotesk"', ...defaultTheme.fontFamily.sans],
      },
      spacing: {
        ...defaultTheme.spacing,
        ...spacingScale,
      },
      borderRadius: {
        card: 'var(--radius-card)',
        button: 'var(--radius-button)',
        input: 'var(--radius-input)',
      },
      boxShadow: {
        card: '0 10px 40px rgb(15 23 42 / 0.08)',
        soft: '0 4px 20px rgb(15 23 42 / 0.06)',
      },
    },
  },
  plugins: [],
}

