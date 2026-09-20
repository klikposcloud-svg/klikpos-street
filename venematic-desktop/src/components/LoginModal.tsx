'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, User, KeyRound, ShieldCheck, ArrowRight, AlertCircle, ShoppingBag, Sparkles } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onSuccess }: LoginModalProps) {
  const { login, switchToRole } = useAuth();
  const [username, setUsername] = useState<'caja' | 'admin'>('admin');
  const [password, setPassword] = useState('*2026');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);
      if (res.success) {
        setPassword('');
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Credenciales inválidas');
      }
    }, 150);
  };

  const handleSelectRole = (role: 'caja' | 'admin') => {
    setUsername(role);
    setPassword(role === 'admin' ? '*2026' : '1234');
    setError(null);
  };

  const handleDirectLogin = (role: 'caja' | 'admin') => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      const ok = switchToRole(role === 'admin' ? 'admin' : 'cajero');
      setIsLoading(false);
      if (ok && onSuccess) onSuccess();
    }, 150);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera con Marca */}
        <div className="bg-gradient-to-r from-sky-800 via-indigo-900 to-slate-950 p-6 text-white text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight">Acceso al Sistema Venematic</h2>
          <p className="text-xs text-sky-200 mt-1">
            Selecciona tu perfil de usuario para iniciar operaciones
          </p>
        </div>

        {/* Selector de Rol Rápido */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Tarjeta Administrador */}
            <button
              type="button"
              onClick={() => handleSelectRole('admin')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all text-center relative ${
                username === 'admin'
                  ? 'border-indigo-600 bg-indigo-50/90 text-indigo-950 shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              {username === 'admin' && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600" />
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                username === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xs text-slate-900">Administrador</span>
              <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-100/60 px-1.5 py-0.5 rounded">
                Clave: admin o *2026
              </span>
            </button>

            {/* Tarjeta Cajero */}
            <button
              type="button"
              onClick={() => handleSelectRole('caja')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all text-center relative ${
                username === 'caja'
                  ? 'border-sky-600 bg-sky-50/90 text-sky-950 shadow-md ring-2 ring-sky-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
              }`}
            >
              {username === 'caja' && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-600" />
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                username === 'caja' ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
              }`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xs text-slate-900">Cajero / Ventas</span>
              <span className="text-[10px] font-mono text-sky-600 font-bold bg-sky-100/60 px-1.5 py-0.5 rounded">
                PIN: 1234
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Input Usuario */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Usuario Seleccionado:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value as any)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Input Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Contraseña / PIN de Acceso:
                </label>
                <button
                  type="button"
                  onClick={() => setPassword(username === 'admin' ? '*2026' : '1234')}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline"
                >
                  Auto-llenar clave ({username === 'admin' ? '*2026' : '1234'})
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder={username === 'admin' ? 'Clave: admin o *2026' : 'PIN: 1234'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón Principal de Inicio de Sesión */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50 ${
                username === 'admin'
                  ? 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-600/20'
                  : 'bg-sky-700 hover:bg-sky-800 shadow-sky-600/20'
              }`}
            >
              <span>{isLoading ? 'Verificando...' : `Entrar como ${username === 'admin' ? 'Administrador' : 'Cajero'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Botón de Acceso Directo 1-Clic */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleDirectLogin('admin')}
                className="flex-1 py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Entrar Directo como Admin</span>
              </button>
              <button
                type="button"
                onClick={() => handleDirectLogin('caja')}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
              >
                <span>Entrar como Cajero</span>
              </button>
            </div>
          </form>

          <div className="pt-1 text-center text-[11px] text-slate-500">
            {username === 'admin' ? (
              <span className="text-indigo-700 font-semibold">
                🛡️ Modo Administrador: Acceso completo a Configuración, Edición, Balanzas y Reportes.
              </span>
            ) : (
              <span className="text-slate-600">
                🛒 Modo Cajero: Punto de Venta rápido, emisión de tickets y cobro.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
