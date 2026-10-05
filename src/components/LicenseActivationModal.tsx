'use client';

import React, { useState, useEffect } from 'react';
import { getMachineHWID } from '@/lib/licensing/hwid';
import {
  verifyLicenseKey,
  saveActivatedLicense,
  generateLicenseKey,
  getStoredLicenseStatus,
  ActivatedLicenseInfo,
  LicensePlan,
} from '@/lib/licensing/license-crypto';
import {
  ShieldCheck,
  KeyRound,
  Cpu,
  Copy,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  Lock,
  Building,
  Calendar,
  Phone,
  MessageCircle,
  CloudDownload,
} from 'lucide-react';
import LegalViewerModal from '@/components/LegalViewerModal';
import { getWhatsAppActivationUrl } from '@/lib/licensing/trial-manager';
import { cloudSyncService } from '@/lib/firebase/cloud-sync-service';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isTrialNotice?: boolean;
}

export default function LicenseActivationModal({ isOpen, onClose, onSuccess, isTrialNotice }: LicenseModalProps) {
  const [hwid, setHwid] = useState('');
  const [copiedHwid, setCopiedHwid] = useState(false);
  const [rif, setRif] = useState('');
  const [storeName, setStoreName] = useState('');
  const [productKey, setProductKey] = useState('');
  const [statusInfo, setStatusInfo] = useState<ActivatedLicenseInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Estados de Cumplimiento Legal (EULA, T&C, Privacidad)
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalDocToView, setLegalDocToView] = useState<'eula' | 'terms' | 'privacy'>('eula');

  // Estados del Keygen Oculto (Herramienta del Desarrollador)
  const [developerUnlocked, setDeveloperUnlocked] = useState(false);
  const [devClicks, setDevClicks] = useState(0);
  const [showKeygenTab, setShowKeygenTab] = useState(false);
  const [keygenTargetHwid, setKeygenTargetHwid] = useState('');
  const [keygenTargetRif, setKeygenTargetRif] = useState('');
  const [keygenPlan, setKeygenPlan] = useState<LicensePlan>('vitalicia');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const machineHwid = getMachineHWID();
      setHwid(machineHwid);
      setKeygenTargetHwid(machineHwid);

      // Cargar RIF si está guardado en los ajustes
      try {
        const compRaw = localStorage.getItem('klikpos_company_info');
        if (compRaw) {
          const comp = JSON.parse(compRaw);
          if (comp.rif) {
            setRif(comp.rif);
            setKeygenTargetRif(comp.rif);
          }
          if (comp.name) {
            setStoreName(comp.name);
          }
        }
        const rawStore = localStorage.getItem('venematic_store_info');
        if (rawStore) {
          const store = JSON.parse(rawStore);
          if (store.rif) {
            setRif(prev => prev || store.rif);
            setKeygenTargetRif(prev => prev || store.rif);
          }
          if (store.name || store.storeName) {
            setStoreName(prev => prev || store.name || store.storeName);
          }
        }
      } catch {}

      const current = getStoredLicenseStatus(machineHwid);
      setStatusInfo(current);
      if (current.payload?.rif) setRif(current.payload.rif);
      if (current.licenseKey) setProductKey(current.licenseKey);

      const accepted = localStorage.getItem('venematic_terms_accepted_at');
      if (accepted || current.status === 'active') {
        setTermsAccepted(true);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyHwid = () => {
    navigator.clipboard.writeText(hwid);
    setCopiedHwid(true);
    setTimeout(() => setCopiedHwid(false), 2500);
  };

  const handleBadgeClick = () => {
    const next = devClicks + 1;
    if (next >= 5) {
      setDevClicks(0);
      const pin = window.prompt('Ingrese PIN Maestro de Desarrollador KlikPOS:');
      if (pin === 'KLIK-2026-DEV' || pin === 'VNMT-2026-DEV' || pin === 'klikpos2026' || pin === 'venematic2026') {
        setDeveloperUnlocked(true);
        setShowKeygenTab(true);
      } else if (pin !== null) {
        alert('PIN de Desarrollador incorrecto.');
      }
    } else {
      setDevClicks(next);
      setTimeout(() => setDevClicks(0), 3000);
    }
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!termsAccepted) {
      setErrorMsg('Debe leer y aceptar el Contrato de Licencia (EULA) y los Términos de Servicio.');
      return;
    }

    if (!rif.trim()) {
      setErrorMsg('Debe indicar el RIF o Cédula del titular del negocio.');
      return;
    }

    if (!productKey.trim()) {
      setErrorMsg('Debe introducir la Clave de Activación suministrada.');
      return;
    }

    const verification = verifyLicenseKey(productKey, hwid, rif);

    if (!verification.valid) {
      setErrorMsg(verification.error || 'La clave no es válida para este computador.');
      return;
    }

    const matchedRif = verification.matchedRif || rif.trim().toUpperCase();

    // Registrar aceptación legal vinculante
    try {
      localStorage.setItem('venematic_terms_accepted_at', new Date().toISOString());
      localStorage.setItem('venematic_terms_version', '2026.1');
    } catch {}

    // Guardar la activación local
    saveActivatedLicense(
      {
        hwid,
        rif: matchedRif,
        plan: verification.plan || 'vitalicia',
        expiresAt: verification.expiresAt || 'NEVER',
        issuedAt: new Date().toISOString(),
        signature: productKey.split('-').slice(3).join('-'),
      },
      productKey.trim().toUpperCase()
    );

    // FUNCIÓN ESTRELLA: Registrar automáticamente en Firestore (Colección users / stores)
    cloudSyncService.registerUserLicenseAndConfig({
      hwid,
      rif: matchedRif,
      storeName: storeName.trim(),
      productKey: productKey.trim().toUpperCase(),
      plan: verification.plan || 'vitalicia',
      appVersion: 'KlikPOS Desktop / Web',
    }).then(res => {
      if (res.success) {
        console.log('[Licensing] Terminal y configuración respaldadas en Firestore.');
      }
    }).catch(() => {});

    setSuccessMsg('¡Activación exitosa! Terminal autenticada permanentemente y respaldada en la nube.');
    setStatusInfo(getStoredLicenseStatus(hwid));
    window.dispatchEvent(new CustomEvent('klikpos:license-activated'));
    window.dispatchEvent(new CustomEvent('venematic:license-activated'));
    if (onSuccess) onSuccess();
  };

  // FUNCIÓN ESTRELLA DE RECUPERACIÓN: Restaurar datos del negocio desde Firestore
  const handleRestoreBusiness = async () => {
    const searchKey = rif.trim() || productKey.trim();
    if (!searchKey) {
      setErrorMsg('Indique su RIF o Clave de Producto para buscar y restaurar su negocio desde la nube.');
      return;
    }

    setIsRestoring(true);
    setErrorMsg(null);
    setSuccessMsg('Conectando con Firestore para recuperar su negocio...');

    try {
      const res = await cloudSyncService.restoreUserAndConfig(searchKey);
      if (res.success) {
        setSuccessMsg(res.message);
        if (res.config?.storeName) setStoreName(res.config.storeName);
        if (res.config?.rif) setRif(res.config.rif);
        if (onSuccess) {
          setTimeout(() => onSuccess(), 2000);
        }
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al conectar con el servidor en la nube.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleGenerateInKeygen = () => {
    if (!keygenTargetHwid.trim() || !keygenTargetRif.trim()) {
      alert('Indique HWID y RIF para generar la llave.');
      return;
    }
    const key = generateLicenseKey(keygenTargetHwid, keygenTargetRif, keygenPlan);
    setGeneratedKey(key);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
      <div className="bg-[#070a12] text-white rounded-3xl shadow-2xl border border-slate-800 w-full max-w-xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="bg-[#090d16] border-b border-slate-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              onClick={handleBadgeClick}
              className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner cursor-pointer"
              title="KlikPOS Security"
            >
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight text-white whitespace-nowrap">
                Licencia de Terminal
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Activación y validación del sistema
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Pestañas de Navegación (Ocultas para clientes - Solo visibles si el desarrollador desbloquea con PIN) */}
        {developerUnlocked && (
          <div className="bg-[#090d16] border-b border-slate-800 px-5 pt-2.5 flex items-center gap-2 shrink-0 animate-in fade-in duration-200">
            <button
              type="button"
              onClick={() => setShowKeygenTab(false)}
              className={`px-3 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
                !showKeygenTab
                  ? 'bg-[#070a12] border-slate-700 text-amber-400 shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Activar Terminal</span>
            </button>

            <button
              type="button"
              onClick={() => setShowKeygenTab(true)}
              className={`px-3 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
                showKeygenTab
                  ? 'bg-[#070a12] border-slate-700 text-amber-400 shadow-xs'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Generador Privado (Keygen Propietario)</span>
            </button>
          </div>
        )}

        {/* Cuerpo con Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-5 scrollbar-thin bg-[#070a12]">
          {!showKeygenTab ? (
            /* ================= PESTAÑA 1: ACTIVACIÓN DE TERMINAL ================= */
            <div className="space-y-4">
              {/* Tarjeta de Información de Licencia */}
              {(statusInfo?.status !== 'active' || isTrialNotice) && (
                <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white leading-snug">
                        Período de Demostración Activo
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-medium">
                        Esta terminal requiere activación para habilitar uso comercial continuo.
                      </p>
                    </div>
                  </div>

                  {/* Respaldo de Datos */}
                  <div className="p-3 bg-[#090d16] rounded-xl border border-slate-800 flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-300 leading-relaxed">
                      <strong className="text-emerald-400 font-bold block mb-0.5">
                        Base de Datos Local Intacta
                      </strong>
                      Tus productos, precios y ventas registradas se conservan localmente en el dispositivo.
                    </div>
                  </div>

                  {/* Botón WhatsApp de Contacto Oficial */}
                  <div className="pt-1 flex flex-col sm:flex-row gap-2">
                    <a
                      href={getWhatsAppActivationUrl(hwid, storeName, rif)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Phone className="w-4 h-4 text-white" />
                      <span>Contactar Soporte por WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Tarjeta de Estado Actual */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                statusInfo?.status === 'active'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}>
                {statusInfo?.status === 'active' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-white">
                    {statusInfo?.status === 'active' ? 'Licencia Comercial Verificada' : 'Estado de Licencia'}
                  </h4>
                  <p className="text-xs font-medium text-slate-200 mt-0.5 leading-relaxed">{statusInfo?.message}</p>
                </div>
              </div>

              {/* ID de Terminal (Hardware ID) */}
              <div className="p-4 bg-[#090d16] rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-sky-400" />
                    <span>Código de Terminal (ID):</span>
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={hwid}
                    className="flex-1 px-3 py-2.5 bg-[#0c1220] border border-slate-700 rounded-xl font-mono font-black text-sm tracking-wider text-sky-400 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyHwid}
                    className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer ${
                      copiedHwid
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {copiedHwid ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedHwid ? 'Copiado' : 'Copiar ID'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Envía este código al distribuidor autorizado para recibir tu clave de activación.
                </p>
              </div>

              {/* Formulario de Activación */}
              <form onSubmit={handleActivate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1">
                      RIF o Cédula Registrada *:
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Ej: J-12345678-9"
                        value={rif}
                        onChange={(e) => setRif(e.target.value.toUpperCase())}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1">
                      Clave de Producto (Product Key) *:
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="VNK-VIT-PERP-XXXX-XXXX..."
                        value={productKey}
                        onChange={(e) => setProductKey(e.target.value.toUpperCase())}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-black text-slate-900 uppercase outline-none focus:ring-2 focus:ring-indigo-500 tracking-tight"
                      />
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Aceptación Obligatoria del Marco Legal (EULA, T&C, Privacidad) */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer shrink-0"
                    />
                    <span className="leading-relaxed">
                      He leído y acepto el{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setLegalDocToView('eula');
                          setShowLegalModal(true);
                        }}
                        className="text-indigo-600 font-bold underline hover:text-indigo-800 cursor-pointer"
                      >
                        Contrato de Licencia (EULA)
                      </button>
                      , los{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setLegalDocToView('terms');
                          setShowLegalModal(true);
                        }}
                        className="text-indigo-600 font-bold underline hover:text-indigo-800 cursor-pointer"
                      >
                        Términos & Descargo SENIAT
                      </button>{' '}
                      y la{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setLegalDocToView('privacy');
                          setShowLegalModal(true);
                        }}
                        className="text-indigo-600 font-bold underline hover:text-indigo-800 cursor-pointer"
                      >
                        Privacidad On-Premise
                      </button>
                      .
                    </span>
                  </label>
                  {!termsAccepted && (
                    <p className="text-xs text-amber-800 font-bold pl-6">
                      * Es indispensable aceptar las condiciones de uso y propiedad intelectual para registrar la licencia.
                    </p>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRestoreBusiness}
                    disabled={isRestoring}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-sky-500/30 bg-[#0c1220] hover:bg-slate-800 text-sky-400 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Si cambiaste de equipo o reinstalaste la app, recupera tu configuración y productos desde la nube"
                  >
                    <CloudDownload className={`w-4 h-4 text-sky-400 ${isRestoring ? 'animate-bounce' : ''}`} />
                    <span>{isRestoring ? 'Restaurando...' : 'Recuperar Negocio desde Nube'}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={!termsAccepted}
                    className={`w-full sm:w-auto px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
                      termsAccepted
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                    title={!termsAccepted ? 'Debe aceptar el marco legal para activar' : 'Activar licencia'}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Activar Terminal Oficial</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ================= PESTAÑA 2: KEYGEN PROPIETARIO ================= */
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl text-xs text-indigo-950 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Panel Maestro de Generación:</strong> Esta utilidad te permite emitir licencias válidas para tus clientes introduciendo el HWID que te suministren. La clave generada solo funcionará en esa máquina física.
                </div>
              </div>

              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    HWID del Computador del Cliente:
                  </label>
                  <input
                    type="text"
                    placeholder="VNXX-XXXX-XXXX-XXXX"
                    value={keygenTargetHwid}
                    onChange={(e) => setKeygenTargetHwid(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      RIF del Cliente:
                    </label>
                    <input
                      type="text"
                      placeholder="J-12345678-9"
                      value={keygenTargetRif}
                      onChange={(e) => setKeygenTargetRif(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Modalidad de Licencia:
                    </label>
                    <select
                      value={keygenPlan}
                      onChange={(e) => setKeygenPlan(e.target.value as LicensePlan)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      <option value="promo_6m">⭐ Promo Lanzamiento - 6 Meses con Nube ($35 - 180 Días)</option>
                      <option value="basico_local">⚡ Básico Local - PERMANENTE ($40 - Sin Nube)</option>
                      <option value="pro_full">👑 Pro Full Empresarial - PERMANENTE ($75 - Todo Incluido)</option>
                      <option value="pro_trial">💳 Plan a Crédito Pro - 1ra Cuota 50% ($37.50 - 30 Días)</option>
                      <option value="starter_trial">💳 Plan a Crédito Starter - 1ra Cuota ($25 - 30 Días)</option>
                      <option value="starter_full">⭐ Starter - Licencia Full $50 (Permanente)</option>
                      <option value="cloud_monthly">☁️ Suscripción Respaldo Nube ($5/mes - 30 Días)</option>
                      <option value="trial_15m">⏱️ Prueba Flash - 15 Minutos (Pre-pago / Demo)</option>
                      <option value="vitalicia">🛡️ Vitalicia / Perpetua (Sin Vencimiento)</option>
                      <option value="anual">📅 Anual (1 Año de soporte)</option>
                      <option value="demo">⏳ Demo (15 Días de Evaluación)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateInKeygen}
                    className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Generar Llave Criptográfica HMAC</span>
                  </button>
                </div>
              </div>

              {generatedKey && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-900">Llave Generada para el Cliente:</span>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase">{keygenPlan}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedKey}
                      className="flex-1 px-3 py-2 bg-white border border-emerald-400 rounded-xl font-mono font-black text-xs text-emerald-950 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedKey);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
                    >
                      {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copiada' : 'Copiar Llave'}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProductKey(generatedKey);
                      setRif(keygenTargetRif);
                      setShowKeygenTab(false);
                    }}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline block pt-1"
                  >
                    → Probar esta llave en la pestaña de activación de este equipo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Visor de Acuerdos Legales */}
      <LegalViewerModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        defaultDoc={legalDocToView}
        onAccept={() => setTermsAccepted(true)}
      />
    </div>
  );
}
