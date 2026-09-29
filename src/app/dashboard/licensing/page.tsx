'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Zap,
  Sparkles,
  Lock,
  Crown,
  Smartphone,
  Layers,
  FileText,
  KeyRound,
  ExternalLink,
  MessageCircle,
  Laptop,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  KlikEdition,
  EDITION_DEFINITIONS,
  getActiveEdition,
  setActiveEdition,
  getActiveCapabilities,
  applyLicenseUpdate,
  LicensePayload
} from '@/lib/licensing/feature-flags';

export default function LicensingInformationPage() {
  const [activeEdition, setActiveEditionState] = useState<KlikEdition>('KLIKPOS_LITE');
  const [terminalHwid, setTerminalHwid] = useState('HWID-DESKTOP-POS');
  const [inputActivationKey, setInputActivationKey] = useState('');
  const [activationFeedback, setActivationFeedback] = useState<{ success: boolean; msg: string } | null>(null);

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

  const handleApplyActivationKey = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationFeedback(null);

    const cleanKey = inputActivationKey.trim();
    if (!cleanKey.startsWith('KLIK-')) {
      setActivationFeedback({ success: false, msg: 'Formato inválido. La clave debe comenzar con "KLIK-".' });
      return;
    }

    try {
      const b64 = cleanKey.replace('KLIK-', '');
      const decoded = JSON.parse(atob(b64)) as LicensePayload;
      if (decoded && (decoded.edition || decoded.tier)) {
        applyLicenseUpdate(decoded);
        const newEdition = getActiveEdition();
        setActiveEditionState(newEdition);
        setActivationFeedback({
          success: true,
          msg: `¡Licencia activada con éxito! Su terminal ha sido actualizado a ${EDITION_DEFINITIONS[newEdition]?.name || newEdition}.`
        });
        setInputActivationKey('');
      } else {
        throw new Error('Payload inválido');
      }
    } catch {
      setActivationFeedback({ success: false, msg: 'Clave de licencia no válida o corrupta. Verifique con su asesor comercial.' });
    }
  };

  const getWhatsAppUpgradeUrl = (targetEdition: string) => {
    const message = encodeURIComponent(
      `Hola! Deseo solicitar la actualización de mi software KlikPOS al plan *${targetEdition}* para mi terminal.\n\n*ID de Terminal (HWID):* ${terminalHwid}\n*Plan Actual:* ${EDITION_DEFINITIONS[activeEdition]?.name || activeEdition}\n*Versión:* v3.0.0`
    );
    return `https://wa.me/584248298026?text=${message}`;
  };

  const currentCaps = EDITION_DEFINITIONS[activeEdition] || EDITION_DEFINITIONS.KLIKPOS_LITE;

  const PLANS_COMPARISON = [
    {
      id: 'KLIKPOS_LITE',
      name: 'KlikPOS Lite',
      subtitle: 'Para pequeños comercios y bodegas',
      badge: 'LITE',
      badgeColor: 'bg-slate-700 text-white',
      price: '$40',
      period: 'pago único / anual',
      highlight: false,
      features: [
        { title: 'Ventas Rápidas en Mostrador', included: true },
        { title: 'Cortes de Caja (Cierre X y Z)', included: true },
        { title: 'Balanza Digital & Tickera Térmica', included: true },
        { title: 'Catálogo Vista Cuadrícula (4 cols)', included: true },
        { title: 'Modo Offline 100% Autónomo', included: true },
        { title: 'Escáner Celular Inalámbrico QR', included: false },
        { title: 'Múltiples Vistas (Lista & Mini)', included: false },
        { title: 'Gestión de Mesas y Comandas', included: false },
        { title: 'App de Delivery WhatsApp', included: false },
        { title: 'Temas & Colores Personalizados', included: false },
        { title: 'Dashboard Financiero P&L', included: false },
      ]
    },
    {
      id: 'KLIKPOS_PRO',
      name: 'KlikPOS Pro',
      subtitle: 'Para abastos, minimarkets y tiendas',
      badge: 'MÁS POPULAR',
      badgeColor: 'bg-indigo-600 text-white',
      price: '$80',
      period: 'pago único / anual',
      highlight: true,
      features: [
        { title: 'Ventas Rápidas en Mostrador', included: true },
        { title: 'Cortes de Caja (Cierre X y Z)', included: true },
        { title: 'Balanza Digital & Tickera Térmica', included: true },
        { title: 'Catálogo Vista Cuadrícula (4 cols)', included: true },
        { title: 'Modo Offline 100% Autónomo', included: true },
        { title: 'Escáner Celular Inalámbrico QR', included: true },
        { title: 'Múltiples Vistas (Lista & Mini)', included: true },
        { title: 'Cuentas por Cobrar (Fiados) & Pagar', included: true },
        { title: 'Reportes Profesionales de Ganancias', included: true },
        { title: 'Gestión de Mesas y Comandas', included: false },
        { title: 'Temas & Colores Personalizados', included: false },
      ]
    },
    {
      id: 'KLIKPOS_ELITE',
      name: 'KlikPOS Elite',
      subtitle: 'Restaurantes, gastronomía y franquicias',
      badge: 'TODO DESBLOQUEADO',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white',
      price: '$150',
      period: 'pago único / anual',
      highlight: false,
      features: [
        { title: 'Todas las funciones del Plan Pro', included: true },
        { title: '4 Vistas: Gourmet (2 cols), Lista, Mini, Grid', included: true },
        { title: 'Gestión de Mesas y Salón en Vivo', included: true },
        { title: 'Comandas de Cocina & Pantalla KDS', included: true },
        { title: 'Control de Motorizados & Delivery WhatsApp', included: true },
        { title: 'Personalización Total de Colores y Marca', included: true },
        { title: 'Dashboard Financiero P&L y Rentabilidad', included: true },
        { title: 'Lector Automático SMS Bancario Anti-Fraude', included: true },
        { title: 'Integración Nube con App Móvil KlikAdmin', included: true },
      ]
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header Informativo */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-3 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-2xl shadow-md shadow-indigo-100 dark:shadow-none">
              <ShieldCheck className="w-8 h-8" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                Planes & Ediciones KlikPOS
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                Conoce las características de tu software y solicita una ampliación de funciones para tu negocio.
              </p>
            </div>
          </div>
        </div>

        {/* Tarjeta de Plan Actual */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/80 px-5 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Plan Instalado en esta PC</span>
            <div className="font-black text-slate-900 dark:text-white text-base">
              {currentCaps.name}
            </div>
            <span className="text-[10px] font-mono text-slate-400">ID: {terminalHwid}</span>
          </div>
          <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase shadow-xs ${
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

      {/* Cuadrícula Comparativa de Planes Oficiales */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Compara las Ediciones de KlikPOS
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Escoge la versión adecuada para el tamaño y tipo de tu comercio. Puedes actualizar en cualquier momento sin perder tus datos de ventas e inventario.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS_COMPARISON.map((plan) => {
            const isCurrent = activeEdition === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative border-2 ${
                  isCurrent
                    ? 'border-emerald-500 bg-white dark:bg-slate-800 shadow-xl ring-2 ring-emerald-500/20'
                    : plan.highlight
                    ? 'border-indigo-500/80 bg-white dark:bg-slate-800 shadow-lg'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm'
                }`}
              >
                {/* Badge Superior */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                  {isCurrent && (
                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Plan Activo
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 min-h-[32px]">{plan.subtitle}</p>

                  <div className="my-5 pb-5 border-b border-slate-100 dark:border-slate-700">
                    <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{plan.price}</span>
                    <span className="text-xs text-slate-500 ml-1.5">{plan.period}</span>
                  </div>

                  {/* Lista de Características */}
                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 mb-6">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        {feat.included ? (
                          <span className="p-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="p-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 shrink-0 mt-0.5">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                        <span className={feat.included ? 'font-medium' : 'text-slate-400 line-through'}>
                          {feat.title}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Botón de Acción */}
                <div className="pt-2">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-3 px-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-black text-xs rounded-xl border border-emerald-300 dark:border-emerald-700 flex items-center justify-center gap-2 cursor-default"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Instalado y Activo</span>
                    </button>
                  ) : (
                    <a
                      href={getWhatsAppUpgradeUrl(plan.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer ${
                        plan.id === 'KLIKPOS_ELITE'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-orange-500/20'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Solicitar Upgrade a {plan.name}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección Inferior: Ingresar Clave de Activación Pro/Elite provista por el Distribuidor */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
          <span className="p-2 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <KeyRound className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              ¿Ya compraste tu Clave de Licencia?
            </h3>
            <p className="text-xs text-slate-500">
              Ingresa el código alfanumérico provisto por tu distribuidor para desbloquear las funciones de inmediato en esta PC.
            </p>
          </div>
        </div>

        <form onSubmit={handleApplyActivationKey} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Clave de Licencia (Token Criptográfico)
            </label>
            <input
              type="text"
              placeholder="KLIK-eyJhbGciOi..."
              value={inputActivationKey}
              onChange={(e) => setInputActivationKey(e.target.value)}
              className="w-full h-11 px-4 border border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 select-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-black rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Validar y Aplicar Licencia en esta PC</span>
          </button>
        </form>

        {activationFeedback && (
          <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 ${
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
    </div>
  );
}
