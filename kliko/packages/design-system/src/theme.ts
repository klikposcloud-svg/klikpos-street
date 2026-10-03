export type KlikoThemeMode = 'obsidian' | 'light-graphite';

export interface ThemeColors {
  bgPrimary: string;
  bgSurface: string;
  bgElevated: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  brandPrimary: string;
  brandElectric: string;
  accentGraphite: string;
  tokenGold: string;
  successEmerald: string;
  danger: string;
}

export const KLIKO_THEMES: Record<KlikoThemeMode, ThemeColors> = {
  obsidian: {
    bgPrimary: '#070A12',
    bgSurface: '#0E1424',
    bgElevated: '#172036',
    border: '#1E293B',
    borderSubtle: '#2A374F',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    brandPrimary: '#2563EB',
    brandElectric: '#3B82F6',
    accentGraphite: '#1E293B',
    tokenGold: '#F59E0B',
    successEmerald: '#10B981',
    danger: '#EF4444'
  },
  'light-graphite': {
    bgPrimary: '#F8FAFC',
    bgSurface: '#FFFFFF',
    bgElevated: '#F1F5F9',
    border: '#E2E8F0',
    borderSubtle: '#CBD5E1',
    textPrimary: '#0F172A',      // Grafito Profundo
    textSecondary: '#334155',    // Grafito Medio
    textMuted: '#64748B',
    brandPrimary: '#1E40AF',
    brandElectric: '#2563EB',
    accentGraphite: '#0F172A',   // Acentos en Grafito Sólido
    tokenGold: '#D97706',
    successEmerald: '#059669',
    danger: '#DC2626'
  }
};
