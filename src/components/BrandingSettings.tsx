'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import {
  THEME_PALETTES,
  UIStyleMode,
  BrandingConfig,
  DEFAULT_BRANDING,
  applyBrandingToDOM,
  applyTheme,
  getCurrentTheme,
  IndustrialBgPreset,
  INDUSTRIAL_BG_PRESETS,
  computeIndustrialThemeVariables,
  DarkBgPreset,
  DARK_BG_PRESETS,
  getContrastRatio,
} from '@/lib/theme';
import {
  Palette,
  Sparkles,
  ShieldCheck,
  Check,
  CheckCircle2,
  Sliders,
  Layers,
  Layout,
  Pipette,
  Store,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  Save,
  RotateCcw,
} from 'lucide-react';
import {
  STANDARD_RUBROS,
  StandardRubroId,
  applyRubroToSystem,
} from '@/lib/utils/business-rubros';
import { soundEffects } from '@/lib/utils/sound';

export default function BrandingSettings() {
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(DEFAULT_BRANDING.paletteId);
  const [selectedUIStyle, setSelectedUIStyle] = useState<UIStyleMode>(DEFAULT_BRANDING.uiStyle);
  const [selectedIndustrialBg, setSelectedIndustrialBg] = useState<IndustrialBgPreset>(DEFAULT_BRANDING.industrialBg || 'white');
  const [customBgColor, setCustomBgColor] = useState<string>(DEFAULT_BRANDING.customBgColor || '#f8fafc');
  const [selectedDarkBg, setSelectedDarkBg] = useState<DarkBgPreset>(DEFAULT_BRANDING.darkBg || 'midnight');
  const [customDarkBgColor, setCustomDarkBgColor] = useState<string>(DEFAULT_BRANDING.customDarkBgColor || '#0a192f');
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Estados avanzados de zonas de color (Header, Sidebar, Botones y Textos)
  const [headerBgColor, setHeaderBgColor] = useState<string>('');
  const [headerTextColor, setHeaderTextColor] = useState<string>('');
  const [sidebarBgColor, setSidebarBgColor] = useState<string>('');
  const [sidebarTextColor, setSidebarTextColor] = useState<string>('');
  const [buttonAccentColor, setButtonAccentColor] = useState<string>('');
  const [buttonTextColor, setButtonTextColor] = useState<string>('');
  const [generalTextColor, setGeneralTextColor] = useState<string>('');

  // Estados de Rubro Comercial Estándar
  const [activeRubroId, setActiveRubroId] = useState<StandardRubroId | null>(null);
  const [selectedRubroForConfig, setSelectedRubroForConfig] = useState<StandardRubroId>('bodega');
  const [loadProductsMode, setLoadProductsMode] = useState<'replace' | 'merge' | 'theme_only'>('replace');
  const [isApplyingRubro, setIsApplyingRubro] = useState(false);
  const [rubroFeedback, setRubroFeedback] = useState<string | null>(null);

  useEffect(() => {
    const activeTheme = getCurrentTheme();
    const isLight = activeTheme !== 'dark';

    // Load saved branding from Dexie or localStorage
    db.settings.get('branding_config').then((setting) => {
      if (setting && setting.value) {
        setSelectedPaletteId(setting.value.paletteId || 'petrol');
        const style = isLight ? 'industrial' : (setting.value.uiStyle || 'industrial');
        const bg = setting.value.industrialBg || (localStorage.getItem('venematic_industrial_bg') as IndustrialBgPreset) || 'white';
        const cBg = setting.value.customBgColor || localStorage.getItem('venematic_custom_bg_color') || '#f8fafc';
        const dBg = setting.value.darkBg || (localStorage.getItem('venematic_dark_bg') as DarkBgPreset) || 'midnight';
        const cdBg = setting.value.customDarkBgColor || localStorage.getItem('venematic_custom_dark_bg') || '#0a192f';
        const hBg = setting.value.headerBgColor || localStorage.getItem('venematic_header_bg') || '';
        const hText = setting.value.headerTextColor || localStorage.getItem('venematic_header_text') || '';
        const sBg = setting.value.sidebarBgColor || localStorage.getItem('venematic_sidebar_bg') || '';
        const sText = setting.value.sidebarTextColor || localStorage.getItem('venematic_sidebar_text') || '';
        const bAccent = setting.value.buttonAccentColor || localStorage.getItem('venematic_button_accent') || '';
        const bText = setting.value.buttonTextColor || localStorage.getItem('venematic_button_text') || '';
        const gText = setting.value.generalTextColor || localStorage.getItem('venematic_general_text') || '';

        setSelectedUIStyle(style);
        setSelectedIndustrialBg(bg);
        setCustomBgColor(cBg);
        setSelectedDarkBg(dBg);
        setCustomDarkBgColor(cdBg);
        setHeaderBgColor(hBg);
        setHeaderTextColor(hText);
        setSidebarBgColor(sBg);
        setSidebarTextColor(sText);
        setButtonAccentColor(bAccent);
        setButtonTextColor(bText);
        setGeneralTextColor(gText);

        applyBrandingToDOM({
          ...setting.value,
          paletteId: setting.value.paletteId || 'petrol',
          uiStyle: style,
          industrialBg: bg,
          customBgColor: cBg,
          darkBg: dBg,
          customDarkBgColor: cdBg,
          headerBgColor: hBg,
          headerTextColor: hText,
          sidebarBgColor: sBg,
          sidebarTextColor: sText,
          buttonAccentColor: bAccent,
          buttonTextColor: bText,
          generalTextColor: gText,
        });
      } else {
        try {
          const p = localStorage.getItem('venematic_branding_palette') || 'sky';
          const s = isLight ? 'industrial' : ((localStorage.getItem('venematic_ui_style') as UIStyleMode) || 'industrial');
          const bg = (localStorage.getItem('venematic_industrial_bg') as IndustrialBgPreset) || 'white';
          const cBg = localStorage.getItem('venematic_custom_bg_color') || '#f8fafc';
          const dBg = (localStorage.getItem('venematic_dark_bg') as DarkBgPreset) || 'midnight';
          const cdBg = localStorage.getItem('venematic_custom_dark_bg') || '#0a192f';
          const hBg = localStorage.getItem('venematic_header_bg') || '';
          const hText = localStorage.getItem('venematic_header_text') || '';
          const sBg = localStorage.getItem('venematic_sidebar_bg') || '';
          const sText = localStorage.getItem('venematic_sidebar_text') || '';
          const bAccent = localStorage.getItem('venematic_button_accent') || '';
          const bText = localStorage.getItem('venematic_button_text') || '';
          const gText = localStorage.getItem('venematic_general_text') || '';

          setSelectedPaletteId(p);
          setSelectedUIStyle(s);
          setSelectedIndustrialBg(bg);
          setCustomBgColor(cBg);
          setSelectedDarkBg(dBg);
          setCustomDarkBgColor(cdBg);
          setHeaderBgColor(hBg);
          setHeaderTextColor(hText);
          setSidebarBgColor(sBg);
          setSidebarTextColor(sText);
          setButtonAccentColor(bAccent);
          setButtonTextColor(bText);
          setGeneralTextColor(gText);

          applyBrandingToDOM({
            paletteId: p,
            uiStyle: s,
            industrialBg: bg,
            customBgColor: cBg,
            darkBg: dBg,
            customDarkBgColor: cdBg,
            headerBgColor: hBg,
            headerTextColor: hText,
            sidebarBgColor: sBg,
            sidebarTextColor: sText,
            buttonAccentColor: bAccent,
            buttonTextColor: bText,
            generalTextColor: gText,
          });
        } catch {}
      }
    });

    // Sincronizar dinámicamente con cambios de tema desde la barra superior
    const onThemeChange = (e: any) => {
      const theme = e.detail;
      if (theme === 'light') {
        setSelectedUIStyle('industrial');
        const savedBg = (localStorage.getItem('venematic_industrial_bg') as IndustrialBgPreset) || 'white';
        const savedCustom = localStorage.getItem('venematic_custom_bg_color') || '#f8fafc';
        setSelectedIndustrialBg(savedBg);
        setCustomBgColor(savedCustom);
      } else if (theme === 'glass' || theme === 'dark') {
        setSelectedUIStyle('glassmorphism');
      }
    };
    window.addEventListener('venematic:theme_changed' as any, onThemeChange);

    // Cargar rubro activo guardado
    db.settings.get('active_rubro').then((s) => {
      if (s && s.value && STANDARD_RUBROS[s.value as StandardRubroId]) {
        setActiveRubroId(s.value);
        setSelectedRubroForConfig(s.value);
      } else {
        const saved = localStorage.getItem('venematic_active_rubro') as StandardRubroId;
        if (saved && STANDARD_RUBROS[saved]) {
          setActiveRubroId(saved);
          setSelectedRubroForConfig(saved);
        } else {
          setActiveRubroId('bodega');
          setSelectedRubroForConfig('bodega');
        }
      }
    });

    return () => {
      window.removeEventListener('venematic:theme_changed' as any, onThemeChange);
    };
  }, []);

  const handleSelectIndustrialWhite = () => {
    setSelectedIndustrialBg('white');
    setSelectedUIStyle('industrial');
    const config: BrandingConfig = {
      paletteId: selectedPaletteId,
      uiStyle: 'industrial',
      industrialBg: 'white',
      customBgColor,
    };
    saveConfig(config);
    applyBrandingToDOM(config, 'light');
  };

  const handlePaletteSelect = (paletteId: string) => {
    setSelectedPaletteId(paletteId);
    const config: BrandingConfig = {
      paletteId,
      uiStyle: selectedUIStyle,
      industrialBg: selectedIndustrialBg,
      customBgColor,
    };
    saveConfig(config);
    const currentThemeMode = getCurrentTheme();
    applyBrandingToDOM(config, currentThemeMode === 'light' ? 'light' : 'dark');
  };

  const handleUIStyleSelect = (uiStyle: UIStyleMode) => {
    setSelectedUIStyle(uiStyle);
    const config: BrandingConfig = {
      paletteId: selectedPaletteId,
      uiStyle,
      industrialBg: selectedIndustrialBg,
      customBgColor,
    };
    saveConfig(config);
    if (uiStyle === 'industrial') {
      applyTheme('light');
      applyBrandingToDOM(config, 'light');
    } else {
      applyTheme('dark');
      applyBrandingToDOM(config, 'dark');
    }
  };

  const handleIndustrialBgSelect = (industrialBg: IndustrialBgPreset) => {
    setSelectedIndustrialBg(industrialBg);
    setSelectedUIStyle('industrial');
    const config: BrandingConfig = {
      paletteId: selectedPaletteId,
      uiStyle: 'industrial',
      industrialBg,
      customBgColor,
      darkBg: selectedDarkBg,
      customDarkBgColor,
    };
    saveConfig(config);
    applyBrandingToDOM(config, 'light');
  };

  const handleCustomColorChange = (color: string) => {
    setCustomBgColor(color);
    setSelectedIndustrialBg('custom');
    setSelectedUIStyle('industrial');
    const config: BrandingConfig = {
      paletteId: selectedPaletteId,
      uiStyle: 'industrial',
      industrialBg: 'custom',
      customBgColor: color,
      darkBg: selectedDarkBg,
      customDarkBgColor,
    };
    saveConfig(config);
    applyBrandingToDOM(config, 'light');
  };

  const handleDarkBgSelect = (darkBg: DarkBgPreset) => {
    setSelectedDarkBg(darkBg);
    setSelectedUIStyle('dark' as any);
    const config: BrandingConfig = {
      paletteId: selectedPaletteId,
      uiStyle: 'dark' as any,
      industrialBg: selectedIndustrialBg,
      customBgColor,
      darkBg,
      customDarkBgColor,
    };
    saveConfig(config);
    applyBrandingToDOM(config, 'dark');
    soundEffects.playBeep();
  };

  const handleCustomDarkColorChange = (color: string) => {
    setCustomDarkBgColor(color);
    setSelectedDarkBg('custom');
    setSelectedUIStyle('dark' as any);
    const config: BrandingConfig = {
      paletteId: selectedPaletteId,
      uiStyle: 'dark' as any,
      industrialBg: selectedIndustrialBg,
      customBgColor,
      darkBg: 'custom',
      customDarkBgColor: color,
    };
    saveConfig(config);
    applyBrandingToDOM(config, 'dark');
  };

  const handleApplyRubro = async (rubroId: StandardRubroId) => {
    setIsApplyingRubro(true);
    try {
      const res = await applyRubroToSystem(rubroId, {
        loadProducts: loadProductsMode !== 'theme_only',
        productMode: loadProductsMode === 'replace' ? 'replace' : 'merge',
        updateStoreName: true,
      });

      setActiveRubroId(rubroId);
      const def = STANDARD_RUBROS[rubroId];
      setSelectedPaletteId(def.recommendedPaletteId);
      setSelectedIndustrialBg(def.recommendedBgPreset);
      setSelectedUIStyle('industrial');
      applyTheme('light');

      setRubroFeedback(res.message);
      setTimeout(() => setRubroFeedback(null), 4000);
      soundEffects.success();
    } catch (e) {
      console.error('Error aplicando rubro:', e);
    } finally {
      setIsApplyingRubro(false);
    }
  };

  const saveConfig = (config: BrandingConfig) => {
    try {
      localStorage.setItem('venematic_branding_palette', config.paletteId);
      localStorage.setItem('venematic_ui_style', config.uiStyle);
      if (config.industrialBg) localStorage.setItem('venematic_industrial_bg', config.industrialBg);
      if (config.customBgColor) localStorage.setItem('venematic_custom_bg_color', config.customBgColor);
      if (config.darkBg) localStorage.setItem('venematic_dark_bg', config.darkBg);
      if (config.customDarkBgColor) localStorage.setItem('venematic_custom_dark_bg', config.customDarkBgColor);
      if (config.headerBgColor !== undefined) localStorage.setItem('venematic_header_bg', config.headerBgColor);
      if (config.headerTextColor !== undefined) localStorage.setItem('venematic_header_text', config.headerTextColor);
      if (config.sidebarBgColor !== undefined) localStorage.setItem('venematic_sidebar_bg', config.sidebarBgColor);
      if (config.sidebarTextColor !== undefined) localStorage.setItem('venematic_sidebar_text', config.sidebarTextColor);
      if (config.buttonAccentColor !== undefined) localStorage.setItem('venematic_button_accent', config.buttonAccentColor);
      if (config.buttonTextColor !== undefined) localStorage.setItem('venematic_button_text', config.buttonTextColor);
      if (config.generalTextColor !== undefined) localStorage.setItem('venematic_general_text', config.generalTextColor);

      window.dispatchEvent(new CustomEvent('venematic:branding_changed', { detail: config }));
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2500);

      // Guardar en Dexie de forma asíncrona desacoplada
      db.settings.put({
        key: 'branding_config',
        value: config,
      }).catch((err) => console.warn('Dexie save error:', err));
      db.settings.put({
        key: 'active_palette',
        value: config.paletteId,
      }).catch(() => {});
    } catch (e) {
      console.warn('Error saving branding config:', e);
    }
  };

  const handleAdvancedColorChange = (key: keyof BrandingConfig, val: string) => {
    let newHbg = headerBgColor;
    let newHtext = headerTextColor;
    let newSbg = sidebarBgColor;
    let newStext = sidebarTextColor;
    let newBaccent = buttonAccentColor;
    let newBtext = buttonTextColor;
    let newGtext = generalTextColor;

    if (key === 'headerBgColor') { newHbg = val; setHeaderBgColor(val); }
    if (key === 'headerTextColor') { newHtext = val; setHeaderTextColor(val); }
    if (key === 'sidebarBgColor') { newSbg = val; setSidebarBgColor(val); }
    if (key === 'sidebarTextColor') { newStext = val; setSidebarTextColor(val); }
    if (key === 'buttonAccentColor') { newBaccent = val; setButtonAccentColor(val); }
    if (key === 'buttonTextColor') { newBtext = val; setButtonTextColor(val); }
    if (key === 'generalTextColor') { newGtext = val; setGeneralTextColor(val); }

    const config: BrandingConfig = {
      paletteId: selectedPaletteId,
      uiStyle: selectedUIStyle,
      industrialBg: selectedIndustrialBg,
      customBgColor,
      darkBg: selectedDarkBg,
      customDarkBgColor,
      headerBgColor: newHbg,
      headerTextColor: newHtext,
      sidebarBgColor: newSbg,
      sidebarTextColor: newStext,
      buttonAccentColor: newBaccent,
      buttonTextColor: newBtext,
      generalTextColor: newGtext,
    };
    saveConfig(config);
    applyBrandingToDOM(config, selectedUIStyle === 'industrial' ? 'light' : 'dark');
  };

  const handleSaveAllColors = () => {
    const config: BrandingConfig = {
      paletteId: selectedPaletteId,
      uiStyle: selectedUIStyle,
      industrialBg: selectedIndustrialBg,
      customBgColor,
      darkBg: selectedDarkBg,
      customDarkBgColor,
      headerBgColor,
      headerTextColor,
      sidebarBgColor,
      sidebarTextColor,
      buttonAccentColor,
      buttonTextColor,
      generalTextColor,
    };
    saveConfig(config);
    applyBrandingToDOM(config, selectedUIStyle === 'industrial' ? 'light' : 'dark');
    soundEffects.success();
  };

  const handleResetAllColors = () => {
    setHeaderBgColor('');
    setHeaderTextColor('');
    setSidebarBgColor('');
    setSidebarTextColor('');
    setButtonAccentColor('');
    setButtonTextColor('');
    setGeneralTextColor('');
    const config: BrandingConfig = {
      paletteId: selectedPaletteId,
      uiStyle: selectedUIStyle,
      industrialBg: selectedIndustrialBg,
      customBgColor,
      darkBg: selectedDarkBg,
      customDarkBgColor,
      headerBgColor: '',
      headerTextColor: '',
      sidebarBgColor: '',
      sidebarTextColor: '',
      buttonAccentColor: '',
      buttonTextColor: '',
      generalTextColor: '',
    };
    saveConfig(config);
    applyBrandingToDOM(config, selectedUIStyle === 'industrial' ? 'light' : 'dark');
    soundEffects.playBeep();
  };

  const activePalette = THEME_PALETTES.find((p) => p.id === selectedPaletteId) || THEME_PALETTES[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-xs p-5 space-y-6">
      {/* Header del bloque */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
              Personalización de Marca y Modo de Interfaz
            </h3>
            <p className="text-[11px] text-slate-500">
              Adapta la identidad de color y estilo visual al rubro de tu negocio
            </p>
          </div>
        </div>

        {savedFeedback && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aplicado en tiempo real</span>
          </span>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 0. SELECCIÓN DE RUBRO COMERCIAL Y PLANTILLA ESTÁNDAR (6 Rubros)          */}
      {/* ========================================================================= */}
      <div className="space-y-3.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-300 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Giro o Rubro Comercial del Negocio (6 Estándares)
              </h4>
              <p className="text-[11px] text-slate-500">
                Selecciona tu tipo de comercio para preconfigurar el tema visual, colores y catálogo de productos estándar
              </p>
            </div>
          </div>

          {activeRubroId && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-300 rounded-full text-[11px] font-bold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rubro Actual: {STANDARD_RUBROS[activeRubroId]?.name}</span>
            </div>
          )}
        </div>

        {rubroFeedback && (
          <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{rubroFeedback}</span>
          </div>
        )}

        {/* Cuadrícula de 6 Rubros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(STANDARD_RUBROS) as StandardRubroId[]).map((rKey) => {
            const rubro = STANDARD_RUBROS[rKey];
            const isSelected = selectedRubroForConfig === rKey;
            const isActive = activeRubroId === rKey;

            return (
              <div
                key={rKey}
                onClick={() => setSelectedRubroForConfig(rKey)}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none relative ${
                  isSelected
                    ? 'border-sky-600 bg-sky-50/70 shadow-md ring-1 ring-sky-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1.5 rounded-lg bg-slate-100 border border-slate-200 shadow-2xs leading-none">
                      {rubro.icon}
                    </span>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 leading-tight">
                        {rubro.name}
                      </h5>
                      <span className="text-[10px] text-slate-500 line-clamp-1">
                        {rubro.tagline}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="text-[9px] uppercase tracking-wider font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-2xs">
                      En Uso
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-snug">
                  {rubro.description}
                </p>

                {/* Categorías & Productos Badge */}
                <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-600">
                    {rubro.sampleProducts.length} productos • {rubro.categories.length} categorías
                  </span>
                  <span className="font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
                    Tema: {rubro.recommendedPaletteId}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel de Configuración y Aplicación del Rubro Seleccionado */}
        {(() => {
          const currentRubroConfig = (selectedRubroForConfig && STANDARD_RUBROS[selectedRubroForConfig]) || STANDARD_RUBROS['bodega'];
          if (!selectedRubroForConfig || !currentRubroConfig) return null;
          return (
            <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-xs space-y-3.5 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentRubroConfig.icon}</span>
                  <div>
                    <h5 className="text-xs font-black text-slate-900">
                      Configuración de Plantilla: {currentRubroConfig.name}
                    </h5>
                    <span className="text-[11px] text-slate-500">
                      Tienda sugerida: <b>{currentRubroConfig.defaultStoreName}</b>
                    </span>
                  </div>
                </div>

                {/* Categorías sugeridas */}
                <div className="flex flex-wrap gap-1">
                  {(currentRubroConfig.categories || []).slice(0, 4).map((c) => (
                    <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Opciones de Carga de Productos */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  ¿Cómo deseas aplicar este rubro en tu inventario?
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2 font-medium transition-colors ${
                    loadProductsMode === 'replace' ? 'bg-sky-50 border-sky-500 text-sky-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="rubro_product_mode"
                      checked={loadProductsMode === 'replace'}
                      onChange={() => setLoadProductsMode('replace')}
                      className="accent-sky-600"
                    />
                    <span>Reemplazar catálogo ({currentRubroConfig.name})</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2 font-medium transition-colors ${
                    loadProductsMode === 'merge' ? 'bg-sky-50 border-sky-500 text-sky-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="rubro_product_mode"
                      checked={loadProductsMode === 'merge'}
                      onChange={() => setLoadProductsMode('merge')}
                      className="accent-sky-600"
                    />
                    <span>Combinar con catálogo actual</span>
                  </label>

                  <label className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center gap-2 font-medium transition-colors ${
                    loadProductsMode === 'theme_only' ? 'bg-sky-50 border-sky-500 text-sky-950 font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}>
                    <input
                      type="radio"
                      name="rubro_product_mode"
                      checked={loadProductsMode === 'theme_only'}
                      onChange={() => setLoadProductsMode('theme_only')}
                      className="accent-sky-600"
                    />
                    <span>Solo aplicar tema y colores</span>
                  </label>
                </div>
              </div>

              {/* Botón de Ejecución */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  Se configurará el color <b>{currentRubroConfig.recommendedPaletteId}</b> y fondo <b>{currentRubroConfig.recommendedBgPreset}</b> automáticamente.
                </span>

                <button
                  type="button"
                  onClick={() => handleApplyRubro(selectedRubroForConfig)}
                  disabled={isApplyingRubro}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 active:bg-sky-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isApplyingRubro ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Aplicando Rubro y Catálogo...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡ Aplicar Plantilla de {currentRubroConfig.name}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ========================================================================= */}
      {/* 1. SELECCIÓN DE ESTILO PRINCIPAL: MODO BLANCO, OSCURO O ESMERILADO        */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Estilo Base de la Interfaz (3 Modos Disponibles)
            </label>
            <p className="text-[11px] text-slate-500">
              Elige el estilo estructural. Puedes combinar cualquiera de estos 3 estilos con la paleta de colores individual que prefieras.
            </p>
          </div>
          <div className="inline-flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs select-none">
            <button
              type="button"
              onClick={() => {
                applyTheme('light');
                setSelectedUIStyle('industrial');
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                getCurrentTheme() === 'light'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              ☀️ Blanco
            </button>
            <button
              type="button"
              onClick={() => {
                applyTheme('dark');
                setSelectedUIStyle('dark' as any);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                getCurrentTheme() === 'dark'
                  ? 'bg-[#121c29] text-amber-300 shadow-xs border border-slate-700'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              🌙 Oscuro
            </button>
            <button
              type="button"
              onClick={() => {
                applyTheme('glass');
                setSelectedUIStyle('glassmorphism');
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                getCurrentTheme() === 'glass'
                  ? 'bg-gradient-to-r from-sky-500/25 to-teal-500/25 text-sky-300 shadow-xs border border-sky-400/50 backdrop-blur-md'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              ✨ Esmerilado
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. MODO PROFESIONAL BLANCO */}
          <div
            onClick={() => {
              applyTheme('light');
              setSelectedUIStyle('industrial');
            }}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
              getCurrentTheme() === 'light'
                ? 'border-sky-600 bg-white shadow-md ring-2 ring-sky-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Modo Blanco Profesional
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-bold">Fondo Blanco Puro • Industrial (#ffffff)</span>
                </div>
              </div>
              {getCurrentTheme() === 'light' && (
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-600 mt-2.5 leading-relaxed">
              Superficie 100% blanca y limpia, bordes nítidos de 1px, máximo contraste con tipografía oscura profunda y respuesta táctil instantánea. Diseñado para evitar fatiga visual en jornadas largas de caja.
            </p>

            <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center gap-1.5 text-[10px] font-bold flex-wrap">
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800">Blanco Puro</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700">0% Distracciones</span>
            </div>
          </div>

          {/* 2. MODO OSCURO CLÁSICO */}
          <div
            onClick={() => {
              applyTheme('dark');
              setSelectedUIStyle('dark' as any);
            }}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
              getCurrentTheme() === 'dark'
                ? 'border-indigo-500 bg-slate-900 text-white shadow-md ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  🌙
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${getCurrentTheme() === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                    Modo Oscuro Clásico
                  </h4>
                  <span className="text-[10px] text-indigo-400 font-bold">Fondo Dark Slate (#121c29)</span>
                </div>
              </div>
              {getCurrentTheme() === 'dark' && (
                <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            <p className={`text-[11px] mt-2.5 leading-relaxed ${getCurrentTheme() === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              Lienzo oscuro profundo para ambientes nocturnos o discotecas, con tarjetas de productos en blanco de alto contraste para máxima visibilidad de fotos y precios.
            </p>

            <div className="mt-3 pt-2.5 border-t border-slate-200/40 flex items-center gap-1.5 text-[10px] font-bold flex-wrap">
              <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700 text-indigo-300">Descanso Visual</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Alto Contraste</span>
            </div>
          </div>

          {/* 3. MODO ESMERILADO (GLASSMORPHISM) */}
          <div
            onClick={() => {
              applyTheme('glass');
              setSelectedUIStyle('glassmorphism');
            }}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
              getCurrentTheme() === 'glass'
                ? 'border-sky-400 bg-slate-900/90 text-white shadow-xl ring-2 ring-sky-400/30'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-teal-400 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${getCurrentTheme() === 'glass' ? 'text-white' : 'text-slate-900'}`}>
                    Modo Esmerilado Translúcido
                  </h4>
                  <span className="text-[10px] text-sky-400 font-semibold">Frosted Glass • Mac & Linear Style</span>
                </div>
              </div>
              {getCurrentTheme() === 'glass' && (
                <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            <p className={`text-[11px] mt-2.5 leading-relaxed ${getCurrentTheme() === 'glass' ? 'text-slate-300' : 'text-slate-600'}`}>
              Efecto esmerilado translúcido con desenfoque de fondo (backdrop-blur), filas flotantes tipo cápsula, destellos de cristal reflectivo y ambient lighting dinámico.
            </p>

            <div className="mt-3 pt-2.5 border-t border-slate-200/40 flex items-center gap-1.5 text-[10px] font-bold flex-wrap">
              <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300">Frosted Glass</span>
              <span className="px-2 py-0.5 rounded bg-teal-950 border border-teal-800 text-teal-300">Filas Cápsula</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUB-PANEL: TONOS DE FONDO Y CONTRASTE DINÁMICO (MODO PROFESIONAL)        */}
        {/* ========================================================================= */}
        {selectedUIStyle === 'industrial' && (
          <div
            style={{ backgroundColor: 'var(--industrial-bg, #ffffff)', borderColor: 'var(--industrial-border, #cbd5e1)' }}
            className="mt-3 p-4 rounded-xl border space-y-3 transition-colors duration-200 animate-in fade-in"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-600" />
                  <span>Color de Fondo del Entorno Profesional</span>
                </h5>
                <p className="text-[11px] text-slate-500">
                  Elige entre blanco clásico, turquesa menta, azul hielo, gris titán o define tu propio color con el Color Picker. Los botones primarios, secundarios y textos se calibran automáticamente para garantizar visibilidad y funcionalidad.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 font-bold shadow-2xs">
                Fondo: {selectedIndustrialBg === 'custom' ? `Personalizado (${customBgColor})` : INDUSTRIAL_BG_PRESETS.find((b) => b.id === selectedIndustrialBg)?.name}
              </span>
            </div>

            {/* Grid de 6 opciones de Fondo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-1">
              {INDUSTRIAL_BG_PRESETS.map((opt) => {
                const isSelected = selectedIndustrialBg === opt.id;
                const isCustom = opt.id === 'custom';

                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      if (isCustom) {
                        handleIndustrialBgSelect('custom');
                      } else {
                        handleIndustrialBgSelect(opt.id);
                      }
                    }}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between select-none cursor-pointer relative ${
                      isSelected
                        ? 'border-sky-600 bg-white shadow-sm ring-1 ring-sky-500'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    {/* Header con Swatch */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {isCustom ? (
                          <label
                            className="cursor-pointer relative flex items-center shrink-0"
                            title="Haz clic para abrir el Color Picker"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="color"
                              value={customBgColor}
                              onChange={(e) => handleCustomColorChange(e.target.value)}
                              className="w-6 h-6 rounded-md cursor-pointer border border-slate-300 shadow-2xs p-0 bg-transparent"
                            />
                          </label>
                        ) : (
                          <div
                            className="w-6 h-6 rounded-md border shadow-2xs shrink-0"
                            style={{
                              backgroundColor: opt.previewColor,
                              borderColor: opt.borderPreview,
                            }}
                          />
                        )}
                        <span className="text-xs font-bold text-slate-900 leading-tight">
                          {opt.name}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 leading-snug">
                      {opt.tagline}
                    </p>

                    {isCustom && (
                      <div
                        className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Hex:</span>
                        <input
                          type="text"
                          value={customBgColor}
                          onChange={(e) => handleCustomColorChange(e.target.value)}
                          className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-300 text-slate-800 w-20 text-center"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-PANEL: TONOS Y MATICES DEL MODO OSCURO (PERSONALIZABLE WCAG AAA)    */}
        {/* ========================================================================= */}
        {(selectedUIStyle === 'dark' || getCurrentTheme() === 'dark') && (
          <div
            style={{ backgroundColor: 'var(--industrial-bg, #0a192f)', borderColor: 'var(--industrial-border, #1e293b)' }}
            className="mt-3 p-4 rounded-xl border space-y-3 transition-colors duration-200 animate-in fade-in"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h5 className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  <span>Ambiente y Matiz del Modo Oscuro (100% Personalizable)</span>
                </h5>
                <p className="text-[11px] text-slate-300">
                  Personaliza el tono de fondo predominante: Negro Puro OLED, Carbón Neutral, Azul Medianoche, Esmeralda o define tu color Hex. Se calibra automáticamente con el estándar WCAG AAA para garantizar contraste superior a 12:1 sin elementos invisibles.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-sky-300 font-bold shadow-2xs">
                Matiz: {selectedDarkBg === 'custom' ? `Personalizado (${customDarkBgColor})` : DARK_BG_PRESETS.find((b) => b.id === selectedDarkBg)?.name}
              </span>
            </div>

            {/* Grid de 6 opciones de Matiz */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-1">
              {DARK_BG_PRESETS.map((opt) => {
                const isSelected = selectedDarkBg === opt.id;
                const isCustom = opt.id === 'custom';
                const contrastRatio = getContrastRatio(isCustom ? customDarkBgColor : opt.bgColor, '#ffffff').toFixed(1);

                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      if (isCustom) {
                        handleDarkBgSelect('custom');
                      } else {
                        handleDarkBgSelect(opt.id);
                      }
                    }}
                    className={`p-3 rounded-xl border-2 transition-all flex flex-col justify-between select-none cursor-pointer relative ${
                      isSelected
                        ? 'border-sky-400 bg-slate-800/95 shadow-sm ring-1 ring-sky-400'
                        : 'border-slate-700/80 bg-slate-900/90 hover:border-slate-600 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Header con Swatch */}
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {isCustom ? (
                          <label
                            className="cursor-pointer relative flex items-center shrink-0"
                            title="Haz clic para abrir el Color Picker"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="color"
                              value={customDarkBgColor}
                              onChange={(e) => handleCustomDarkColorChange(e.target.value)}
                              className="w-6 h-6 rounded-md cursor-pointer border border-slate-600 shadow-2xs p-0 bg-transparent"
                            />
                          </label>
                        ) : (
                          <div
                            className="w-6 h-6 rounded-md border shadow-2xs shrink-0"
                            style={{
                              backgroundColor: opt.previewColor,
                              borderColor: opt.borderPreview,
                            }}
                          />
                        )}
                        <span className="text-xs font-bold text-white leading-tight">
                          {opt.name}
                        </span>
                      </div>

                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-300 mt-2 line-clamp-2 leading-snug">
                      {opt.tagline}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-emerald-400 font-mono">
                        {contrastRatio}:1 AAA
                      </span>
                      {isCustom && (
                        <input
                          type="text"
                          value={customDarkBgColor}
                          onChange={(e) => handleCustomDarkColorChange(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-600 bg-slate-800 text-white w-20 text-center"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. CATÁLOGO DE 10 PALETAS PRE-ESTABLECIDAS                                */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Paleta de Color de la Marca (10 Opciones por Rubro)
          </label>
          <span className="text-[11px] font-bold text-slate-500">
            Activa: <b style={{ color: activePalette.primary }}>{activePalette.name}</b>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {THEME_PALETTES.map((pal) => {
            const isSelected = selectedPaletteId === pal.id;
            return (
              <button
                key={pal.id}
                type="button"
                onClick={() => handlePaletteSelect(pal.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between h-28 relative group select-none cursor-pointer ${
                  isSelected
                    ? 'shadow-md ring-2'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
                style={
                  isSelected
                    ? {
                        borderColor: pal.primary,
                        backgroundColor: pal.primaryLight,
                        outlineColor: pal.primary,
                      }
                    : undefined
                }
              >
                {/* Header con Swatch y Check */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                      style={{ backgroundColor: pal.primary }}
                    ></div>
                    <div
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: pal.accent }}
                    ></div>
                  </div>

                  {isSelected && (
                    <div
                      className="w-4 h-4 rounded-full text-white flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: pal.primary }}
                    >
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Textos */}
                <div className="mt-2">
                  <h5 className="font-bold text-xs text-slate-900 leading-tight">
                    {pal.name}
                  </h5>
                  <p className="text-[9px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                    {pal.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISTA PREVIA EN VIVO DE BOTONES Y COMPONENTES ADAPTATIVOS             */}
      {/* ========================================================================= */}
      {(() => {
        const themeVars = computeIndustrialThemeVariables(
          selectedIndustrialBg,
          customBgColor,
          activePalette.primary,
          activePalette.primaryHover
        );

        return (
          <div
            className="p-4 rounded-xl border space-y-3 transition-colors duration-200 shadow-xs"
            style={{
              backgroundColor: selectedUIStyle === 'industrial' ? themeVars.bgColor : 'rgba(15, 23, 42, 0.65)',
              borderColor: selectedUIStyle === 'industrial' ? themeVars.borderColor : 'rgba(56, 189, 248, 0.3)',
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[10px] font-black uppercase tracking-wider block"
                style={{ color: selectedUIStyle === 'industrial' ? themeVars.textMuted : '#94a3b8' }}
              >
                ✓ Verificación de Contraste Activa: Textos, Botones y Superficies
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded shadow-2xs"
                style={{
                  backgroundColor: selectedUIStyle === 'industrial' ? themeVars.cardColor : '#0f172a',
                  color: selectedUIStyle === 'industrial' ? themeVars.textColor : '#f8fafc',
                  border: `1px solid ${themeVars.borderColor}`,
                }}
              >
                Fondo: {selectedUIStyle === 'industrial' ? (selectedIndustrialBg === 'custom' ? customBgColor : selectedIndustrialBg) : 'Glassmorphism Dark'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Botón Principal Adaptativo */}
              <button
                type="button"
                className="px-4 py-2 rounded-lg font-bold text-xs shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
                style={{
                  backgroundColor: selectedUIStyle === 'industrial' ? themeVars.primaryBg : activePalette.primary,
                  color: selectedUIStyle === 'industrial' ? themeVars.primaryText : '#ffffff',
                }}
              >
                <span>Botón Principal (Acción)</span>
              </button>

              {/* Botón Secundario Adaptativo */}
              <button
                type="button"
                className="px-3.5 py-2 rounded-lg font-bold text-xs border flex items-center gap-1.5 shadow-2xs"
                style={{
                  backgroundColor: selectedUIStyle === 'industrial' ? themeVars.secondaryBg : 'rgba(30, 41, 59, 0.9)',
                  borderColor: selectedUIStyle === 'industrial' ? themeVars.secondaryBorder : 'rgba(56, 189, 248, 0.4)',
                  color: selectedUIStyle === 'industrial' ? themeVars.secondaryText : '#f8fafc',
                }}
              >
                <span>Botón Secundario</span>
              </button>

              {/* Badge / Etiqueta Activa */}
              <span
                className="px-2.5 py-1 rounded-md text-xs font-bold border"
                style={{
                  backgroundColor: activePalette.primaryLight,
                  color: activePalette.primary,
                  borderColor: activePalette.primaryBorder,
                }}
              >
                Badge / Etiqueta Activa
              </span>

              {/* Tarjeta de Producto / Precios con Contraste Seguro */}
              <div
                className="p-2.5 rounded-xl border shadow-xs"
                style={{
                  backgroundColor: selectedUIStyle === 'industrial' ? themeVars.cardColor : 'rgba(15, 23, 42, 0.8)',
                  borderColor: selectedUIStyle === 'industrial' ? themeVars.borderColor : 'rgba(56, 189, 248, 0.25)',
                }}
              >
                <div className="text-[10px] font-bold" style={{ color: selectedUIStyle === 'industrial' ? themeVars.textMuted : '#94a3b8' }}>
                  Fondo Tarjeta
                </div>
                <span
                  className="text-sm font-black font-mono tabular-numbers"
                  style={{ color: selectedUIStyle === 'industrial' ? themeVars.textColor : '#ffffff' }}
                >
                  $12.50{' '}
                  <span
                    className="text-xs font-normal"
                    style={{ color: selectedUIStyle === 'industrial' ? themeVars.textMuted : '#94a3b8' }}
                  >
                    (Bs. 10.606,87)
                  </span>
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 4. PERSONALIZACIÓN INTEGRAL DE ZONAS DE COLOR (Header, Sidebar, Botones y Texto) */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Personalización Integral de Estructura Visual (Header, Sidebar, Botones y Texto)
              </h4>
              <p className="text-[11px] text-slate-500">
                Ajusta los colores independientes de la barra superior, menú lateral, botones de acción y tipografía
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetAllColors}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAllColors}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Personalización de Colores</span>
            </button>
          </div>
        </div>

        {/* Cuadrícula de Controles de Color */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Header Background */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Fondo del Header (Superior)
              </label>
              <div
                className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                style={{ backgroundColor: headerBgColor || '#ffffff' }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Color de fondo de la barra de navegación superior
            </p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={headerBgColor || '#ffffff'}
                onChange={(e) => handleAdvancedColorChange('headerBgColor', e.target.value)}
                className="w-9 h-8 p-0.5 border border-slate-300 rounded cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={headerBgColor}
                placeholder="Por defecto (#ffffff)"
                onChange={(e) => handleAdvancedColorChange('headerBgColor', e.target.value)}
                className="flex-1 font-mono text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-sky-500"
              />
            </div>
          </div>

          {/* Header Text Color */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Texto e Íconos del Header
              </label>
              <div
                className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                style={{ backgroundColor: headerTextColor || '#0f172a' }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Color de texto, títulos y botones de la barra superior
            </p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={headerTextColor || '#0f172a'}
                onChange={(e) => handleAdvancedColorChange('headerTextColor', e.target.value)}
                className="w-9 h-8 p-0.5 border border-slate-300 rounded cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={headerTextColor}
                placeholder="Por defecto (#0f172a)"
                onChange={(e) => handleAdvancedColorChange('headerTextColor', e.target.value)}
                className="flex-1 font-mono text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-sky-500"
              />
            </div>
          </div>

          {/* Sidebar Background */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Fondo del Sidebar (Menú Lateral)
              </label>
              <div
                className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                style={{ backgroundColor: sidebarBgColor || '#0a2336' }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Color de fondo de la barra de navegación lateral izquierda
            </p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={sidebarBgColor || '#0a2336'}
                onChange={(e) => handleAdvancedColorChange('sidebarBgColor', e.target.value)}
                className="w-9 h-8 p-0.5 border border-slate-300 rounded cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={sidebarBgColor}
                placeholder="Por defecto (#0a2336)"
                onChange={(e) => handleAdvancedColorChange('sidebarBgColor', e.target.value)}
                className="flex-1 font-mono text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-sky-500"
              />
            </div>
          </div>

          {/* Sidebar Text Color */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Texto del Sidebar
              </label>
              <div
                className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                style={{ backgroundColor: sidebarTextColor || '#f8fafc' }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Color de texto y etiquetas de los módulos en el menú lateral
            </p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={sidebarTextColor || '#f8fafc'}
                onChange={(e) => handleAdvancedColorChange('sidebarTextColor', e.target.value)}
                className="w-9 h-8 p-0.5 border border-slate-300 rounded cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={sidebarTextColor}
                placeholder="Por defecto (#f8fafc)"
                onChange={(e) => handleAdvancedColorChange('sidebarTextColor', e.target.value)}
                className="flex-1 font-mono text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-sky-500"
              />
            </div>
          </div>

          {/* Button Accent / Active Zone */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Zona Activa de Botones / Acento
              </label>
              <div
                className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                style={{ backgroundColor: buttonAccentColor || activePalette.primary }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Color de fondo de los botones principales y enlaces activos
            </p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={buttonAccentColor || activePalette.primary}
                onChange={(e) => handleAdvancedColorChange('buttonAccentColor', e.target.value)}
                className="w-9 h-8 p-0.5 border border-slate-300 rounded cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={buttonAccentColor}
                placeholder={`Por defecto (${activePalette.primary})`}
                onChange={(e) => handleAdvancedColorChange('buttonAccentColor', e.target.value)}
                className="flex-1 font-mono text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-sky-500"
              />
            </div>
          </div>

          {/* Button Text Color & General Text */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                Texto de Botones de Acción
              </label>
              <div
                className="w-5 h-5 rounded-md border border-slate-300 shadow-2xs"
                style={{ backgroundColor: buttonTextColor || '#ffffff' }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Color del texto y los iconos dentro de botones activos
            </p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={buttonTextColor || '#ffffff'}
                onChange={(e) => handleAdvancedColorChange('buttonTextColor', e.target.value)}
                className="w-9 h-8 p-0.5 border border-slate-300 rounded cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={buttonTextColor}
                placeholder="Por defecto (#ffffff)"
                onChange={(e) => handleAdvancedColorChange('buttonTextColor', e.target.value)}
                className="flex-1 font-mono text-xs px-2 py-1.5 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-sky-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
