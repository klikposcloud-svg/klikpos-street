'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  KeyRound,
  Check,
  Copy,
  Sparkles,
  Sliders,
  DollarSign,
  Package,
  Layers,
  Lock,
  Unlock,
  Building,
  RefreshCw,
  QrCode,
  Smartphone,
  Cloud,
  FileText
} from 'lucide-react';
import {
  FeatureFlag,
  LicenseTier,
  PLAN_DEFINITIONS,
  getActiveLicensePayload,
  applyLicenseUpdate,
  setFeatureOverride,
  LicensePayload
} from '@/lib/licensing/feature-flags';

const ALL_FLAGS: { key: FeatureFlag; title: string; description: string; icon: React.ReactNode; category: string }[] = [
  {
    key: 'analytics_financial',
    title: 'Dashboard Financiero & P&L',
    description: 'Cálculo de Ganancia Neta, Costo de Mercancía (COGS), Gastos Operativos y Margen %.',
    icon: <DollarSign className="w-5 h-5 text-emerald-600" />,
    category: 'Inteligencia Financiera'
  },
  {
    key: 'credit_management',
    title: 'Cuentas por Cobrar & Fiados',
    description: 'Gestión de deudas de clientes, abonos parciales y recordatorio de cobranza WhatsApp.',
    icon: <UsersIcon className="w-5 h-5 text-indigo-600" />,
    category: 'Ventas y Clientes'
  },
  {
    key: 'payables_suppliers',
    title: 'Cuentas por Pagar & Proveedores',
    description: 'Directorio comercial de distribuidores, facturas por pagar y alertas de vencimiento.',
    icon: <Layers className="w-5 h-5 text-purple-600" />,
    category: 'Administración y Compras'
  },
  {
    key: 'seniat_fiscal_api',
    title: 'Digitalización SENIAT & QR Fiscal',
    description: 'Facturación Electrónica Digital, firmas criptográficas CUFE y puente fiscal.',
    icon: <FileText className="w-5 h-5 text-amber-600" />,
    category: 'Tributario & Legal'
  },
  {
    key: 'firestore_cloud_sync',
    title: 'Sincronización Nube & Red Delivery',
    description: 'Conexión a Firebase Firestore y publicación en el Marketplace nacional.',
    icon: <Cloud className="w-5 h-5 text-blue-600" />,
    category: 'Infraestructura Nube'
  },
  {
    key: 'digital_menu_qr',
    title: 'Menú Digital QR & Comandas Gourmet',
    description: 'Menú interactivo en mesas, escaneo QR sin app y pedidos vía WhatsApp.',
    icon: <QrCode className="w-5 h-5 text-orange-600" />,
    category: 'Restaurantes & Gourmet'
  },
  {
    key: 'sms_bank_monitor',
    title: 'Lector Automático SMS Pago Móvil',
    description: 'Detección anti-fraude de pagos bancarios en tiempo real.',
    icon: <Smartphone className="w-5 h-5 text-cyan-600" />,
    category: 'Seguridad de Pagos'
  },
  {
    key: 'unlimited_products',
    title: 'Catálogo de Productos Ilimitado',
    description: 'Supera el límite de 50 productos del plan gratuito (hasta 999.999 artículos).',
    icon: <Package className="w-5 h-5 text-teal-600" />,
    category: 'Inventario'
  },
  {
    key: 'multi_device_sync',
    title: 'Red Local Multi-Terminales / Mesoneros',
    description: 'Sincronización en tiempo real entre servidor PC y terminales móviles.',
    icon: <RefreshCw className="w-5 h-5 text-violet-600" />,
    category: 'Operaciones'
  },
  {
    key: 'customer_loyalty_crm',
    title: 'CRM 360° & Hábitos de Consumo',
    description: 'Estadísticas de clientes frecuentes, ticket promedio y fidelización.',
    icon: <Sparkles className="w-5 h-5 text-rose-600" />,
    category: 'Ventas y Clientes'
  },
];

function UsersIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export default function LicensingControlPage() {
  const [activePayload, setActivePayload] = useState<LicensePayload>(getActiveLicensePayload());
  const [selectedTier, setSelectedTier] = useState<LicenseTier>(activePayload.tier);
  const [customFlags, setCustomFlags] = useState<Partial<Record<FeatureFlag, boolean>>>(
    activePayload.customFlags || {}
  );
  const [generatedKey, setGeneratedKey] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [inputActivationKey, setInputActivationKey] = useState('');
  const [activationFeedback, setActivationFeedback] = useState<{ success: boolean; msg: string } | null>(null);

  useEffect(() => {
    const payload = getActiveLicensePayload();
    setActivePayload(payload);
    setSelectedTier(payload.tier);
    if (payload.customFlags) {
      setCustomFlags(payload.customFlags);
    }
  }, []);

  const handleApplyTier = (tier: LicenseTier) => {
    setSelectedTier(tier);
    const plan = PLAN_DEFINITIONS[tier];
    const newPayload: LicensePayload = {
      hwid: activePayload.hwid || 'KLIK-HWID-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      tier: tier,
      issuedAt: new Date().toISOString(),
      customFlags: tier === 'CUSTOM_PLAN' ? customFlags : undefined,
    };
    applyLicenseUpdate(newPayload);
    setActivePayload(newPayload);
  };

  const handleToggleCustomFlag = (flag: FeatureFlag) => {
    const nextState = !isFlagActive(flag);
    const updatedCustom = { ...customFlags, [flag]: nextState };
    setCustomFlags(updatedCustom);
    setFeatureOverride(flag, nextState);

    const newPayload: LicensePayload = {
      ...activePayload,
      tier: 'CUSTOM_PLAN',
      customFlags: updatedCustom,
    };
    applyLicenseUpdate(newPayload);
    setActivePayload(newPayload);
    setSelectedTier('CUSTOM_PLAN');
  };

  const isFlagActive = (flag: FeatureFlag): boolean => {
    if (selectedTier === 'CUSTOM_PLAN') {
      if (typeof customFlags[flag] === 'boolean') {
        return customFlags[flag]!;
      }
    }
    const def = PLAN_DEFINITIONS[selectedTier] || PLAN_DEFINITIONS.FREE_STARTER;
    return Boolean(def.features[flag]);
  };

  const handleGenerateLicenseKey = () => {
    const payloadToEncode: LicensePayload = {
      hwid: 'GENERIC_ACTIVATION',
      tier: selectedTier,
      issuedAt: new Date().toISOString(),
      customFlags: selectedTier === 'CUSTOM_PLAN' ? customFlags : undefined,
      signature: `SIG_KLIKPOS_${Date.now()}_SECURE`,
    };
    const b64 = btoa(JSON.stringify(payloadToEncode));
    const formatted = `KLIK-${b64}`;
    setGeneratedKey(formatted);
  };

  const handleApplyActivationKey = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationFeedback(null);
    if (!inputActivationKey.startsWith('KLIK-')) {
      setActivationFeedback({ success: false, msg: 'Formato de clave inválido. Debe comenzar con KLIK-.' });
      return;
    }

    try {
      const b64 = inputActivationKey.replace('KLIK-', '');
      const decoded = JSON.parse(atob(b64)) as LicensePayload;
      if (decoded && decoded.tier) {
        applyLicenseUpdate(decoded);
        setActivePayload(decoded);
        setSelectedTier(decoded.tier);
        if (decoded.customFlags) setCustomFlags(decoded.customFlags);
        setActivationFeedback({ success: true, msg: `¡Licencia activada con éxito! Plan: ${PLAN_DEFINITIONS[decoded.tier].name}` });
        setInputActivationKey('');
      } else {
        throw new Error('Payload corrupto');
      }
    } catch {
      setActivationFeedback({ success: false, msg: 'Error al desencriptar la licencia. Verifique el código.' });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-100">
              <ShieldCheck className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Centro de Licenciamiento & Paquetes</h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium">
                Control granular de características, personalización de planes comerciales y generación de claves de activación.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-200">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Plan Actual</span>
            <div className="font-extrabold text-slate-900 text-sm sm:text-base">
              {PLAN_DEFINITIONS[activePayload.tier]?.name || 'Plan Gratuito'}
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-600 text-white uppercase">
            {PLAN_DEFINITIONS[activePayload.tier]?.badge || 'FREE'}
          </span>
        </div>
      </div>

      {/* Selector de Planes Principales */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Seleccionar Paquete Comercial Base
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['FREE_STARTER', 'RETAIL_PRO', 'RESTAURANT_PRO', 'ENTERPRISE_CLOUD'] as LicenseTier[]).map((tierKey) => {
            const plan = PLAN_DEFINITIONS[tierKey];
            const isSelected = selectedTier === tierKey;

            return (
              <div
                key={tierKey}
                onClick={() => handleApplyTier(tierKey)}
                className={`p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {plan.badge}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-indigo-600 font-black" />}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">{plan.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{plan.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Límite Productos:</span>
                  <span className="text-xs font-extrabold text-slate-900">
                    {plan.maxProducts >= 999999 ? 'Ilimitado' : `${plan.maxProducts} ítems`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interruptores Granulares de Características (Feature Flags) */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              Matriz Granular de Características y Módulos
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Enciende o apaga módulos individuales. Al modificar cualquier casilla se creará un <span className="font-bold text-slate-900">Plan Personalizado a Medida</span>.
            </p>
          </div>

          <button
            onClick={() => handleApplyTier('CUSTOM_PLAN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition ${
              selectedTier === 'CUSTOM_PLAN'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Modo Plan a Medida
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALL_FLAGS.map((item) => {
            const enabled = isFlagActive(item.key);

            return (
              <div
                key={item.key}
                onClick={() => handleToggleCustomFlag(item.key)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                  enabled
                    ? 'border-indigo-200 bg-indigo-50/30'
                    : 'border-slate-200 bg-slate-50/60 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{item.title}</span>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-snug">{item.description}</p>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                      enabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generador y Activador de Licencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generar Clave para un Cliente */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-900 text-base">Generar Token de Activación</h3>
          </div>
          <p className="text-xs text-slate-600">
            Crea una clave criptográfica que contiene la configuración actual de módulos para enviársela a un cliente o terminal.
          </p>

          <button
            onClick={handleGenerateLicenseKey}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
          >
            Generar Clave para ({PLAN_DEFINITIONS[selectedTier].name})
          </button>

          {generatedKey && (
            <div className="p-3 bg-slate-900 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Clave de Licencia Generada:</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedKey ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="font-mono text-xs text-emerald-400 break-all select-all">{generatedKey}</p>
            </div>
          )}
        </div>

        {/* Activar Licencia en Esta Terminal */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Zap className="w-5 h-5" />
            </span>
            <h3 className="font-bold text-slate-900 text-base">Activar Licencia en este Dispositivo</h3>
          </div>
          <p className="text-xs text-slate-600">
            Pega aquí la clave de licencia provista por tu distribuidor para desbloquear funciones al instante.
          </p>

          <form onSubmit={handleApplyActivationKey} className="space-y-3">
            <input
              type="text"
              placeholder="KLIK-eyJhbGciOiJIUzI1..."
              value={inputActivationKey}
              onChange={e => setInputActivationKey(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition shadow-sm"
            >
              Aplicar y Desbloquear Módulos
            </button>
          </form>

          {activationFeedback && (
            <div className={`p-3 rounded-xl text-xs font-bold ${
              activationFeedback.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {activationFeedback.msg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
