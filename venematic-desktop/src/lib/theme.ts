export interface ThemePalette {
  id: string;
  name: string;
  tagline: string;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  accent: string;
  glow: string;
  glassBorder: string;
  colorName: string; // Tailwind color family
  swatchGradient: string;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'sky',
    name: 'Azul Industrial',
    tagline: 'Por defecto • Minimarkets y Comercio General',
    primary: '#0369a1',
    primaryHover: '#075985',
    primaryLight: '#f0f9ff',
    primaryBorder: '#7dd3fc',
    accent: '#0284c7',
    glow: 'rgba(2, 132, 199, 0.35)',
    glassBorder: 'rgba(56, 189, 248, 0.30)',
    colorName: 'sky',
    swatchGradient: 'from-sky-500 to-sky-700',
  },
  {
    id: 'emerald',
    name: 'Verde Esmeralda',
    tagline: 'Supermercados, Fruterías y Abastos Frescos',
    primary: '#047857',
    primaryHover: '#065f46',
    primaryLight: '#ecfdf5',
    primaryBorder: '#6ee7b7',
    accent: '#059669',
    glow: 'rgba(5, 150, 105, 0.35)',
    glassBorder: 'rgba(52, 211, 153, 0.30)',
    colorName: 'emerald',
    swatchGradient: 'from-emerald-500 to-emerald-700',
  },
  {
    id: 'blue',
    name: 'Azul Corporativo',
    tagline: 'Banca, Retail y Distribuidoras Mayoristas',
    primary: '#1d4ed8',
    primaryHover: '#1e40af',
    primaryLight: '#eff6ff',
    primaryBorder: '#93c5fd',
    accent: '#2563eb',
    glow: 'rgba(37, 99, 235, 0.35)',
    glassBorder: 'rgba(96, 165, 250, 0.30)',
    colorName: 'blue',
    swatchGradient: 'from-blue-500 to-blue-700',
  },
  {
    id: 'amber',
    name: 'Ámbar Dorado',
    tagline: 'Panaderías, Pastelerías, Cafés y Dulcerías',
    primary: '#b45309',
    primaryHover: '#92400e',
    primaryLight: '#fffbeb',
    primaryBorder: '#fcd34d',
    accent: '#d97706',
    glow: 'rgba(217, 119, 6, 0.35)',
    glassBorder: 'rgba(251, 191, 36, 0.30)',
    colorName: 'amber',
    swatchGradient: 'from-amber-500 to-amber-700',
  },
  {
    id: 'ruby',
    name: 'Rojo Rubí',
    tagline: 'Carnicerías, Charcuterías y Bodegones',
    primary: '#b91c1c',
    primaryHover: '#991b1b',
    primaryLight: '#fef2f2',
    primaryBorder: '#fca5a5',
    accent: '#dc2626',
    glow: 'rgba(220, 38, 38, 0.35)',
    glassBorder: 'rgba(248, 113, 113, 0.30)',
    colorName: 'red',
    swatchGradient: 'from-red-500 to-red-700',
  },
  {
    id: 'purple',
    name: 'Púrpura Amatista',
    tagline: 'Perfumerías, Cosmética, Boutiques y Moda',
    primary: '#6d28d9',
    primaryHover: '#5b21b6',
    primaryLight: '#f5f3ff',
    primaryBorder: '#d8b4fe',
    accent: '#7c3aed',
    glow: 'rgba(124, 58, 237, 0.35)',
    glassBorder: 'rgba(192, 132, 252, 0.30)',
    colorName: 'purple',
    swatchGradient: 'from-purple-500 to-purple-700',
  },
  {
    id: 'slate',
    name: 'Gris Grafito Titán',
    tagline: 'Ferreterías, Repuestos y Construcción',
    primary: '#334155',
    primaryHover: '#1e293b',
    primaryLight: '#f8fafc',
    primaryBorder: '#cbd5e1',
    accent: '#475569',
    glow: 'rgba(71, 85, 105, 0.35)',
    glassBorder: 'rgba(148, 163, 184, 0.30)',
    colorName: 'slate',
    swatchGradient: 'from-slate-600 to-slate-800',
  },
  {
    id: 'teal',
    name: 'Turquesa Salud',
    tagline: 'Farmacias, Droguerías, Clínicas y Ópticas',
    primary: '#0f766e',
    primaryHover: '#115e59',
    primaryLight: '#f0fdfa',
    primaryBorder: '#5eead4',
    accent: '#0d9488',
    glow: 'rgba(13, 148, 136, 0.35)',
    glassBorder: 'rgba(45, 212, 191, 0.30)',
    colorName: 'teal',
    swatchGradient: 'from-teal-500 to-teal-700',
  },
  {
    id: 'coral',
    name: 'Coral Sunset',
    tagline: 'Pizzerías, Fast Food, Snacks y Juguerías',
    primary: '#c2410c',
    primaryHover: '#9a3412',
    primaryLight: '#fff7ed',
    primaryBorder: '#fdba74',
    accent: '#ea580c',
    glow: 'rgba(234, 88, 12, 0.35)',
    glassBorder: 'rgba(251, 146, 60, 0.30)',
    colorName: 'orange',
    swatchGradient: 'from-orange-500 to-orange-700',
  },
  {
    id: 'indigo',
    name: 'Índigo Tech',
    tagline: 'Electrónica, Computación y Celulares',
    primary: '#4338ca',
    primaryHover: '#3730a3',
    primaryLight: '#eef2ff',
    primaryBorder: '#a5b4fc',
    accent: '#4f46e5',
    glow: 'rgba(79, 70, 229, 0.35)',
    glassBorder: 'rgba(129, 140, 248, 0.30)',
    colorName: 'indigo',
    swatchGradient: 'from-indigo-500 to-indigo-700',
  },
];

