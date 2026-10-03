'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Smartphone,
  Cloud,
  CheckCircle2,
  Sparkles,
  Lock,
  ArrowRight,
  Gift,
  HelpCircle,
  Copy,
  Check,
  AlertCircle,
  ShieldAlert,
  Send,
  Zap,
} from 'lucide-react';
import { getMachineHWID } from '@/lib/licensing/hwid';
import { OFFICIAL_WHATSAPP_PHONE } from '@/lib/licensing/trial-manager';
import { verifyLicenseKey, saveActivatedLicense, getStoredLicenseStatus } from '@/lib/licensing/license-crypto';

interface StreetAmbassadorLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
  primaryColor?: string;
  storeName?: string;
  rif?: string;
  onLicenseActivated?: () => void;
}

export default function StreetAmbassadorLicenseModal({
  isOpen,
  onClose,
  isLight = false,
  primaryColor = '#0284c7',
  storeName = 'Mi Negocio',
  rif = 'Pendiente',
  onLicenseActivated,
}: StreetAmbassadorLicenseModalProps) {
  const [hwid, setHwid] = useState<string>('CARGANDO...');
  const [copiedHwid, setCopiedHwid] = useState(false);
  const [ambassadorCode, setAmbassadorCode] = useState('');
  const [paymentOption, setPaymentOption] = useState<'cash' | 'credit' | 'vip'>('cash');
  const [cloudAddon, setCloudAddon] = useState(true);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [isLicensed, setIsLicensed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getMachineHWID().then(id => {
        setHwid(id);
        const status = getStoredLicenseStatus(id);
        setIsLicensed(status.status === 'active');
      });
      try {
        const savedCode = localStorage.getItem('klikpos_ambassador_code');
        if (savedCode) setAmbassadorCode(savedCode);
      } catch {}
    }
  }, [isOpen]);

  const handleCopyHwid = () => {
    navigator.clipboard.writeText(hwid);
    setCopiedHwid(true);
    setTimeout(() => setCopiedHwid(false), 2000);
  };

  const handleSaveAmbassadorCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    setAmbassadorCode(clean);
    try {
      localStorage.setItem('klikpos_ambassador_code', clean);
    } catch {}
  };

  const generateWhatsAppUrl = () => {
    const cleanHwid = hwid.trim().toUpperCase();
    let modeText = 'Pago Único de Contado ($15 USD - Ahorro de $10)';
    if (paymentOption === 'credit') {
      modeText = 'Plan Financiado a Crédito ($25 USD: $10 hoy + $15 a los 15 días)';
    } else if (paymentOption === 'vip') {
      modeText = 'Plan Full VIP Blindado ($50 USD: $25 hoy + $25 a la quincena, con 1 año de Respaldo Cloud)';
    }
    const promoText = ambassadorCode ? `🎁 *Código de Embajador / Promotor:* \`${ambassadorCode}\` (Comisión $5 asignada)\n` : '';

    const text =
      `¡Hola KlikPOS! 🚀 Quiero activar la licencia oficial para mi negocio:\n\n` +
      `🏪 *Comercio / Negocio:* ${storeName || 'Mi Negocio'}\n` +
      `📋 *RIF o Cédula:* ${rif || 'Sin RIF'}\n` +
      `💻 *ID del Equipo (HWID):* \`${cleanHwid}\`\n` +
      `${promoText}` +
      `💳 *Modalidad de Pago:* ${modeText}\n` +
      `☁️ *Seguro Antirrobo & Cloud Backup:* 30 Días de Prueba Activados\n\n` +
      `Adjunto comprobante de Pago Móvil para recibir mi clave de activación. ¡Muchas gracias!`;

    return `https://wa.me/${OFFICIAL_WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
  };

  const handleActivateWithKey = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');

    if (!licenseKeyInput.trim()) {
      setActivationError('Por favor introduce tu clave de activación.');
      return;
    }

    const verification = verifyLicenseKey(licenseKeyInput.trim(), hwid, rif || 'STREET');
    if (verification.valid) {
      saveActivatedLicense({
        hwid,
        rif: rif || 'STREET',
        plan: verification.plan || 'vitalicia',
        expiresAt: verification.expiresAt || 'NEVER',
        issuedAt: new Date().toISOString(),
        signature: 'VERIFIED'
      }, licenseKeyInput.trim());
      setActivationSuccess(true);
      setIsLicensed(true);
      if (onLicenseActivated) onLicenseActivated();
      setTimeout(() => {
        onClose();
      }, 2500);
    } else {
      setActivationError(verification.error || 'Clave de activación inválida para este equipo.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs">
      <div
        className={`relative w-full max-w-2xl max-h-[92vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* HEADER */}
        <header
          className="px-6 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: isLight ? '#e2e8f0' : '#1e293b' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md font-black"
              style={{ backgroundColor: primaryColor }}
            >
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                  Activación de Licencia & Seguro Cloud
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Street v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Adquiere tu licencia oficial de por vida con soporte y respaldo en la nube.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Identificador de Equipo (HWID) */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                ID Único de tu Terminal (HWID)
              </span>
              <span className="text-xs sm:text-sm font-mono font-black text-sky-400 truncate block">
                {hwid}
              </span>
            </div>

            <button
              onClick={handleCopyHwid}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
            >
              {copiedHwid ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHwid ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          {/* CÓDIGO DE EMBAJADOR / PROMOTOR */}
          <div
            className={`p-4 rounded-2xl border space-y-2.5 bg-gradient-to-r ${
              isLight
                ? 'from-amber-500/10 via-orange-500/5 to-transparent border-amber-300'
                : 'from-amber-500/15 via-orange-500/5 to-transparent border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-amber-500">¿Vienes referido por otro comerciante?</span>
              </div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Comisión $5</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ingresa el Código de Embajador (Ej: JUAN5)"
                value={ambassadorCode}
                onChange={e => handleSaveAmbassadorCode(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-xl border text-xs font-mono font-black uppercase outline-none ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800 focus:border-amber-500'
                    : 'bg-slate-950 border-slate-800 text-amber-300 focus:border-amber-500'
                }`}
              />
            </div>

            {ambassadorCode && (
              <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  ¡Código <strong>{ambassadorCode}</strong> aplicado! Tu distribuidor recibirá su comisión de $5 y tú obtienes soporte prioritario.
                </span>
              </p>
            )}
          </div>

          {/* SELECTOR DE PLAN: CONTADO $15 VS CRÉDITO $25 VS VIP $50 */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-400 block">
              Selecciona tu Modalidad de Activación
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Opción 1: Contado $15 (Recomendada) */}
              <div
                onClick={() => setPaymentOption('cash')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                  paymentOption === 'cash'
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/20'
                    : isLight
                    ? 'border-slate-200 bg-white hover:border-slate-300'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="absolute top-2 right-2">
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-500 text-white">
                    -40% OFF
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-black text-slate-400 block">Contado</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-black text-emerald-500 font-mono">$15</span>
                    <span className="text-[10px] font-bold text-slate-400">USD único</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-snug">
                    Vitalicio de por vida. Sin deudas.
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Ahorras $10 USD</span>
                </div>
              </div>

              {/* Opción 2: Financiado en 2 Cuotas $25 */}
              <div
                onClick={() => setPaymentOption('credit')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  paymentOption === 'credit'
                    ? 'border-sky-500 bg-sky-500/10 shadow-md ring-2 ring-sky-500/20'
                    : isLight
                    ? 'border-slate-200 bg-white hover:border-slate-300'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-[11px] font-black text-slate-400 block">Financiado (2 partes)</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-black text-sky-400 font-mono">$25</span>
                    <span className="text-[10px] font-bold text-slate-400">USD total</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-snug">
                    <strong>$10 hoy</strong> + <strong>$15 en 15 días</strong>.
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-sky-500/20 flex items-center gap-1 text-[10px] font-bold text-sky-400">
                  <Zap className="w-3 h-3 shrink-0" />
                  <span>Arrancas con solo $10</span>
                </div>
              </div>

              {/* Opción 3: VIP $50 */}
              <div
                onClick={() => setPaymentOption('vip')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  paymentOption === 'vip'
                    ? 'border-purple-500 bg-purple-500/10 shadow-md ring-2 ring-purple-500/20'
                    : isLight
                    ? 'border-slate-200 bg-white hover:border-slate-300'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div>
                  <span className="text-[11px] font-black text-slate-400 block">Full VIP Blindado</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-black text-purple-400 font-mono">$50</span>
                    <span className="text-[10px] font-bold text-slate-400">USD</span>
                  </div>
                  <p className="text-[10.5px] text-slate-400 leading-snug">
                    <strong>$25 hoy</strong> + <strong>$25 a la quincena</strong>.
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-purple-500/20 flex items-center gap-1 text-[10px] font-bold text-purple-400">
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>1 Año Cloud + Logo</span>
                </div>
              </div>
            </div>
          </div>

          {/* BENEFICIO: SEGURO ANTIRROBO Y CLOUD BACKUP */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isLight ? 'bg-sky-50/70 border-sky-200 text-sky-900' : 'bg-sky-950/40 border-sky-800/60 text-sky-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-400" />
              <h4 className="text-xs font-black">
                Seguro Antirrobo & Respaldo Cloud: 30 Días de Prueba Incluidos
              </h4>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Si tu teléfono se daña, se moja o te lo roban, <strong className="text-white">no pierdes tu dinero ni tus cuentas por cobrar</strong>. Te compras otro equipo, descargas el APK y recuperas todo en 3 segundos. Puedes mantenerlo activo después de tu mes gratis por solo <strong className="text-sky-400">$5 USD/mes</strong>.
            </p>
          </div>

          {/* BOTÓN PRINCIPAL DE WHATSAPP */}
          <div>
            <a
              href={generateWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl font-black text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 flex items-center justify-center gap-2.5 shadow-lg active:scale-98 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Reportar Pago por WhatsApp ({paymentOption === 'cash' ? '$15 USD' : '$15 de Inicial'})</span>
            </a>
            <p className="text-center text-[10px] text-slate-400 mt-2">
              Te responderemos al instante con tu Clave de Activación oficial.
            </p>
          </div>

          {/* FORMULARIO: INTRODUCIR CLAVE DE ACTIVACIÓN RECIBIDA */}
          <form onSubmit={handleActivateWithKey} className="pt-3 border-t border-slate-800 space-y-2.5">
            <label className="text-xs font-bold text-slate-300 block">
              ¿Ya recibiste tu Clave de Activación? Pégala aquí:
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Pega tu clave (Ej: KLIK-XXXX-XXXX-XXXX)"
                value={licenseKeyInput}
                onChange={e => setLicenseKeyInput(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-xl border text-xs font-mono font-bold outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-emerald-400 focus:border-emerald-500'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl active:scale-95 transition-all shadow-sm"
              >
                Activar
              </button>
            </div>

            {activationError && (
              <p className="text-[11px] text-rose-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{activationError}</span>
              </p>
            )}

            {activationSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>¡Licencia activada con éxito! Tu terminal está 100% autorizada y operativa.</span>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
