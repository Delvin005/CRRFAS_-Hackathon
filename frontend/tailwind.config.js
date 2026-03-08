/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crrfas: {
          bg: 'var(--crrfas-bg, #0B1026)',        // Deep Space Blue
          surface: 'var(--crrfas-surface, #1B2A4A)',   // Navy Surface
          primary: 'var(--crrfas-primary, #2563EB)',   // Royal Blue
          cyan: 'var(--crrfas-cyan, #22D3EE)',      // Neon Cyan (Accents)
          teal: 'var(--crrfas-teal, #2DD4BF)',      // Futuristic Teal
          purple: 'var(--crrfas-purple, #8B5CF6)',    // Deep Purple
          light: 'var(--crrfas-light, #F8FAFC)',     // Ghost White text
          muted: 'var(--crrfas-muted, #64748B)',     // Slate Gray
          border: 'var(--crrfas-border, #CBD5E1)',    // Light Slate
          success: '#10B981',   // Emerald
          warning: '#F59E0B',   // Amber
          danger: '#EF4444',    // Red
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
