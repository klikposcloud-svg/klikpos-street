import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'Venematic POS Local - Terminal Comercial',
  description: 'Sistema de Punto de Venta Local y Offline para Comercios',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0369a1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="darkreader-lock" content="true" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = localStorage.getItem('venematic_branding_palette') || 'sky';
                  var s = localStorage.getItem('venematic_ui_style') || 'industrial';
                  var bgPreset = localStorage.getItem('venematic_industrial_bg') || 'white';
                  var customBg = localStorage.getItem('venematic_custom_bg_color') || '#f8fafc';
                  var palettes = {
                    sky: { primary: '#0369a1', hover: '#075985', light: '#f0f9ff', border: '#7dd3fc', accent: '#0284c7', glow: 'rgba(2, 132, 199, 0.35)', glassBorder: 'rgba(56, 189, 248, 0.30)' },
                    emerald: { primary: '#047857', hover: '#065f46', light: '#ecfdf5', border: '#6ee7b7', accent: '#059669', glow: 'rgba(5, 150, 105, 0.35)', glassBorder: 'rgba(52, 211, 153, 0.30)' },
                    blue: { primary: '#1d4ed8', hover: '#1e40af', light: '#eff6ff', border: '#93c5fd', accent: '#2563eb', glow: 'rgba(37, 99, 235, 0.35)', glassBorder: 'rgba(96, 165, 250, 0.30)' },
                    amber: { primary: '#b45309', hover: '#92400e', light: '#fffbeb', border: '#fcd34d', accent: '#d97706', glow: 'rgba(217, 119, 6, 0.35)', glassBorder: 'rgba(251, 191, 36, 0.30)' },
                    ruby: { primary: '#b91c1c', hover: '#991b1b', light: '#fef2f2', border: '#fca5a5', accent: '#dc2626', glow: 'rgba(220, 38, 38, 0.35)', glassBorder: 'rgba(248, 113, 113, 0.30)' },
                    purple: { primary: '#6d28d9', hover: '#5b21b6', light: '#f5f3ff', border: '#d8b4fe', accent: '#7c3aed', glow: 'rgba(124, 58, 237, 0.35)', glassBorder: 'rgba(192, 132, 252, 0.30)' },
                    slate: { primary: '#334155', hover: '#1e293b', light: '#f8fafc', border: '#cbd5e1', accent: '#475569', glow: 'rgba(71, 85, 105, 0.35)', glassBorder: 'rgba(148, 163, 184, 0.30)' },
                    teal: { primary: '#0f766e', hover: '#115e59', light: '#f0fdfa', border: '#5eead4', accent: '#0d9488', glow: 'rgba(13, 148, 136, 0.35)', glassBorder: 'rgba(45, 212, 191, 0.30)' },
                    coral: { primary: '#c2410c', hover: '#9a3412', light: '#fff7ed', border: '#fdba74', accent: '#ea580c', glow: 'rgba(234, 88, 12, 0.35)', glassBorder: 'rgba(251, 146, 60, 0.30)' },
                    indigo: { primary: '#4338ca', hover: '#3730a3', light: '#eef2ff', border: '#a5b4fc', accent: '#4f46e5', glow: 'rgba(79, 70, 229, 0.35)', glassBorder: 'rgba(129, 140, 248, 0.30)' }
                  };
                  var pal = palettes[p] || palettes.sky;
                  var root = document.documentElement;
                  root.setAttribute('data-theme-palette', p);
                  root.setAttribute('data-ui-style', s);
                  root.setAttribute('data-industrial-bg', bgPreset);

                  var bgThemes = {
                    white: { bg: '#ffffff', card: '#ffffff', text: '#0f172a', muted: '#475569', border: '#e2e8f0', secBg: '#f8fafc', secBorder: '#cbd5e1', secText: '#1e293b' },
                    teal: { bg: '#f0fdfa', card: '#ffffff', text: '#042f2e', muted: '#115e59', border: '#99f6e4', secBg: '#ffffff', secBorder: '#5eead4', secText: '#0f766e' },
                    blue: { bg: '#f0f9ff', card: '#ffffff', text: '#082f49', muted: '#0369a1', border: '#bae6fd', secBg: '#ffffff', secBorder: '#7dd3fc', secText: '#0284c7' },
                    gray: { bg: '#f1f5f9', card: '#ffffff', text: '#0f172a', muted: '#334155', border: '#cbd5e1', secBg: '#ffffff', secBorder: '#cbd5e1', secText: '#1e293b' }
                  };
                  var ind = bgThemes[bgPreset] || bgThemes.white;
                  if (bgPreset === 'custom') {
                    ind = { bg: customBg, card: '#ffffff', text: '#0f172a', muted: '#334155', border: '#cbd5e1', secBg: '#ffffff', secBorder: '#cbd5e1', secText: '#0f172a' };
                  }

                  root.style.setProperty('--industrial-bg', ind.bg);
                  root.style.setProperty('--industrial-card', ind.card);
                  root.style.setProperty('--industrial-text', ind.text);
                  root.style.setProperty('--industrial-text-muted', ind.muted);
                  root.style.setProperty('--industrial-border', ind.border);
                  root.style.setProperty('--btn-primary-bg', pal.primary);
                  root.style.setProperty('--btn-primary-hover', pal.hover);
                  root.style.setProperty('--btn-secondary-bg', ind.secBg);
                  root.style.setProperty('--btn-secondary-border', ind.secBorder);
                  root.style.setProperty('--btn-secondary-text', ind.secText);

                  root.style.setProperty('--brand-primary', pal.primary);
                  root.style.setProperty('--brand-hover', pal.hover);
                  root.style.setProperty('--brand-light', pal.light);
                  root.style.setProperty('--brand-border', pal.border);
                  root.style.setProperty('--brand-accent', pal.accent);
                  root.style.setProperty('--brand-glow', pal.glow);
                  root.style.setProperty('--brand-glass-border', pal.glassBorder);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="antialiased selection:bg-sky-100 selection:text-sky-900 min-h-screen"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
