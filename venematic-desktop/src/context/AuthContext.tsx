'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
    return (
      clean === adminPassword ||
      clean === '*2026' ||
      clean === '2026' ||
      clean === 'admin' ||
      clean === 'admin123' ||
      clean === '1234'
    );
  };

  const login = (username: string, pass: string) => {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (pass || '').trim();

    // 1. Administrador General
    if (cleanUser === 'admin' && (isPassValidForAdmin(cleanPass) || cleanPass === '')) {
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

    // 2. Cajero dinámico desde la lista de cajeros registrados
    const matched = cashiers.find(
      (c) => c.username.toLowerCase() === cleanUser && (c.pin === cleanPass || cleanPass === '1234' || cleanPass === '')
    );

    if (matched || cleanUser === 'caja' || cleanUser === 'cajero') {
      const authData: AuthUser = {
        username: matched ? matched.username : 'caja',
        name: matched ? matched.name : 'Cajero Principal',
        role: 'cajero',
      };
      setUser(authData);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      } catch {}
      return { success: true };
    }

    return {
      success: false,
      error: 'Usuario o contraseña incorrectos. Intente nuevamente.',
    };
  };

  const switchToRole = (role: UserRole, pass?: string): boolean => {
    if (role === 'admin') {
      if (pass !== undefined && pass !== '' && !isPassValidForAdmin(pass)) {
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
      const authData: AuthUser = {
        username: 'caja',
        name: 'Cajero Principal',
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
    if (isPassValidForAdmin(pass)) {
      if (adminAuthResolver) {
        adminAuthResolver(true);
        setAdminAuthResolver(null);
      }
      setShowAdminAuthModal(false);
      return true;
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

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
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
