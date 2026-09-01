/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#38abf8',
          500: '#0e8fd9',
          600: '#0272b7',
          700: '#035c94',
          800: '#074e7b',
          900: '#0c4266',
          950: '#082a44',
        },
        slate: {
          850: '#162032',
          900: '#0f172a',
          950: '#080d1a',
        },
        bpmn: {
          start: '#10b981',
          end: '#ef4444',
          task: '#3b82f6',
          service: '#8b5cf6',
          manual: '#f59e0b',
          gateway: '#f97316',
          quality: '#ec4899',
          timer: '#06b6d4',
          subprocess: '#6366f1'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px -3px rgba(6, 182, 212, 0.4)',
        'glow-pink': '0 0 15px -3px rgba(236, 72, 153, 0.4)',
        'glow-blue': '0 0 15px -3px rgba(59, 130, 246, 0.4)',
      }
    },
  },
  plugins: [],
}
