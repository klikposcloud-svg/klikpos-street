'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  checkLockout,
  recordAuthFailure,
  recordAuthSuccess,
  verifyCredential,
  hashCredential,
  isDuressPin,
  triggerDuressSilentAlarm,
  logSecurityEvent,
} from '@/lib/security/enterprise-security';

export type UserRole = 'admin' | 'cajero';

export interface CashierAccount {
  id: string;
  username: string;
  name: string;
  pin: string;
  role: UserRole;
}

export interface AuthUser {
  username: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  isAdmin: boolean;
  isCajero: boolean;
  requireAdminAuth: () => Promise<boolean>;
  showAdminAuthModal: boolean;
  setShowAdminAuthModal: (show: boolean) => void;
  handleAdminAuthConfirm: (pass: string) => boolean;
  cashiers: CashierAccount[];
  addCashier: (cashier: Omit<CashierAccount, 'id' | 'role'>) => boolean;
  updateCashier: (id: string, updated: Partial<CashierAccount>) => boolean;
  deleteCashier: (id: string) => boolean;
  adminPassword: string;
  updateAdminPassword: (newPass: string) => boolean;
  switchToRole: (role: UserRole, pass?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'venematic_current_user';
const CASHIERS_STORAGE_KEY = 'venematic_cashiers_list';
const ADMIN_PASS_STORAGE_KEY = 'venematic_admin_pass';

const DEFAULT_CASHIERS: CashierAccount[] = [
  {
    id: 'c1',
    username: 'caja',
    name: 'Cajero Principal',
    pin: '1234',
    role: 'cajero',
  },
];

export const DEFAULT_USER: AuthUser = {
  username: 'admin',
  name: 'Administrador General',
  role: 'admin',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return DEFAULT_USER;
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch {}
    return DEFAULT_USER;
  });
  const [showAdminAuthModal, setShowAdminAuthModal] = useState<boolean>(false);
  const [adminAuthResolver, setAdminAuthResolver] = useState<((val: boolean) => void) | null>(null);
  const [cashiers, setCashiers] = useState<CashierAccount[]>(DEFAULT_CASHIERS);
  const [adminPassword, setAdminPassword] = useState<string>('*2026');

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(DEFAULT_USER);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(DEFAULT_USER));
      }

      const savedCashiers = localStorage.getItem(CASHIERS_STORAGE_KEY);
      if (savedCashiers) {
        setCashiers(JSON.parse(savedCashiers));
      } else {
        localStorage.setItem(CASHIERS_STORAGE_KEY, JSON.stringify(DEFAULT_CASHIERS));
      }

      const savedAdminPass = localStorage.getItem(ADMIN_PASS_STORAGE_KEY);
      if (savedAdminPass) {
        setAdminPassword(savedAdminPass);
      }
    } catch (e) {
      console.warn('Error reading auth state:', e);
    }
  }, []);

  const isPassValidForAdmin = (p: string) => {
    const clean = (p || '').trim();
    if (!clean) return false;
    const check = verifyCredential(clean, adminPassword, 'ADMIN_SALT');
    if (check.isValid && check.needsRehash && check.newHash) {
      setAdminPassword(check.newHash);
      try {
        localStorage.setItem(ADMIN_PASS_STORAGE_KEY, check.newHash);
      } catch {}
    }
    return check.isValid;
  };

  const login = (username: string, pass: string) => {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    if (!cleanPass) {
      return {
        success: false,
        error: 'Por favor ingrese la contraseña o PIN de acceso.',
      };
    }

    // 0. Blindaje Anti-Fuerza Bruta & Lockout
    const lockout = checkLockout(cleanUser || 'login_portal');
    if (lockout.isLocked) {
      return {
        success: false,
        error: lockout.message || `Terminal bloqueado temporalmente. Espera ${lockout.remainingSeconds}s.`,
      };
    }

    // 0.1 Detección de PIN de Coacción / Emergencia
    if (isDuressPin(cleanPass)) {
      triggerDuressSilentAlarm(cleanUser, { context: 'PORTAL_LOGIN' });
      const authData: AuthUser = {
        username: cleanUser || 'cajero',
        name: 'Cajero en Servicio',
        role: 'cajero',
      };
      setUser(authData);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      } catch {}
      return { success: true };
    }

    // 1. Administrador General
    if (cleanUser === 'admin' || cleanUser === 'administrador') {
      if (isPassValidForAdmin(cleanPass)) {
        recordAuthSuccess(cleanUser);
        const authData: AuthUser = {
          username: 'admin',
          name: 'Administrador General',
          role: 'admin',
        };
        setUser(authData);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        } catch {}
        return { success: true };
      }
      const fail = recordAuthFailure(cleanUser);
      return {
        success: false,
        error: fail.message || 'Contraseña de Administrador incorrecta.',
      };
    }

    // 2. Cajero dinámico desde la lista de cajeros registrados
    const matched = cashiers.find(
      (c) => c.username.toLowerCase() === cleanUser
    );

    if (matched) {
      const check = verifyCredential(cleanPass, matched.pin, `CASHIER_${matched.id}`);
      if (check.isValid) {
        if (check.needsRehash && check.newHash) {
          updateCashier(matched.id, { pin: check.newHash });
        }
        recordAuthSuccess(cleanUser);
        const authData: AuthUser = {
          username: matched.username,
          name: matched.name,
          role: 'cajero',
        };
        setUser(authData);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        } catch {}
        return { success: true };
      }
      const fail = recordAuthFailure(cleanUser);
      return {
        success: false,
        error: fail.message || `PIN incorrecto para el cajero "${matched.name}".`,
      };
    }

    // Si ingresó como 'caja' genérico, validar contra cualquiera de los cajeros registrados
    if (cleanUser === 'caja' || cleanUser === 'cajero') {
      const pinMatch = cashiers.find((c) => {
        const check = verifyCredential(cleanPass, c.pin, `CASHIER_${c.id}`);
        return check.isValid;
      });
      if (pinMatch) {
        recordAuthSuccess('caja');
        const authData: AuthUser = {
          username: pinMatch.username,
          name: pinMatch.name,
          role: 'cajero',
        };
        setUser(authData);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
        } catch {}
        return { success: true };
      }
      const fail = recordAuthFailure('caja');
      return {
        success: false,
        error: fail.message || 'PIN de cajero incorrecto.',
      };
    }

    const fail = recordAuthFailure(cleanUser || 'unknown');
    return {
      success: false,
      error: fail.message || 'Usuario o credenciales no encontradas.',
    };
  };

  const switchToRole = (role: UserRole, pass?: string): boolean => {
    if (role === 'admin') {
      if (!pass || !isPassValidForAdmin(pass)) {
        return false;
      }
      const authData: AuthUser = {
        username: 'admin',
        name: 'Administrador General',
        role: 'admin',
      };
      setUser(authData);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      } catch {}
      return true;
    } else {
      const activeCashier = cashiers[0] || DEFAULT_CASHIERS[0];
      const authData: AuthUser = {
        username: activeCashier.username,
        name: activeCashier.name,
        role: 'cajero',
      };
      setUser(authData);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      } catch {}
      return true;
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
  };

  const requireAdminAuth = (): Promise<boolean> => {
    if (user?.role === 'admin') {
      return Promise.resolve(true);
    }
    setShowAdminAuthModal(true);
    return new Promise<boolean>((resolve) => {
      setAdminAuthResolver(() => resolve);
    });
  };

  const handleAdminAuthConfirm = (pass: string): boolean => {
    const cleanPass = (pass || '').trim();
    const lockout = checkLockout('supervisor_auth');
    if (lockout.isLocked) {
      alert(lockout.message || 'Autorización bloqueada por seguridad.');
      return false;
    }

    if (isDuressPin(cleanPass)) {
      triggerDuressSilentAlarm('supervisor', { context: 'SUPERVISOR_AUTH_DURESS' });
      if (adminAuthResolver) {
        adminAuthResolver(true);
        setAdminAuthResolver(null);
      }
      setShowAdminAuthModal(false);
      return true;
    }

    if (isPassValidForAdmin(cleanPass)) {
      recordAuthSuccess('supervisor_auth');
      logSecurityEvent({
        eventType: 'AUTH_SUCCESS',
        user: 'supervisor',
        details: { action: 'Autorización de supervisor aprobada' },
      });
      if (adminAuthResolver) {
        adminAuthResolver(true);
        setAdminAuthResolver(null);
      }
      setShowAdminAuthModal(false);
      return true;
    }

    const fail = recordAuthFailure('supervisor_auth');
    if (fail.isLocked) {
      alert(fail.message);
    }
    return false;
  };

  const addCashier = (newCashier: Omit<CashierAccount, 'id' | 'role'>): boolean => {
    const cleanUser = newCashier.username.trim().toLowerCase();
    if (cleanUser === 'admin' || cashiers.some((c) => c.username.toLowerCase() === cleanUser)) {
      return false;
    }
    const cashier: CashierAccount = {
      ...newCashier,
      username: cleanUser,
      id: 'c_' + Date.now(),
      role: 'cajero',
    };
    const updated = [...cashiers, cashier];
    setCashiers(updated);
    try {
      localStorage.setItem(CASHIERS_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    return true;
  };

  const updateCashier = (id: string, updated: Partial<CashierAccount>): boolean => {
    const next = cashiers.map((c) => (c.id === id ? { ...c, ...updated } : c));
    setCashiers(next);
    try {
      localStorage.setItem(CASHIERS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    return true;
  };

  const deleteCashier = (id: string): boolean => {
    if (cashiers.length <= 1) return false;
    const next = cashiers.filter((c) => c.id !== id);
    setCashiers(next);
    try {
      localStorage.setItem(CASHIERS_STORAGE_KEY, JSON.stringify(next));
    } catch {}
    return true;
  };

  const updateAdminPassword = (newPass: string): boolean => {
    const clean = newPass.trim();
    if (!clean) return false;
    setAdminPassword(clean);
    try {
      localStorage.setItem(ADMIN_PASS_STORAGE_KEY, clean);
    } catch {}
    return true;
  };

  const authContextValue = useMemo(
    () => ({
      user,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      isCajero: user?.role === 'cajero',
      requireAdminAuth,
      showAdminAuthModal,
      setShowAdminAuthModal: (show: boolean) => {
        setShowAdminAuthModal(show);
        if (!show && adminAuthResolver) {
          adminAuthResolver(false);
          setAdminAuthResolver(null);
        }
      },
      handleAdminAuthConfirm,
      cashiers,
      addCashier,
      updateCashier,
      deleteCashier,
      adminPassword,
      updateAdminPassword,
      switchToRole,
    }),
    [
      user,
      login,
      logout,
      requireAdminAuth,
      showAdminAuthModal,
      adminAuthResolver,
      handleAdminAuthConfirm,
      cashiers,
      addCashier,
      updateCashier,
      deleteCashier,
      adminPassword,
      updateAdminPassword,
      switchToRole,
    ]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
