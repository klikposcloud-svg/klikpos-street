'use client';

import React, { useState, useEffect } from 'react';
import { licenseManager, StoreLicense } from '@/lib/licensing/license-manager';
import { cloudBackupService, CloudBackupSnapshot } from '@/lib/backup/cloud-backup-service';

import { db } from '@/lib/db';

export default function CloudBackupDashboardPage() {
  const [license, setLicense] = useState<StoreLicense>(licenseManager.getLicense());
  const [backups, setBackups] = useState<CloudBackupSnapshot[]>([]);
  const [loadingSync, setLoadingSync] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);

  const [serialInput, setSerialInput] = useState('');

  const refreshData = () => {
    setLicense(licenseManager.getLicense());
    setBackups(cloudBackupService.getBackups());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = licenseManager.onLicenseChange((lic) => {
      setLicense(lic);
    });
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setLoadingSync(true);
    try {
      const productsCount = await db.products.count();
      const salesCount = await db.sales.count();
      const customersCount = await db.customers.count();

      const result = cloudBackupService.executeCloudSync({
        productsCount,
        salesCount,
        customersCount,
      });

      setLoadingSync(false);
      if (result.success) {
        setStatusMessage({ type: 'success', text: result.message });
        refreshData();
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch {
      setLoadingSync(false);
      setStatusMessage({ type: 'error', text: 'Error al consultar la base de datos local para la sincronización.' });
    }
  };

  const handleRedeemLicense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialInput.trim()) return;
    const res = licenseManager.redeemLicenseKey(serialInput);
    if (res.success) {
      licenseManager.setCloudSyncStatus(true);
      setStatusMessage({ type: 'success', text: res.message });
      setSerialInput('');
      refreshData();
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const isBackupAllowed = licenseManager.isCloudBackupActive();

  return (
    <div className="space-y-6 font-montserrat text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xl">
            ☁️
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
              Respaldo en la Nube (Cloud Backup)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Protección continua de inventarios, ventas, clientes y caja contra pérdidas de equipo o formateo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={loadingSync}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md ${
              isBackupAllowed
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>{loadingSync ? '⏳' : '🔄'}</span>
            <span>{loadingSync ? 'Sincronizando con la nube...' : 'Sincronizar a la Nube Ahora'}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Estado */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
          }`}
        >
          <span>{statusMessage.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Bloqueo / Paywall si la suscripción no está activa */}
      {!isBackupAllowed ? (
        <div className="bg-gradient-to-br from-red-50/70 via-white to-amber-50/50 dark:from-slate-850 dark:to-slate-800 p-6 md:p-8 rounded-3xl border-2 border-dashed border-red-300 dark:border-red-800 text-center space-y-4 shadow-md">
          <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
            🔒
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
              Respaldo en la Nube Pausado por Falta de Mensualidad
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto mt-1 leading-relaxed">
              Tus datos de productos y ventas siguen guardados de forma <strong>local</strong> en esta computadora, pero si el disco duro falla o se formatea el equipo, <strong>no habrá copia de seguridad disponible en el servidor en la nube</strong>.
            </p>
          </div>

          {/* Formulario de Activación de Serial */}
          <form onSubmit={handleRedeemLicense} className="max-w-md mx-auto space-y-2.5 pt-2">
            <input
              type="text"
              required
              placeholder="Ingresa tu Clave de Licencia Serial (VNK-...)"
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              className="w-full bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 rounded-2xl py-3 px-4 text-xs font-mono font-bold text-center text-slate-900 dark:text-white uppercase outline-none"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-extrabold py-3 rounded-2xl text-xs shadow-lg shadow-blue-500/20 active:scale-98 transition-all"
            >
              Reactivar Respaldo en la Nube ☁️
            </button>
          </form>

          <div className="text-[11px] text-slate-500 pt-2">
            ¿Deseas activar tu suscripción mensual?{' '}
            <a
              href="https://wa.me/584141234567?text=Hola,%20deseo%20activar%20el%20servicio%20de%20respaldo%20en%20la%20nube%20de%20KlikPOS"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Contactar al Administrador por WhatsApp →
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Tarjetas de Métricas de Respaldo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Estado Cloud
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  Activo y Protegido
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Suscripción SaaS al día</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Última Copia
              </span>
              <span className="text-sm font-black text-slate-800 dark:text-white mt-1 block">
                {backups.length > 0 ? new Date(backups[0].timestamp).toLocaleString('es-VE') : 'Sin copias aún'}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Sincronización en servidor seguro</p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Registros en la Nube
              </span>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1 block">
                {backups.length > 0 ? `${backups[0].recordsCount.products} Productos / ${backups[0].recordsCount.sales} Ventas` : '0 registros'}
              </span>
              <p className="text-[10px] text-slate-400 mt-1">Snapshot cifrado SHA-256</p>
            </div>
          </div>

          {/* Historial de Snapshots en la Nube */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>🗄️</span> Snapshots Disponibles para Restauración
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {backups.map((bk) => (
                <div key={bk.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-100">
                        Snapshot {new Date(bk.timestamp).toLocaleString('es-VE')}
                      </span>
                      <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Cifrado OK
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {bk.recordsCount.products} productos • {bk.recordsCount.sales} ventas • {(bk.sizeBytes / 1024).toFixed(0)} KB • ID: {bk.id}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const res = cloudBackupService.restoreSnapshot(bk.id);
                      setStatusMessage({ type: res.success ? 'success' : 'error', text: res.message });
                    }}
                    className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-bold rounded-xl transition-all self-start sm:self-auto"
                  >
                    Restaurar este Snapshot ↺
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
