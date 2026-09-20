/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pos: {
          surface: '#ffffff',
          subtle: '#f8fafc',
          muted: '#f1f5f9',
          border: '#e2e8f0',
          'border-strong': '#cbd5e1',
          text: '#0f172a',
          'text-muted': '#64748b',
          'text-subtle': '#94a3b8',
          brand: '#0284c7', // Slate Blue / Cyan técnico profesional
          'brand-hover': '#0369a1',
          success: '#16a34a', // Verde transaccional nítido
          'success-hover': '#15803d',
          danger: '#dc2626',
          'danger-hover': '#b91c1c',
          warning: '#d97706',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
      },
      boxShadow: {
        'pos-card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'pos-key': '0 2px 0 0 #cbd5e1',
        'pos-key-active': '0 0 0 0 transparent',
      },
    },
  },
  plugins: [],
}
