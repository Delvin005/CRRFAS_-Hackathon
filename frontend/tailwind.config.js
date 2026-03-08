/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#0B1026',
          800: '#1B2A4A',
          600: '#2563EB',
        },
        accent: {
          cyan: '#22D3EE',
          teal: '#2DD4BF',
          purple: '#8B5CF6',
          green: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
        },
        neutral: {
          50: '#F8FAFC',
          400: '#64748B',
          300: '#CBD5E1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
