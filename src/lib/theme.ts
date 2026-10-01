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
    id: 'petrol',
    name: 'Verde Petróleo Comercial',
    tagline: 'Diseño Oficial • Supermercados, Minimarkets y Comercio Retail',
    primary: '#0e4f5a',
    primaryHover: '#0a3d46',
    primaryLight: '#e6f4f6',
    primaryBorder: '#7fc1cc',
    accent: '#0a3d46',
    glow: 'rgba(14, 79, 90, 0.35)',
    glassBorder: 'rgba(127, 193, 204, 0.30)',
    colorName: 'teal',
    swatchGradient: 'from-teal-800 to-cyan-900',
  },
  {
    id: 'sky',
    name: 'Azul Industrial',
    tagline: 'Minimarkets y Comercio General',
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
    id: 'clinic_cyan',
    name: 'Cyan Clínico & Hospitalario',
    tagline: 'Clínicas, Hospitales, Consultorios Médicos y Laboratorios',
    primary: '#0284c7',
    primaryHover: '#0369a1',
    primaryLight: '#f0f9ff',
    primaryBorder: '#7dd3fc',
    accent: '#0ea5e9',
    glow: 'rgba(2, 132, 199, 0.35)',
    glassBorder: 'rgba(56, 189, 248, 0.30)',
    colorName: 'sky',
    swatchGradient: 'from-cyan-600 to-sky-700',
  },
  {
    id: 'clinic_mint',
    name: 'Verde Quirúrgico / Menta Salud',
    tagline: 'Quirófanos, Odontología, Pediatría y Fisioterapia',
    primary: '#0d9488',
    primaryHover: '#0f766e',
    primaryLight: '#f0fdfa',
    primaryBorder: '#5eead4',
    accent: '#14b8a6',
    glow: 'rgba(13, 148, 136, 0.35)',
    glassBorder: 'rgba(45, 212, 191, 0.30)',
    colorName: 'teal',
    swatchGradient: 'from-teal-600 to-emerald-700',
  },
  {
    id: 'clinic_lavender',
    name: 'Lavanda Terapéutica & Relax',
    tagline: 'Centros Médicos, Salud Mental, Dermatología y Estética',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: '#f5f3ff',
    primaryBorder: '#c4b5fd',
    accent: '#8b5cf6',
    glow: 'rgba(124, 58, 237, 0.35)',
    glassBorder: 'rgba(167, 139, 250, 0.30)',
    colorName: 'purple',
    swatchGradient: 'from-violet-600 to-purple-700',
  },
  {
    id: 'clinic_rose',
    name: 'Rosa Maternidad & Pediatría',
    tagline: 'Ginecología, Maternidad, Cuidados de Salud y Spa',
    primary: '#db2777',
    primaryHover: '#be185d',
    primaryLight: '#fdf2f8',
    primaryBorder: '#f9a8d4',
    accent: '#ec4899',
    glow: 'rgba(219, 39, 119, 0.35)',
    glassBorder: 'rgba(244, 114, 182, 0.30)',
    colorName: 'pink',
    swatchGradient: 'from-pink-600 to-rose-700',
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

export type UIStyleMode = 'industrial' | 'glassmorphism' | 'dark';

export type IndustrialBgPreset = 'white' | 'cream' | 'teal' | 'clinic_cyan_bg' | 'clinic_mint_bg' | 'clinic_lavender_bg' | 'blue' | 'gray' | 'custom';

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
    tagline: 'Fondo blanco 100% nítido, tarjetas elevadas y máxima claridad visual (#ffffff)',
    bgColor: '#ffffff',
    previewColor: '#ffffff',
    borderPreview: '#cbd5e1',
  },
  {
    id: 'cream',
    name: 'Crema Suave / Soft Warm',
    tagline: 'Tono marfil cálido elegante que reduce el cansancio visual (#f4ede4)',
    bgColor: '#f4ede4',
    previewColor: '#f4ede4',
    borderPreview: '#ded8cd',
  },
  {
    id: 'teal',
    name: 'Turquesa Suave (Menta)',
    tagline: 'Frescura visual que relaja la vista en jornadas de caja largas (#e6f7f5)',
    bgColor: '#e6f7f5',
    previewColor: '#14b8a6',
    borderPreview: '#99f6e4',
  },
  {
    id: 'clinic_cyan_bg',
    name: 'Cian Sanitario Clínico',
    tagline: 'Azul glaciar sanitario esterilizado para clínicas y laboratorios (#edf8fd)',
    bgColor: '#edf8fd',
    previewColor: '#0ea5e9',
    borderPreview: '#7dd3fc',
  },
  {
    id: 'clinic_mint_bg',
    name: 'Menta Quirúrgico Relajante',
    tagline: 'Tono menta médico que calma y armoniza consultorios y clínicas (#edfcf7)',
    bgColor: '#edfcf7',
    previewColor: '#10b981',
    borderPreview: '#6ee7b7',
  },
  {
    id: 'clinic_lavender_bg',
    name: 'Lavanda Terapéutica',
    tagline: 'Fondo lila suave y armónico para salud, estética y psicología (#f6f4fd)',
    bgColor: '#f6f4fd',
    previewColor: '#8b5cf6',
    borderPreview: '#c4b5fd',
  },
  {
    id: 'blue',
    name: 'Azul Hielo Ejecutivo',
    tagline: 'Tono azul corporativo suave para retail y farmacias (#e8f3fc)',
    bgColor: '#e8f3fc',
    previewColor: '#38bdf8',
    borderPreview: '#bae6fd',
  },
  {
    id: 'gray',
    name: 'Gris Titán Neutro',
    tagline: 'Gris moderno para ferreterías, repuestos y depósitos (#edf2f7)',
    bgColor: '#edf2f7',
    previewColor: '#94a3b8',
    borderPreview: '#cbd5e1',
  },
  {
    id: 'custom',
    name: 'Color Picker Personalizado',
    tagline: 'Selecciona libremente cualquier tono con contraste automático calibrado',
    bgColor: '#ffffff',
    previewColor: '#6366f1',
    borderPreview: '#818cf8',
  },
];

