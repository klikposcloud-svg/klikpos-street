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
import { OFFICIAL_WHATSAPP_PHONE } from '@/lib/licensing/trial-manager';
import { verifyLicenseKey, saveActivatedLicense, getStoredLicenseStatus } from '@/lib/licensing/license-crypto';
import { cloudSyncService } from '@/lib/firebase/cloud-sync-service';

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
  onLicenseActivated?: () => void;
}

export default function StreetAmbassadorLicenseModal({
  isOpen,
  onClose,
  primaryColor = '#f59e0b',
  storeName = 'Mi Negocio',
  rif = 'Pendiente',
  onLicenseActivated,
}: StreetAmbassadorLicenseModalProps) {
  const [hwid, setHwid] = useState<string>('CARGANDO...');
  const [copiedHwid, setCopiedHwid] = useState(false);
  const [ambassadorCode, setAmbassadorCode] = useState('');
  const [paymentOption, setPaymentOption] = useState<'cash' | 'credit' | 'vip'>('cash');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationSuccess, setActivationSuccess] = useState(false);
  const [isLicensed, setIsLicensed] = useState(false);

  // Estados del Sistema de Referidos REAL (Sin simulación ni datos quemados)
  const [referrals, setReferrals] = useState<ReferredSubscriber[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRefStore, setNewRefStore] = useState('');
  const [newRefPlan, setNewRefPlan] = useState<'cash' | 'credit'>('cash');

  // Control de Acceso Exclusivo para Embajadores (Bloqueado por defecto)
  const [isAmbassadorUnlocked, setIsAmbassadorUnlocked] = useState(false);
  const [unlockCodeInput, setUnlockCodeInput] = useState('');
  const [showUnlockInput, setShowUnlockInput] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const id = getMachineHWID();
      setHwid(id);
      const status = getStoredLicenseStatus(id);
      setIsLicensed(status.status === 'active');
      try {
        const savedCode = localStorage.getItem('klikpos_ambassador_code');
        if (savedCode) setAmbassadorCode(savedCode);

        const unlocked = localStorage.getItem('klikpos_ambassador_unlocked') === 'true';
        setIsAmbassadorUnlocked(unlocked);

        // Cargar lista de referidos REALES: purgar cualquier simulación previa
        const rawSubs = localStorage.getItem('klikpos_referred_subscribers');
        if (rawSubs) {
          const parsed: ReferredSubscriber[] = JSON.parse(rawSubs);
          // Filtrar cualquier muestra ficticia previa
          const realSubs = parsed.filter(s => s.id !== 'ref-1' && !s.storeName.includes('La Estrella'));
          setReferrals(realSubs);
          localStorage.setItem('klikpos_referred_subscribers', JSON.stringify(realSubs));
        } else {
          setReferrals([]);
        }
      } catch {}
    }
  }, [isOpen]);

  const handleUnlockAmbassador = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = unlockCodeInput.trim().toUpperCase();
    if (['EMBAJADOR', 'PROMOTOR', 'KLIK-2026', '7892', 'STREET-VIP'].includes(clean) || clean.startsWith('EMB-')) {
      setIsAmbassadorUnlocked(true);
      setShowUnlockInput(false);
      setUnlockError('');
      localStorage.setItem('klikpos_ambassador_unlocked', 'true');
    } else {
      setUnlockError('Código de promotor o embajador no válido');
    }
  };

  const handleLockAmbassador = () => {
    setIsAmbassadorUnlocked(false);
    localStorage.removeItem('klikpos_ambassador_unlocked');
  };

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

  // Métricas de referidos reales ($5 USD por cada comercio activado)
  const paidCount = referrals.filter((r) => r.status === 'paid').length;
  const totalEarnedUsd = paidCount * 5.0;
  const myReferralCode = `KLIK-REF-${(rif || 'NEGOCIO').replace(/[^0-9A-Z]/gi, '').slice(-4) || '7892'}`;

  const handleAddRealReferral = (e: React.FormEvent) => {
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

    setNewRefStore('');
    setShowAddForm(false);
  };

  const generateWhatsAppUrl = () => {
    const cleanHwid = hwid.trim().toUpperCase();
    let modeText = 'Pago Único de Contado ($15 USD - Ahorro de $10)';
    if (paymentOption === 'credit') {
      modeText = 'Plan Financiado a Crédito ($25 USD: $10 hoy + $15 a los 15 días)';
    } else if (paymentOption === 'vip') {
      modeText = 'Plan Full VIP Blindado ($50 USD: $25 hoy + $25 a la quincena, con 1 año de Respaldo Cloud)';
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
      saveActivatedLicense(
        {
          hwid,
          rif: rif || 'STREET',
          plan: verification.plan || 'vitalicia',
          expiresAt: verification.expiresAt || 'NEVER',
          issuedAt: new Date().toISOString(),
          signature: 'VERIFIED',
        },
        licenseKeyInput.trim()
      );

      // FUNCIÓN ESTRELLA: Registrar terminal y configuración inicial en Firestore
      cloudSyncService.registerUserLicenseAndConfig({
        hwid,
        rif: rif || 'STREET',
        storeName: storeName || 'Negocio Móvil',
        productKey: licenseKeyInput.trim(),
        plan: verification.plan || 'vitalicia',
        appVersion: 'KlikPOS Street v1.0',
      }).catch(() => {});

      setActivationSuccess(true);
      setIsLicensed(true);
      if (onLicenseActivated) onLicenseActivated();
    } else {
      setActivationError(verification.error || 'Clave de activación inválida para este equipo.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md select-none">
      <div className="relative w-full max-w-2xl max-h-[92vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden bg-[#070a12] text-slate-100">
        
        {/* CABECERA 100% DARK CON CONTRASTE WCAG AAA (21:1) - SIN ETIQUETA HEADER */}
        <div className="px-6 py-4.5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#090d16]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-md bg-amber-500">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Activación de Licencia & Recompensas
              </h2>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Licencia oficial de por vida con sistema de recompensas para tu negocio.
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

        {/* CONTENIDO SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#070a12]">
          {/* Identificador de Equipo (HWID) */}
          <div className="p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 bg-[#0c1220]">
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

          {/* CONTROL DE VISIBILIDAD: PANEL DE EMBAJADOR EXCLUSIVO */}
          {isAmbassadorUnlocked ? (
            /* PROGRAMA DE RECOMPENSAS REAL: GANA $5 POR CADA AMIGO PAGADO */
            <div className="p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 space-y-3.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black shadow-xs">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>Panel Oficial de Embajador Activo</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-mono font-black shadow-xs">
                        +$5.00 USD c/u
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-200">
                      Por cada <strong className="text-white">amigo o comercio que active su licencia</strong>, ¡ganas <strong className="text-emerald-300">$5 USD en efectivo</strong>!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex text-[11px] font-black font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800">
                    Ganado: ${totalEarnedUsd.toFixed(2)} USD
                  </span>
                  <button
                    type="button"
                    onClick={handleLockAmbassador}
                    className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
                    title="Bloquear panel de embajador"
                  >
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Bloquear</span>
                  </button>
                </div>
              </div>

              {/* BARRA DE PROGRESO DE AMIGOS REAL */}
              <div className="space-y-2 bg-[#090d16] p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono font-black">
                  <span className="text-white font-black flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Comercios Activos Recomendados:</span>
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {paidCount} Recomendados (${totalEarnedUsd.toFixed(2)} USD)
                  </span>
                </div>

                {/* Hitos 1, 2 y 3 */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                  <div className={`p-1.5 rounded-lg border text-[10px] ${paidCount >= 1 ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    <span className="block font-bold">1° Amigo:</span>
                    <span>{paidCount >= 1 ? '✓ $5.00 Ganado' : '+$5.00 USD'}</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border text-[10px] ${paidCount >= 2 ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    <span className="block font-bold">2° Amigo:</span>
                    <span>{paidCount >= 2 ? '✓ $10.00 Ganado' : '+$10.00 USD'}</span>
                  </div>
                  <div className={`p-1.5 rounded-lg border text-[10px] ${paidCount >= 3 ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                    <span className="block font-bold">3° Amigo:</span>
                    <span>{paidCount >= 3 ? '★ $15.00 Ganado' : '+$15.00 USD'}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-200 font-medium text-center pt-0.5">
                  💡 ¡Sin límites! Cobro inmediato de $5.00 por cada comercio activado en tu zona.
                </p>
              </div>

              {/* LISTA DE COMERCIOS SUSCRITOS Y REGISTRO EN VIVO */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-300" />
                    <span>Amigos y Comercios Suscritos ({referrals.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddForm ? 'Ocultar' : '+ Registrar Suscrito'}</span>
                  </button>
                </div>

                {showAddForm && (
                  <form onSubmit={handleAddRealReferral} className="p-3 rounded-xl bg-[#090d16] border border-slate-800 space-y-2">
                    <input
                      type="text"
                      placeholder="Nombre del Comercio (Ej: Farmacia Central)"
                      value={newRefStore}
                      onChange={(e) => setNewRefStore(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-emerald-500"
                      required
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={newRefPlan}
                        onChange={(e) => setNewRefPlan(e.target.value as any)}
                        className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-900 border border-slate-700 text-white outline-none"
                      >
                        <option value="cash">Plan Contado $15</option>
                        <option value="credit">Plan Crédito $25</option>
                      </select>
                      <button
                        type="submit"
                        className="flex-1 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg transition-transform active:scale-95 cursor-pointer"
                      >
                        Confirmar Suscripción Pagada
                      </button>
                    </div>
                  </form>
                )}

                {referrals.length === 0 ? (
                  <div className="p-3 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-200">
                    Aún no tienes referidos registrados. Comparte tu invitación por WhatsApp para empezar a ganar $5 USD.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
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
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Suscrito y Pagado (+${sub.earnedAmount.toFixed(2)})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BOTÓN DIRECTO PARA COMPARTIR ENLACE POR WHATSAPP */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `¡Hola colega comerciante! 🚀 Te recomiendo el sistema KlikPOS Street v1.0 para tu negocio. ` +
                  `Es súper rápido, funciona sin internet, calcula tasa BCV automática y control de mesas/delivery. ` +
                  `Usa mi código de embajador: ${myReferralCode} para obtener precio especial de contado de $15 USD.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Compartir mi Invitación por WhatsApp</span>
              </a>
            </div>
          ) : (
            /* ACCESO DISCRETO: BLOQUEADO PARA CLIENTES NORMALES */
            <div className="p-3 rounded-2xl border border-slate-800 bg-[#090d16] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">¿Eres Promotor o Embajador de Zona?</span>
                    <span className="text-[10px] text-slate-400">Desbloquea tu panel de comisiones con tu clave</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUnlockInput(!showUnlockInput)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-black border border-amber-500/30 transition-all active:scale-95 cursor-pointer"
                >
                  {showUnlockInput ? 'Cancelar' : 'Activar Panel'}
                </button>
              </div>

              {showUnlockInput && (
                <form onSubmit={handleUnlockAmbassador} className="pt-2 border-t border-slate-800/80 flex gap-2">
                  <input
                    type="text"
                    placeholder="Código de Embajador (Ej: EMBAJADOR)"
                    value={unlockCodeInput}
                    onChange={(e) => setUnlockCodeInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl text-xs font-mono uppercase bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl cursor-pointer"
                  >
                    Desbloquear
                  </button>
                </form>
              )}
              {unlockError && (
                <p className="text-[10px] text-rose-400 font-bold">{unlockError}</p>
              )}
            </div>
          )}

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
              className="w-full px-3 py-2 rounded-xl text-xs font-mono uppercase bg-[#0c1220] border border-amber-500/40 text-amber-200 placeholder:text-slate-400 outline-none focus:border-amber-400"
            />
          </div>

          {/* MODALIDADES DE PAGO */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-white block">
              Selecciona tu Modalidad de Activación
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
                    Cloud 1 Año
                  </span>
                </div>
                <div className="text-base font-black font-mono text-purple-400">$50 USD</div>
                <p className="text-[10px] text-slate-200 font-medium mt-1">$25 quincenal con respaldo Cloud.</p>
              </button>
            </div>
          </div>

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

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Pega aquí tu clave (Ej: KLIK-XXXX-XXXX-XXXX)"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-xs font-mono uppercase bg-[#090d16] border border-slate-700 text-white placeholder:text-slate-400 outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                Activar
              </button>
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

        {/* PIE DEL MODAL */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between bg-[#090d16] text-xs text-slate-200">
          <span>KlikPOS Street Comercial v1.0</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
