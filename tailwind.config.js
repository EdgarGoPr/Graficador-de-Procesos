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
        // Colores Modo Claro
        light: {
          bg: '#F8F9FA',
          surface: '#FFFFFF',
          text: '#1E293B',
          accent: '#0284C7',
          muted: '#64748B',
          border: '#E2E8F0',
          hover: '#F1F5F9',
        },
        // Colores Modo Oscuro
        dark: {
          bg: '#0F172A',
          surface: '#1E293B',
          text: '#E2E8F0',
          accent: '#38BDF8',
          muted: '#94A3B8',
          border: '#334155',
          hover: '#283548',
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
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 15px -3px rgba(56, 189, 248, 0.35)',
        'glow-green': '0 0 15px -3px rgba(16, 185, 129, 0.35)',
        'glow-blue': '0 0 15px -3px rgba(59, 130, 246, 0.35)',
        'glow-amber': '0 0 15px -3px rgba(245, 158, 11, 0.35)',
        'glow-red': '0 0 15px -3px rgba(239, 68, 68, 0.35)',
      }
    },
  },
  plugins: [],
}

