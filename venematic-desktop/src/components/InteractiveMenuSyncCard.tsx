'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { menuPosBridge, MenuSyncSettings, DEFAULT_MENU_SYNC_SETTINGS } from '@/lib/sync/menu-pos-bridge';
import {
  Utensils,
  Tablet,
  Wifi,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Send,
  QrCode,
  Copy,
  Check,
  Radio,
  ArrowRightLeft,
} from 'lucide-react';

import { useLicenseFeatures } from '@/lib/licensing/use-license-features';

export default function InteractiveMenuSyncCard() {
  const [settings, setSettings] = useState<MenuSyncSettings>(DEFAULT_MENU_SYNC_SETTINGS);
  const [serverInfo, setServerInfo] = useState<{ localIp: string; port: string; serverUrl: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [planBlockedMsg, setPlanBlockedMsg] = useState(false);

  const { plan, features, planName } = useLicenseFeatures();
  const isElitePlan = features.interactiveMenuSync || plan === 'vitalicia' || plan === 'pro_full' || plan === 'promo_6m' || plan === 'trial_15m' || (plan as string).toLowerCase().includes('elite');

  useEffect(() => {
    // 1. Initialize bridge listener
    menuPosBridge.initLocalChannel();

    // 2. Load stored settings from db
    db.settings.get('menu_sync_config').then((rec) => {
      if (rec && rec.value) {
        setSettings(rec.value);
        if (typeof window !== 'undefined') {
          localStorage.setItem('venematic_klikmenu_enabled', String(rec.value.enabled));
        }
      }
      setIsLoading(false);
    });

    // 3. Fetch server network IP
    fetch('/api/system/network-ip')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setServerInfo({
            localIp: data.localIp,
            port: data.port,
            serverUrl: data.serverUrl,
          });
        }
      })
      .catch(() => {
        setServerInfo({
          localIp: '127.0.0.1',
          port: '3000',
          serverUrl: 'http://localhost:3000',
        });
      });
  }, []);

  const handleSaveSettings = async (newSettings: MenuSyncSettings) => {
    if (!isElitePlan && newSettings.enabled) {
      setPlanBlockedMsg(true);
      setTimeout(() => setPlanBlockedMsg(false), 4000);
      return;
    }
    setSettings(newSettings);
    setIsSaving(true);
    await db.settings.put({
      key: 'menu_sync_config',
      value: newSettings,
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('venematic_klikmenu_enabled', String(newSettings.enabled));
      window.dispatchEvent(new CustomEvent('venematic:klikmenu_toggled', { detail: newSettings.enabled }));
    }
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleBroadcastCatalog = async () => {
    await menuPosBridge.broadcastCurrentCatalog();
    setTestResult('¡Catálogo y tasa BCV emitidos al canal en tiempo real!');
    setTimeout(() => setTestResult(null), 3500);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-500">
        Cargando configuración del Menú Interactivo...
      </div>
    );
  }

  const menuEndpointUrl = serverInfo ? `${serverInfo.serverUrl}/api/sync/menu/orders` : 'http://localhost:3000/api/sync/menu/orders';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/50">
        <div className="flex items-center gap-3">
          {settings.enabled && isElitePlan && (
            <Link
              href="/dashboard/mesas"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-xs"
            >
              <Utensils className="w-4 h-4" />
              <span>Ver Salón & Mesas en Vivo</span>
            </Link>
          )}
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              Sincronización con KlikMenu (Food POS & Mesas)
              {isElitePlan ? (
                <span className="px-2.5 py-0.5 text-xs rounded-full font-bold bg-purple-100 text-purple-800 border border-purple-300">
                  Plan Elite Activo
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Exclusivo Plan Elite
                </span>
              )}
              {settings.enabled && isElitePlan && (
                <span className="px-2.5 py-0.5 text-xs rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Módulo Activo
                </span>
              )}
            </h3>
            <p className="text-sm text-slate-500">
              Conexión bidireccional en tiempo real entre KlikPOS y las terminales de KlikMenu (Salón, Mesas, Delivery y Cocina).
            </p>
          </div>
        </div>

        {/* Elite Plan Switcher */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Habilitar Mesas / KlikMenu:
          </span>
          <button
            type="button"
            onClick={() => handleSaveSettings({ ...settings, enabled: !settings.enabled })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
              settings.enabled && isElitePlan ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled && isElitePlan ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {planBlockedMsg && (
        <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>El módulo de Mesas y Menú KlikMenu está disponible exclusivamente para el <b>Plan Elite</b> o <b>Licencia Vitalicia</b>. Tu plan actual es: {planName}.</span>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Modos de Comunicación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MODO 1: LOCAL DIRECTO */}
          <div
            onClick={() => handleSaveSettings({ ...settings, activeMode: 'local' })}
            className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative ${
              settings.activeMode === 'local'
                ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <Tablet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Modo 1: Local Directo</h4>
                  <p className="text-xs text-slate-500">Misma PC / Pantalla Doble de Cliente</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-700">Listo</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Comunicación instantánea en tiempo real vía <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-mono">BroadcastChannel</code>. Cero configuración de red requerida.
            </p>
          </div>

          {/* MODO 2: RED WI-FI LOCAL */}
          <div
            onClick={() => handleSaveSettings({ ...settings, activeMode: 'lan' })}
            className={`p-5 rounded-xl border-2 transition-all cursor-pointer relative ${
              settings.activeMode === 'lan'
                ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700">
                  <Wifi className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">Modo 2: Red Wi-Fi / LAN</h4>
                  <p className="text-xs text-slate-500">Tablets y Celulares en Mesas / Salón</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-xs font-bold text-blue-700">Multi-Equipo</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Las tablets conectadas a la misma red Wi-Fi envían comandas directamente a esta caja mediante API REST.
            </p>
          </div>
        </div>

        {/* LAN Connection Details & QR */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-blue-600" />
              URL de Conexión de esta Caja (Red Local):
            </span>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono font-bold text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-300">
                {menuEndpointUrl}
              </code>
              <button
                type="button"
                onClick={() => handleCopyUrl(menuEndpointUrl)}
                className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
                title="Copiar URL"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Pega esta URL en el Dev Studio de la tablet o escanea la IP en la misma red Wi-Fi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBroadcastCatalog}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold flex items-center gap-2 transition shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Emitir Catálogo & Tasa BCV Ahora</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Automatizaciones de Caja */}
        <div className="border-t border-slate-200 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-700" />
            Opciones de Procesamiento Automático:
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={settings.autoDeductStock}
                onChange={(e) => handleSaveSettings({ ...settings, autoDeductStock: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Descontar Inventario Automáticamente</span>
                <span className="text-[11px] text-slate-500">Resta unidades de stock en KlikPOS al cobrar cada orden.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={settings.autoPrintKitchenTicket}
                onChange={(e) => handleSaveSettings({ ...settings, autoPrintKitchenTicket: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Imprimir Ticket de Comanda / Cocina</span>
                <span className="text-[11px] text-slate-500">Envía automáticamente a la impresora térmica 80mm/58mm.</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
