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
  Users,
  Plus,
  TrendingUp,
  DollarSign,
  Clock,
} from 'lucide-react';
import { getMachineHWID } from '@/lib/licensing/hwid';
import { OFFICIAL_WHATSAPP_PHONE, reactivateTrialFor3Hours } from '@/lib/licensing/trial-manager';
import { verifyLicenseKey, saveActivatedLicense, getStoredLicenseStatus } from '@/lib/licensing/license-crypto';
import { cloudSyncService } from '@/lib/firebase/cloud-sync-service';
import { referralService } from '@/lib/firebase/referral-service';

export interface ReferredSubscriber {
  id: string;
  storeName: string;
  date: string;
  status: 'paid' | 'trial';
  planPaid?: string;
  earnedAmount: number;
}

interface StreetAmbassadorLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
  primaryColor?: string;
  storeName?: string;
  rif?: string;
  initialTab?: 'plans' | 'ambassador';
  onLicenseActivated?: () => void;
}

export default function StreetAmbassadorLicenseModal({
  isOpen,
  onClose,
  primaryColor = '#f59e0b',
  storeName = 'Mi Negocio',
  rif = 'Pendiente',
  initialTab = 'plans',
  onLicenseActivated,
}: StreetAmbassadorLicenseModalProps) {
  const [activeTab, setActiveTab] = useState<'plans' | 'ambassador'>('plans');
  const [hwid, setHwid] = useState<string>('CARGANDO...');
  const [copiedHwid, setCopiedHwid] = useState(false);
  const [ambassadorCode, setAmbassadorCode] = useState('');
  const [paymentOption, setPaymentOption] = useState<'cash' | 'credit' | 'vip'>('cash');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [rifInput, setRifInput] = useState(rif !== 'Pendiente' ? rif : 'STREET');
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [isLicensed, setIsLicensed] = useState(false);

  // Estados del Sistema de Referidos REAL (Conectado a Firestore + LocalStorage)
  const [referrals, setReferrals] = useState<ReferredSubscriber[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRefStore, setNewRefStore] = useState('');
  const [newRefPlan, setNewRefPlan] = useState<'cash' | 'credit'>('cash');
  const [copiedReferralCode, setCopiedReferralCode] = useState(false);

  const myReferralCode = `KLIK-REF-${(rif || 'NEGOCIO').replace(/[^0-9A-Z]/gi, '').slice(-4) || '7892'}`;

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      const id = getMachineHWID();
      setHwid(id);
      const status = getStoredLicenseStatus(id);
      setIsLicensed(status.status === 'active');

      try {
        const compRaw = localStorage.getItem('klikpos_company_info');
        if (compRaw) {
          const comp = JSON.parse(compRaw);
          if (comp.rif) setRifInput(comp.rif);
        } else if (rif && rif !== 'Pendiente') {
          setRifInput(rif);
        }
      } catch {}

      try {
        const savedCode = localStorage.getItem('klikpos_ambassador_code');
        if (savedCode) setAmbassadorCode(savedCode);

        // 1. Cargar referidos desde localStorage primero para velocidad inmediata
        const rawSubs = localStorage.getItem('klikpos_referred_subscribers');
        if (rawSubs) {
          const parsed: ReferredSubscriber[] = JSON.parse(rawSubs);
          const realSubs = parsed.filter(s => s.id !== 'ref-1' && !s.storeName.includes('La Estrella'));
          setReferrals(realSubs);
        } else {
          setReferrals([]);
        }

        // 2. Cargar en vivo desde Firestore (sincronización multi-dispositivo en la nube)
        referralService.getReferrals(myReferralCode, id).then(cloudRefs => {
          if (cloudRefs && cloudRefs.length > 0) {
            const formatted: ReferredSubscriber[] = cloudRefs.map(c => ({
              id: c.id,
              storeName: c.storeName,
              date: c.date,
              status: c.status,
              planPaid: c.planPaid,
              earnedAmount: c.earnedAmount || 5.0,
            }));
            setReferrals(formatted);
            try {
              localStorage.setItem('klikpos_referred_subscribers', JSON.stringify(formatted));
            } catch {}
          }
        }).catch(() => {});
      } catch {}
    }
  }, [isOpen, initialTab, myReferralCode, rif]);

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

  // Reglas de Negocio de Retiros de Referidos:
  // 1. Mínimo de retiro: $15 USD (equivalente a 3 comercios registrados)
  // 2. Tiempo de liquidación: 48 horas hábiles tras verificación bancaria
  const MIN_PAYOUT_USD = 15.0;
  const paidCount = referrals.filter((r) => r.status === 'paid').length;
  const totalEarnedUsd = paidCount * 5.0;
  const canWithdraw = totalEarnedUsd >= MIN_PAYOUT_USD;
  const missingForPayout = Math.max(0, MIN_PAYOUT_USD - totalEarnedUsd);
  const missingReferrals = Math.max(0, Math.ceil(missingForPayout / 5.0));
  const progressPercent = Math.min(100, Math.round((totalEarnedUsd / MIN_PAYOUT_USD) * 100));

  const generateWithdrawalWhatsAppUrl = () => {
    const text =
      `¡Hola KlikPOS! 💸 Deseo solicitar el retiro de mis comisiones por referidos:\n\n` +
      `🏪 *Comercio / Promotor:* ${storeName || 'Mi Negocio'}\n` +
      `📋 *Código de Referido:* \`${myReferralCode}\`\n` +
      `💰 *Monto Acumulado a Retirar:* $${totalEarnedUsd.toFixed(2)} USD (${paidCount} comercios activos)\n` +
      `⏱️ *Condición de Liquidación:* 48 horas tras verificación bancaria\n\n` +
      `Adjunto mis datos de Pago Móvil para procesar la transferencia. ¡Muchas gracias!`;

    return `https://wa.me/${OFFICIAL_WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
  };

  const handleAddRealReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefStore.trim()) return;

    const newSub: ReferredSubscriber = {
      id: `ref-${Date.now()}`,
      storeName: newRefStore.trim(),
      date: 'Hoy (Registrado)',
      status: 'paid',
      planPaid: newRefPlan === 'cash' ? 'Contado $15' : 'Financiado $25',
      earnedAmount: 5.00,
    };

    const updated = [newSub, ...referrals];
    setReferrals(updated);
    try {
      localStorage.setItem('klikpos_referred_subscribers', JSON.stringify(updated));
    } catch {}

    // Respaldo en la nube Firestore
    referralService.saveReferral({
      id: newSub.id,
      referrerCode: myReferralCode,
      referrerHwid: hwid,
      referrerStore: storeName || 'Negocio Móvil',
      storeName: newSub.storeName,
      date: new Date().toLocaleDateString('es-VE'),
      status: 'paid',
      planPaid: newSub.planPaid || 'Contado $15',
      earnedAmount: 5.00,
      settlementHours: 48,
      createdAt: new Date().toISOString(),
    }).catch(() => {});

    setNewRefStore('');
    setShowAddForm(false);
  };

  const generateWhatsAppUrl = () => {
    const cleanHwid = hwid.trim().toUpperCase();
    let modeText = 'Pago Único de Contado ($15 USD - Ahorro de $10)';
    if (paymentOption === 'credit') {
      modeText = 'Plan Financiado a Crédito ($25 USD: $10 hoy + $15 a los 15 días)';
    } else if (paymentOption === 'vip') {
      modeText = 'Plan Full VIP Blindado ($50 USD: $25 hoy + $25 a la quincena, con 24 meses de Respaldo Cloud)';
    }
    const promoText = ambassadorCode
      ? `🎁 *Código de Promotor que me refirió:* \`${ambassadorCode}\`\n`
      : '';

    const text =
      `¡Hola KlikPOS! 🚀 Quiero activar la licencia oficial para mi negocio:\n\n` +
      `🏪 *Comercio / Negocio:* ${storeName || 'Mi Negocio'}\n` +
      `📋 *RIF o Cédula:* ${rif || 'Sin RIF'}\n` +
      `💻 *ID del Equipo (HWID):* \`${cleanHwid}\`\n` +
      `${promoText}` +
      `💳 *Modalidad de Pago:* ${modeText}\n` +
      `☁️ *Seguro Cloud & Respaldo:* Activación Inmediata\n\n` +
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

    const targetRif = (rifInput || rif || 'STREET').trim().toUpperCase();
    const verification = verifyLicenseKey(licenseKeyInput.trim(), hwid, targetRif);
    if (verification.valid) {
      const finalRif = verification.matchedRif || targetRif;
      saveActivatedLicense(
        {
          hwid,
          rif: finalRif,
          plan: verification.plan || 'vitalicia',
          expiresAt: verification.expiresAt || 'NEVER',
          issuedAt: new Date().toISOString(),
          signature: licenseKeyInput.trim().split('-').slice(3).join('-') || 'VERIFIED',
        },
        licenseKeyInput.trim()
      );

      // Registrar terminal y configuración inicial en Firestore
      cloudSyncService.registerUserLicenseAndConfig({
        hwid,
        rif: finalRif,
        storeName: storeName || 'Negocio Móvil',
        productKey: licenseKeyInput.trim(),
        plan: verification.plan || 'vitalicia',
        appVersion: 'KlikPOS Street v1.0',
      }).catch(() => {});

      setActivationSuccess(true);
      setIsLicensed(true);
      window.dispatchEvent(new CustomEvent('klikpos:license-activated'));
      window.dispatchEvent(new CustomEvent('venematic:license-activated'));
      if (onLicenseActivated) onLicenseActivated();
    } else {
      setActivationError(verification.error || 'Clave de activación inválida para este equipo.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md select-none">
      <div className="relative w-full max-w-2xl max-h-[92vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden bg-[#070a12] text-slate-100">
        
        {/* CABECERA CON SELECTOR DE PESTAÑAS (PLANES vs EMBAJADORES) */}
        <div className="px-5 py-4 border-b border-slate-800 shrink-0 bg-[#090d16] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-md bg-amber-500">
                <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Planes Comerciales & Embajadores
                </h2>
                <p className="text-xs text-slate-300 font-medium">
                  {activeTab === 'plans' ? 'Licencia oficial y respaldo en la nube' : 'Gana $5 USD por cada comercio referido sin límites'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-90 cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* SELECTOR DE PESTAÑAS ELEGANTES */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('plans')}
              className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                activeTab === 'plans'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>💎 Planes Comerciales & Licencia</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ambassador')}
              className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer ${
                activeTab === 'ambassador'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>🎁 Embajador & Referidos</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-400/30">
                Ilimitado
              </span>
            </button>
          </div>
        </div>

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#070a12]">
          
          {/* Identificador de Equipo (HWID) */}
          <div className="p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 bg-[#0c1220]">
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 block">
                ID Único de tu Terminal (HWID)
              </span>
              <span className="text-xs sm:text-sm font-mono font-black text-sky-400 truncate block mt-0.5">
                {hwid}
              </span>
            </div>

            <button
              onClick={handleCopyHwid}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              {copiedHwid ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedHwid ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* PESTAÑA 1: PLANES COMERCIALES & ACTIVACIÓN DE LICENCIA                    */}
          {/* ========================================================================= */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              {/* NOTA RECORDATORIA POR LANZAMIENTO (KLIKPOS CLOUD) */}
              <div className="p-3.5 rounded-2xl border border-sky-500/40 bg-sky-950/40 space-y-2 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black shrink-0">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-sky-300 uppercase tracking-wide block">
                      🚀 Promoción Especial por Lanzamiento
                    </span>
                    <span className="text-[11px] text-sky-200 font-bold block">
                      ¡Tu licencia incluye 3 Meses de Respaldo en la Nube (KlikPOS Cloud) GRATIS!
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pl-10">
                  Posteriormente, si deseas mantener el respaldo cloud automático, el costo del servicio es de tan solo <strong className="text-white">$5 USD mensuales</strong>. Y si adquieres el <strong className="text-purple-300">Plan VIP de $50 USD</strong>, ¡recibes <strong>24 meses (2 años completos)</strong> de KlikPOS Cloud incluidos sin mensualidades!
                </p>
              </div>

              {/* MODALIDADES DE PAGO */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-white block">
                  Selecciona tu Modalidad de Activación:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentOption('cash')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentOption === 'cash'
                        ? 'border-emerald-500 bg-emerald-950/30 ring-2 ring-emerald-500/30 shadow-md'
                        : 'border-slate-800 bg-[#0c1220] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-white">Contado</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        -40% OFF
                      </span>
                    </div>
                    <div className="text-base font-black font-mono text-emerald-400">$15 USD</div>
                    <p className="text-[10px] text-slate-200 font-medium mt-1">Pago único de por vida. Sin mensualidades.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption('credit')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentOption === 'credit'
                        ? 'border-sky-500 bg-sky-950/30 ring-2 ring-sky-500/30 shadow-md'
                        : 'border-slate-800 bg-[#0c1220] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-white">Financiado</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-500/20 text-sky-400 border border-sky-500/30">
                        A Crédito
                      </span>
                    </div>
                    <div className="text-base font-black font-mono text-sky-400">$25 USD</div>
                    <p className="text-[10px] text-slate-200 font-medium mt-1">$10 hoy + $15 en 15 días.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentOption('vip')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentOption === 'vip'
                        ? 'border-purple-500 bg-purple-950/30 ring-2 ring-purple-500/30 shadow-md'
                        : 'border-slate-800 bg-[#0c1220] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-white">VIP Blindado</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        Vitalicio Pro
                      </span>
                    </div>
                    <div className="text-base font-black font-mono text-purple-400">$50 USD</div>
                    <p className="text-[10px] text-slate-200 font-medium mt-1">En 2 cuotas de $25 (quincenal).</p>
                    <div className="mt-1.5 px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-400/30 text-[9px] text-purple-200 font-bold">
                      ⭐ 24 Meses (2 Años) Cloud Incluido
                    </div>
                  </button>
                </div>
              </div>

              {/* CÓDIGO DE EMBAJADOR / REFERIDO */}
              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>¿Vienes referido por otro comerciante?</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                    Comisión Asignada
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Ingresa el código de embajador (Ej: KLIK-REF-4581)"
                  value={ambassadorCode}
                  onChange={(e) => handleSaveAmbassadorCode(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-black uppercase bg-white border-2 border-amber-400 text-slate-950 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 shadow-inner"
                />
              </div>

              {/* BOTÓN DE REACTIVAR 3 HORAS DE PRUEBA */}
              <button
                type="button"
                onClick={() => {
                  reactivateTrialFor3Hours();
                  if (onLicenseActivated) onLicenseActivated();
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-2xl border border-sky-500/40 bg-sky-950/40 hover:bg-sky-900/60 text-sky-200 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-sky-400 animate-pulse" />
                <span>⏱️ Continuar con Evaluación (Reactivar 3 Horas Libres)</span>
              </button>

              {/* BOTÓN PRINCIPAL DE SOLICITAR ACTIVACIÓN POR WHATSAPP */}
              <a
                href={generateWhatsAppUrl()}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-2xl font-black text-xs text-slate-950 flex items-center justify-center gap-2 transition-all shadow-xl active:scale-98 bg-amber-500 hover:bg-amber-400 cursor-pointer"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>Solicitar Activación Oficial vía WhatsApp</span>
              </a>

              {/* INGRESO DE CLAVE DE ACTIVACIÓN */}
              <form onSubmit={handleActivateWithKey} className="p-4 rounded-2xl border border-slate-800 bg-[#0c1220] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>¿Ya recibiste tu clave de activación?</span>
                  </span>
                  {isLicensed && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Activado ✓
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      RIF del Negocio:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: J-50123456-7"
                      value={rifInput}
                      onChange={(e) => setRifInput(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-black uppercase bg-white border-2 border-slate-300 text-slate-950 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 shadow-inner"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">
                      Clave de Activación:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej: VNK-PRO-PERP-XXXX..."
                        value={licenseKeyInput}
                        onChange={(e) => setLicenseKeyInput(e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-black uppercase bg-white border-2 border-slate-300 text-slate-950 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 shadow-inner"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 shrink-0 cursor-pointer"
                      >
                        Activar
                      </button>
                    </div>
                  </div>
                </div>

                {activationError && (
                  <p className="text-xs text-rose-400 font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{activationError}</span>
                  </p>
                )}

                {activationSuccess && (
                  <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>¡Licencia activada con éxito de por vida para esta terminal!</span>
                  </p>
                )}
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 2: PROGRAMA DE EMBAJADORES & REFERIDOS 100% ILIMITADO             */}
          {/* ========================================================================= */}
          {activeTab === 'ambassador' && (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-[#070a12] space-y-4 shadow-xl">
                
                {/* CABECERA DEL PROGRAMA */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shadow-md border border-emerald-500/30 shrink-0">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-white tracking-tight">
                          Programa de Embajadores KlikPOS
                        </h3>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono font-black shadow-xs">
                          ¡100% ILIMITADO!
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-200 mt-0.5">
                        Gana <strong className="text-emerald-300 font-bold">$5.00 USD en efectivo</strong> por cada comercio registrado. ¡Sin tope de ganancias!
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-700/60 shadow-inner">
                      Total Acumulado: ${totalEarnedUsd.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* MÓDULO DE RETIROS: MÍNIMO $15 USD (3 COMERCIOS) + LIQUIDACIÓN 48H */}
                <div className="p-3.5 rounded-2xl bg-[#090d16] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Monto para Retiro:</span>
                    </div>
                    <div className="font-mono text-xs font-black flex items-center gap-1.5">
                      <span className={canWithdraw ? 'text-emerald-400' : 'text-amber-400'}>
                        ${totalEarnedUsd.toFixed(2)} USD
                      </span>
                      <span className="text-slate-500">/ Mín. $15.00 USD (3 Registros)</span>
                    </div>
                  </div>

                  {/* Barra de Progreso hacia los $15 USD */}
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 rounded-full"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Progreso: {progressPercent}%</span>
                      <span>
                        {canWithdraw
                          ? '✅ Mínimo alcanzado para solicitar retiro'
                          : `Faltan ${missingReferrals} comercios ($${missingForPayout.toFixed(2)} USD)`}
                      </span>
                    </div>
                  </div>

                  {/* Liquidación 48 Horas */}
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Tiempo de Liquidación: <b>48 horas hábiles</b> tras validación bancaria.</span>
                    </div>
                  </div>

                  {/* BOTÓN DE SOLICITAR RETIRO POR WHATSAPP */}
                  {canWithdraw ? (
                    <a
                      href={generateWithdrawalWhatsAppUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl font-black text-xs text-slate-950 flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 bg-emerald-500 hover:bg-emerald-400 cursor-pointer"
                    >
                      <DollarSign className="w-4 h-4 stroke-[2.5]" />
                      <span>Cobrar Comisiones Acumuladas (${totalEarnedUsd.toFixed(2)} USD)</span>
                    </a>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-dashed border-slate-700 text-center text-xs text-slate-400">
                      🔒 Retiro habilitado a partir de 3 comercios registrados ($15.00 USD).
                    </div>
                  )}
                </div>

                {/* TU CÓDIGO DE REFERIDO */}
                <div className="flex items-center justify-between gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tu Código de Promotor:</span>
                    <span className="text-xs sm:text-sm font-mono font-black text-amber-300">{myReferralCode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(myReferralCode);
                      setCopiedReferralCode(true);
                      setTimeout(() => setCopiedReferralCode(false), 2000);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer shrink-0"
                  >
                    {copiedReferralCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedReferralCode ? 'Copiado' : 'Copiar Código'}</span>
                  </button>
                </div>

                {/* LISTA DE COMERCIOS REGISTRADOS EN FIRESTORE / LOCAL */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-300" />
                      <span>Comercios en tu Red ({referrals.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{showAddForm ? 'Ocultar' : '+ Registrar Referido'}</span>
                    </button>
                  </div>

                  {showAddForm && (
                    <form onSubmit={handleAddRealReferral} className="p-3 rounded-2xl bg-[#090d16] border border-slate-800 space-y-2">
                      <input
                        type="text"
                        placeholder="Nombre del Comercio (Ej: Panadería La Central)"
                        value={newRefStore}
                        onChange={(e) => setNewRefStore(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-slate-700 text-slate-950 placeholder:text-slate-500 font-bold outline-none focus:border-emerald-500"
                        required
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={newRefPlan}
                          onChange={(e) => setNewRefPlan(e.target.value as any)}
                          className="px-3 py-2 rounded-xl text-xs bg-slate-900 border border-slate-700 text-white outline-none"
                        >
                          <option value="cash">Plan Contado $15</option>
                          <option value="credit">Plan Crédito $25</option>
                        </select>
                        <button
                          type="submit"
                          className="flex-1 py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-transform active:scale-95 cursor-pointer shadow-md"
                        >
                          Guardar en Red Nube
                        </button>
                      </div>
                    </form>
                  )}

                  {referrals.length === 0 ? (
                    <div className="p-3.5 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-300 bg-slate-950/40">
                      Aún no tienes referidos registrados. Comparte tu código o invitación por WhatsApp para empezar a acumular $5 USD por comercio.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {referrals.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-2.5 rounded-xl border border-slate-800 bg-[#090d16] flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-white block truncate">{sub.storeName}</span>
                            <span className="text-[10px] text-slate-300 font-mono">
                              {sub.date} • {sub.planPaid || 'Plan Activo'}
                            </span>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Comisión Pagada (+${sub.earnedAmount.toFixed(2)})</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BOTÓN DIRECTO PARA COMPARTIR INVITACIÓN POR WHATSAPP */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `¡Hola estimado colega! 🚀 Te recomiendo el sistema KlikPOS para tu negocio. ` +
                    `Es súper rápido, funciona sin internet, calcula tasa BCV automática y emite tickets térmicos. ` +
                    `Usa mi código de referido: ${myReferralCode} para obtener precio especial de contado de $15 USD.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Compartir mi Invitación por WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* PIE DEL MODAL */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-[#090d16] text-xs text-slate-200">
          <span>KlikPOS Street Comercial v1.0</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