export type DarkBgPreset = 'oled' | 'graphite' | 'midnight' | 'emerald' | 'purple' | 'custom';

export interface DarkBgOption {
  id: DarkBgPreset;
  name: string;
  tagline: string;
  bgColor: string;
  cardColor: string;
  borderColor: string;
  previewColor: string;
  borderPreview: string;
}

export const DARK_BG_PRESETS: DarkBgOption[] = [
  {
    id: 'oled',
    name: 'Negro Puro OLED',
    tagline: 'Negro absoluto (#000000) de máximo contraste, cero reflejos y menor consumo',
    bgColor: '#000000',
    cardColor: '#09090b',
    borderColor: '#27272a',
    previewColor: '#000000',
    borderPreview: '#3f3f46',
  },
  {
    id: 'graphite',
    name: 'Grafito Carbón Neutro',
    tagline: 'Gris antracita sobrio sin tinte azulado (#121212) para máxima elegancia',
    bgColor: '#121212',
    cardColor: '#18181b',
    borderColor: '#27272a',
    previewColor: '#18181b',
    borderPreview: '#3f3f46',
  },
  {
    id: 'midnight',
    name: 'Azul Medianoche',
    tagline: 'Azul marino profundo corporativo (#0a192f) para entornos tecnológicos',
    bgColor: '#0a192f',
    cardColor: '#121c29',
    borderColor: '#1e293b',
    previewColor: '#0f172a',
    borderPreview: '#38bdf8',
  },
  {
    id: 'emerald',
    name: 'Esmeralda Nocturno',
    tagline: 'Verde bosque oscuro refinado (#051814) ideal para cajas, bancos y finanzas',
    bgColor: '#051814',
    cardColor: '#09231d',
    borderColor: '#113a30',
    previewColor: '#062820',
    borderPreview: '#10b981',
  },
  {
    id: 'purple',
    name: 'Púrpura Nocturno',
    tagline: 'Índigo oscuro sofisticado (#0f0d24) para boutiques, restaurantes y cafés',
    bgColor: '#0f0d24',
    cardColor: '#181534',
    borderColor: '#2a2455',
    previewColor: '#1e1b4b',
    borderPreview: '#a855f7',
  },
  {
    id: 'custom',
    name: 'Tono Oscuro Libre (Hex)',
    tagline: 'Define cualquier color hexadecimal con calibración automática de contraste WCAG',
    bgColor: '#0f172a',
    cardColor: '#1e293b',
    borderColor: '#334155',
    previewColor: '#6366f1',
    borderPreview: '#818cf8',
  },
];

