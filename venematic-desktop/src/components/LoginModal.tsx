'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, User, KeyRound, ShieldCheck, ArrowRight, AlertCircle, ShoppingBag, Eye, EyeOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  onClose?: () => void;
}

export default function LoginModal({ isOpen, onSuccess, onClose }: LoginModalProps) {
  const { user, login, cashiers } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'cajero'>('cajero');
  const [selectedCashierUser, setSelectedCashierUser] = useState<string>('caja');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar cajero por defecto si hay cajeros registrados
  useEffect(() => {
    if (cashiers && cashiers.length > 0) {
      setSelectedCashierUser(cashiers[0].username);
    }
  }, [cashiers]);

  // Si ya hay un usuario autenticado y el modal no está explícitamente forzado, no renderizar
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);

    const passToVerify = password.trim();
    if (!passToVerify) {
      setError(selectedRole === 'admin' ? 'Ingrese la contraseña de Administrador.' : 'Ingrese el PIN de acceso del Cajero.');
      return;
    }

    setIsLoading(true);

    try {
      const usernameToAuth = selectedRole === 'admin' ? 'admin' : selectedCashierUser;
      const res = login(usernameToAuth, passToVerify);
      setIsLoading(false);

      if (res.success) {
        setPassword('');
        setError(null);
        if (onSuccess) onSuccess();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('venematic:auth_success'));
        }
      } else {
        setError(res.error || 'Credenciales incorrectas. Verifique e intente nuevamente.');
      }
    } catch {
      setIsLoading(false);
      setError('Ocurrió un error al verificar las credenciales.');
    }
  };

  const handleRoleChange = (role: 'admin' | 'cajero') => {
    setSelectedRole(role);
    setPassword('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Cabecera con Marca */}
        <div className="bg-gradient-to-r from-sky-900 via-indigo-950 to-slate-950 p-6 text-center relative border-b border-indigo-900/50">
          <div className="w-13 h-13 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">
            Acceso a Venematic POS
          </h2>
          <p className="text-xs font-medium text-sky-200/90 mt-1">
            Identifíquese con sus credenciales de seguridad para operar
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Selector de Perfil Claro y Profesional */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Seleccione Tipo de Acceso:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Tarjeta Cajero */}
              <button
                type="button"
                onClick={() => handleRoleChange('cajero')}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all text-center relative cursor-pointer ${
                  selectedRole === 'cajero'
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-950 dark:text-sky-200 shadow-sm ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/50'
                }`}
              >
                {selectedRole === 'cajero' && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky-600" />
                )}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    selectedRole === 'cajero'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">Caja / Ventas</span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">Facturación rápida</span>
              </button>

              {/* Tarjeta Administrador */}
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`p-3.5 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-all text-center relative cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800/50'
                }`}
              >
                {selectedRole === 'admin' && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600" />
                )}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    selectedRole === 'admin'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">Administrador</span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">Ajustes y reportes</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Si es Cajero y hay múltiples cajeros registrados, selector de usuario */}
            {selectedRole === 'cajero' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cajero Asignado:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={selectedCashierUser}
                    onChange={(e) => setSelectedCashierUser(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-500 appearance-none cursor-pointer"
                  >
                    {cashiers && cashiers.length > 0 ? (
                      cashiers.map((c) => (
                        <option key={c.id} value={c.username}>
                          {c.name} (@{c.username})
                        </option>
                      ))
                    ) : (
                      <option value="caja">Cajero Principal (@caja)</option>
                    )}
                  </select>
                </div>
              </div>
            )}

            {/* Input de Contraseña o PIN de Acceso */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {selectedRole === 'admin' ? 'Contraseña Maestra de Administrador:' : 'PIN de Seguridad del Cajero:'}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  placeholder={selectedRole === 'admin' ? 'Ingrese contraseña de administrador' : 'Ingrese PIN numérico (Ej: 1234)'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Mensaje de Error */}
            {error && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-medium animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Botón Principal de Inicio de Sesión */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl font-black text-xs text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-600/20'
                  : 'bg-sky-700 hover:bg-sky-800 shadow-sky-600/20'
              }`}
            >
              <span>{isLoading ? 'Verificando...' : `Iniciar Sesión como ${selectedRole === 'admin' ? 'Administrador' : 'Cajero'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Nota al pie informativa */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-[11px] text-slate-500 dark:text-slate-400">
            {selectedRole === 'admin' ? (
              <span>🔒 Puede actualizar su contraseña de administrador en <b>Ajustes &gt; Gestión de Cajeros</b>.</span>
            ) : (
              <span>🔑 Puede registrar o editar los PINs de los cajeros en el panel de Administración.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
