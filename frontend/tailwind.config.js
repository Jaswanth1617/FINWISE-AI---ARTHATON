/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        finwise: {
          navy: '#0F172A',
          'navy-light': '#1E293B',
          indigo: '#4F46E5',
          'indigo-light': '#6366F1',
          'indigo-soft': '#EEF2FF',
          cyan: '#0284C7',
          'cyan-light': '#0EA5E9',
          'cyan-soft': '#E0F2FE',
          bg: '#FAFAFC',
          card: '#FFFFFF',
          border: '#E2E8F0',
          'border-light': '#F1F5F9',
          muted: '#64748B',
          success: '#10B981',
          'success-soft': '#ECFDF5',
          warning: '#F59E0B',
          'warning-soft': '#FFFBEB',
          danger: '#EF4444',
          'danger-soft': '#FEF2F2'
        }
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px 0 rgba(0, 0, 0, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