export interface BrandingConfig {
  paletteId: string;
  uiStyle: UIStyleMode;
  industrialBg?: IndustrialBgPreset;
  customBgColor?: string;
  darkBg?: DarkBgPreset;
  customDarkBgColor?: string;
  // Personalización integral avanzada (Header, Sidebar, Botones y Texto)
  headerBgColor?: string;
  headerTextColor?: string;
  sidebarBgColor?: string;
  sidebarTextColor?: string;
  buttonAccentColor?: string;
  buttonTextColor?: string;
  generalTextColor?: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  paletteId: 'petrol',
  uiStyle: 'industrial',
  industrialBg: 'white',
  customBgColor: '#eef2f5',
  darkBg: 'midnight',
  customDarkBgColor: '#0a192f',
  headerBgColor: '',
  headerTextColor: '',
  sidebarBgColor: '',
  sidebarTextColor: '',
  buttonAccentColor: '',
  buttonTextColor: '',
  generalTextColor: '',
};

/**
 * Calcula la luminancia relativa conforme al estándar WCAG 2.1 (sRGB)
 */
export function getRelativeLuminance(hex: string): number {
  try {
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    if (isNaN(num)) return 1;
    const r8 = (num >> 16) & 255;
    const g8 = (num >> 8) & 255;
    const b8 = num & 255;

    const toLinear = (c: number) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };

    const r = toLinear(r8);
    const g = toLinear(g8);
    const b = toLinear(b8);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  } catch {
    return 1;
  }
}

export function getLuminance(hex: string): number {
  return getRelativeLuminance(hex);
}

/**
 * Calcula el ratio de contraste WCAG entre dos colores hex (ej: 4.5:1, 7:1)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Determina si el texto debe ser blanco (#ffffff) o ultra-oscuro (#090d16)
 * para garantizar el ratio de contraste máximo según WCAG AAA.
 */
export function getHighContrastTextColor(bgHex: string): string {
  const ratioWithWhite = getContrastRatio(bgHex, '#ffffff');
  const ratioWithDark = getContrastRatio(bgHex, '#090d16');
  return ratioWithWhite >= ratioWithDark ? '#ffffff' : '#090d16';
}

/**
 * Determina el color atenuado (subtítulos/bordes secundarios) con contraste verificado
 */
export function getHighContrastMutedColor(bgHex: string): string {
  const ratioWithWhite = getContrastRatio(bgHex, '#ffffff');
  const ratioWithDark = getContrastRatio(bgHex, '#090d16');
  return ratioWithWhite >= ratioWithDark ? '#cbd5e1' : '#475569';
}

export interface IndustrialThemeVariables {
  bgColor: string;
  cardColor: string;
  textColor: string;
  textMuted: string;
  borderColor: string;
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
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
  const primaryText = getHighContrastTextColor(brandPrimary);

  // 1. Blanco Puro Profesional (#ffffff)
  if (preset === 'white') {
    const secBg = '#f1f5f9'; // Slate 100 suave para botones secundarios e inputs
    return {
      bgColor: '#ffffff',
      cardColor: '#ffffff',
      textColor: '#0f172a', // Slate 900
      textMuted: '#334155', // Slate 700
      borderColor: '#cbd5e1', // Slate 300 nítido
      primaryBg: brandPrimary,
      primaryHover: brandHover,
      primaryText,
      secondaryBg: secBg,
      secondaryBorder: '#cbd5e1',
      secondaryText: getHighContrastTextColor(secBg),
    };
  }

  // 2. Crema Cálido Soft UI (#f4ede4)
  if (preset === 'cream') {
    const secBg = '#ede8df';
    return {
      bgColor: '#f4ede4',
      cardColor: '#ffffff',
      textColor: '#0f172a',
      textMuted: '#475569',
      borderColor: '#ded8cd',
      primaryBg: brandPrimary,
      primaryHover: brandHover,
      primaryText,
      secondaryBg: secBg,
      secondaryBorder: '#ded8cd',
      secondaryText: getHighContrastTextColor(secBg),
    };
  }

