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
} from 'lucide-react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LicenseActivationModal({ isOpen, onClose, onSuccess }: LicenseModalProps) {
  const [hwid, setHwid] = useState('');
  const [copiedHwid, setCopiedHwid] = useState(false);
  const [rif, setRif] = useState('');
  const [productKey, setProductKey] = useState('');
  const [statusInfo, setStatusInfo] = useState<ActivatedLicenseInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados del Keygen Oculto (Herramienta del Desarrollador)
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
        const rawStore = localStorage.getItem('venematic_store_info');
        if (rawStore) {
          const store = JSON.parse(rawStore);
          if (store.rif) {
            setRif(store.rif);
            setKeygenTargetRif(store.rif);
          }
        }
      } catch {}

      const current = getStoredLicenseStatus(machineHwid);
      setStatusInfo(current);
      if (current.payload?.rif) setRif(current.payload.rif);
      if (current.licenseKey) setProductKey(current.licenseKey);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyHwid = () => {
    navigator.clipboard.writeText(hwid);
    setCopiedHwid(true);
    setTimeout(() => setCopiedHwid(false), 2500);
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

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

    // Guardar la activación
    saveActivatedLicense(
      {
        hwid,
        rif: rif.trim().toUpperCase(),
        plan: verification.plan || 'vitalicia',
        expiresAt: verification.expiresAt || 'NEVER',
        issuedAt: new Date().toISOString(),
        signature: productKey.split('-').slice(3).join('-'),
      },
      productKey.trim().toUpperCase()
    );

    setSuccessMsg('¡Activación exitosa! Terminal autenticada permanentemente.');
    setStatusInfo(getStoredLicenseStatus(hwid));
    if (onSuccess) onSuccess();
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
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-300 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                <span>Licenciamiento y Activación Offline</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/20 font-mono">
                  HMAC-SHA256
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Protección antipiratería por Hardware ID vinculada al equipo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 pt-2.5 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowKeygenTab(false)}
            className={`px-3 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all flex items-center gap-1.5 ${
              !showKeygenTab
                ? 'bg-white border-slate-200 text-indigo-700 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
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
                ? 'bg-white border-slate-200 text-indigo-700 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Generador Privado (Keygen Propietario)</span>
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {!showKeygenTab ? (
            /* ================= PESTAÑA 1: ACTIVACIÓN DE TERMINAL ================= */
            <div className="space-y-4">
              {/* Tarjeta de Estado Actual */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                statusInfo?.status === 'active'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-amber-50 border-amber-300 text-amber-950'
              }`}>
                {statusInfo?.status === 'active' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-extrabold text-xs uppercase tracking-wider">
                    {statusInfo?.status === 'active' ? 'Licencia Comercial Verificada' : 'Estado de Licencia'}
                  </h4>
                  <p className="text-xs font-medium mt-0.5 leading-relaxed">{statusInfo?.message}</p>
                </div>
              </div>

              {/* ID de Máquina (Hardware ID) */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    <span>Identificador de Hardware de este Computador (HWID):</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Inmutable</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={hwid}
                    className="flex-1 px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-black text-sm tracking-wider text-slate-900 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyHwid}
                    className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                      copiedHwid
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-900 text-white'
                    }`}
                  >
                    {copiedHwid ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedHwid ? 'Copiado' : 'Copiar ID'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Envía este código al distribuidor autorizado para recibir tu clave de desbloqueo firmada.
                </p>
              </div>

              {/* Formulario de Activación */}
              <form onSubmit={handleActivate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">
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

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
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
                      <option value="vitalicia">🛡️ Vitalicia / Perpetua (Sin Vencimiento)</option>
                      <option value="anual">📅 Anual (1 Año de soporte)</option>
                      <option value="demo">⏳ Demo (15 Días de Prueba)</option>
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
    </div>
  );
}
