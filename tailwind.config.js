/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic tokens (nomes existentes preservados — valores atualizados)
        primary: '#4F46E5',
        'primary-foreground': '#FFFFFF',
        'primary-soft': '#EEF2FF',
        success: '#16A36A',
        'success-soft': '#ECFDF5',
        warning: '#D97706',
        'warning-soft': '#FFFBEB',
        danger: '#DC2626',
        'danger-soft': '#FEF2F2',
        info: '#0284C7',
        'info-soft': '#F0F9FF',
        neutral: '#687080',

        // Surface / text / border tokens (nova identidade)
        background: '#F7F8FA',
        surface: '#FFFFFF',
        'surface-muted': '#F8FAFC',
        border: '#E6E9EF',
        foreground: '#171A21',
        muted: '#687080',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(16, 24, 40, 0.04)',
        sm: '0 1px 3px 0 rgba(16, 24, 40, 0.06), 0 1px 2px -1px rgba(16, 24, 40, 0.06)',
        md: '0 4px 6px -1px rgba(16, 24, 40, 0.06), 0 2px 4px -2px rgba(16, 24, 40, 0.06)',
        lg: '0 10px 15px -3px rgba(16, 24, 40, 0.06), 0 4px 6px -4px rgba(16, 24, 40, 0.06)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