  // 3. Turquesa Suave (Menta) (#e6f7f5)
  if (preset === 'teal') {
    const secBg = '#d1fae5';
    return {
      bgColor: '#e6f7f5',
      cardColor: '#ffffff',
      textColor: '#042f2e',
      textMuted: '#115e59',
      borderColor: '#99f6e4',
      primaryBg: brandPrimary,
      primaryHover: brandHover,
      primaryText,
      secondaryBg: secBg,
      secondaryBorder: '#5eead4',
      secondaryText: getHighContrastTextColor(secBg),
    };
  }

  // 3.1 Cian Sanitario Clínico (#edf8fd)
  if (preset === 'clinic_cyan_bg') {
    const secBg = '#e0f2fe';
    return {
      bgColor: '#edf8fd',
      cardColor: '#ffffff',
      textColor: '#082f49',
      textMuted: '#0284c7',
      borderColor: '#bae6fd',
      primaryBg: brandPrimary,
      primaryHover: brandHover,
      primaryText,
      secondaryBg: secBg,
      secondaryBorder: '#7dd3fc',
      secondaryText: getHighContrastTextColor(secBg),
    };
  }

  // 3.2 Menta Quirúrgico Relajante (#edfcf7)
  if (preset === 'clinic_mint_bg') {
    const secBg = '#ccfbf1';
    return {
      bgColor: '#edfcf7',
      cardColor: '#ffffff',
      textColor: '#042f2e',
      textMuted: '#0d9488',
      borderColor: '#99f6e4',
      primaryBg: brandPrimary,
      primaryHover: brandHover,
      primaryText,
      secondaryBg: secBg,
      secondaryBorder: '#5eead4',
      secondaryText: getHighContrastTextColor(secBg),
    };
  }

  // 3.3 Lavanda Terapéutica Suave (#f6f4fd)
  if (preset === 'clinic_lavender_bg') {
    const secBg = '#ede9fe';
    return {
      bgColor: '#f6f4fd',
      cardColor: '#ffffff',
      textColor: '#2e1065',
      textMuted: '#6d28d9',
      borderColor: '#ddd6fe',
      primaryBg: brandPrimary,
      primaryHover: brandHover,
      primaryText,
      secondaryBg: secBg,
      secondaryBorder: '#c4b5fd',
      secondaryText: getHighContrastTextColor(secBg),
    };
  }

  // 4. Azul Hielo Ejecutivo (#e8f3fc)
  if (preset === 'blue') {
    const secBg = '#e0f2fe';
    return {
      bgColor: '#e8f3fc',
      cardColor: '#ffffff',
      textColor: '#082f49',
      textMuted: '#0369a1',
      borderColor: '#bae6fd',
      primaryBg: brandPrimary,
      primaryHover: brandHover,
      primaryText,
      secondaryBg: secBg,
      secondaryBorder: '#7dd3fc',
      secondaryText: getHighContrastTextColor(secBg),
    };
  }

  // 5. Gris Titán Neutro (#edf2f7)
  if (preset === 'gray') {
    const secBg = '#e2e8f0';
    return {
      bgColor: '#edf2f7',
      cardColor: '#ffffff',
      textColor: '#0f172a',
      textMuted: '#334155',
      borderColor: '#cbd5e1',
      primaryBg: brandPrimary,
      primaryHover: brandHover,
      primaryText,
      secondaryBg: secBg,
      secondaryBorder: '#94a3b8',
      secondaryText: getHighContrastTextColor(secBg),
    };
  }

  // 6. Color Picker Personalizado (Calibración Dinámica de Alto Contraste)
  if (preset === 'custom' && customHex) {
    const lum = getRelativeLuminance(customHex);
    const isLight = lum > 0.45;
    if (isLight) {
      const secBg = '#f1f5f9';
      return {
        bgColor: customHex,
        cardColor: '#ffffff',
        textColor: '#0f172a',
        textMuted: '#475569',
        borderColor: '#cbd5e1',
        primaryBg: brandPrimary,
        primaryHover: brandHover,
        primaryText,
        secondaryBg: secBg,
        secondaryBorder: '#cbd5e1',
        secondaryText: '#0f172a',
      };
    } else {
      // Fondo Oscuro Personalizado
      const secBg = '#1e2d40';
      return {
        bgColor: customHex,
        cardColor: '#132030',
        textColor: '#ffffff',
        textMuted: '#cbd5e1',
        borderColor: '#2b3e55',
        primaryBg: brandPrimary,
        primaryHover: brandHover,
        primaryText,
        secondaryBg: secBg,
        secondaryBorder: '#334a66',
        secondaryText: '#ffffff',
      };
    }
  }