export type UIStyleMode = 'industrial' | 'glassmorphism';

export type IndustrialBgPreset = 'white' | 'teal' | 'blue' | 'gray' | 'custom';

export interface IndustrialBgOption {
  id: IndustrialBgPreset;
  name: string;
  tagline: string;
  bgColor: string;
  previewColor: string;
  borderPreview: string;
}

export const INDUSTRIAL_BG_PRESETS: IndustrialBgOption[] = [
  {
    id: 'white',
    name: 'Blanco Puro Profesional',
    tagline: 'Fondo blanco 100% limpio, máxima nitidez y cero fatiga (#ffffff)',
    bgColor: '#ffffff',
    previewColor: '#ffffff',
    borderPreview: '#cbd5e1',
  },
  {
    id: 'teal',
    name: 'Turquesa Suave (Menta)',
    tagline: 'Frescura visual que relaja la vista en jornadas de caja largas (#f0fdfa)',
    bgColor: '#f0fdfa',
    previewColor: '#14b8a6',
    borderPreview: '#99f6e4',
  },
  {
    id: 'blue',
    name: 'Azul Hielo Ejecutivo',
    tagline: 'Tono azul corporativo suave para retail y farmacias (#f0f9ff)',
    bgColor: '#f0f9ff',
    previewColor: '#38bdf8',
    borderPreview: '#bae6fd',
  },
  {
    id: 'gray',
    name: 'Gris Titán Neutro',
    tagline: 'Gris moderno para ferreterías, repuestos y depósitos (#f1f5f9)',
    bgColor: '#f1f5f9',
    previewColor: '#94a3b8',
    borderPreview: '#cbd5e1',
  },
  {
    id: 'custom',
    name: 'Color Picker Personalizado',
    tagline: 'Selecciona libremente cualquier tono de color de fondo con el selector',
    bgColor: '#ffffff',
    previewColor: '#6366f1',
    borderPreview: '#818cf8',
  },
];

export interface BrandingConfig {
  paletteId: string;
  uiStyle: UIStyleMode;
  industrialBg?: IndustrialBgPreset;
  customBgColor?: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  paletteId: 'sky',
  uiStyle: 'industrial',
  industrialBg: 'white',
  customBgColor: '#f8fafc',
};

export function getLuminance(hex: string): number {
  try {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  } catch {
    return 1;
  }
}

export interface IndustrialThemeVariables {
  bgColor: string;
  cardColor: string;
  textColor: string;
  textMuted: string;
  borderColor: string;
  primaryBg: string;
  primaryHover: string;
  secondaryBg: string;
  secondaryBorder: string;
  secondaryText: string;
}

