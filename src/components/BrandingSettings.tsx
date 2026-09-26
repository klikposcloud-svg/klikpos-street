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
  const [savedFeedback, setSavedFeedback] = useState(false);

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
        setSelectedUIStyle(style);
        setSelectedIndustrialBg(bg);
        setCustomBgColor(cBg);
        applyBrandingToDOM({
          ...setting.value,
          paletteId: setting.value.paletteId || 'petrol',
          uiStyle: style,
          industrialBg: bg,
          customBgColor: cBg,
        });
      } else {
        try {
          const p = localStorage.getItem('venematic_branding_palette') || 'sky';
          const s = isLight ? 'industrial' : ((localStorage.getItem('venematic_ui_style') as UIStyleMode) || 'industrial');
          const bg = (localStorage.getItem('venematic_industrial_bg') as IndustrialBgPreset) || 'white';
          const cBg = localStorage.getItem('venematic_custom_bg_color') || '#f8fafc';
          setSelectedPaletteId(p);
          setSelectedUIStyle(s);
          setSelectedIndustrialBg(bg);
          setCustomBgColor(cBg);
          applyBrandingToDOM({ paletteId: p, uiStyle: s, industrialBg: bg, customBgColor: cBg });
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
    };
    saveConfig(config);
    applyBrandingToDOM(config, 'light');
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
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
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
      {/* 1. SELECCIÓN DE MODO DE INTERFAZ: MODO PROFESIONAL BLANCO VS GLASSMORPHISM */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Modo de Apariencia de la Interfaz
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectIndustrialWhite}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedUIStyle === 'industrial' && selectedIndustrialBg === 'white'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <span>☀️ Modo Profesional Blanco</span>
              {selectedUIStyle === 'industrial' && selectedIndustrialBg === 'white' && <span>✓</span>}
            </button>

            <button
              type="button"
              onClick={() => handleUIStyleSelect('glassmorphism')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                selectedUIStyle === 'glassmorphism'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Modo Glassmorphism</span>
              {selectedUIStyle === 'glassmorphism' && <span>✓</span>}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* MODO PROFESIONAL BLANCO (INDUSTRIAL) */}
          <div
            onClick={handleSelectIndustrialWhite}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
              selectedUIStyle === 'industrial'
                ? 'border-sky-600 bg-white shadow-md ring-1 ring-sky-500'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Modo Profesional Blanco
                  </h4>
                  <span className="text-[10px] text-emerald-700 font-bold">Fondo Blanco Puro • Máximo Contraste (#ffffff)</span>
                </div>
              </div>
              {selectedUIStyle === 'industrial' && (
                <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              Superficie 100% blanca y limpia, bordes nítidos de 1px, máximo contraste con tipografía oscura profunda y respuesta táctil instantánea. Diseñado para evitar fatiga visual en jornadas largas de caja.
            </p>

            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800">Blanco Puro Sólido</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700">0% Distracciones</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700">Alta Densidad POS</span>
            </div>
          </div>

          {/* MODO GLASSMORPHISM MODERNO */}
          <div
            onClick={() => handleUIStyleSelect('glassmorphism')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between select-none ${
              selectedUIStyle === 'glassmorphism'
                ? 'border-sky-600 bg-sky-50/70 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Modo Glassmorphism Moderno
                  </h4>
                  <span className="text-[10px] text-sky-700 font-semibold">Vidrio Esmerilado • Dark Navy Futurista</span>
                </div>
              </div>
              {selectedUIStyle === 'glassmorphism' && (
                <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              Superficie oscura negro-azulada con paneles translúcidos de cristal esmerilado (frosted glass), bordes luminosos y alto contraste para pantallas táctiles modernas.
            </p>

            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded bg-sky-100 border border-sky-300 text-sky-800">Frosted Glass</span>
              <span className="px-2 py-0.5 rounded bg-sky-100 border border-sky-300 text-sky-800">Elegante</span>
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
    </div>
  );
}
