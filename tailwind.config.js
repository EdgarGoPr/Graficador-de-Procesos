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
        // Colores Semánticos
        semantic: {
          green: '#10B981',
          blue: '#3B82F6',
          amber: '#F59E0B',
          red: '#EF4444',
          success: '#10B981',
          primary: '#3B82F6',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
        // Colores Modo Claro (Nordic Studio Light)
        light: {
          bg: '#F4F6F9',
          surface: '#FFFFFF',
          text: '#0F2942',
          accent: '#1A85B8',
          muted: '#475569',
          border: '#DCE3EC',
          hover: '#ECF0F5',
        },
        // Colores Modo Oscuro (ProcesStudio Slate Pro Mate)
        dark: {
          bg: '#101726',
          surface: '#1B263B',
          text: '#FFFFFF',
          accent: '#29B6F6',
          muted: '#94A3B8',
          border: '#2B3A55',
          hover: '#24324C',
        },
        // Dynamic theme tokens
        theme: {
          bg: 'var(--theme-bg)',
          canvas: 'var(--theme-canvas-bg)',
          surface: 'var(--theme-surface)',
          'surface-subtle': 'var(--theme-surface-subtle)',
          'surface-hover': 'var(--theme-surface-hover)',
          card: 'var(--theme-card)',
          text: 'var(--theme-text)',
          'text-muted': 'var(--theme-text-muted)',
          accent: 'var(--theme-accent)',
          'accent-hover': 'var(--theme-accent-hover)',
          border: 'var(--theme-border)',
          'border-subtle': 'var(--theme-border-subtle)',
        },
        bpmn: {
          start: '#10B981',
          end: '#EF4444',
          task: '#3B82F6',
          service: '#3B82F6',
          manual: '#F59E0B',
          gateway: '#F59E0B',
          quality: '#10B981',
          timer: '#F59E0B',
          subprocess: '#3B82F6'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        brand: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 15px -3px rgba(41, 182, 246, 0.35)',
        'glow-green': '0 0 15px -3px rgba(16, 185, 129, 0.35)',
        'glow-blue': '0 0 15px -3px rgba(59, 130, 246, 0.35)',
        'glow-amber': '0 0 15px -3px rgba(245, 158, 11, 0.35)',
        'glow-red': '0 0 15px -3px rgba(239, 68, 68, 0.35)',
      }
    },
  },
  plugins: [],
}
