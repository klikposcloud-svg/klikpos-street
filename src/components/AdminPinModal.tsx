'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, KeyRound, Check, X } from 'lucide-react';

export default function AdminPinModal() {
  const { showAdminAuthModal, setShowAdminAuthModal, handleAdminAuthConfirm } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!showAdminAuthModal) return null;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = handleAdminAuthConfirm(pin);
    if (!ok) {
      setError(true);
      setPin('');
    } else {
      setError(false);
      setPin('');
    }
  };

  const handleClose = () => {
    setShowAdminAuthModal(false);
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm tracking-tight text-white !text-white" style={{ color: '#ffffff' }}>
              Autorización de Administrador
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Esta acción está restringida. Ingrese la contraseña o PIN de administrador para continuar:
          </p>

          <div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                autoFocus
                placeholder="PIN o Clave de Administrador"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError(false);
                }}
                className={`w-full pl-9 pr-3 py-2.5 bg-slate-50 border rounded-xl font-mono text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 ${
                  error ? 'border-rose-500 bg-rose-50' : 'border-slate-300'
                }`}
              />
            </div>
            {error && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1">
                Clave incorrecta. Solo el administrador puede realizar esta acción.
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!pin}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Autorizar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
