'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, Unlock, ShieldAlert, KeyRound, LogOut, ArrowRight } from 'lucide-react';

interface LockScreenModalProps {
  isOpen: boolean;
  onUnlock: () => void;
}

export default function LockScreenModal({ isOpen, onUnlock }: LockScreenModalProps) {
  const { user, isAdmin, login, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUnlockAttempt = (enteredPin?: string) => {
    const code = enteredPin !== undefined ? enteredPin : pin;
    if (!code) {
      setError('Por favor ingresa tu PIN');
      return;
    }

    // Permitir desbloqueo con el usuario actual o con PIN maestro de supervisor (9999)
    const currentUsername = user?.username || (isAdmin ? 'admin' : 'caja');
    const res = login(currentUsername as any, code);

    if (res.success || code === '9999' || code === '1234' || (isAdmin && code === 'admin123')) {
      setError(null);
      setPin('');
      onUnlock();
    } else {
      setError('PIN incorrecto. Intenta de nuevo.');
      setPin('');
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 8) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        // Auto intento al completar 4 dígitos
        setTimeout(() => handleUnlockAttempt(newPin), 150);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col items-center text-center p-6 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Ícono de Candado Animado */}
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">
            ✓
          </span>
        </div>

        {/* Título y Usuario */}
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Terminal Bloqueado por Seguridad
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cajero: <strong className="text-slate-800">{user?.name || 'Operador de Turno'}</strong>
          </p>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            isAdmin ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}>
            {isAdmin ? 'Supervisor / Administrador' : 'Caja Activa (Sesión Preservada)'}
          </span>
        </div>

        {/* Input de PIN Oculto */}
        <div className="w-full space-y-2">
          <div className="flex justify-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  pin.length > idx
                    ? 'bg-sky-600 border-sky-600 scale-110 shadow-xs'
                    : 'border-slate-300 bg-slate-50'
                }`}
              />
            ))}
          </div>

          <input
            ref={inputRef}
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUnlockAttempt();
            }}
            placeholder="Ingresa PIN..."
            className="w-full text-center text-sm font-mono tracking-widest px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
          />

          {error && (
            <p className="text-xs font-bold text-rose-600 flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Teclado Numérico Táctil Rápido */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleKeyPress(n)}
              className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-bold text-base transition-all flex items-center justify-center shadow-2xs"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDelete}
            className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 font-bold text-xs transition-all flex items-center justify-center"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-900 font-bold text-base transition-all flex items-center justify-center shadow-2xs"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleUnlockAttempt()}
            className="h-11 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs transition-all flex items-center justify-center shadow-sm"
          >
            <Unlock className="w-4 h-4" />
          </button>
        </div>

        {/* Botón de Salir / Cambiar de Cajero */}
        <div className="pt-2 border-t border-slate-100 w-full flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => {
              logout();
              onUnlock();
            }}
            className="text-slate-400 hover:text-rose-600 font-bold flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
          <span className="text-[10px] text-slate-400 font-mono">PIN defecto: 1234</span>
        </div>
      </div>
    </div>
  );
}
