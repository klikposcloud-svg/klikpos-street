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
import { LogOut, ShieldCheck, User, Lock, RefreshCw, CheckCircle2, Sun, Sparkles } from 'lucide-react';
import { STANDARD_RUBROS, StandardRubroId } from '@/lib/utils/business-rubros';
import { applyBrandingToDOM } from '@/lib/theme';
import CloudSyncWidget from '@/components/CloudSyncWidget';

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
    label: 'Inventario y Precios',
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
    label: 'Ventas del Turno',
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
    label: 'Cierres de Caja (X/Z)',
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

  const [storeName, setStoreName] = useState('Comercial Mi Tienda C.A.');
  const [bcvRate, setBcvRate] = useState<number>(848.55);
  const [showBcvModal, setShowBcvModal] = useState(false);
  const [tempBcvRate, setTempBcvRate] = useState('');
  const [isSyncingBcv, setIsSyncingBcv] = useState(false);
  const [bcvSyncMessage, setBcvSyncMessage] = useState<string | null>(null);
  const [bcvRateSource, setBcvRateSource] = useState<string>('BCV Oficial');
  const [phoneConnected, setPhoneConnected] = useState<boolean>(false);
  const [phoneDeviceName, setPhoneDeviceName] = useState<string>('');
  const [currentTime, setCurrentTime] = useState('');
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const [isLoginDismissed, setIsLoginDismissed] = useState(false);
  const [activeRubroInfo, setActiveRubroInfo] = useState<{ id: string; name: string; icon: string }>({
    id: 'bodega',
    name: 'Bodega',
    icon: '🏪',
  });

  const [currentUIStyle, setCurrentUIStyle] = useState<'industrial' | 'glassmorphism'>('industrial');

  useEffect(() => {
    try {
      const s = (localStorage.getItem('venematic_ui_style') as 'industrial' | 'glassmorphism') || 'industrial';
      setCurrentUIStyle(s);
      const palette = localStorage.getItem('venematic_branding_palette') || 'sky';
      const industrialBg = (localStorage.getItem('venematic_industrial_bg') as any) || 'white';
      const customBg = localStorage.getItem('venematic_custom_bg_color') || '#ffffff';
      applyBrandingToDOM({
        paletteId: palette,
        uiStyle: s,
        industrialBg: industrialBg,
        customBgColor: customBg,
      });
    } catch {}

    const handleBrandingUpdated = (e: any) => {
      if (e.detail?.uiStyle) {
        setCurrentUIStyle(e.detail.uiStyle);
      }
    };
    window.addEventListener('venematic:branding_updated', handleBrandingUpdated);
    return () => window.removeEventListener('venematic:branding_updated', handleBrandingUpdated);
  }, []);

  const handleToggleUIStyle = () => {
    const nextStyle = currentUIStyle === 'glassmorphism' ? 'industrial' : 'glassmorphism';
    setCurrentUIStyle(nextStyle);
    const palette = localStorage.getItem('venematic_branding_palette') || 'sky';
    const industrialBg = (localStorage.getItem('venematic_industrial_bg') as any) || 'white';
    const customBg = localStorage.getItem('venematic_custom_bg_color') || '#ffffff';
    applyBrandingToDOM({
      paletteId: palette,
      uiStyle: nextStyle,
      industrialBg: industrialBg,
      customBgColor: customBg,
    });
    try {
      localStorage.setItem('venematic_ui_style', nextStyle);
      db.settings.put({
        key: 'branding_config',
        value: {
          paletteId: palette,
          uiStyle: nextStyle,
          industrialBg: industrialBg,
          customBgColor: customBg,
        },
      }).catch(() => {});
    } catch {}
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
        const res = await fetch('/api/bcv/rate');
        if (res.ok) {
          const data = await res.json();
          if (data.success && typeof data.rate === 'number' && data.rate > 0) {
            await db.settings.put({ key: 'bcv_rate', value: data.rate });
            setBcvRate(data.rate);
            if (data.source) setBcvRateSource(data.source);
            window.dispatchEvent(new CustomEvent('pos:bcv_updated', { detail: data.rate }));
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
      setCurrentTime(
        now.toLocaleDateString('es-VE', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }) +
          ' ' +
          now.toLocaleTimeString('es-VE', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
      );
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
    <div className="h-screen w-screen flex flex-col bg-white text-slate-900 font-sans overflow-hidden select-none">
      {/* Barra de Estado Superior Profesional */}
      <header className="h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-20 shadow-xs">
        {/* Identidad del Terminal */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-black text-sm tracking-tight text-slate-900">
            <span className="w-6 h-6 rounded brand-badge flex items-center justify-center font-mono text-xs font-bold shadow-xs">
              V
            </span>
            <span>VENEMATIC POS</span>
          </div>
          <span className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">{storeName}</span>
            <Link
              href="/dashboard/settings"
              title="Cambiar giro comercial o plantilla estándar (F8)"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-sky-50 hover:border-sky-300 text-slate-700 hover:text-sky-900 border border-slate-200 font-bold text-[10px] transition-colors"
            >
              <span>{activeRubroInfo.icon}</span>
              <span>{activeRubroInfo.name}</span>
            </Link>
            <span className="text-slate-400">|</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Terminal Offline 100% Local
            </span>
            <span className="text-slate-400">|</span>
            <CloudSyncWidget />
            <span className="text-slate-400">|</span>
            {phoneConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-[11px] shadow-2xs animate-in fade-in">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>📱 {phoneDeviceName || 'Celular'} Conectado</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span>📱 Celular no enlazado</span>
              </span>
            )}
          </div>
        </div>

        {/* Tasa BCV & Reloj de Sistema */}
        <div className="flex items-center gap-2.5">
          {/* Botón de Alternar Modo: Soft UI Blanco vs Glassmorphism */}
          <button
            type="button"
            onClick={handleToggleUIStyle}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-xs border select-none pos-theme-toggle"
            title={`Alternar tema: Actualmente en ${currentUIStyle === 'glassmorphism' ? 'Glassmorphism' : 'Modo Blanco'}`}
          >
            {currentUIStyle === 'glassmorphism' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold">Modo Blanco</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span className="text-[11px] font-bold text-purple-700">Glassmorphism</span>
              </>
            )}
          </button>

          <span className="h-4 w-px bg-slate-200" />

          {/* Tasa BCV con Botón de Ajuste Rápido */}
          <button
            onClick={() => {
              setTempBcvRate(bcvRate.toFixed(2));
              setShowBcvModal(true);
            }}
            className="flex items-center gap-2 px-3 py-1 rounded border border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 text-xs transition-colors"
            title="Clic para cambiar tasa BCV"
          >
            <span className="text-slate-500 font-medium">Tasa BCV:</span>
            <span className="font-mono font-black text-slate-900 tabular-numbers">
              Bs. {bcvRate.toFixed(2)}
            </span>
            <span className="text-[10px] text-sky-700 font-bold underline">Cambiar</span>
          </button>

          <span className="h-4 w-px bg-slate-200" />

          {/* Reloj */}
          <span className="text-xs text-slate-500 font-mono tabular-numbers">
            {currentTime}
          </span>
        </div>
      </header>

      {/* Cuerpo Principal: Sidebar + Contenido */}
      <div className="flex-1 flex overflow-hidden">
        {/* Barra Lateral Blanca Profesional */}
        <aside className="w-56 bg-white border-r border-slate-200 text-slate-700 flex flex-col justify-between shrink-0 p-3 z-10">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Operaciones de Caja
            </div>

            {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  prefetch={true}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors duration-75 border select-none ${
                    isActive
                      ? 'nav-item-active shadow-xs font-bold'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={isActive ? 'text-sky-700' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  <kbd
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isActive
                        ? 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {item.shortcut}
                  </kbd>
                </Link>
              );
            })}
          </div>

          {/* Pie del Sidebar: Usuario / Rol Activo + Cerrar Sesión */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg font-black flex items-center justify-center text-xs border ${
                isAdmin
                  ? 'bg-indigo-700 text-white border-indigo-600 shadow-xs'
                  : 'bg-sky-700 text-white border-sky-600 shadow-xs'
              }`}>
                {isAdmin ? 'AD' : 'C1'}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 leading-tight">
                  {user ? user.name : 'Iniciando...'}
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                    isAdmin ? 'text-indigo-600' : 'text-emerald-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-indigo-600' : 'bg-emerald-500'}`} />
                    {isAdmin ? 'Administrador' : 'Cajero'}
                  </span>
                  <button
                    type="button"
                    onClick={() => switchToRole(isAdmin ? 'cajero' : 'admin')}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all ${
                      isAdmin
                        ? 'text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-300'
                        : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
                    }`}
                    title={isAdmin ? 'Cambiar a modo Cajero' : 'Cambiar a modo Administrador'}
                  >
                    {isAdmin ? 'Pasar a Cajero' : 'Cambiar a Admin'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsScreenLocked(true)}
                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                title="Bloquear Pantalla de Seguridad (Ctrl+L)"
              >
                <Lock className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginDismissed(false);
                  logout();
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Cerrar Sesión / Cambiar Usuario"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Área de Trabajo */}
        <main className="flex-1 bg-slate-50 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>

      {/* Modal de Inicio de Sesión Obligatorio */}
      <LoginModal
        isOpen={!user && !isLoginDismissed}
        onSuccess={() => setIsLoginDismissed(true)}
        onClose={() => {
          setIsLoginDismissed(true);
          if (!user) switchToRole('admin');
        }}
      />

      {/* Modal de Bloqueo Rápido de Pantalla */}
      <LockScreenModal
        isOpen={isScreenLocked}
        onUnlock={() => setIsScreenLocked(false)}
      />

      {/* Modal de Confirmación de PIN de Administrador */}
      <AdminPinModal />

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
    </div>
  );
}
