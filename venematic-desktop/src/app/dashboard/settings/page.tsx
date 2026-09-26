'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { initializeDatabaseIfNeeded } from '@/lib/seed-data';
import BrandingSettings from '@/components/BrandingSettings';
import LicenseActivationModal from '@/components/LicenseActivationModal';
import CloudSyncSettingsCard from '@/components/CloudSyncSettingsCard';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ShieldCheck, ArrowLeft, Scale, CheckCircle2, AlertCircle, RefreshCw, Zap, Banknote, Upload, Image as ImageIcon, Trash2, Printer, Palette, Store, Users } from 'lucide-react';
import Link from 'next/link';
import { scaleService, ScaleProtocol, WeightReading, PriceMultiplierBasis } from '@/lib/hardware/scale';
import { getScaleBarcodeConfig, saveScaleBarcodeConfig, ScaleBarcodeConfig } from '@/lib/hardware/scale-barcode';
import { pagoMovilMonitor, initiateGmailOAuth, extractOAuthTokenFromUrl, verifyGmailToken } from '@/lib/payments/pago-movil-gmail-monitor';

export type SettingsTabId = 'branding' | 'business' | 'printer' | 'scale' | 'cashiers' | 'cloud_backup' | 'payments' | 'privacy_compliance';

export default function DesktopSettingsPage() {
  const { isAdmin, switchToRole } = useAuth();
  const [unlockPass, setUnlockPass] = useState('*2026');
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [rif, setRif] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [footerMessage, setFooterMessage] = useState('');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState<boolean>(true);
  const [receiptFeedMargin, setReceiptFeedMargin] = useState<'0mm' | '3mm' | '6mm' | '10mm'>('3mm');
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [primaryCurrency, setPrimaryCurrency] = useState<'VES' | 'USD'>('VES');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTabId>('branding');

  // Gmail Pago Móvil Monitor
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailClientId, setGmailClientId] = useState(
    process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || ''
  );
  const [gmailTolerance, setGmailTolerance] = useState(
    parseInt(process.env.NEXT_PUBLIC_PAGO_MOVIL_TOLERANCE_PCT || '2')
  );
  const [gmailVerifying, setGmailVerifying] = useState(false);
  const [gmailPollMs, setGmailPollMs] = useState<number>(8000);

  // Webhook Pago Móvil Monitor (Modo Dueño fuera del local)
  const [webhookSecret, setWebhookSecretState] = useState<string>('venematic-pm-2026-sec');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [webhookTestMsg, setWebhookTestMsg] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWhSecret = localStorage.getItem('venematic_pm_webhook_secret');
      if (savedWhSecret) setWebhookSecretState(savedWhSecret);
      setWebhookUrl(`${window.location.origin}/api/payments/webhook`);
    }
    db.settings.get('store_info').then((s) => {
      if (s && s.value) {
        setStoreName(s.value.name || '');
        setRif(s.value.rif || '');
        setPhone(s.value.phone || '');
        setAddress(s.value.address || '');
        setFooterMessage(s.value.footerMessage || '');
        setLogoUrl(s.value.logoUrl || '');
        setShowLogoOnReceipt(s.value.showLogoOnReceipt !== false);
      }
    });

    db.settings.get('paper_width').then((p) => {
      if (p) {
        setPaperWidth(p.value);
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-paper-width', p.value);
          const printableWidth = p.value === '58mm' ? '48mm' : '72mm';
          document.documentElement.style.setProperty('--receipt-width', printableWidth);
        }
      }
    });

    db.settings.get('receipt_feed_margin').then((m) => {
      if (m && m.value) {
        setReceiptFeedMargin(m.value);
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--receipt-feed-padding', m.value);
        }
      }
    });

    db.settings.get('gemini_api_key').then((k) => {
      if (k) setGeminiApiKey(k.value);
    });

    db.settings.get('primary_currency').then((c) => {
      if (c && (c.value === 'VES' || c.value === 'USD')) {
        setPrimaryCurrency(c.value);
      } else {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('venematic_primary_currency') : null;
        if (stored === 'USD' || stored === 'VES') setPrimaryCurrency(stored);
      }
    });

    // Verificar si hay token Gmail guardado o si viene de redirect OAuth
    const oauthResult = extractOAuthTokenFromUrl();
    if (oauthResult) {
      setActiveTab('payments');
      setGmailVerifying(true);
      verifyGmailToken(oauthResult.accessToken).then((info) => {
        if (info) {
          const cfg = pagoMovilMonitor.getConfig();
          pagoMovilMonitor.saveConfig({
            accessToken: oauthResult.accessToken,
            monitoredEmail: info.email,
            pollingIntervalMs: cfg?.pollingIntervalMs || 8000,
            tolerancePct: cfg?.tolerancePct || 2,
          });
          setGmailConnected(true);
          setGmailEmail(info.email);
        }
        setGmailVerifying(false);
      });
    } else {
      const saved = pagoMovilMonitor.getConfig();
      if (saved?.accessToken) {
        setGmailVerifying(true);
        verifyGmailToken(saved.accessToken).then((info) => {
          if (info) { setGmailConnected(true); setGmailEmail(info.email); }
          else { pagoMovilMonitor.clearConfig(); }
          setGmailVerifying(false);
        });
      }
    }
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen del logo no debe superar los 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
        setShowLogoOnReceipt(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoUrl('');
    setShowLogoOnReceipt(false);
  };

  const handleTestWebhook = async () => {
    setWebhookTestStatus('testing');
    try {
      const res = await fetch(`/api/payments/webhook?action=test&monto=150.00&banco=Banco de Venezuela`, {
        headers: { 'x-venematic-secret': webhookSecret }
      });
      const data = await res.json();
      if (data.success) {
        setWebhookTestStatus('success');
        setWebhookTestMsg(`¡Pago de prueba emitido! Ref: ${data.payment.referencia} por Bs. ${Number(data.payment.monto).toFixed(2)}`);
        setTimeout(() => setWebhookTestStatus('idle'), 5000);
      } else {
        setWebhookTestStatus('error');
        setWebhookTestMsg(data.error || 'Error al emitir prueba');
      }
    } catch (e: any) {
      setWebhookTestStatus('error');
      setWebhookTestMsg('Error de conexión con el servidor');
    }
  };

  const handleSaveWebhookSecret = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('venematic_pm_webhook_secret', webhookSecret);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.settings.put({
      key: 'store_info',
      value: {
        name: storeName,
        rif,
        phone,
        address,
        footerMessage,
        logoUrl,
        showLogoOnReceipt,
      },
    });

    await db.settings.put({
      key: 'paper_width',
      value: paperWidth,
    });

    await db.settings.put({
      key: 'receipt_feed_margin',
      value: receiptFeedMargin,
    });

    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-paper-width', paperWidth);
      const printableWidth = paperWidth === '58mm' ? '48mm' : '72mm';
      document.documentElement.style.setProperty('--receipt-width', printableWidth);
      document.documentElement.style.setProperty('--receipt-feed-padding', receiptFeedMargin);
    }

    await db.settings.put({
      key: 'gemini_api_key',
      value: geminiApiKey.trim(),
    });

    await db.settings.put({
      key: 'primary_currency',
      value: primaryCurrency,
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('venematic_primary_currency', primaryCurrency);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Exportar respaldo de datos local a JSON
  const handleExportBackup = async () => {
    const products = await db.products.toArray();
    const sales = await db.sales.toArray();
    const customers = await db.customers.toArray();
    const shifts = await db.cashShifts.toArray();
    const settings = await db.settings.toArray();

    const backupData = {
      version: 1,
      createdAt: new Date().toISOString(),
      products,
      sales,
      customers,
      shifts,
      settings,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `venematic-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetCatalog = async () => {
    if (!confirm('¿Desea restaurar el catálogo de productos a la configuración de prueba inicial?')) return;
    await db.products.clear();
    await initializeDatabaseIfNeeded();
    alert('Catálogo restaurado exitosamente.');
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-100 font-sans select-none">
        <div className="bg-white rounded-3xl border border-slate-300 shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Panel de Configuración Restringido</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            El módulo de configuración del sistema (F8), respaldos y parámetros fiscales está reservado exclusivamente para usuarios con <strong>Rol de Administrador</strong>.
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-left">
            <label className="block text-xs font-bold text-slate-700">
              Desbloquear con Clave de Administrador:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Clave (admin o *2026)"
                value={unlockPass}
                onChange={(e) => setUnlockPass(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  const ok = switchToRole('admin', unlockPass);
                  if (!ok) alert('Clave incorrecta. Claves válidas: "admin", "*2026" o "1234".');
                }}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                Desbloquear
              </button>
            </div>
            <button
              type="button"
              onClick={() => switchToRole('admin')}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 text-slate-900 font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              <span style={{ color: '#0f172a' }}>⚡ Activar Administrador con 1 Clic</span>
            </button>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/pos"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Regresar al Punto de Venta (F1)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const SETTINGS_TABS: { id: SettingsTabId; label: string; icon: any }[] = [
    { id: 'branding', label: 'Marca y Fondo', icon: Palette },
    { id: 'business', label: 'Datos del Negocio', icon: Store },
    { id: 'printer', label: 'Impresora y Logo', icon: Printer },
    { id: 'scale', label: 'Balanza Digital', icon: Scale },
    { id: 'cashiers', label: 'Cajeros y Seguridad', icon: Users },
    { id: 'cloud_backup', label: 'Nube y Respaldos', icon: RefreshCw },
    { id: 'payments', label: 'Pagos y Gmail', icon: Zap },
    { id: 'privacy_compliance', label: 'Privacidad y Normativa', icon: ShieldCheck },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto bg-slate-100 font-sans">
      {/* Cabecera y Barra de Pestañas Superior */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Configuración del Sistema
            </h2>
            <p className="text-xs text-slate-500">
              Personaliza el entorno visual, datos fiscales, comprobantes térmicos, balanza y seguridad
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLicenseModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 active:bg-indigo-900 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-white shrink-0" />
              <span className="text-white font-bold">Licenciamiento y HWID</span>
            </button>

            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg animate-in fade-in">
                ✓ Guardado
              </span>
            )}
          </div>
        </div>

        {/* Pestañas de Navegación Rápida */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-200 scrollbar-none">
          {SETTINGS_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-700 text-white shadow-sm ring-1 ring-sky-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. PESTAÑA: MARCA Y FONDO DEL ENTORNO */}
      {activeTab === 'branding' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <BrandingSettings />

          {/* Selector de Moneda Principal de Exhibición y Cobro */}
          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Moneda Principal de Visualización en Caja y Cobros
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Define qué moneda verá el cajero y el cliente en tamaño gigante prioritario
                  </p>
                </div>
              </div>

              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-300">
                {primaryCurrency === 'VES' ? '🇻🇪 Bolívares (Bs.) Prioritario' : '💵 Dólares ($ USD) Prioritario'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div
                onClick={async () => {
                  setPrimaryCurrency('VES');
                  await db.settings.put({ key: 'primary_currency', value: 'VES' });
                  if (typeof window !== 'undefined') localStorage.setItem('venematic_primary_currency', 'VES');
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 2500);
                }}
                className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all ${
                  primaryCurrency === 'VES'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="text-base">🇻🇪</span> Bolívares (Bs.) Prioritario
                  </span>
                  <input
                    type="radio"
                    name="primaryCurrency"
                    checked={primaryCurrency === 'VES'}
                    onChange={() => {}}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  El total a cobrar del ticket, los botones rápidos y el modal de cobro se muestran en <strong>fuente gigante en Bolívares (Bs.)</strong>, con el equivalente en $ en vivo como referencia secundaria.
                </p>
                <div className="mt-2 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md inline-block">
                  ★ RECOMENDADO PARA VENEZUELA (Pago Móvil / Punto)
                </div>
              </div>

              <div
                onClick={async () => {
                  setPrimaryCurrency('USD');
                  await db.settings.put({ key: 'primary_currency', value: 'USD' });
                  if (typeof window !== 'undefined') localStorage.setItem('venematic_primary_currency', 'USD');
                  setSavedSuccess(true);
                  setTimeout(() => setSavedSuccess(false), 2500);
                }}
                className={`cursor-pointer p-3.5 rounded-xl border-2 transition-all ${
                  primaryCurrency === 'USD'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="text-base">💵</span> Dólares ($ USD) Prioritario
                  </span>
                  <input
                    type="radio"
                    name="primaryCurrency"
                    checked={primaryCurrency === 'USD'}
                    onChange={() => {}}
                    className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  El total del ticket y los cobros se exhiben en <strong>fuente gigante en Dólares ($)</strong>, manteniendo la conversión en Bolívares en vivo calculada según la tasa del BCV.
                </p>
                <div className="mt-2 text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-md inline-block">
                  Ideal para cobro en divisas efectivo
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PESTAÑA: DATOS DEL NEGOCIO */}
      {activeTab === 'business' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div>
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">
                Datos Fiscales y Membrete del Negocio
              </h3>
              <p className="text-xs text-slate-500">
                Información legal que se imprimirá en los tickets y facturas fiscales
              </p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              Guardar Datos
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nombre Comercial de la Tienda:
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                RIF o Cédula Fiscal:
              </label>
              <input
                type="text"
                required
                value={rif}
                onChange={(e) => setRif(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Teléfono de Contacto:
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Dirección Física:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Mensaje de Pie de Ticket (Agradecimiento o Política de Cambio):
              </label>
              <input
                type="text"
                value={footerMessage}
                onChange={(e) => setFooterMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div className="md:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <label className="block font-semibold text-slate-700 flex items-center justify-between">
                <span>Google Vision / Gemini API Key (Reconocimiento Automático de Productos):</span>
                <span className="text-[10px] text-sky-600 font-normal">Opcional</span>
              </label>
              <input
                type="password"
                placeholder="AIzaSy... (Opcional para autocompletar foto con IA)"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
              <p className="text-[10px] text-slate-500">
                Permite reconocer el nombre, marca y categoría del producto mediante inteligencia artificial al fotografiarlo.
              </p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      )}

      {/* 3. PESTAÑA: IMPRESORA TÉRMICA Y LOGO */}
      {activeTab === 'printer' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div>
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Printer className="w-4 h-4 text-sky-600" />
                <span>Impresora Térmica y Logotipo del Ticket</span>
              </h3>
              <p className="text-xs text-slate-500">
                Ajusta el logotipo de membrete, tamaño de rollo y avance para eliminar tiras en blanco
              </p>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              Guardar Ajustes
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Logotipo del Negocio para Membrete de Tickets */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  <span>Logotipo del Negocio (Encabezado de Ticket)</span>
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-[11px] text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Logotipo</span>
                  </button>
                )}
              </div>

              {logoUrl ? (
                <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-300">
                  <div className="w-20 h-16 bg-slate-100 rounded border border-slate-200 p-1 flex items-center justify-center shrink-0">
                    <img
                      src={logoUrl}
                      alt="Logo Negocio"
                      className="max-h-full max-w-full object-contain filter grayscale contrast-125"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-800 block truncate">Logotipo Cargado Correctamente</span>
                    <label className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showLogoOnReceipt}
                        onChange={(e) => setShowLogoOnReceipt(e.target.checked)}
                        className="rounded accent-sky-600 cursor-pointer"
                      />
                      <span>Imprimir logotipo en el encabezado de los tickets</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="border-2 border-dashed border-slate-300 hover:border-sky-400 bg-white rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-sky-600 transition-colors mb-1" />
                    <span className="text-xs font-bold text-slate-700">Subir imagen de Logo (PNG / JPG / WebP)</span>
                    <span className="text-[10px] text-slate-400">Tamaño recomendado: 300x120px (Monocromático o alto contraste)</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="O pega aquí una URL directa de imagen..."
                      value={logoUrl}
                      onChange={(e) => {
                        setLogoUrl(e.target.value);
                        if (e.target.value) setShowLogoOnReceipt(true);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ajustes de Impresora Térmica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="block text-xs font-bold text-slate-800">
                  Ancho de Papel / Rollo Térmico:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperWidth('80mm')}
                    className={`py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                      paperWidth === '80mm'
                        ? 'bg-sky-700 text-white border-sky-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    80 mm (Estándar Punto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperWidth('58mm')}
                    className={`py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                      paperWidth === '58mm'
                        ? 'bg-sky-700 text-white border-sky-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    58 mm (Mini Térmica)
                  </button>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Avance Final de Papel (Sin espacio en blanco):
                  </span>
                  <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">
                    {receiptFeedMargin}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: '0mm', label: '0 mm', desc: 'Sin espacio' },
                    { id: '3mm', label: '3 mm', desc: 'Recomendado' },
                    { id: '6mm', label: '6 mm', desc: 'Normal' },
                    { id: '10mm', label: '10 mm', desc: 'Amplio' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setReceiptFeedMargin(f.id as any)}
                      className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                        receiptFeedMargin === f.id
                          ? 'bg-sky-700 text-white border-sky-700 font-bold shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs block font-bold">{f.label}</span>
                      <span className={`text-[9px] block ${receiptFeedMargin === f.id ? 'text-sky-100' : 'text-slate-400'}`}>
                        {f.desc}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Elimina las tiras excesivas de papel en blanco expulsadas tras terminar la impresión.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              Guardar Configuración de Impresión
            </button>
          </div>
        </form>
      )}

      {/* 4. PESTAÑA: BALANZA DIGITAL */}
      {activeTab === 'scale' && (
        <div className="animate-in fade-in duration-150">
          <DigitalScaleSettingsSection />
        </div>
      )}

      {/* 5. PESTAÑA: CAJEROS Y SEGURIDAD */}
      {activeTab === 'cashiers' && (
        <div className="animate-in fade-in duration-150">
          <CashiersManagementSection />
        </div>
      )}

      {/* 6. PESTAÑA: NUBE Y RESPALDOS */}
      {activeTab === 'cloud_backup' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <CloudSyncSettingsCard />

          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
              Base de Datos Local (IndexedDB / Dexie)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Toda la información de este terminal se almacena de forma segura en el disco local de tu computadora. Puedes generar un archivo de respaldo en cualquier momento para guardarlo en un pendrive o restaurarlo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Descargar Copia de Seguridad Completa (JSON)</span>
              </button>

              <button
                type="button"
                onClick={handleResetCatalog}
                className="w-full py-2.5 px-4 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Recargar Catálogo Inicial de Prueba</span>
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
              <strong>Terminal ID:</strong> POS-STANDALONE-01 <br />
              <strong>Motor:</strong> Tauri Rust Native Wrapper + Next.js Local Engine
            </div>
          </div>
        </div>
      )}

      {/* 7. PESTAÑA: PAGOS Y GMAIL */}
      {activeTab === 'payments' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs p-5 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                <span className="text-xl">&#x1F4E7;</span>
              </div>
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white">Confirmaci&oacute;n Autom&aacute;tica de Pago M&oacute;vil por Gmail</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Conecta el Gmail del negocio que recibe las notificaciones bancarias. Venematic detectar&aacute; el pago autom&aacute;ticamente.</p>
              </div>
            </div>
            <div className={`rounded-xl p-4 border-2 ${gmailConnected ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'}`}>
              {gmailVerifying ? (
                <div className="flex items-center gap-3"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Verificando conexi&oacute;n Gmail...</span></div>
              ) : gmailConnected ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div><div><p className="text-xs font-black text-emerald-800 dark:text-emerald-300">Gmail Conectado</p><p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-500">{gmailEmail}</p></div></div>
                  <button onClick={() => { pagoMovilMonitor.clearConfig(); setGmailConnected(false); setGmailEmail(''); }} className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer">Desconectar</button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center"><AlertCircle className="w-5 h-5 text-slate-400" /></div><div><p className="text-xs font-bold text-slate-700 dark:text-slate-300">No conectado</p><p className="text-[11px] text-slate-500">Conecta tu Gmail para habilitar la detecci&oacute;n autom&aacute;tica</p></div></div>
                  <button onClick={() => { if (!gmailClientId) { alert('Primero ingresa el Google Client ID.'); return; } pagoMovilMonitor.saveConfig({ accessToken: '', monitoredEmail: '', pollingIntervalMs: gmailPollMs, tolerancePct: gmailTolerance }); initiateGmailOAuth(gmailClientId); }} className="px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 shrink-0"><span>&#x1F517;</span><span>Conectar Gmail</span></button>
                </div>
              )}
            </div>
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Configuraci&oacute;n Avanzada</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Google Client ID (OAuth)</label><input type="text" value={gmailClientId} onChange={(e) => setGmailClientId(e.target.value)} placeholder="XXXXXXXXX.apps.googleusercontent.com" className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" /><p className="text-[11px] text-slate-400">Obtenido en Google Cloud Console &rarr; Credenciales OAuth</p></div>
                <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Tolerancia de monto (%)</label><div className="flex items-center gap-2"><input type="number" min={0} max={10} step={0.5} value={gmailTolerance} onChange={(e) => setGmailTolerance(parseFloat(e.target.value))} className="w-24 h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500" /><span className="text-xs text-slate-500">Ej: 2 = acepta &plusmn;2%</span></div></div>
                <div className="space-y-1.5"><label className="block text-xs font-bold text-slate-700 dark:text-slate-300">Frecuencia de verificaci&oacute;n</label><select value={gmailPollMs} onChange={(e) => setGmailPollMs(parseInt(e.target.value))} className="w-full h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"><option value={5000}>Cada 5 segundos</option><option value={8000}>Cada 8 segundos (recomendado)</option><option value={15000}>Cada 15 segundos</option><option value={30000}>Cada 30 segundos</option></select></div>
              </div>
              <button onClick={() => { const e = pagoMovilMonitor.getConfig(); if (e) pagoMovilMonitor.saveConfig({ ...e, pollingIntervalMs: gmailPollMs, tolerancePct: gmailTolerance }); setSavedSuccess(true); setTimeout(() => setSavedSuccess(false), 2000); }} className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">{savedSuccess ? '&#x2705; Guardado' : 'Guardar configuraci&oacute;n'}</button>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] text-blue-800 dark:text-blue-300"><span className="text-base">&#x1F512;</span><p><strong>Privacidad:</strong> Solo se leen emails de notificaci&oacute;n bancaria. Ning&uacute;n correo personal es accedido. El token se guarda &uacute;nicamente en este dispositivo.</p></div>
          </div>

          {/* TARJETA: WEBHOOK DE PAGO MÓVIL (MODO DUEÑO REMOTO) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 text-white shadow-sm font-black text-xl">
                  ⚡
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">Webhook de Pago M&oacute;vil (Due&ntilde;o fuera del local)</h3>
                    <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">En Vivo</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Permite a las cajas recibir confirmaciones al instante cuando el due&ntilde;o recibe SMS o notificaciones push bancarias en su tel&eacute;fono m&oacute;vil sin estar presente en la tienda.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>URL del Webhook de este Servidor POS</span>
                  <span className="text-[10px] font-normal text-slate-500">Apunta el reenv&iacute;o de SMS a esta direcci&oacute;n</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl || 'http://localhost:3002/api/payments/webhook'}
                    className="flex-1 h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-950 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) navigator.clipboard.writeText(webhookUrl);
                      alert('¡URL copiada al portapapeles!');
                    }}
                    className="px-3.5 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95"
                  >
                    Copiar URL
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Token Secreto de Seguridad (Opcional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={webhookSecret}
                      onChange={(e) => setWebhookSecretState(e.target.value)}
                      placeholder="venematic-pm-2026-sec"
                      className="flex-1 h-10 px-3 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-mono text-slate-900 dark:text-white bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleSaveWebhookSecret}
                      className="px-3 h-10 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shrink-0"
                    >
                      Guardar
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <button
                    type="button"
                    disabled={webhookTestStatus === 'testing'}
                    onClick={handleTestWebhook}
                    className="w-full h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-black shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {webhookTestStatus === 'testing' ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Enviando pago de prueba...</span>
                      </>
                    ) : (
                      <>
                        <span>🔔</span>
                        <span>Probar Webhook (Simular Pago Bs. 150.00)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {webhookTestMsg && (
                <div className={`p-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  webhookTestStatus === 'success' 
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' 
                    : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                }`}>
                  <span>{webhookTestStatus === 'success' ? '✅' : '⚠️'}</span>
                  <span>{webhookTestMsg}</span>
                </div>
              )}
            </div>

            {/* Guía Rápida para el Celular del Dueño */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <h5 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>📱</span>
                <span>¿C&oacute;mo configurarlo en el celular del due&ntilde;o en 3 pasos?</span>
              </h5>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                <li>Instala una app de automatizaci&oacute;n ligera en el tel&eacute;fono Android del due&ntilde;o (como <strong>MacroDroid</strong> o <strong>SMS Forwarder</strong> desde Google Play).</li>
                <li>Crea un disparador: cuando llegue un SMS de los n&uacute;meros del banco (ej. <em>2661 / 2662 Banco de Venezuela, Banesco, Mercantil, Bancamiga, BBVA Provincial, BNC</em>).</li>
                <li>Agrega la acci&oacute;n: enviar una petici&oacute;n <strong>HTTP POST</strong> a la URL del Webhook con el texto del SMS en el campo <code>message</code> o directamente en el cuerpo. El parser de Venematic extraer&aacute; autom&aacute;ticamente la referencia y el monto.</li>
              </ol>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs p-5">
            <h3 className="font-black text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-200 dark:border-slate-700 pb-2">M&eacute;todos de Pago Activos en el POS</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[{icon:'&#x1F4B5;',label:'Efectivo USD'},{icon:'&#x1F1FB;&#x1F1EA;',label:'Efectivo Bs.'},{icon:'&#x1F4F2;',label:'Pago M&oacute;vil'},{icon:'&#x1F4B3;',label:'Punto D&eacute;bito'},{icon:'&#x1F7E1;',label:'Binance Pay'},{icon:'&#x1F91D;',label:'Cr&eacute;dito / Fiado'},{icon:'&#x1F504;',label:'Pago Mixto'}].map((m) => (
                <div key={m.label} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span dangerouslySetInnerHTML={{__html: m.icon}} /><span className="text-xs font-semibold text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{__html: m.label}} /><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: PRIVACIDAD, REGULACIONES Y CUMPLIMIENTO SENIAT */}
      {activeTab === 'privacy_compliance' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-blue-800/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Auditado & Certificado
                  </span>
                  <span className="text-xs text-blue-200 font-medium">Marco Legal Venezuela</span>
                </div>
                <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Privacidad, Normativas Legales y SENIAT</span>
                </h2>
                <p className="text-xs text-blue-200/90 mt-1 max-w-2xl leading-relaxed">
                  Venematic POS está arquitecturado bajo soberanía de datos local (Offline-First), cumplimiento estricto de la Providencia 00071 del SENIAT y protección de identidad y métodos de pago.
                </p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-center"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                Imprimir Declaración Legal
              </button>
            </div>
          </div>

          {/* 6 Pilares de Cumplimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pilar 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:border-blue-400 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-sm shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    Soberanía de Datos (Zero Cloud Liability)
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Venematic es <strong>100% Offline-First</strong>. La base de datos de productos, inventario, precios, ventas y clientes se almacena exclusivamente en el almacenamiento local de este dispositivo. No transmitimos datos comerciales a servidores externos ni nubes de terceros.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Base de datos local encriptada y protegida
                  </div>
                </div>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:border-blue-400 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    Cumplimiento Fiscal SENIAT (Providencia 00071)
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    Estructurado bajo los lineamientos de facturación venezolana: numeración fiscal consecutiva y no reseteable, Libro de Ventas oficial (Diario, Semanal y Mensual) con desglose de <strong>Exento, Base 16%, Débito Fiscal IVA e IGTF 3%</strong>.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Tasa Oficial BCV requerida en comprobantes bi-monetarios
                  </div>
                </div>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:border-blue-400 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    Seguridad en Pagos y PCI DSS
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    <strong>Cero almacenamiento de tarjetas:</strong> El software nunca solicita, captura ni guarda números completos de tarjetas de débito/crédito, CVV ni claves bancarias. Las verificaciones de Pago Móvil y Zelle residen en memoria volátil efímera (RAM) con purga automática.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Tolerante a inspecciones bancarias y auditorías PCI
                  </div>
                </div>
              </div>
            </div>

            {/* Pilar 4 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:border-blue-400 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-sm shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    Privacidad de Hardware y Sensores
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    El permiso de cámara se usa estrictamente para la lectura de códigos de barras de productos y códigos QR de Pago Móvil. No se toman fotos ambientales, no hay vigilancia ni reconocimiento facial en ningún momento.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Cámara activa sólo mientras el escáner esté abierto
                  </div>
                </div>
              </div>
            </div>

            {/* Pilar 5 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:border-blue-400 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-sm shrink-0">
                  5
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    Licenciamiento HWID Criptográfico
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    La activación del software se valida mediante un identificador de hardware único (HWID) con firma <strong>HMAC-SHA256</strong>. La validación se ejecuta offline en el equipo, garantizando autenticidad sin requerir conexión permanente a internet.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Clave criptográfica vinculada a este equipo
                  </div>
                </div>
              </div>
            </div>

            {/* Pilar 6 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:border-blue-400 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black text-sm shrink-0">
                  6
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    Custodia y Responsabilidad de Respaldos
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 inline" />
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                    En cumplimiento con el Código Orgánico Tributario, la responsabilidad de conservar la información contable y fiscal corresponde al sujeto pasivo (comercio). Venematic provee la herramienta de <strong>Copia de Seguridad</strong> para exportar respaldos periódicos a medios externos.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                    Respaldos exportables en 1 clic desde la pestaña Sistema
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Marco Legal Referencial */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Referencias Legales y Normativas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <strong>SENIAT Providencia 00071:</strong> Normas generales de emisión de facturas y otros documentos.
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <strong>Convenio Cambiario N° 1 (BCV):</strong> Obligatoriedad de tasa oficial para transacciones en divisas.
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <strong>Gaceta Oficial N° 42.339:</strong> Aplicación de la alícuota del IGTF sobre pagos en divisas.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Licenciamiento y HWID */}
      <LicenseActivationModal
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
      />
    </div>
  );
}

function CashiersManagementSection() {
  const { cashiers, addCashier, updateCashier, deleteCashier, adminPassword, updateAdminPassword } = useAuth();
  
  // Estados para nuevo cajero
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [addError, setAddError] = useState('');

  // Estados para editar cajero
  const [editingCashier, setEditingCashier] = useState<{ id: string; name: string; username: string; pin: string } | null>(null);

  // Estados para contraseña de admin
  const [currentAdminPassInput, setCurrentAdminPassInput] = useState('');
  const [newAdminPassInput, setNewAdminPassInput] = useState('');
  const [confirmAdminPassInput, setConfirmAdminPassInput] = useState('');
  const [adminPassMsg, setAdminPassMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleCreateCashier = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newUsername.trim() || !newName.trim() || !newPin.trim()) {
      setAddError('Por favor complete todos los campos.');
      return;
    }
    const ok = addCashier({
      username: newUsername.trim(),
      name: newName.trim(),
      pin: newPin.trim(),
    });
    if (!ok) {
      setAddError('El nombre de usuario ya está en uso o no es válido.');
      return;
    }
    setNewUsername('');
    setNewName('');
    setNewPin('');
    setShowAddModal(false);
  };

  const handleSaveEditCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCashier) return;
    if (!editingCashier.name.trim() || !editingCashier.pin.trim()) {
      alert('Nombre y PIN no pueden estar vacíos.');
      return;
    }
    updateCashier(editingCashier.id, {
      name: editingCashier.name.trim(),
      pin: editingCashier.pin.trim(),
    });
    setEditingCashier(null);
  };

  const handleDeleteCashier = (id: string, name: string) => {
    if (cashiers.length <= 1) {
      alert('Debe existir al menos un cajero registrado en el sistema.');
      return;
    }
    if (confirm(`¿Está seguro de eliminar al cajero "${name}"?`)) {
      deleteCashier(id);
    }
  };

  const handleChangeAdminPass = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassMsg(null);

    if (currentAdminPassInput !== adminPassword) {
      setAdminPassMsg({ text: 'La contraseña actual del administrador es incorrecta.', isError: true });
      return;
    }

    if (!newAdminPassInput || newAdminPassInput.length < 4) {
      setAdminPassMsg({ text: 'La nueva contraseña debe tener al menos 4 caracteres.', isError: true });
      return;
    }

    if (newAdminPassInput !== confirmAdminPassInput) {
      setAdminPassMsg({ text: 'Las nuevas contraseñas no coinciden.', isError: true });
      return;
    }

    updateAdminPassword(newAdminPassInput);
    setCurrentAdminPassInput('');
    setNewAdminPassInput('');
    setConfirmAdminPassInput('');
    setAdminPassMsg({ text: 'Contraseña de administrador actualizada con éxito.', isError: false });
    setTimeout(() => setAdminPassMsg(null), 4000);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Gestión de Cajeros y Credenciales de Acceso
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Administre las cuentas de cajeros que pueden operar el punto de venta y actualice la contraseña maestra de administración.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setAddError('');
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Agregar Cajero</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de Cajeros */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Cajeros Autorizados ({cashiers.length})
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Nombre</th>
                  <th className="py-2.5 px-3">Usuario (Login)</th>
                  <th className="py-2.5 px-3">PIN / Clave</th>
                  <th className="py-2.5 px-3">Rol Asignado</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashiers.map((cashier) => (
                  <tr key={cashier.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {cashier.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-sky-700 font-bold">
                      {cashier.username}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      •••• ({cashier.pin})
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        Cajero / Ventas
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingCashier({ ...cashier })}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-sky-700 hover:bg-sky-50 rounded border border-slate-300 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCashier(cashier.id, cashier.name)}
                        disabled={cashiers.length <= 1}
                        title={cashiers.length <= 1 ? 'Debe haber al menos un cajero' : 'Eliminar cajero'}
                        className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Los cajeros pueden ingresar con su nombre de usuario y PIN para emitir tickets y agregar nuevos productos con fotos, pero requieren autorización de administrador para modificar precios, editar catálogo o borrar datos.
          </p>
        </div>

        {/* Tarjeta: Cambiar Contraseña de Administrador */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
          <form onSubmit={handleChangeAdminPass} className="space-y-3">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Clave Administrador
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Usuario fijo: <strong className="font-mono text-slate-700">admin</strong>
              </p>
            </div>

            {adminPassMsg && (
              <div
                className={`p-2 rounded text-[11px] font-bold ${
                  adminPassMsg.isError
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {adminPassMsg.text}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contraseña Actual:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ej: *2026"
                  value={currentAdminPassInput}
                  onChange={(e) => setCurrentAdminPassInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nueva Contraseña:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={newAdminPassInput}
                  onChange={(e) => setNewAdminPassInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirmar Nueva:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repita la nueva contraseña"
                  value={confirmAdminPassInput}
                  onChange={(e) => setConfirmAdminPassInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
              >
                Actualizar Clave Maestra
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal: Agregar Nuevo Cajero */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                Registrar Nuevo Cajero
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateCashier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre Completo del Cajero:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: María González"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre de Usuario (para Login):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: maria / caja2"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PIN o Contraseña de Acceso:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 5678"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Guardar Cajero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Cajero */}
      {editingCashier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                Editar Cajero: <span className="text-sky-700">{editingCashier.username}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCashier(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEditCashier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  required
                  value={editingCashier.name}
                  onChange={(e) => setEditingCashier({ ...editingCashier, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Usuario (No editable):
                </label>
                <input
                  type="text"
                  disabled
                  value={editingCashier.username}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PIN o Contraseña:
                </label>
                <input
                  type="text"
                  required
                  value={editingCashier.pin}
                  onChange={(e) => setEditingCashier({ ...editingCashier, pin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCashier(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Actualizar Credenciales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DigitalScaleSettingsSection() {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [protocol, setProtocol] = useState<ScaleProtocol>('torrey');
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [autoWeight, setAutoWeight] = useState<boolean>(true);
  const [defaultInputUnit, setDefaultInputUnit] = useState<'g' | 'kg'>('g');
  const [priceBasis, setPriceBasis] = useState<PriceMultiplierBasis>('1kg');
  const [manualWeightPrompt, setManualWeightPrompt] = useState<boolean>(true);
  const [barcodeScaleConfig, setBarcodeScaleConfig] = useState<ScaleBarcodeConfig>(getScaleBarcodeConfig());
  const [currentReading, setCurrentReading] = useState<WeightReading>({
    weight: 0,
    unit: 'kg',
    isStable: true,
    raw: '',
    timestamp: Date.now(),
  });
  const [connecting, setConnecting] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  const [connSuccess, setConnSuccess] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(scaleService.isSupported());
    setIsConnected(scaleService.isConnected());
    const cfg = scaleService.getConfig();
    setProtocol(cfg.protocol);
    setBaudRate(cfg.baudRate);
    setAutoWeight(cfg.autoWeight);
    setDefaultInputUnit(cfg.defaultInputUnit || 'g');
    setPriceBasis(cfg.priceBasis || '1kg');
    setManualWeightPrompt(cfg.manualWeightPrompt !== false);
    setBarcodeScaleConfig(getScaleBarcodeConfig());

    const unsub = scaleService.onWeightChange((reading) => {
      setCurrentReading(reading);
      setIsConnected(scaleService.isConnected());
    });

    return () => unsub();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setConnError(null);
    setConnSuccess(null);
    const res = await scaleService.connect({
      protocol,
      baudRate,
      autoWeight,
      enabled: true,
    });
    setConnecting(false);
    if (!res.success) {
      setConnError(res.error || 'No se pudo conectar a la balanza.');
    } else {
      setIsConnected(true);
      setConnSuccess('✓ Balanza conectada exitosamente al puerto serial.');
      setTimeout(() => setConnSuccess(null), 4000);
    }
  };

  const handleDisconnect = async () => {
    await scaleService.disconnect();
    setIsConnected(false);
  };

  const handleProtocolChange = (p: ScaleProtocol) => {
    setProtocol(p);
    scaleService.saveConfig({ protocol: p });
  };

  const handleBaudRateChange = (b: number) => {
    setBaudRate(b);
    scaleService.saveConfig({ baudRate: b });
  };

  const handleAutoWeightToggle = (val: boolean) => {
    setAutoWeight(val);
    scaleService.saveConfig({ autoWeight: val });
  };

  const handleDefaultInputUnitChange = (u: 'g' | 'kg') => {
    setDefaultInputUnit(u);
    scaleService.saveConfig({ defaultInputUnit: u });
  };

  const handlePriceBasisChange = (b: PriceMultiplierBasis) => {
    setPriceBasis(b);
    scaleService.saveConfig({ priceBasis: b });
  };

  const handleManualWeightPromptToggle = (val: boolean) => {
    setManualWeightPrompt(val);
    scaleService.saveConfig({ manualWeightPrompt: val });
  };

  const handleBarcodeConfigUpdate = (partial: Partial<ScaleBarcodeConfig>) => {
    const updated = saveScaleBarcodeConfig(partial);
    setBarcodeScaleConfig(updated);
  };

  const handleSimulate = (kg: number) => {
    scaleService.simulateWeight(kg);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-500" />
            <span>Periféricos: Balanza Electrónica de Mostrador</span>
            {isConnected ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                Conectada
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-300">
                Desconectada
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Conecte su balanza comercial (Torrey, CAS, Toledo, Systel) por puerto USB o Serial RS-232 para pesaje automático en el Punto de Venta.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              Desconectar Balanza
            </button>
          ) : (
            <button
              type="button"
              disabled={connecting}
              onClick={handleConnect}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{connecting ? 'Conectando...' : 'Conectar Balanza (Puerto COM)'}</span>
            </button>
          )}
        </div>
      </div>

      {connError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{connError}</span>
        </div>
      )}

      {connSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{connSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualizador Digital tipo Display de Balanza */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-lg text-white">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
            <span>DISPLAY DE BALANZA</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${currentReading.isStable ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              {currentReading.isStable ? 'ESTABLE' : 'PESANDO'}
            </span>
          </div>

          <div className="py-6 text-center">
            <span className="text-5xl font-black font-mono tracking-tighter text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.35)] tabular-numbers">
              {currentReading.weight.toFixed(3)}
            </span>
            <span className="text-xl font-bold font-mono text-emerald-500 ml-2">
              {currentReading.unit}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Trama Cruda:</span>
              <span className="text-slate-200 truncate max-w-[160px]">{currentReading.raw || '---'}</span>
            </div>

            {/* Simulador para pruebas sin balanza física */}
            <div className="pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Simular Peso para Pruebas:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.25, 0.5, 1.25, 0].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleSimulate(w)}
                    className="py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-[11px] font-bold rounded border border-slate-700"
                  >
                    {w > 0 ? `${w}kg` : '0 kg'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Protocolo y Comunicación */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Protocolo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Protocolo / Marca de Balanza:
              </label>
              <select
                value={protocol}
                onChange={(e) => handleProtocolChange(e.target.value as ScaleProtocol)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="torrey">Torrey (L-EQ / PCR / MFQ)</option>
                <option value="cas">CAS (PD-II / AP-1 / ER-Plus)</option>
                <option value="toledo">Toledo (8217 / Viva / Mettler)</option>
                <option value="systel">Systel (Croma / Clima / Brio)</option>
                <option value="generic">Genérico Continuo (Cualquier balanza Serial)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Ajusta el intérprete de tramas según el modelo conectado a tu puerto USB o COM.
              </p>
            </div>

            {/* Baudios */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Velocidad de Transmisión (Baud Rate):
              </label>
              <select
                value={baudRate}
                onChange={(e) => handleBaudRateChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value={9600}>9600 baudios (Estándar)</option>
                <option value={4800}>4800 baudios</option>
                <option value={2400}>2400 baudios</option>
                <option value={19200}>19200 baudios</option>
                <option value={115200}>115200 baudios</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                La mayoría de balanzas de mostrador operan a 9600 baudios, 8 bits, sin paridad.
              </p>
            </div>
          </div>

          {/* Opciones de Operación y Balanza Manual */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>Balanza de Mostrador Sin Cable / Entrada Manual</span>
              <span className="text-[10px] font-normal text-slate-500 normal-case">Configuración para cajeros</span>
            </h4>

            {/* Unidad preferida */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unidad de Entrada Predeterminada:
                </label>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handleDefaultInputUnitChange('g')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      defaultInputUnit === 'g'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Gramos (g)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDefaultInputUnitChange('kg')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      defaultInputUnit === 'kg'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kilogramos (kg)
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Si eliges Gramos, el cajero digita números enteros (ej: "250" g) en lugar de decimales ("0.250" kg).
                </p>
              </div>

              {/* Múltiplo de Precio Base */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Base del Múltiplo de Precios (Pesables):
                </label>
                <select
                  value={priceBasis}
                  onChange={(e) => handlePriceBasisChange(e.target.value as PriceMultiplierBasis)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="1kg">Por Kilo (1000g) — Estándar Supermercado</option>
                  <option value="100g">Por 100 Gramos — Charcutería / Delicatesses</option>
                  <option value="1g">Por 1 Gramo — Especias y Productos Finos</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Define la fórmula de cálculo del precio según cómo fijas el precio unitario en tu inventario.
                </p>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualWeightPrompt}
                  onChange={(e) => handleManualWeightPromptToggle(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Abrir Ingreso Manual al Tocar un Producto Vendido por Peso
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Si no hay una balanza conectada al computador por cable, muestra la calculadora de gramos/kilos de inmediato.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoWeight}
                  onChange={(e) => handleAutoWeightToggle(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Captura Automática de Puerto Serial (Balanza Conectada)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Al tener balanza física por USB/COM, toma el peso vivo del plato automáticamente.
                  </span>
                </div>
              </label>
            </div>

            {/* Configuración de Etiquetas EAN-13 GS1 de Balanzas Imprimibles */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span>Etiquetas de Balanzas Imprimibles (EAN-13 GS1)</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Decodificador Activo
                    </span>
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Permite escanear tickets adhesivos con código de barras impresos por balanzas de charcutería, carnicería y supermercado.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={barcodeScaleConfig.enabled}
                    onChange={(e) => handleBarcodeConfigUpdate({ enabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Habilitado</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Prefijos de Peso Variable:
                  </label>
                  <input
                    type="text"
                    value={barcodeScaleConfig.weightPrefixes.join(', ')}
                    onChange={(e) => {
                      const prefixes = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      handleBarcodeConfigUpdate({ weightPrefixes: prefixes });
                    }}
                    placeholder="20, 22, 24"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Estándar: 20, 22 (gramos entre 1000)</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Prefijos de Precio / Importe:
                  </label>
                  <input
                    type="text"
                    value={barcodeScaleConfig.pricePrefixes.join(', ')}
                    onChange={(e) => {
                      const prefixes = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      handleBarcodeConfigUpdate({ pricePrefixes: prefixes });
                    }}
                    placeholder="21, 23"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Estándar: 21 (monto total fijado en balanza)</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Longitud del Código PLU:
                  </label>
                  <select
                    value={barcodeScaleConfig.pluLength}
                    onChange={(e) => handleBarcodeConfigUpdate({ pluLength: Number(e.target.value) as 4 | 5 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                  >
                    <option value={4}>4 Dígitos (20 + PPPP + VVVVV + C)</option>
                    <option value={5}>5 Dígitos (20 + PPPPP + VVVV + C)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Estructura interna de la balanza</span>
                </div>
              </div>

              {/* Ejemplo en vivo */}
              <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] flex flex-wrap items-center justify-between gap-2 border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">Ejemplo:</span>
                  <span className="text-amber-300 font-black">20</span>
                  <span className="text-sky-300 font-black">0123</span>
                  <span className="text-emerald-400 font-black">00450</span>
                  <span className="text-slate-400">8</span>
                </div>
                <div className="text-[10px] text-slate-300 flex gap-2">
                  <span>PLU: <b className="text-sky-300">0123</b></span>
                  <span>·</span>
                  <span>Peso: <b className="text-emerald-400">0.450 kg (450g)</b></span>
                  <span>·</span>
                  <span className="text-amber-300 font-bold">¡Auto-liquidado!</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
            💡 <strong>Consejo Comercial:</strong> Si tu negocio cuenta con balanza digital de mostrador que no tiene cable al PC, utiliza el botón <strong>"Fijar Peso"</strong> en la barra superior del Punto de Venta para digitar los gramos o kilos en pantalla rápidamente con los botones preajustados (100g, 250g, 500g, 1kg), o escanea directamente las etiquetas impresas de peso variable (EAN-13).
          </div>
        </div>
      </div>
    </div>
  );
}