  // Fallback seguro: Blanco Puro Profesional
  const fallbackSecBg = '#f1f5f9';
  return {
    bgColor: '#ffffff',
    cardColor: '#ffffff',
    textColor: '#0f172a',
    textMuted: '#334155',
    borderColor: '#cbd5e1',
    primaryBg: brandPrimary,
    primaryHover: brandHover,
    primaryText,
    secondaryBg: fallbackSecBg,
    secondaryBorder: '#cbd5e1',
    secondaryText: getHighContrastTextColor(fallbackSecBg),
  };
}

export interface DarkThemeVariables {
  bgColor: string;
  cardColor: string;
  textColor: string;
  textMuted: string;
  borderColor: string;
  primaryBg: string;
  primaryHover: string;
  primaryText: string;
  secondaryBg: string;
  secondaryBorder: string;
  secondaryText: string;
}

export function computeDarkThemeVariables(
  preset: DarkBgPreset,
  customHex?: string,
  activePalettePrimary?: string,
  activePaletteHover?: string
): DarkThemeVariables {
  const brandPrimary = activePalettePrimary || '#0369a1';
  const brandHover = activePaletteHover || '#075985';
  const primaryText = getHighContrastTextColor(brandPrimary);

  let bg = '#0a192f';
  let card = '#121c29';
  let border = '#1e293b';

  if (preset === 'oled') {
    bg = '#000000';
    card = '#09090b';
    border = '#27272a';
  } else if (preset === 'graphite') {
    bg = '#121212';
    card = '#18181b';
    border = '#27272a';
  } else if (preset === 'emerald') {
    bg = '#051814';
    card = '#09231d';
    border = '#113a30';
  } else if (preset === 'purple') {
    bg = '#0f0d24';
    card = '#181534';
    border = '#2a2455';
  } else if (preset === 'custom' && customHex) {
    bg = customHex;
    card = 'color-mix(in srgb, ' + customHex + ' 80%, white 20%)';
    border = 'color-mix(in srgb, ' + customHex + ' 60%, white 40%)';
  } else {
    // midnight default
    bg = '#0a192f';
    card = '#121c29';
    border = '#1e293b';
  }

  return {
    bgColor: bg,
    cardColor: card,
    textColor: '#f8fafc',
    textMuted: '#94a3b8',
    borderColor: border,
    primaryBg: brandPrimary,
    primaryHover: brandHover,
    primaryText,
    secondaryBg: card,
    secondaryBorder: border,
    secondaryText: '#f8fafc',
  };
}