export function computeIndustrialThemeVariables(
  preset: IndustrialBgPreset,
  customHex?: string,
  activePalettePrimary?: string,
  activePaletteHover?: string
): IndustrialThemeVariables {
  const brandPrimary = activePalettePrimary || '#0369a1';
  const brandHover = activePaletteHover || '#075985';

  if (preset === 'teal') {
    return {
      bgColor: '#f0fdfa', // Mint soft
      cardColor: '#ffffff',
      textColor: '#042f2e', // Deep teal 950
      textMuted: '#115e59', // Teal 800
      borderColor: '#99f6e4', // Teal 200
      primaryBg: brandPrimary,
      primaryHover: brandHover,
      secondaryBg: '#ffffff',
      secondaryBorder: '#5eead4',
      secondaryText: '#0f766e',
    };
  }
  if (preset === 'blue') {
    return {
      bgColor: '#f0f9ff', // Ice blue soft
      cardColor: '#ffffff',
      textColor: '#082f49', // Sky 950
      textMuted: '#0369a1', // Sky 700
      borderColor: '#bae6fd', // Sky 200
      primaryBg: brandPrimary,
      primaryHover: brandHover,
      secondaryBg: '#ffffff',
      secondaryBorder: '#7dd3fc',
      secondaryText: '#0284c7',
    };
  }
  if (preset === 'gray') {
    return {
      bgColor: '#f1f5f9', // Slate soft
      cardColor: '#ffffff',
      textColor: '#0f172a', // Slate 900
      textMuted: '#334155', // Slate 700
      borderColor: '#cbd5e1', // Slate 300
      primaryBg: brandPrimary,
      primaryHover: brandHover,
      secondaryBg: '#ffffff',
      secondaryBorder: '#cbd5e1',
      secondaryText: '#1e293b',
    };
  }
  if (preset === 'custom' && customHex) {
    const isLight = getLuminance(customHex) > 0.5;
    if (isLight) {
      return {
        bgColor: customHex,
        cardColor: '#ffffff',
        textColor: '#0f172a',
        textMuted: '#334155',
        borderColor: '#cbd5e1',
        primaryBg: brandPrimary,
        primaryHover: brandHover,
        secondaryBg: '#ffffff',
        secondaryBorder: '#cbd5e1',
        secondaryText: '#0f172a',
      };
    } else {
      // Dark background custom
      return {
        bgColor: customHex,
        cardColor: '#1e293b',
        textColor: '#f8fafc',
        textMuted: '#cbd5e1',
        borderColor: '#334155',
        primaryBg: brandPrimary,
        primaryHover: brandHover,
        secondaryBg: '#0f172a',
        secondaryBorder: '#475569',
        secondaryText: '#f8fafc',
      };
    }
  }

  // Default 'white' (Modo Profesional Blanco / Enhanced Contrast Soft UI)
  return {
    bgColor: '#f3eee7',
    cardColor: '#ffffff',
    textColor: '#0f172a',
    textMuted: '#475569',
    borderColor: '#ded8cd',
    primaryBg: brandPrimary,
    primaryHover: brandHover,
    secondaryBg: '#ede8df',
    secondaryBorder: '#ded8cd',
    secondaryText: '#334155',
  };
}

export function applyBrandingToDOM(config: BrandingConfig) {
  if (typeof window === 'undefined') return;

  const palette = THEME_PALETTES.find((p) => p.id === config.paletteId) || THEME_PALETTES[0];
  const root = document.documentElement;

  root.setAttribute('data-theme-palette', palette.id);
  root.setAttribute('data-ui-style', config.uiStyle);

  // Background y Adaptabilidad Dinámica para Modo Industrial Profesional
  const industrialBgPreset = config.industrialBg || 'white';
  const customHex = config.customBgColor || '#f8fafc';
  const themeVars = computeIndustrialThemeVariables(
    industrialBgPreset,
    customHex,
    palette.primary,
    palette.primaryHover
  );

  root.setAttribute('data-industrial-bg', industrialBgPreset);
  root.style.setProperty('--industrial-bg', themeVars.bgColor);
  root.style.setProperty('--industrial-card', themeVars.cardColor);
  root.style.setProperty('--industrial-text', themeVars.textColor);
  root.style.setProperty('--industrial-text-muted', themeVars.textMuted);
  root.style.setProperty('--industrial-border', themeVars.borderColor);
  root.style.setProperty('--btn-primary-bg', themeVars.primaryBg);
  root.style.setProperty('--btn-primary-hover', themeVars.primaryHover);
  root.style.setProperty('--btn-secondary-bg', themeVars.secondaryBg);
  root.style.setProperty('--btn-secondary-border', themeVars.secondaryBorder);
  root.style.setProperty('--btn-secondary-text', themeVars.secondaryText);

  // Set CSS Variables de Marca
  root.style.setProperty('--brand-primary', palette.primary);
  root.style.setProperty('--brand-hover', palette.primaryHover);
  root.style.setProperty('--brand-light', palette.primaryLight);
  root.style.setProperty('--brand-border', palette.primaryBorder);
  root.style.setProperty('--brand-accent', palette.accent);
  root.style.setProperty('--brand-glow', palette.glow);
  root.style.setProperty('--brand-glass-border', palette.glassBorder);

  if (document.body) {
    if (config.uiStyle === 'industrial') {
      document.body.style.backgroundColor = themeVars.bgColor;
      document.body.style.color = themeVars.textColor;
    } else {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }
  }

  // Trigger event for listeners
  window.dispatchEvent(new CustomEvent('venematic:branding_updated', { detail: config }));
}
