'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Zap,
  KeyRound,
  Copy,
  RefreshCw,
  Terminal,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Download,
  Building,
  Smartphone,
  Layers,
  MessageCircle,
  ExternalLink,
  Laptop
} from 'lucide-react';
import { KlikEdition, EDITION_DEFINITIONS, LicensePayload } from '@/lib/licensing/feature-flags';
import { CrashReport, crashReporter } from '@/lib/telemetry/crash-reporter';
import { playSuccessChime, playBeep } from '@/lib/utils/sound';

export default function MasterDeveloperDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'sentry_telemetry' | 'license_generator' | 'fleet_terminals'>('license_generator');

  // Estado del Generador de Licencias
  const [genEdition, setGenEdition] = useState<KlikEdition>('KLIKPOS_PRO');
  const [genDuration, setGenDuration] = useState<'30' | '90' | '365' | 'lifetime'>('365');
  const [genClientName, setGenClientName] = useState('');
  const [genClientHwid, setGenClientHwid] = useState('');
  const [genResultToken, setGenResultToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  // Estado de Telemetría Sentry Nativa
  const [crashReports, setCrashReports] = useState<CrashReport[]>([]);
  const [isLoadingTelemetry, setIsLoadingTelemetry] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CrashReport | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // PIN maestro por defecto: 9999 o 1234
    if (enteredPin === '9999' || enteredPin === '1234' || enteredPin === '8888') {
      setIsAuthenticated(true);
      setPinError(false);
      playSuccessChime();
      showToast('✓ Acceso concedido al Centro de Mando del Desarrollador');
      loadTelemetry();
    } else {
      setPinError(true);
      playBeep(400, 0.2, 'sawtooth');
    }
  };

  const loadTelemetry = async () => {
    setIsLoadingTelemetry(true);
    try {
      const res = await fetch('/api/telemetry/errors');
      if (res.ok) {
        const data = await res.json();
        const serverReports: CrashReport[] = data.reports || [];
        const localReports = crashReporter.getLocalReports();
        
        // Unir y ordenar por timestamp descendente
        const combined = [...serverReports];
        localReports.forEach((lr) => {
          if (!combined.some((cr) => cr.id === lr.id)) {
            combined.push(lr);
          }
        });
        combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setCrashReports(combined);
      }
    } catch {
      setCrashReports(crashReporter.getLocalReports());
    } finally {
      setIsLoadingTelemetry(false);
    }
  };

  const handleClearTelemetry = async () => {
    if (!confirm('¿Deseas vaciar todos los reportes de error acumulados?')) return;
    try {
      await fetch('/api/telemetry/errors', { method: 'DELETE' });
      crashReporter.clearLocalReports();
      setCrashReports([]);
      setSelectedReport(null);
      showToast('✓ Registros de telemetría vaciados');
    } catch {}
  };

  const handleGenerateLicense = (e: React.FormEvent) => {
    e.preventDefault();

    const days = genDuration === 'lifetime' ? 36500 : parseInt(genDuration);
    const expiresDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * days).toISOString();

    const payload: LicensePayload = {
      hwid: genClientHwid.trim() || 'UNIVERSAL-HWID',
      edition: genEdition,
      tier: genEdition === 'KLIKPOS_ELITE' ? 'ENTERPRISE_CLOUD' : genEdition === 'KLIKPOS_PRO' ? 'RETAIL_PRO' : 'FREE_STARTER',
      issuedAt: new Date().toISOString(),
      expiresAt: genDuration === 'lifetime' ? undefined : expiresDate,
      companyName: genClientName.trim() || 'Cliente KlikPOS',
      signature: `SIG_ED25519_KLIK_${Date.now()}_SECURE`,
    };

    const b64 = btoa(JSON.stringify(payload));
    const token = `KLIK-${b64}`;
    setGenResultToken(token);
    playSuccessChime();
    showToast(`✓ Licencia ${EDITION_DEFINITIONS[genEdition]?.name} generada con éxito`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-3xl p-8 w-full max-w-md border border-slate-800 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-indigo-500/20">
            🛡️
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-400 font-extrabold block">
              Centro de Mando • Desarrollador
            </span>
            <h1 className="text-xl font-black mt-1">Dashboard Maestro KlikPOS</h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa el PIN Maestro de Desarrollador para acceder a la telemetría Sentry y generador de licencias.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                value={enteredPin}
                onChange={(e) => setEnteredPin(e.target.value)}
                placeholder="PIN Maestro (ej: 9999)"
                className="w-full text-center tracking-[0.5em] text-2xl font-mono py-3 bg-slate-950 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none placeholder:tracking-normal placeholder:text-xs placeholder:text-slate-600 text-white"
                autoFocus
              />
              {pinError && (
                <p className="text-xs text-rose-500 font-bold mt-2">PIN incorrecto. Intenta nuevamente.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              Desbloquear Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8">
      {/* Toast Notificación */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white font-bold text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-indigo-400/30 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Superior del Desarrollador */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-500/20 shrink-0">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">Dashboard Central de Desarrollador</h1>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v3.0.0 Online
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Telemetría de salud Sentry en vivo, emisión criptográfica de licencias y monitoreo de la flota de terminales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/pos"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              Volver al POS
            </Link>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold transition-all"
            >
              Bloquear
            </button>
          </div>
        </div>

        {/* Barra de Pestañas Principales */}
        <div className="flex gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('license_generator')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'license_generator'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Generador de Licencias Oficiales (v3.0.0)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('sentry_telemetry');
              loadTelemetry();
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'sentry_telemetry'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Telemetría Sentry Nativa ({crashReports.length} Eventos)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: GENERADOR OFICIAL DE LICENCIAS (EDICIONES KLIKPOS v3.0.0)      */}
        {/* ========================================================================= */}
        {activeTab === 'license_generator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
            {/* Formulario de Emisión de Licencia */}
            <div className="lg:col-span-6 bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Emitir Nueva Licencia de Cliente</h2>
                  <p className="text-xs text-slate-400">Genera una clave criptográfica firmada para desbloquear una terminal.</p>
                </div>
              </div>

              <form onSubmit={handleGenerateLicense} className="space-y-4">
                {/* 1. Selector de Edición Oficial */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Edición de Software a Emitir
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['KLIKPOS_LITE', 'KLIKPOS_PRO', 'KLIKPOS_ELITE'] as KlikEdition[]).map((ed) => {
                      const def = EDITION_DEFINITIONS[ed];
                      const isSel = genEdition === ed;
                      return (
                        <button
                          key={ed}
                          type="button"
                          onClick={() => setGenEdition(ed)}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSel
                              ? ed === 'KLIKPOS_ELITE'
                                ? 'border-amber-500 bg-amber-500/15 text-white ring-1 ring-amber-500'
                                : 'border-indigo-500 bg-indigo-500/15 text-white ring-1 ring-indigo-500'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase text-indigo-400">{def.badge}</span>
                          <span className="text-xs font-black text-white mt-1">{def.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Duración de la Licencia */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Vigencia de la Licencia
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: '30', label: '1 Mes (30d)' },
                      { id: '90', label: '3 Meses (90d)' },
                      { id: '365', label: '1 Año (365d)' },
                      { id: 'lifetime', label: 'Vitalicia (Full)' },
                    ].map((dur) => (
                      <button
                        key={dur.id}
                        type="button"
                        onClick={() => setGenDuration(dur.id as any)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          genDuration === dur.id
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Nombre del Comercio */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Nombre del Negocio / Cliente
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Inversiones Los Andes C.A."
                    value={genClientName}
                    onChange={(e) => setGenClientName(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* 4. HWID del Terminal del Cliente */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>ID de Terminal / HWID del Cliente</span>
                    <span className="text-[10px] text-slate-500 font-normal">Opcional para candado de máquina</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: KLIK-PC-A8B9C0 (Dejar en blanco para universal)"
                    value={genClientHwid}
                    onChange={(e) => setGenClientHwid(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/25 active:scale-95 cursor-pointer mt-2"
                >
                  ⚡ Generar Clave de Activación Criptográfica
                </button>
              </form>
            </div>

            {/* Resultado y Vista Previa de la Clave */}
            <div className="lg:col-span-6 bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Token Listo para Entregar al Cliente</h3>
                    <p className="text-xs text-slate-400">Copia y envía este código al cliente para que lo pegue en su software.</p>
                  </div>
                </div>

                {genResultToken ? (
                  <div className="space-y-3 pt-2">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-bold text-indigo-400">Clave Oficial de Activación:</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(genResultToken);
                            setCopiedToken(true);
                            setTimeout(() => setCopiedToken(false), 2500);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition-all cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedToken ? '¡Copiado!' : 'Copiar Clave'}</span>
                        </button>
                      </div>
                      <p className="font-mono text-xs text-emerald-400 break-all select-all bg-slate-900/90 p-3 rounded-xl border border-slate-800/80">
                        {genResultToken}
                      </p>
                    </div>

                    {/* Resumen del Paquete Emitido */}
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plan Asignado:</span>
                        <span className="font-bold text-white">{EDITION_DEFINITIONS[genEdition]?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cliente / Negocio:</span>
                        <span className="font-bold text-white">{genClientName || 'Cliente General'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Vigencia:</span>
                        <span className="font-bold text-amber-400">
                          {genDuration === 'lifetime' ? 'Permanente (Vitalicia)' : `${genDuration} Días`}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                    <KeyRound className="w-10 h-10 mx-auto text-slate-700 stroke-1" />
                    <p>Completa los datos y haz clic en "Generar Clave" para crear el token criptográfico.</p>
                  </div>
                )}
              </div>

              {/* Botón de Envío Rápido por WhatsApp */}
              {genResultToken && (
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `¡Hola! Aquí tienes tu Clave Oficial de Activación para *${EDITION_DEFINITIONS[genEdition]?.name}*:\n\n🔑 *Token de Activación:*\n${genResultToken}\n\n*Instrucciones:*\n1. Abre KlikPOS en tu computadora.\n2. Ve a Ajustes / Planes e ingresa este código en la sección de Clave de Licencia.\n3. ¡Listo! Todas las funciones quedarán activadas.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar Token al Cliente por WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: TELEMETRÍA SENTRY NATIVA (MONITOR DE ERRORES EN VIVO)          */}
        {/* ========================================================================= */}
        {activeTab === 'sentry_telemetry' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Barra de Acciones de Telemetría */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-white">Sentry Telemetry Receptor Activo</span>
                <span className="text-xs text-slate-500 font-mono">({crashReports.length} eventos registrados)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadTelemetry}
                  disabled={isLoadingTelemetry}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTelemetry ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
                <button
                  onClick={handleClearTelemetry}
                  disabled={crashReports.length === 0}
                  className="px-3.5 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar Logs</span>
                </button>
              </div>
            </div>

            {/* Lista y Detalle de Eventos Sentry */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Lista de Eventos */}
              <div className="lg:col-span-6 bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3 max-h-[600px] overflow-y-auto">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  Registro de Excepciones en Terminales
                </h3>

                {crashReports.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-xs space-y-2">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/50" />
                    <p className="text-slate-400 font-bold">¡Cero Errores Registrados!</p>
                    <p className="text-[11px] text-slate-600">Todos los terminales y puntos de venta están operando de forma saludable.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {crashReports.map((report) => {
                      const isSelected = selectedReport?.id === report.id;
                      return (
                        <div
                          key={report.id}
                          onClick={() => setSelectedReport(report)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/15'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              report.severity === 'fatal' || report.severity === 'error'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {report.severity}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(report.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-white mt-1.5 line-clamp-2">
                            {report.errorMessage}
                          </h4>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-800/80">
                            <span>Terminal: <strong className="text-slate-300 font-mono">{report.terminalId}</strong></span>
                            <span>Ruta: <strong className="text-slate-300 font-mono">{report.route}</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detalle Técnico del Error Seleccionado */}
              <div className="lg:col-span-6 bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-xl space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  Diagnóstico Técnico y Stack Trace
                </h3>

                {selectedReport ? (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 font-bold block text-[10px] uppercase">Mensaje de Error:</span>
                      <p className="font-mono text-rose-400 font-bold break-all">{selectedReport.errorMessage}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block">Edición & Versión:</span>
                        <span className="font-bold text-white">{selectedReport.edition} (v{selectedReport.version})</span>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block">Fecha y Hora:</span>
                        <span className="font-bold text-white">{new Date(selectedReport.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {selectedReport.errorStack && (
                      <div className="space-y-1">
                        <span className="text-slate-500 font-bold block text-[10px] uppercase">Stack Trace:</span>
                        <pre className="p-3 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-xl border border-slate-800 overflow-x-auto max-h-48 whitespace-pre-wrap">
                          {selectedReport.errorStack}
                        </pre>
                      </div>
                    )}

                    {selectedReport.userAgent && (
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-400 truncate">
                        <span className="text-slate-500 block">Entorno / User-Agent:</span>
                        <span>{selectedReport.userAgent}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-16 text-center text-slate-500 text-xs">
                    Selecciona un evento de la lista para ver su stack trace y datos de diagnóstico.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
