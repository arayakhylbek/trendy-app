/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0d0d0f',
        surface: '#16161a',
        surface2: '#1e1e24',
        'surface-border': 'rgba(255,255,255,0.08)',
        accent: '#ff6b9d',
        accent2: '#c084fc',
        accent3: '#67e8f9',
        'text-muted': '#888888',
        'text-dim': '#555555',
        'plan-free': '#4ade80',
        'plan-lite': '#67e8f9',
        'plan-pro': '#f59e0b',
        'plan-studio': '#c084fc',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #ff6b9d, #c084fc, #67e8f9)',
      },
    },
  },
  plugins: [],
};
