'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { initializeDatabaseIfNeeded } from '@/lib/seed-data';
import { useAuth } from '@/context/AuthContext';
import LoginModal from '@/components/LoginModal';
import AdminPinModal from '@/components/AdminPinModal';
import LockScreenModal from '@/components/LockScreenModal';
import AutoUpdateModal from '@/components/AutoUpdateModal';
import { LogOut, ShieldCheck, User, Lock, RefreshCw, CheckCircle2, Sun, Moon, Sparkles, Clock, Cloud, Smartphone, Users, X, QrCode } from 'lucide-react';
import { STANDARD_RUBROS, StandardRubroId } from '@/lib/utils/business-rubros';
import { applyBrandingToDOM, applyTheme, getCurrentTheme, ThemeMode } from '@/lib/theme';
import CloudSyncWidget from '@/components/CloudSyncWidget';
import QRCode from 'qrcode';
import { SYSTEM_DEFAULTS } from '@/lib/constants/defaults';

interface NavItem {
  key: string;
  label: string;
  href: string;
  shortcut: string;
  adminOnly?: boolean;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: 'pos',
    label: 'Punto de Venta',
    href: '/dashboard/pos',
    shortcut: 'F1',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
    ),
  },
  {
    key: 'inventory',
    label: 'Inventario',
    href: '/dashboard/inventory',
    shortcut: 'F2',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'sales',
    label: 'Ventas',
    href: '/dashboard/sales',
    shortcut: 'F3',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'customers',
    label: 'Clientes',
    href: '/dashboard/customers',
    shortcut: 'F4',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    key: 'reports',
    label: 'Cierres',
    href: '/dashboard/reports',
    shortcut: 'F5',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    key: 'settings',
    label: 'Configuración',
    href: '/dashboard/settings',
    shortcut: 'F8',
    adminOnly: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function DesktopDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, isCajero, logout, requireAdminAuth, switchToRole } = useAuth();

  const [storeName, setStoreName] = useState(SYSTEM_DEFAULTS.DEFAULT_STORE.name);
  const [bcvRate, setBcvRate] = useState<number>(SYSTEM_DEFAULTS.DEFAULT_BCV_RATE);
  const [showBcvModal, setShowBcvModal] = useState(false);
  const [tempBcvRate, setTempBcvRate] = useState('');
  const [isSyncingBcv, setIsSyncingBcv] = useState(false);
  const [bcvSyncMessage, setBcvSyncMessage] = useState<string | null>(null);
  const [bcvRateSource, setBcvRateSource] = useState<string>('BCV Oficial');
  const [phoneConnected, setPhoneConnected] = useState<boolean>(false);
  const [phoneDeviceName, setPhoneDeviceName] = useState<string>('');
  const [currentTime, setCurrentTime] = useState('');
  const [clockDate, setClockDate] = useState('');
  const [clockTime, setClockTime] = useState('');
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [isLoginDismissed, setIsLoginDismissed] = useState(false);
  const [activeRubroInfo, setActiveRubroInfo] = useState<{ id: string; name: string; icon: string }>({
    id: 'supermercado',
    name: 'Supermercado & Minimarket',
    icon: '🛒',
  });

  const [currentTheme, setCurrentTheme] = useState<ThemeMode>('light');
  const [currentUIStyle, setCurrentUIStyle] = useState<'industrial' | 'glassmorphism'>('industrial');
  const [currentPalette, setCurrentPalette] = useState<string>('petrol');

  // Modal Global de Vinculación de Celular / Escáner Móvil
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobileQrUrl, setMobileQrUrl] = useState('');
  const [mobileScannerUrl, setMobileScannerUrl] = useState('');
  const [mobileLocalIp, setMobileLocalIp] = useState('');
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  const handleOpenMobileModal = async () => {
    setShowMobileModal(true);
    setIsGeneratingQr(true);
    try {
      const res = await fetch('/api/scanner/status?session=caja-1');
      if (res.ok) {
        const d = await res.json();
        const base = d.scannerUrl || (typeof window !== 'undefined' ? `${window.location.origin}/scanner?session=caja-1` : '');
        const fullUrl = base.includes('?') ? `${base}&store=tienda_principal` : `${base}?store=tienda_principal`;
        setMobileScannerUrl(fullUrl);
        setMobileLocalIp(d.localIp || '');
        if (d.phoneConnected) {
          setPhoneConnected(true);
          setPhoneDeviceName(d.deviceName || 'Caja Móvil');
        }
        if (fullUrl) {
          const qr = await QRCode.toDataURL(fullUrl, {
            width: 260,
            margin: 1,
            color: { dark: '#0e4f5a', light: '#ffffff' },
          });
          setMobileQrUrl(qr);
        }
      }
    } catch {
      const fallbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/scanner?session=caja-1&store=tienda_principal` : '';
      setMobileScannerUrl(fallbackUrl);
      if (fallbackUrl) {
        QRCode.toDataURL(fallbackUrl, { width: 260, margin: 1 }).then(setMobileQrUrl).catch(() => {});
      }
    } finally {
      setIsGeneratingQr(false);
    }
  };

  useEffect(() => {
    try {
      const t = getCurrentTheme();
      setCurrentTheme(t);
      const s = t === 'light' ? 'industrial' : ((localStorage.getItem('venematic_ui_style') as 'industrial' | 'glassmorphism') || 'industrial');
      setCurrentUIStyle(s);
      applyTheme(t);
      const palette = localStorage.getItem('venematic_branding_palette') || 'petrol';
      setCurrentPalette(palette);
      const industrialBg = (localStorage.getItem('venematic_industrial_bg') as any) || 'white';
      const customBg = localStorage.getItem('venematic_custom_bg_color') || '#f8fafc';
      applyBrandingToDOM({
        paletteId: palette,
        uiStyle: s,
        industrialBg: industrialBg,
        customBgColor: customBg,
      }, t === 'light' ? 'light' : 'dark');
    } catch {}

    const handleThemeChanged = (e: any) => {
      if (e.detail) {
        setCurrentTheme(e.detail);
        if (e.detail === 'light') {
          setCurrentUIStyle('industrial');
        } else {
          setCurrentUIStyle('glassmorphism');
        }
      }
    };
    const handleBrandingChanged = (e: any) => {
      if (e.detail?.paletteId) {
        setCurrentPalette(e.detail.paletteId);
      }
    };
    const handleOpenScannerModalEvent = () => {
      handleOpenMobileModal();
    };
    window.addEventListener('venematic:theme_changed', handleThemeChanged);
    window.addEventListener('venematic:branding_changed', handleBrandingChanged);
    window.addEventListener('venematic:open_scanner_modal', handleOpenScannerModalEvent);
    return () => {
      window.removeEventListener('venematic:theme_changed', handleThemeChanged);
      window.removeEventListener('venematic:branding_changed', handleBrandingChanged);
      window.removeEventListener('venematic:open_scanner_modal', handleOpenScannerModalEvent);
    };
  }, []);

  const handleToggleTheme = () => {
    // Alternar directamente entre Modo Blanco y Modo Oscuro
    const nextTheme: ThemeMode = currentTheme === 'light' ? 'dark' : 'light';
    setCurrentTheme(nextTheme);
    applyTheme(nextTheme);
    db.settings.put({ key: 'app_theme', value: nextTheme }).catch(() => {});
  };

  // Escuchar atajo global de bloqueo rápido de pantalla (Ctrl+L) y eventos
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setIsScreenLocked(true);
      }
    };
    const handleLockEvent = () => setIsScreenLocked(true);

    window.addEventListener('keydown', handleGlobalKeyDown);
    window.addEventListener('venematic:lock_screen', handleLockEvent);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('venematic:lock_screen', handleLockEvent);
    };
  }, []);

  // Escuchar estado en vivo del celular escáner
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/scanner/events?session=caja-1');
      eventSource.addEventListener('phone_status', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          setPhoneConnected(Boolean(data.connected));
          if (data.deviceName) setPhoneDeviceName(data.deviceName);
        } catch {}
      });
    } catch {}

    // Polling ligero de respaldo cada 5s
    const checkStatus = () => {
      fetch('/api/scanner/status?session=caja-1')
        .then((r) => r.json())
        .then((data) => {
          setPhoneConnected(Boolean(data.connected));
          if (data.deviceName) setPhoneDeviceName(data.deviceName);
        })
        .catch(() => {});
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    // Escuchar ventas móviles completadas para guardarlas en Dexie aun si está en otra pestaña
    const processIncomingSale = async (sale: any) => {
      if (!sale || !sale.receiptNumber) return;
      try {
        const exists = await db.sales.where('receiptNumber').equals(sale.receiptNumber).first();
        if (exists) {
          fetch('/api/scanner/sale', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiptNumber: sale.receiptNumber }),
          }).catch(() => {});
          return;
        }

        const saleToSave = {
          receiptNumber: sale.receiptNumber,
          timestamp: sale.timestamp || new Date().toISOString(),
          items: sale.items || [],
          subtotalUSD: Number(sale.subtotalUSD) || Number(sale.totalUSD) || 0,
          taxUSD: Number(sale.taxUSD) || 0,
          totalUSD: Number(sale.totalUSD) || 0,
          totalVES: Number(sale.totalVES) || 0,
          bcvRate: Number(sale.bcvRate) || bcvRate,
          payments: sale.payments || [
            {
              method: 'cash_usd',
              amountUSD: Number(sale.totalUSD) || 0,
              amountVES: Number(sale.totalVES) || 0,
            },
          ],
          changeUSD: Number(sale.changeUSD) || 0,
          changeVES: Number(sale.changeVES) || 0,
          cashierName: sale.cashierName || 'POS Celular (Contingencia)',
          status: 'completed',
          source: 'mobile',
        };

        await db.transaction('rw', db.sales, db.products, async () => {
          await db.sales.add(saleToSave as any);
          for (const item of saleToSave.items || []) {
            let prod = item.productId ? await db.products.get(Number(item.productId)) : undefined;
            if (!prod && item.barcode) {
              prod = await db.products.where('barcode').equals(item.barcode).first();
            }
            if (prod && prod.id) {
              await db.products.update(prod.id, {
                stock: Math.max(0, prod.stock - item.qty),
                updatedAt: new Date().toISOString(),
              });
            }
          }
        });

        fetch('/api/scanner/sale', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptNumber: sale.receiptNumber }),
        }).catch(() => {});

        window.dispatchEvent(new CustomEvent('venematic:mobile_sale_saved', { detail: saleToSave }));
      } catch (err) {
        console.error('Error procesando venta móvil en layout:', err);
      }
    };

    if (eventSource) {
      eventSource.addEventListener('mobile_sale_completed', (e: any) => {
        try {
          const d = JSON.parse(e.data);
          if (d.sale) processIncomingSale(d.sale);
        } catch {}
      });

      eventSource.addEventListener('inventory_updated', (e: any) => {
        try {
          const d = JSON.parse(e.data);
          if (typeof d.bcvRate === 'number' && d.bcvRate > 0) {
            setBcvRate(d.bcvRate);
            setTempBcvRate(d.bcvRate.toFixed(2));
            db.settings.put({ key: 'bcv_rate', value: d.bcvRate });
            window.dispatchEvent(new CustomEvent('pos:bcv_updated', { detail: d.bcvRate }));
            window.dispatchEvent(new CustomEvent('venematic:bcv_updated', { detail: d.bcvRate }));
          }
        } catch {}
      });
    }

    // Polling de ventas pendientes cada 4s
    const checkPending = () => {
      fetch('/api/scanner/sale')
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d.pendingSales) && d.pendingSales.length > 0) {
            for (const s of d.pendingSales) {
              processIncomingSale(s);
            }
          }
        })
        .catch(() => {});
    };
    checkPending();
    const pendingTimer = setInterval(checkPending, 4000);

    return () => {
      eventSource?.close();
      clearInterval(interval);
      clearInterval(pendingTimer);
    };
  }, [bcvRate]);

  // Inicializar DB y auto-sincronizar tasa BCV oficial al arrancar
  useEffect(() => {
    const autoSyncBcv = async () => {
      try {
        const res = await fetch('/api/bcv/rate?refresh=true');
        if (res.ok) {
          const data = await res.json();
          if (data.success && typeof data.rate === 'number' && data.rate > 0) {
            await db.settings.put({ key: 'bcv_rate', value: data.rate });
            setBcvRate(data.rate);
            if (data.source) setBcvRateSource(data.source);
            window.dispatchEvent(new CustomEvent('pos:bcv_updated', { detail: data.rate }));
            window.dispatchEvent(new CustomEvent('venematic:bcv_updated', { detail: data.rate }));
            // Sincronizar catálogo celular
            fetch('/api/scanner/inventory', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bcvRate: data.rate }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Auto BCV sync warning:', err);
      }
    };

    // Inicializar DB y auto-sincronizar tasa BCV oficial del día al abrir el programa
    initializeDatabaseIfNeeded().then(async () => {
      const bcv = await db.settings.get('bcv_rate');
      if (bcv) setBcvRate(bcv.value);
      autoSyncBcv();

      const store = await db.settings.get('store_info');
      if (store) setStoreName(store.value.name);
      const savedRubro = await db.settings.get('active_rubro');
      if (savedRubro?.value && STANDARD_RUBROS[savedRubro.value as StandardRubroId]) {
        const r = STANDARD_RUBROS[savedRubro.value as StandardRubroId];
        setActiveRubroInfo({ id: r.id, name: r.name, icon: r.icon });
      }
    });

    const handleRubroChanged = (e: any) => {
      if (e.detail?.rubroId && STANDARD_RUBROS[e.detail.rubroId as StandardRubroId]) {
        const r = STANDARD_RUBROS[e.detail.rubroId as StandardRubroId];
        setActiveRubroInfo({ id: r.id, name: r.name, icon: r.icon });
        if (e.detail.storeName) setStoreName(e.detail.storeName);
      }
    };
    window.addEventListener('venematic:rubro_changed', handleRubroChanged);

    const updateClock = () => {
      const now = new Date();
      // Fecha completa: ej. "Mar, 22 Sep 2026"
      const dateFormatted = now.toLocaleDateString('es-VE', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
      setClockDate(capitalizedDate);

      // Hora precisa con segundos y formato AM/PM
      const timeFormatted = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setClockTime(timeFormatted);
      setCurrentTime(`${capitalizedDate} ${timeFormatted}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

    // Atajos de Teclado Globales (F1 a F8 y Ctrl+L)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloqueo de pantalla con Ctrl+L
      if ((e.ctrlKey || e.metaKey) && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setIsScreenLocked(true);
        return;
      }
      if (e.key === 'F1') {
        e.preventDefault();
        router.push('/dashboard/pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        router.push('/dashboard/inventory');
      } else if (e.key === 'F3') {
        e.preventDefault();
        router.push('/dashboard/sales');
      } else if (e.key === 'F4') {
        e.preventDefault();
        router.push('/dashboard/customers');
      } else if (e.key === 'F5') {
        e.preventDefault();
        router.push('/dashboard/reports');
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (isAdmin) {
          router.push('/dashboard/settings');
        } else {
          requireAdminAuth().then((ok) => {
            if (ok) router.push('/dashboard/settings');
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [router, isAdmin, requireAdminAuth]);

  // Actualizar tasa mediante scraping en vivo
  const handleScrapeBcv = async () => {
    setIsSyncingBcv(true);
    setBcvSyncMessage(null);
    try {
      const res = await fetch('/api/bcv/rate?refresh=true');
      if (res.ok) {
        const data = await res.json();
        if (data.success && typeof data.rate === 'number' && data.rate > 0) {
          setTempBcvRate(data.rate.toFixed(2));
          setBcvRate(data.rate);
          setBcvRateSource(data.source || 'BCV Oficial');
          await db.settings.put({ key: 'bcv_rate', value: data.rate });
          window.dispatchEvent(new CustomEvent('pos:bcv_updated', { detail: data.rate }));
          // Actualizar inventario móvil
          fetch('/api/scanner/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bcvRate: data.rate }),
          }).catch(() => {});
          setBcvSyncMessage(`✓ Tasa BCV Oficial obtenida en vivo: Bs. ${data.rate.toFixed(2)} (${data.source || 'Scraping'})`);
        } else {
          setBcvSyncMessage('No se pudo obtener la tasa en vivo. Verifica conexión.');
        }
      }
    } catch (err) {
      setBcvSyncMessage('Error de red al consultar servicio BCV.');
    } finally {
      setIsSyncingBcv(false);
    }
  };

  const handleSaveBcv = async () => {
    const parsed = parseFloat(tempBcvRate.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      await db.settings.put({ key: 'bcv_rate', value: parsed });
      setBcvRate(parsed);
      setBcvRateSource('Ajuste Manual');
      setShowBcvModal(false);
      window.dispatchEvent(new CustomEvent('pos:bcv_updated', { detail: parsed }));
      fetch('/api/bcv/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rate: parsed }),
      }).catch(() => {});
      fetch('/api/scanner/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bcvRate: parsed }),
      }).catch(() => {});
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white dark:bg-[#0B141F] text-slate-900 dark:text-slate-100 font-sans overflow-hidden select-none">
      {/* Barra de Estado Superior Profesional (30% más alta, imponente y sobria) */}
      <header className="h-[72px] sm:h-[74px] bg-white dark:bg-[#121c29] border-b-2 border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white px-5 sm:px-6 flex items-center justify-between shrink-0 z-20 shadow-sm layer-shell transition-all">
        {/* Identidad del Terminal */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="h-9 sm:h-10 w-28 sm:w-32 cursor-pointer transition-all duration-300 hover:scale-105"
              style={{
                maskImage: 'url(/brand/klikpos-logo-white.png)',
                WebkitMaskImage: 'url(/brand/klikpos-logo-white.png)',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center left',
                WebkitMaskPosition: 'center left',
                backgroundColor: currentTheme === 'dark' ? '#ffffff' : 'var(--brand-primary, #0f172a)',
              }}
              onClick={() => router.push('/dashboard/pos')}
              title="KlikPOS Cloud"
            />
          </div>
          <span className="h-7 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex flex-col leading-tight min-w-0">
            <span
              className="font-black text-sm sm:text-base truncate tracking-tight transition-colors duration-300 drop-shadow-xs"
              style={{
                color: currentTheme === 'light'
                  ? 'var(--brand-primary, #0369a1)'
                  : currentTheme === 'glass'
                  ? 'var(--brand-border, #38bdf8)'
                  : 'var(--brand-border, #7dd3fc)',
                textShadow: currentTheme === 'glass' ? '0 0 10px var(--brand-glow, rgba(56,189,248,0.35))' : undefined,
              }}
              title={storeName}
            >
              {storeName}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
              <span>Terminal de Cobro &amp; Facturación</span>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full transition-colors duration-300"
                style={{ backgroundColor: 'var(--brand-primary, #0284c7)' }}
              />
            </span>
          </div>
        </div>

        {/* Tasa BCV, Estado del Sistema & Atajos */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Indicador Offline Local */}
          <span
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold select-none shadow-2xs"
            style={{
              backgroundColor: currentTheme === 'dark' ? '#1e293b' : '#f1f5f9',
              borderColor: currentTheme === 'dark' ? '#334155' : '#cbd5e1',
              color: currentTheme === 'dark' ? '#ffffff' : '#0f172a',
            }}
            title="Terminal operando 100% en modo local offline seguro"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
            <span style={{ color: currentTheme === 'dark' ? '#ffffff' : '#0f172a' }}>Offline</span>
          </span>

          {/* Sincronización en la Nube */}
          <span
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold select-none cursor-pointer transition-colors shadow-2xs"
            style={{
              backgroundColor: currentTheme === 'dark' ? '#1e293b' : '#f1f5f9',
              borderColor: currentTheme === 'dark' ? '#334155' : '#cbd5e1',
              color: currentTheme === 'dark' ? '#ffffff' : '#0f172a',
            }}
            title="Sincronización en tiempo real"
          >
            <Cloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span style={{ color: currentTheme === 'dark' ? '#ffffff' : '#0f172a' }}>Nube</span>
          </span>

          {/* Estado Celular Escáner / Vincular Móvil */}
          <button
            type="button"
            onClick={handleOpenMobileModal}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold select-none cursor-pointer transition-colors shadow-2xs"
            style={{
              backgroundColor: phoneConnected
                ? (currentTheme === 'dark' ? '#064e3b' : '#ecfdf5')
                : (currentTheme === 'dark' ? '#1e293b' : '#f1f5f9'),
              borderColor: phoneConnected
                ? (currentTheme === 'dark' ? '#047857' : '#6ee7b7')
                : (currentTheme === 'dark' ? '#334155' : '#cbd5e1'),
              color: phoneConnected
                ? (currentTheme === 'dark' ? '#6ee7b7' : '#065f46')
                : (currentTheme === 'dark' ? '#ffffff' : '#0f172a'),
            }}
            title="Clic para vincular celular como escáner inalámbrico con código QR"
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span style={{ color: currentTheme === 'dark' ? '#ffffff' : '#0f172a' }}>{phoneConnected ? 'Móvil Conectado' : 'Móvil'}</span>
          </button>

          {/* Selector de Tema Inteligente: Modo Blanco, Oscuro, Esmerilado */}
          <div
            className="inline-flex items-center p-1 rounded-full border shadow-2xs select-none"
            style={{
              backgroundColor: currentTheme === 'dark' ? '#1e293b' : '#f1f5f9',
              borderColor: currentTheme === 'dark' ? '#334155' : '#cbd5e1',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setCurrentTheme('light');
                applyTheme('light');
                db.settings.put({ key: 'app_theme', value: 'light' }).catch(() => {});
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                currentTheme === 'light'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                  : 'text-slate-800 hover:text-slate-950'
              }`}
              style={{ color: currentTheme === 'light' ? '#0f172a' : (currentTheme === 'dark' ? '#94a3b8' : '#334155') }}
              title="Activar Modo Blanco Profesional"
            >
              <Sun className={`w-3.5 h-3.5 ${currentTheme === 'light' ? 'text-amber-500' : 'text-slate-600'}`} />
              <span>Modo Blanco</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentTheme('dark');
                applyTheme('dark');
                db.settings.put({ key: 'app_theme', value: 'dark' }).catch(() => {});
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                currentTheme === 'dark'
                  ? 'bg-[#121c29] text-amber-300 shadow-xs border border-slate-700'
                  : 'text-slate-800 hover:text-slate-950'
              }`}
              style={{ color: currentTheme === 'dark' ? '#fcd34d' : '#334155' }}
              title="Activar Modo Oscuro"
            >
              <Moon className={`w-3.5 h-3.5 ${currentTheme === 'dark' ? 'text-amber-400' : 'text-slate-600'}`} />
              <span>Oscuro</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentTheme('glass');
                applyTheme('glass');
                db.settings.put({ key: 'app_theme', value: 'glass' }).catch(() => {});
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                currentTheme === 'glass'
                  ? 'bg-gradient-to-r from-sky-500/25 to-teal-500/25 text-sky-300 shadow-xs border border-sky-400/50 backdrop-blur-md'
                  : 'text-slate-800 hover:text-slate-950'
              }`}
              style={{ color: currentTheme === 'glass' ? '#7dd3fc' : (currentTheme === 'dark' ? '#94a3b8' : '#334155') }}
              title="Activar Modo Esmerilado Translúcido (Glassmorphism)"
            >
              <Sparkles className={`w-3.5 h-3.5 ${currentTheme === 'glass' ? 'text-sky-300 animate-pulse' : 'text-slate-600'}`} />
              <span>Esmerilado</span>
            </button>
          </div>

          {/* Tasa BCV con Botón de Ajuste Rápido - Impecable en Modo Blanco, Oscuro y Esmerilado */}
          <button
            type="button"
            onClick={() => {
              setTempBcvRate(bcvRate.toFixed(2));
              setShowBcvModal(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 text-xs transition-all shadow-xs active:scale-95 cursor-pointer group shrink-0"
            style={{
              backgroundColor: currentTheme === 'light' ? '#f8fafc' : '#0f172a',
              borderColor: currentTheme === 'light' ? '#cbd5e1' : '#334155',
              color: currentTheme === 'light' ? '#0f172a' : '#ffffff',
            }}
            title="Clic para cambiar tasa oficial BCV"
          >
            <span
              className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black tracking-wider shadow-2xs transition-colors shrink-0"
              style={{
                backgroundColor: 'var(--brand-primary, #0369a1)',
                color: '#ffffff',
              }}
            >
              BCV
            </span>
            <span
              className="font-mono font-black tabular-numbers text-xs sm:text-[13.5px] tracking-wide"
              style={{
                color: currentTheme === 'light' ? '#020617' : '#ffffff',
              }}
            >
              Bs. {bcvRate.toFixed(2)}
            </span>
          </button>

          {/* Reloj Digital del Sistema */}
          <div
            className="hidden md:inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-bold font-mono select-none shadow-2xs shrink-0"
            style={{
              backgroundColor: currentTheme === 'dark' ? '#1e293b' : '#f1f5f9',
              borderColor: currentTheme === 'dark' ? '#334155' : '#cbd5e1',
              color: currentTheme === 'dark' ? '#ffffff' : '#0f172a',
            }}
            title="Fecha y hora oficial del sistema"
          >
            <span style={{ color: currentTheme === 'dark' ? '#cbd5e1' : '#0f172a' }}>{clockDate}</span>
            <span style={{ color: currentTheme === 'dark' ? '#64748b' : '#94a3b8' }}>|</span>
            <span className="font-black tabular-numbers" style={{ color: currentTheme === 'dark' ? '#ffffff' : '#000000' }}>{clockTime}</span>
          </div>
        </div>
      </header>

      {/* Cuerpo Principal: Sidebar + Contenido */}
      <div className="flex-1 flex overflow-hidden">
        {/* Barra Lateral Profesional */}
        <aside
          className="w-56 border-r flex flex-col justify-between shrink-0 p-3 z-10 layer-shell"
          style={{
            backgroundColor: currentTheme === 'dark' ? '#0e1826' : '#ffffff',
            borderColor: currentTheme === 'dark' ? '#1e293b' : '#e2e8f0',
            color: currentTheme === 'dark' ? '#f8fafc' : '#0f172a',
          }}
        >
          <div className="space-y-1">
            <div
              className="px-3 py-2 text-[10.5px] font-black uppercase tracking-wider select-none"
              style={{ color: currentTheme === 'dark' ? '#94a3b8' : '#0f172a' }}
            >
              Operaciones de Caja
            </div>

            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              const isLocked = item.adminOnly && !isAdmin;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isLocked) {
                      const ok = await requireAdminAuth();
                      if (!ok) return;
                    }
                    router.push(item.href);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors select-none cursor-pointer text-left ${
                    isActive
                      ? 'nav-item-active font-black border shadow-xs'
                      : (currentTheme === 'dark'
                          ? 'text-slate-100 hover:text-white hover:bg-slate-800 font-bold'
                          : 'text-slate-900 hover:text-slate-950 hover:bg-slate-100 font-black')
                  }`}
                  style={{
                    color: isActive ? undefined : (currentTheme === 'dark' ? '#f1f5f9' : '#0f172a')
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ color: isActive ? undefined : (currentTheme === 'dark' ? '#94a3b8' : '#0f172a') }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {isLocked && (
                    <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pie del Sidebar: Avatar Circular + Administrador General + Pasar a */}
          <div
            className="pt-3 border-t flex flex-col items-center text-center select-none"
            style={{ borderColor: currentTheme === 'dark' ? '#1e293b' : '#e2e8f0' }}
          >
            {/* Avatar circular con borde blanco */}
            <div className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-700 shadow-md overflow-hidden bg-slate-300 dark:bg-slate-700 relative flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                alt="Usuario"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--brand-primary)] text-white font-black text-sm">
                {isAdmin ? 'AD' : 'C1'}
              </div>
            </div>

            <span
              className="font-black text-xs mt-2"
              style={{ color: currentTheme === 'dark' ? '#ffffff' : '#0f172a' }}
            >
              {isAdmin ? 'Administrador General' : user ? user.name : 'Cajero Activo'}
            </span>

            <div
              className="flex items-center gap-1.5 mt-1 text-[11px] font-bold"
              style={{ color: currentTheme === 'dark' ? '#cbd5e1' : '#0f172a' }}
            >
              <span>Pasar a</span>
              <button
                type="button"
                onClick={() => switchToRole(isAdmin ? 'cajero' : 'admin')}
                className="p-1 hover:scale-110 transition-transform"
                style={{ color: currentTheme === 'dark' ? '#cbd5e1' : '#0f172a' }}
                title={isAdmin ? 'Pasar a Cajero' : 'Cambiar a Admin'}
              >
                <Users className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsScreenLocked(true)}
                className="p-1 hover:scale-110 transition-transform text-amber-500"
                title="Bloquear Pantalla de Seguridad (Ctrl+L)"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginDismissed(false);
                  logout();
                }}
                className="p-1 hover:scale-110 transition-transform text-rose-500"
                title="Cerrar Sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
          </div>
        </aside>

        {/* Área de Trabajo */}
        <main className="flex-1 bg-white dark:bg-[#0B141F] overflow-hidden flex flex-col">
          {children}
        </main>
      </div>

      {/* Modal de Inicio de Sesión Obligatorio */}
      <LoginModal
        isOpen={!user}
        onSuccess={() => setIsLoginDismissed(true)}
      />

      {/* Modal de Bloqueo Rápido de Pantalla */}
      <LockScreenModal
        isOpen={isScreenLocked}
        onUnlock={() => setIsScreenLocked(false)}
      />

      {/* Modal de Confirmación de PIN de Administrador */}
      <AdminPinModal />

      {/* Modal de Auto-Actualizaciones en Línea y Notificación */}
      <AutoUpdateModal />

      {/* Modal Rápido de Cambio de Tasa BCV */}
      {showBcvModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-300 p-5 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Ajustar Tasa Oficial BCV</h3>
              <button
                onClick={() => setShowBcvModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Valor del Dólar Oficial (Bs./$):
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Fuente: {bcvRateSource}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                  Bs.
                </span>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={tempBcvRate}
                  onChange={(e) => setTempBcvRate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveBcv();
                    if (e.key === 'Escape') setShowBcvModal(false);
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none tabular-numbers"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Puedes editarla a mano o sincronizarla en vivo con el Banco Central.
              </p>
            </div>

            {/* Botón de Actualizar Tasa por Scraping en Vivo */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                disabled={isSyncingBcv}
                onClick={handleScrapeBcv}
                className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 border border-sky-300 text-sky-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBcv ? 'animate-spin text-sky-600' : 'text-sky-700'}`} />
                <span>{isSyncingBcv ? 'Consultando BCV en vivo...' : '🔄 Actualizar Tasa Oficial (Scraping en Vivo)'}</span>
              </button>

              {bcvSyncMessage && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                  <span>{bcvSyncMessage}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBcvModal(false)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBcv}
                className="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold shadow-sm"
              >
                Guardar Tasa Manual
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Global: Vincular Celular como Escáner Móvil */}
      {showMobileModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-md overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0e4f5a] text-white flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 tracking-tight">
                    Vincular Celular como Escáner
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cámara móvil lectora de códigos de barras y fotos de productos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 flex flex-col items-center text-center space-y-4">
              {/* Código QR Generado Dinámicamente */}
              <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm relative group">
                {mobileQrUrl ? (
                  <img
                    src={mobileQrUrl}
                    alt="Escáner QR Celular"
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#0e4f5a]" />
                    <span className="text-xs font-semibold">Generando código QR...</span>
                  </div>
                )}
              </div>

              {/* Código de Tienda y Estado */}
              <div className="w-full flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left">
                <div>
                  <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block leading-tight">
                    Código de Tienda (Store ID):
                  </span>
                  <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    tienda_principal
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('tienda_principal');
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-all"
                >
                  Copiar Código
                </button>
              </div>

              {/* Estado de Conexión del Teléfono */}
              <div
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
                  phoneConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    phoneConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <span>
                  {phoneConnected
                    ? `¡Celular Conectado! (${phoneDeviceName || 'Móvil'})`
                    : 'Esperando escaneo del código QR con el móvil...'}
                </span>
              </div>

              {/* Instrucciones Paso a Paso */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-[#0e4f5a] font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span className="text-slate-600">
                    Conecta tu celular al <b>mismo Wi-Fi</b> o red local que esta computadora.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-[#0e4f5a] font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span className="text-slate-600">
                    Abre la cámara de tu teléfono, apunta a este código QR y toca el enlace.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-[#0e4f5a] font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <span className="text-slate-600">
                    ¡Listo! Podrás usar la cámara de tu móvil para escanear productos y se agregarán a la venta en vivo.
                  </span>
                </div>
              </div>

              {/* URL directa */}
              {mobileScannerUrl && (
                <div className="w-full text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    O escribe esta dirección en el navegador de tu celular:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={mobileScannerUrl}
                      className="flex-1 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(mobileScannerUrl);
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="px-4 py-2 bg-[#0e4f5a] hover:bg-[#0a3d46] text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