export function applyBrandingToDOM(config: BrandingConfig, forceTheme?: 'light' | 'dark' | 'glass') {
  if (typeof window === 'undefined') return;

  const palette = THEME_PALETTES.find((p) => p.id === config.paletteId) || THEME_PALETTES[0];
  const root = document.documentElement;

  // Determinar tema con máxima prioridad a forceTheme
  let activeTheme: ThemeMode = 'light';
  if (forceTheme) {
    activeTheme = forceTheme;
  } else {
    const savedTheme = (typeof window !== 'undefined' ? localStorage.getItem('venematic_theme') : null) as ThemeMode | null;
    if (savedTheme === 'glass' || savedTheme === 'dark' || savedTheme === 'light') {
      activeTheme = savedTheme;
    } else {
      const attr = root.getAttribute('data-theme');
      if (attr === 'glass') activeTheme = 'glass';
      else if (attr === 'dark' || root.classList.contains('dark')) activeTheme = 'dark';
      else activeTheme = 'light';
    }
  }

  const isLight = activeTheme === 'light';
  const isGlass = activeTheme === 'glass';
  const isDark = activeTheme === 'dark' || isGlass;

  root.setAttribute('data-theme-palette', palette.id);

  // Background y Adaptabilidad Dinámica para Modo Industrial Profesional
  const industrialBgPreset = config.industrialBg || 'white';
  const customHex = config.customBgColor || '#f8fafc';
  const themeVars = computeIndustrialThemeVariables(
    industrialBgPreset,
    customHex,
    palette.primary,
    palette.primaryHover
  );

  // Background y Adaptabilidad Dinámica para Modo Oscuro Personalizable
  const darkBgPreset = config.darkBg || (typeof window !== 'undefined' ? localStorage.getItem('venematic_dark_bg') as DarkBgPreset : null) || 'midnight';
  const customDarkHex = config.customDarkBgColor || (typeof window !== 'undefined' ? localStorage.getItem('venematic_custom_dark_bg') : null) || '#0a192f';
  const darkThemeVars = computeDarkThemeVariables(
    darkBgPreset,
    customDarkHex,
    palette.primary,
    palette.primaryHover
  );

  if (isLight) {
    root.setAttribute('data-industrial-bg', industrialBgPreset);
    root.style.setProperty('--industrial-bg', themeVars.bgColor);
    root.style.setProperty('--industrial-card', themeVars.cardColor);
    root.style.setProperty('--industrial-text', themeVars.textColor);
    root.style.setProperty('--industrial-text-muted', themeVars.textMuted);
    root.style.setProperty('--industrial-border', themeVars.borderColor);
    root.style.setProperty('--color-bg-app', themeVars.bgColor);
    root.style.setProperty('--color-bg-surface', themeVars.cardColor);
  } else if (isGlass) {
    root.setAttribute('data-industrial-bg', 'glass');
    root.style.setProperty('--industrial-bg', '#070e17');
    root.style.setProperty('--industrial-card', 'rgba(18, 28, 41, 0.7)');
    root.style.setProperty('--industrial-text', '#f8fafc');
    root.style.setProperty('--industrial-text-muted', '#94a3b8');
    root.style.setProperty('--industrial-border', 'rgba(255, 255, 255, 0.14)');
    root.style.setProperty('--color-bg-app', '#070e17');
    root.style.setProperty('--color-bg-surface', 'rgba(18, 28, 41, 0.7)');
  } else {
    // Modo Oscuro Personalizable (OLED, Carbón, Azul Medianoche, Esmeralda, Púrpura)
    root.setAttribute('data-industrial-bg', 'dark');
    root.setAttribute('data-dark-bg', darkBgPreset);
    root.style.setProperty('--industrial-bg', darkThemeVars.bgColor);
    root.style.setProperty('--industrial-card', darkThemeVars.cardColor);
    root.style.setProperty('--industrial-text', darkThemeVars.textColor);
    root.style.setProperty('--industrial-text-muted', darkThemeVars.textMuted);
    root.style.setProperty('--industrial-border', darkThemeVars.borderColor);
    root.style.setProperty('--color-bg-app', darkThemeVars.bgColor);
    root.style.setProperty('--color-bg-surface', darkThemeVars.cardColor);
  }
  // 4. Variables de Personalización Integral Avanzada (Header, Sidebar, Botones, Textos)
  const currentBaseBg = isLight ? themeVars.bgColor : (isGlass ? 'rgba(11, 26, 48, 0.85)' : darkThemeVars.bgColor);
  const currentBaseText = isLight ? themeVars.textColor : (isGlass ? '#f8fafc' : darkThemeVars.textColor);

  const headerBg = config.headerBgColor || currentBaseBg;
  const headerText = config.headerTextColor || currentBaseText;
  const sidebarBg = config.sidebarBgColor || currentBaseBg;
  const sidebarText = config.sidebarTextColor || currentBaseText;
  const btnAccent = config.buttonAccentColor || palette.primary;
  const btnAccentText = config.buttonTextColor || themeVars.primaryText;
  const generalText = config.generalTextColor || currentBaseText;

  root.style.setProperty('--header-bg', headerBg);
  root.style.setProperty('--header-text', headerText);
  root.style.setProperty('--sidebar-bg', sidebarBg);
  root.style.setProperty('--sidebar-text', sidebarText);
  root.style.setProperty('--btn-accent-active', btnAccent);
  root.style.setProperty('--btn-accent-text', btnAccentText);
  root.style.setProperty('--general-text', generalText);

  // Sobrescribir primary con botón de acento personalizado si existe
  if (config.buttonAccentColor) {
    root.style.setProperty('--btn-primary-bg', config.buttonAccentColor);
    root.style.setProperty('--btn-primary-hover', config.buttonAccentColor);
    root.style.setProperty('--brand-primary', config.buttonAccentColor);
  } else {
    root.style.setProperty('--btn-primary-bg', themeVars.primaryBg);
    root.style.setProperty('--btn-primary-hover', themeVars.primaryHover);
    root.style.setProperty('--brand-primary', palette.primary);
  }

  if (config.buttonTextColor) {
    root.style.setProperty('--btn-primary-text', config.buttonTextColor);
  } else {
    root.style.setProperty('--btn-primary-text', themeVars.primaryText);
  }

  root.style.setProperty('--btn-secondary-bg', themeVars.secondaryBg);
  root.style.setProperty('--btn-secondary-border', themeVars.secondaryBorder);
  root.style.setProperty('--btn-secondary-text', themeVars.secondaryText);

  // Set CSS Variables de Marca
  root.style.setProperty('--brand-hover', palette.primaryHover);
  root.style.setProperty('--brand-contrast-text', themeVars.primaryText);
  root.style.setProperty('--brand-light', palette.primaryLight);
  root.style.setProperty('--brand-border', palette.primaryBorder);
  root.style.setProperty('--brand-accent', palette.accent);
  root.style.setProperty('--brand-glow', palette.glow);
  root.style.setProperty('--brand-glass-border', palette.glassBorder);
  root.style.setProperty('--color-brand-600', config.buttonAccentColor || palette.primary);
  root.style.setProperty('--color-brand-700', palette.primaryHover);

  if (isLight) {
    root.setAttribute('data-theme', 'light');
    root.setAttribute('data-ui-style', 'industrial');
    root.classList.remove('dark');
    root.classList.remove('theme-glass');
    root.style.backgroundColor = themeVars.bgColor;
    root.style.backgroundImage = 'none';
    root.style.color = generalText;
    (root.style as any).colorScheme = 'light';
    if (document.body) {
      document.body.classList.remove('dark');
      document.body.classList.remove('theme-glass');
      document.body.style.backgroundColor = themeVars.bgColor;
      document.body.style.backgroundImage = 'none';
      document.body.style.color = generalText;
      (document.body.style as any).colorScheme = 'light';
    }
  } else if (isGlass) {
    root.setAttribute('data-theme', 'glass');
    root.setAttribute('data-ui-style', 'glassmorphism');
    root.classList.add('dark');
    root.classList.add('theme-glass');
    const glassBg = 'radial-gradient(circle at 15% 20%, rgba(2, 132, 199, 0.28) 0%, transparent 45%), radial-gradient(circle at 85% 75%, rgba(245, 158, 11, 0.16) 0%, transparent 45%), radial-gradient(circle at 50% 50%, rgba(13, 148, 136, 0.12) 0%, transparent 60%), #070e17';
    root.style.backgroundColor = '#070e17';
    root.style.backgroundImage = glassBg;
    root.style.color = '#f8fafc';
    (root.style as any).colorScheme = 'dark';
    if (document.body) {
      document.body.classList.add('dark');
      document.body.classList.add('theme-glass');
      document.body.style.backgroundColor = '#070e17';
      document.body.style.backgroundImage = glassBg;
      document.body.style.color = '#f8fafc';
      (document.body.style as any).colorScheme = 'dark';
    }
  } else {
    // Modo Oscuro Personalizable (OLED, Carbón, Azul Medianoche, Esmeralda, Púrpura)
    root.setAttribute('data-theme', 'dark');
    root.setAttribute('data-ui-style', 'dark');
    root.classList.add('dark');
    root.classList.remove('theme-glass');
    root.style.backgroundColor = darkThemeVars.bgColor;
    root.style.backgroundImage = 'none';
    root.style.color = darkThemeVars.textColor;
    (root.style as any).colorScheme = 'dark';
    if (document.body) {
      document.body.classList.add('dark');
      document.body.classList.remove('theme-glass');
      document.body.style.backgroundColor = darkThemeVars.bgColor;
      document.body.style.backgroundImage = 'none';
      document.body.style.color = darkThemeVars.textColor;
      (document.body.style as any).colorScheme = 'dark';
    }
  }

  try {
    localStorage.setItem('venematic_theme', activeTheme);
    localStorage.setItem('venematic_ui_style', isLight ? 'industrial' : (isGlass ? 'glassmorphism' : 'dark'));
    localStorage.setItem('venematic_branding_palette', config.paletteId);
    localStorage.setItem('venematic_industrial_bg', industrialBgPreset);
    localStorage.setItem('venematic_dark_bg', darkBgPreset);
    if (config.customBgColor) {
      localStorage.setItem('venematic_custom_bg_color', config.customBgColor);
    }
    if (config.customDarkBgColor) {
      localStorage.setItem('venematic_custom_dark_bg', config.customDarkBgColor);
    }
    if (config.headerBgColor) localStorage.setItem('venematic_header_bg', config.headerBgColor);
    else localStorage.removeItem('venematic_header_bg');

    if (config.headerTextColor) localStorage.setItem('venematic_header_text', config.headerTextColor);
    else localStorage.removeItem('venematic_header_text');

    if (config.sidebarBgColor) localStorage.setItem('venematic_sidebar_bg', config.sidebarBgColor);
    else localStorage.removeItem('venematic_sidebar_bg');

    if (config.sidebarTextColor) localStorage.setItem('venematic_sidebar_text', config.sidebarTextColor);
    else localStorage.removeItem('venematic_sidebar_text');

    if (config.buttonAccentColor) localStorage.setItem('venematic_button_accent', config.buttonAccentColor);
    else localStorage.removeItem('venematic_button_accent');

    if (config.buttonTextColor) localStorage.setItem('venematic_button_text', config.buttonTextColor);
    else localStorage.removeItem('venematic_button_text');

    if (config.generalTextColor) localStorage.setItem('venematic_general_text', config.generalTextColor);
    else localStorage.removeItem('venematic_general_text');
  } catch {}

  // Trigger event for listeners
  window.dispatchEvent(new CustomEvent('venematic:branding_updated', { detail: config }));
  window.dispatchEvent(new CustomEvent('venematic:theme_changed', { detail: activeTheme }));
}

