'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  Zap,
  Smartphone,
  KeyRound,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Copy,
  Send,
  Sparkles,
  Layers,
  Crown
} from 'lucide-react';
import {
  KlikEdition,
  EDITION_DEFINITIONS,
  getActiveEdition,
  applyLicenseUpdate,
  LicensePayload
} from '@/lib/licensing/feature-flags';
import { playSuccessChime, playBeep } from '@/lib/utils/sound';

export default function LicensingInformationPage() {
  const [activeEdition, setActiveEditionState] = useState<KlikEdition>('KLIKPOS_LITE');
  const [terminalHwid, setTerminalHwid] = useState('HWID-DESKTOP-POS');
  const [inputActivationKey, setInputActivationKey] = useState('');
  const [activationFeedback, setActivationFeedback] = useState<{ success: boolean; msg: string } | null>(null);
  const [copiedHwid, setCopiedHwid] = useState(false);

  useEffect(() => {
    const current = getActiveEdition();
    setActiveEditionState(current);

    // Obtener o generar HWID del dispositivo
    let hwid = localStorage.getItem('klikpos_terminal_hwid');
    if (!hwid) {
      hwid = 'KLIK-PC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem('klikpos_terminal_hwid', hwid);
    }
    setTerminalHwid(hwid);
  }, []);

  const handleCopyHwid = () => {
    navigator.clipboard.writeText(terminalHwid);
    setCopiedHwid(true);
    playSuccessChime();
    setTimeout(() => setCopiedHwid(false), 2500);
  };

  const handleApplyActivationKey = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationFeedback(null);

    const cleanKey = inputActivationKey.trim();
    if (!cleanKey.startsWith('KLIK-')) {
      setActivationFeedback({ success: false, msg: 'Formato inválido. La clave debe comenzar con "KLIK-".' });
      playBeep(400, 0.2, 'sawtooth');
      return;
    }

    try {
      const b64 = cleanKey.replace('KLIK-', '');
      const decoded = JSON.parse(atob(b64)) as LicensePayload;
      if (decoded && (decoded.edition || decoded.tier)) {
        applyLicenseUpdate(decoded);
        const newEdition = getActiveEdition();
        setActiveEditionState(newEdition);
        playSuccessChime();
        setActivationFeedback({
          success: true,
          msg: `¡Licencia activada con éxito! Su terminal ha sido actualizado a ${EDITION_DEFINITIONS[newEdition]?.name || newEdition}.`
        });
        setInputActivationKey('');
      } else {
        throw new Error('Payload inválido');
      }
    } catch {
      playBeep(400, 0.2, 'sawtooth');
      setActivationFeedback({ success: false, msg: 'Clave de licencia no válida o corrupta. Verifique con su asesor comercial.' });
    }
  };

  const getWhatsAppUpgradeUrl = () => {
    const currentName = EDITION_DEFINITIONS[activeEdition]?.name || activeEdition;
    const message = encodeURIComponent(
      `¡Hola! Deseo consultar información o solicitar la activación de mi licencia KlikPOS.\n\n` +
      `*ID de Terminal (HWID):* ${terminalHwid}\n` +
      `*Plan Instalado:* ${currentName}\n` +
      `*Versión:* v3.0.0 Oficial`
    );
    return `https://wa.me/584248298026?text=${message}`;
  };

  const currentCaps = EDITION_DEFINITIONS[activeEdition] || EDITION_DEFINITIONS.KLIKPOS_LITE;

  // EXACTAMENTE 3 PLANES OFICIALES (LITE: FREE, PRO: $50, ELITE: $99)
  const PLANS_COMPARISON = [
    {
      id: 'KLIKPOS_LITE',
      name: 'KlikPOS Lite',
      subtitle: 'Comercio esencial, bodegas y ventas de mostrador',
      badge: 'LITE • GRATIS',
      badgeColor: 'bg-slate-700 text-white',
      price: 'Free',
      period: 'gratis de por vida',
      highlight: false,
      features: [
        'Punto de Venta ultra rápido 100% Offline',
        'Cortes de Caja (Cierre X y Cierre Z)',
        'Soporte de Balanzas y Tiqueteras Térmicas',
        'Catálogo Visual Cuadrícula optimizado',
        'Cálculo dual automático $ / Bs. (Tasa BCV)'
      ]
    },
    {
      id: 'KLIKPOS_PRO',
      name: 'KlikPOS Pro',
      subtitle: 'Minimarkets, tiendas y comercios en crecimiento',
      badge: 'MÁS POPULAR',
      badgeColor: 'bg-indigo-600 text-white',
      price: '$50',
      period: 'pago único vitalicio',
      highlight: true,
      features: [
        'Todo lo incluido en el Plan Lite',
        '📱 Escáner Inalámbrico por Celular (QR)',
        'Múltiples Vistas de Catálogo (Lista, Mini y Grid)',
        'Cuentas por Cobrar (Fiados) y Control de Deudas',
        'Reportes de Ganancias y Métricas Comerciales'
      ]
    },
    {
      id: 'KLIKPOS_ELITE',
      name: 'KlikPOS Elite',
      subtitle: 'Restaurantes, gastronomía, franquicias y cadenas',
      badge: 'TODO DESBLOQUEADO',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
      price: '$99',
      period: 'pago único vitalicio',
      highlight: false,
      features: [
        'Todo lo incluido en el Plan Pro',
        'Modo Restaurante Gourmet en 2 Columnas',
        'Salón, Mapa de Mesas y Comandas de Cocina',
        'Menú Digital QR & Pedidos por WhatsApp',
        'Personalización Total de Marca y Colores',
        'Conexión Móvil con la App KlikAdmin'
      ]
    }
  ];

  return (
    <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header Superior Principal */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="p-3 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl shadow-md shadow-indigo-100 dark:shadow-none shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Planes & Ediciones KlikPOS
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              Conoce nuestras ediciones disponibles y potencia tu comercio con la versión ideal.
            </p>
          </div>
        </div>

        {/* Tarjeta de Plan Actual en esta PC */}
        <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
          <div className="text-right">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500">Plan en esta PC</span>
            <div className="font-black text-slate-900 dark:text-white text-sm">
              {currentCaps.name}
            </div>
            <span className="text-[9.5px] font-mono text-slate-400">ID: {terminalHwid}</span>
          </div>
          <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase shadow-2xs ${
            activeEdition === 'KLIKPOS_ELITE'
              ? 'bg-amber-500 text-white'
              : activeEdition === 'KLIKPOS_PRO'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-white'
          }`}>
            {currentCaps.badge}
          </span>
        </div>
      </div>

      {/* BARRA DESTACADA DE ACTIVACIÓN DE LICENCIA & SOPORTE WHATSAPP (SIEMPRE VISIBLE ARRIBA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Módulo A: Pegar y Activar Clave (8 Columnas) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 rounded-3xl p-5 border-2 border-indigo-100 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Activar Licencia en esta PC
              </span>
            </div>

            {/* Botón para Copiar HWID */}
            <button
              type="button"
              onClick={handleCopyHwid}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-[11px] font-mono font-bold transition-all cursor-pointer"
              title="Copiar ID de Terminal para solicitar licencia"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedHwid ? '¡HWID Copiado!' : `ID: ${terminalHwid}`}</span>
            </button>
          </div>

          <form onSubmit={handleApplyActivationKey} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              placeholder="Pega aquí tu clave de licencia: KLIK-eyJhbGciOi..."
              value={inputActivationKey}
              onChange={(e) => setInputActivationKey(e.target.value)}
              className="flex-1 h-11 px-3.5 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 select-all"
            />
            <button
              type="submit"
              className="h-11 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Activar Licencia</span>
            </button>
          </form>

          {activationFeedback && (
            <div className={`mt-3 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
              activationFeedback.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-rose-50 text-rose-800 border border-rose-300'
            }`}>
              {activationFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{activationFeedback.msg}</span>
            </div>
          )}
        </div>

        {/* Módulo B: Botón Directo Soporte / Ventas WhatsApp (4 Columnas) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[9.5px] font-black uppercase tracking-widest text-emerald-200">
                Soporte & Asesoría
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[9px] font-bold">
                WhatsApp Oficial
              </span>
            </div>
            <h3 className="text-sm font-black text-white leading-tight">
              ¿Deseas Comprar o Actualizar?
            </h3>
            <p className="text-[11px] text-emerald-100 mt-0.5 leading-snug">
              Atención directa y entrega inmediata de claves.
            </p>
          </div>

          <a
            href={getWhatsAppUpgradeUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full py-2.5 px-4 rounded-xl bg-white hover:bg-emerald-50 text-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4.5 h-4.5 text-emerald-600" />
            <span className="font-extrabold text-slate-900">WhatsApp: +58 424-8298026</span>
          </a>
        </div>
      </div>

      {/* Cuadrícula Comparativa de los 3 Planes Oficiales (Lite: Free, Pro: $50, Elite: $99) */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-6">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            Nuestros 3 Planes Comerciales
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Diseñados para adaptarse a la evolución de tu negocio con máxima velocidad y estabilidad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {PLANS_COMPARISON.map((plan) => {
            const isCurrent = activeEdition === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 relative border-2 ${
                  isCurrent
                    ? 'border-emerald-500 bg-white dark:bg-slate-800 shadow-lg ring-2 ring-emerald-500/20'
                    : plan.highlight
                    ? 'border-indigo-500/80 bg-white dark:bg-slate-800 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xs'
                }`}
              >
                {/* Badge Superior */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded-lg ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> Plan Activo
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 min-h-[28px]">{plan.subtitle}</p>

                  <div className="my-4 pb-4 border-b border-slate-100 dark:border-slate-700 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{plan.price}</span>
                    <span className="text-xs text-slate-500">{plan.period}</span>
                  </div>

                  {/* Lista de Características Curadas */}
                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="p-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                        <span className="font-semibold leading-snug text-slate-800 dark:text-slate-200">
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
