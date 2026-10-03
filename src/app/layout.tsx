import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'KlikPOS Enterprise - Terminal Comercial y Facturación',
  description: 'Sistema Inteligente de Punto de Venta y Facturación Local y Offline',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0e4f5a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="darkreader-lock" content="true" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isTabletPos = typeof window !== 'undefined' && (window.location.pathname.indexOf('/tablet-pos') !== -1 || window.location.hash.indexOf('tablet-pos') !== -1);
                  var t = isTabletPos ? 'dark' : localStorage.getItem('venematic_theme');
                  // Preestablecido: SIEMPRE entrar en Modo Blanco Profesional por defecto
                  if (!t || t !== 'dark' && t !== 'glass') {
                    t = 'light';
                    try { localStorage.setItem('venematic_theme', 'light'); } catch(e) {}
                  }
                  var p = localStorage.getItem('venematic_branding_palette') || 'petrol';
                  var s = t === 'light' ? 'industrial' : (localStorage.getItem('venematic_ui_style') || 'industrial');
                  var bgPreset = t === 'light' ? (localStorage.getItem('venematic_industrial_bg') || 'white') : (localStorage.getItem('venematic_industrial_bg') || 'white');
                  var customBg = localStorage.getItem('venematic_custom_bg_color') || '#ffffff';

                  var palettes = {
                    petrol: { primary: '#0e4f5a', hover: '#0a3d46', light: '#e6f4f6', border: '#7fc1cc', accent: '#0a3d46', glow: 'rgba(14, 79, 90, 0.35)', glassBorder: 'rgba(127, 193, 204, 0.30)' },
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
                  var pal = palettes[p] || palettes.petrol;
                  var root = document.documentElement;
                  var isDark = t === 'dark' || t === 'glass' || s === 'glassmorphism';

                  var bgThemes = {
                    white: { bg: '#ffffff', card: '#ffffff', text: '#0f172a', muted: '#475569', border: '#cbd5e1', secBg: '#f1f5f9', secBorder: '#cbd5e1', secText: '#0f172a' },
                    cream: { bg: '#f3eee7', card: '#ffffff', text: '#0f172a', muted: '#475569', border: '#ded8cd', secBg: '#ede8df', secBorder: '#ded8cd', secText: '#0f172a' },
                    teal: { bg: '#f0fdfa', card: '#ffffff', text: '#042f2e', muted: '#115e59', border: '#99f6e4', secBg: '#e6fffa', secBorder: '#5eead4', secText: '#042f2e' },
                    blue: { bg: '#f0f9ff', card: '#ffffff', text: '#082f49', muted: '#0369a1', border: '#bae6fd', secBg: '#e0f2fe', secBorder: '#7dd3fc', secText: '#082f49' },
                    gray: { bg: '#f1f5f9', card: '#ffffff', text: '#0f172a', muted: '#475569', border: '#cbd5e1', secBg: '#e2e8f0', secBorder: '#cbd5e1', secText: '#0f172a' }
                  };
                  var ind = bgThemes[bgPreset] || bgThemes.white;
                  if (isTabletPos) {
                    isDark = true;
                    ind = { bg: '#070a12', card: '#0c1220', text: '#ffffff', muted: '#94a3b8', border: '#1e293b', secBg: '#090d16', secBorder: '#1e293b', secText: '#ffffff' };
                  }
                  if (bgPreset === 'custom' && customBg) {
                    var hex = customBg.replace('#', '');
                    if (hex.length === 3) hex = hex.split('').map(function(c) { return c + c; }).join('');
                    var num = parseInt(hex, 16);
                    var r = ((num >> 16) & 255) / 255;
                    var g = ((num >> 8) & 255) / 255;
                    var b = (num & 255) / 255;
                    var lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                    if (lum > 0.45) {
                      ind = { bg: customBg, card: '#ffffff', text: '#0f172a', muted: '#475569', border: '#cbd5e1', secBg: '#f1f5f9', secBorder: '#cbd5e1', secText: '#0f172a' };
                    } else {
                      ind = { bg: customBg, card: '#132030', text: '#ffffff', muted: '#cbd5e1', border: '#2b3e55', secBg: '#1e2d40', secBorder: '#334a66', secText: '#ffffff' };
                      isDark = true;
                    }
                  }

                  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
                  root.setAttribute('data-ui-style', isDark ? 'glassmorphism' : s);
                  root.setAttribute('data-theme-palette', p);
                  root.setAttribute('data-industrial-bg', bgPreset);

                  if (isDark) {
                    root.classList.add('dark');
                    root.style.backgroundColor = ind.bg || '#1a2636';
                    root.style.color = ind.text || '#f8fafc';
                    root.style.colorScheme = 'dark';
                  } else {
                    root.classList.remove('dark');
                    root.style.backgroundColor = ind.bg;
                    root.style.color = ind.text;
                    root.style.colorScheme = 'light';
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
                  root.style.setProperty('--color-brand-600', pal.primary);
                  root.style.setProperty('--color-brand-700', pal.hover);
                  root.style.setProperty('--btn-primary-bg', pal.primary);
                  root.style.setProperty('--btn-primary-hover', pal.hover);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="antialiased selection:bg-sky-100 selection:text-sky-900 min-h-screen"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
