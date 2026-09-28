'use client';

import React, { useState, useEffect } from 'react';
import { FeatureFlag, isFeatureEnabled, getActiveLicensePayload, PLAN_DEFINITIONS } from '@/lib/licensing/feature-flags';
import { Sparkles, Lock, ShieldCheck, ArrowRight, PhoneCall } from 'lucide-react';
import LicenseActivationModal from './LicenseActivationModal';

export interface FeatureGateProps {
  flag: FeatureFlag;
  title?: string;
  featureName?: string;
  description?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({
  flag,
  title,
  featureName,
  description,
  children,
  fallback,
}: FeatureGateProps) {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const check = () => setEnabled(isFeatureEnabled(flag));
    check();

    const handleUpdate = () => check();
    window.addEventListener('klikpos_license_updated', handleUpdate);
    return () => window.removeEventListener('klikpos_license_updated', handleUpdate);
  }, [flag]);

  if (!isMounted) return null;

  if (enabled) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const payload = getActiveLicensePayload();
  const currentPlan = PLAN_DEFINITIONS[payload.tier] || PLAN_DEFINITIONS.FREE_STARTER;

  return (
    <div className="w-full p-6 sm:p-10 flex flex-col items-center justify-center text-center bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-amber-500/20 rounded-3xl shadow-2xl relative overflow-hidden my-4 text-white">
      {/* Halo de Luz y Decoración */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Ícono Insignia */}
      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 mb-4 animate-bounce">
        <Lock className="w-8 h-8 stroke-[2.5]" />
      </div>

      <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-amber-400/10 text-amber-300 border border-amber-400/30 mb-2">
        Módulo Exclusivo KlikPOS Pro
      </span>

      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight max-w-lg">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-2 leading-relaxed">
        {description}
      </p>

      {/* Estado del Plan Actual */}
      <div className="mt-4 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-2 text-xs">
        <span className="text-slate-400">Plan Actual:</span>
        <span className="font-extrabold text-amber-400 uppercase">{currentPlan.name}</span>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mt-6 w-full max-w-sm">
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Activar Plan Pro en 1 Clic</span>
        </button>

        <a
          href="https://wa.me/584248298026?text=Hola,%20deseo%20activar%20el%20Plan%20Pro%20de%20KlikPOS%20en%20mi%20negocio."
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
        >
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span>Consultar Precios</span>
        </a>
      </div>

      {showModal && (
        <LicenseActivationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

export default FeatureGate;