/**
 * §17 Tres Estilos Oficiales:
 * - light: Modo Blanco Profesional
 * - dark: Modo Oscuro Personalizable
 * - glass: Modo Esmerilado Translúcido (Glassmorphism con ambient lighting)
 */
export type ThemeMode = 'light' | 'dark' | 'glass';

export function applyTheme(mode: ThemeMode) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('venematic_theme', mode);
    localStorage.setItem('venematic_ui_style', mode === 'light' ? 'industrial' : (mode === 'glass' ? 'glassmorphism' : 'dark'));
  } catch {}

  const savedPalette = localStorage.getItem('venematic_branding_palette') || 'petrol';
  const savedBg = (localStorage.getItem('venematic_industrial_bg') as IndustrialBgPreset) || 'white';
  const savedCustomBg = localStorage.getItem('venematic_custom_bg_color') || '#f8fafc';
  const savedDarkBg = (localStorage.getItem('venematic_dark_bg') as DarkBgPreset) || 'midnight';
  const savedCustomDarkBg = localStorage.getItem('venematic_custom_dark_bg') || '#0a192f';

  applyBrandingToDOM({
    paletteId: savedPalette,
    uiStyle: mode === 'light' ? 'industrial' : (mode === 'glass' ? 'glassmorphism' : 'dark' as any),
    industrialBg: savedBg,
    customBgColor: savedCustomBg,
    darkBg: savedDarkBg,
    customDarkBgColor: savedCustomDarkBg,
  }, mode);
}

export function getCurrentTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('venematic_theme');
  if (saved === 'glass') return 'glass';
  if (saved === 'dark') return 'dark';
  if (saved === 'light') return 'light';
  if (document.documentElement.getAttribute('data-theme') === 'glass' || document.documentElement.classList.contains('theme-glass')) {
    return 'glass';
  }
  if (document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark') {
    return 'dark';
  }
  return 'light';
}



