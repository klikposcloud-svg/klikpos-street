'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { initializeDatabaseIfNeeded } from '@/lib/seed-data';
import BrandingSettings from '@/components/BrandingSettings';
import LicenseActivationModal from '@/components/LicenseActivationModal';
import CloudSyncSettingsCard from '@/components/CloudSyncSettingsCard';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert, ShieldCheck, ArrowLeft, Scale, CheckCircle2, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import Link from 'next/link';
import { scaleService, ScaleProtocol, WeightReading, PriceMultiplierBasis } from '@/lib/hardware/scale';
import { getScaleBarcodeConfig, saveScaleBarcodeConfig, ScaleBarcodeConfig } from '@/lib/hardware/scale-barcode';

export default function DesktopSettingsPage() {
  const { isAdmin, switchToRole } = useAuth();
  const [unlockPass, setUnlockPass] = useState('*2026');
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [rif, setRif] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [footerMessage, setFooterMessage] = useState('');
  const [paperWidth, setPaperWidth] = useState<'80mm' | '58mm'>('80mm');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    db.settings.get('store_info').then((s) => {
      if (s && s.value) {
        setStoreName(s.value.name || '');
        setRif(s.value.rif || '');
        setPhone(s.value.phone || '');
        setAddress(s.value.address || '');
        setFooterMessage(s.value.footerMessage || '');
      }
    });

    db.settings.get('paper_width').then((p) => {
      if (p) setPaperWidth(p.value);
    });

    db.settings.get('gemini_api_key').then((k) => {
      if (k) setGeminiApiKey(k.value);
    });
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.settings.put({
      key: 'store_info',
      value: {
        name: storeName,
        rif,
        phone,
        address,
        footerMessage,
      },
    });

    await db.settings.put({
      key: 'paper_width',
      value: paperWidth,
    });

    await db.settings.put({
      key: 'gemini_api_key',
      value: geminiApiKey.trim(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Exportar respaldo de datos local a JSON
  const handleExportBackup = async () => {
    const products = await db.products.toArray();
    const sales = await db.sales.toArray();
    const customers = await db.customers.toArray();
    const shifts = await db.cashShifts.toArray();
    const settings = await db.settings.toArray();

    const backupData = {
      version: 1,
      createdAt: new Date().toISOString(),
      products,
      sales,
      customers,
      shifts,
      settings,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `venematic-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetCatalog = async () => {
    if (!confirm('¿Desea restaurar el catálogo de productos a la configuración de prueba inicial?')) return;
    await db.products.clear();
    await initializeDatabaseIfNeeded();
    alert('Catálogo restaurado exitosamente.');
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-100 font-sans select-none">
        <div className="bg-white rounded-3xl border border-slate-300 shadow-xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-slate-900">Panel de Configuración Restringido</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            El módulo de configuración del sistema (F8), respaldos y parámetros fiscales está reservado exclusivamente para usuarios con <strong>Rol de Administrador</strong>.
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-left">
            <label className="block text-xs font-bold text-slate-700">
              Desbloquear con Clave de Administrador:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Clave (admin o *2026)"
                value={unlockPass}
                onChange={(e) => setUnlockPass(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  const ok = switchToRole('admin', unlockPass);
                  if (!ok) alert('Clave incorrecta. Claves válidas: "admin", "*2026" o "1234".');
                }}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                Desbloquear
              </button>
            </div>
            <button
              type="button"
              onClick={() => switchToRole('admin')}
              className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-xl transition-all"
            >
              ⚡ Activar Administrador con 1 Clic
            </button>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/pos"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Regresar al Punto de Venta (F1)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto bg-slate-100 font-sans">
      {/* Cabecera */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
            Configuración del Terminal de Ventas
          </h2>
          <p className="text-xs text-slate-500">
            Datos fiscales de impresión, formato de ticket térmico, marca y respaldos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowLicenseModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold transition-all shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Licenciamiento y HWID</span>
          </button>

          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg">
              ✓ Guardado
            </span>
          )}
        </div>
      </div>

      {/* Selector de Marca y Modo de Interfaz (10 Paletas + Industrial vs Glassmorphism) */}
      <BrandingSettings />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Formulario de Datos del Comercio */}
        <form
          onSubmit={handleSaveSettings}
          className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4"
        >
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2">
            Datos del Comercio (Encabezado de Ticket)
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nombre Comercial de la Tienda:
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  RIF o Cédula Fiscal:
                </label>
                <input
                  type="text"
                  required
                  value={rif}
                  onChange={(e) => setRif(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Teléfono de Contacto:
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Dirección Física:
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mensaje de Pie de Ticket:
              </label>
              <input
                type="text"
                value={footerMessage}
                onChange={(e) => setFooterMessage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ancho de Papel Térmico:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`py-2 rounded-lg border text-xs font-bold ${
                    paperWidth === '80mm'
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  80 mm (Estándar Punto)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`py-2 rounded-lg border text-xs font-bold ${
                    paperWidth === '58mm'
                      ? 'bg-sky-700 text-white border-sky-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  58 mm (Mini Térmica)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Google Vision / Gemini API Key (Reconocimiento de Fotos):</span>
                <span className="text-[10px] text-sky-600 font-normal">Opcional para auto-completar</span>
              </label>
              <input
                type="password"
                placeholder="AIzaSy... (Deja en blanco si usas variable de entorno o auto-remover local)"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Permite reconocer automáticamente el nombre, marca y categoría del producto con IA a partir de la foto tomada con la cámara.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </form>

        {/* Panel de Mantenimiento de Base de Datos y Respaldos */}
        <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-2 mb-3">
              Base de Datos Local (IndexedDB / Dexie)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Toda la información de este terminal se almacena de forma segura en el disco local de tu computadora. Puedes generar un archivo de respaldo en cualquier momento para guardarlo en un pendrive o restaurarlo.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded-lg flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Descargar Copia de Seguridad Completa (JSON)</span>
              </button>

              <button
                onClick={handleResetCatalog}
                className="w-full py-2.5 px-4 bg-white hover:bg-amber-50 border border-amber-300 text-amber-900 font-bold text-xs rounded-lg flex items-center justify-center gap-2"
              >
                <span>Recargar Catálogo Inicial de Prueba</span>
              </button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500">
            <strong>Terminal ID:</strong> POS-STANDALONE-01 <br />
            <strong>Motor:</strong> Tauri Rust Native Wrapper + Next.js Local Engine
          </div>
        </div>
      </div>

      {/* Panel de Sincronización en la Nube Firestore */}
      <CloudSyncSettingsCard />

      {/* Sección Periféricos: Balanza Electrónica Digital */}
      <DigitalScaleSettingsSection />

      {/* Sección Exclusiva Administrador: Gestión de Cajeros y Credenciales de Seguridad */}
      <CashiersManagementSection />

      {/* Modal de Licenciamiento y HWID */}
      <LicenseActivationModal
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
      />
    </div>
  );
}

function CashiersManagementSection() {
  const { cashiers, addCashier, updateCashier, deleteCashier, adminPassword, updateAdminPassword } = useAuth();
  
  // Estados para nuevo cajero
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [addError, setAddError] = useState('');

  // Estados para editar cajero
  const [editingCashier, setEditingCashier] = useState<{ id: string; name: string; username: string; pin: string } | null>(null);

  // Estados para contraseña de admin
  const [currentAdminPassInput, setCurrentAdminPassInput] = useState('');
  const [newAdminPassInput, setNewAdminPassInput] = useState('');
  const [confirmAdminPassInput, setConfirmAdminPassInput] = useState('');
  const [adminPassMsg, setAdminPassMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleCreateCashier = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!newUsername.trim() || !newName.trim() || !newPin.trim()) {
      setAddError('Por favor complete todos los campos.');
      return;
    }
    const ok = addCashier({
      username: newUsername.trim(),
      name: newName.trim(),
      pin: newPin.trim(),
    });
    if (!ok) {
      setAddError('El nombre de usuario ya está en uso o no es válido.');
      return;
    }
    setNewUsername('');
    setNewName('');
    setNewPin('');
    setShowAddModal(false);
  };

  const handleSaveEditCashier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCashier) return;
    if (!editingCashier.name.trim() || !editingCashier.pin.trim()) {
      alert('Nombre y PIN no pueden estar vacíos.');
      return;
    }
    updateCashier(editingCashier.id, {
      name: editingCashier.name.trim(),
      pin: editingCashier.pin.trim(),
    });
    setEditingCashier(null);
  };

  const handleDeleteCashier = (id: string, name: string) => {
    if (cashiers.length <= 1) {
      alert('Debe existir al menos un cajero registrado en el sistema.');
      return;
    }
    if (confirm(`¿Está seguro de eliminar al cajero "${name}"?`)) {
      deleteCashier(id);
    }
  };

  const handleChangeAdminPass = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPassMsg(null);

    if (currentAdminPassInput !== adminPassword) {
      setAdminPassMsg({ text: 'La contraseña actual del administrador es incorrecta.', isError: true });
      return;
    }

    if (!newAdminPassInput || newAdminPassInput.length < 4) {
      setAdminPassMsg({ text: 'La nueva contraseña debe tener al menos 4 caracteres.', isError: true });
      return;
    }

    if (newAdminPassInput !== confirmAdminPassInput) {
      setAdminPassMsg({ text: 'Las nuevas contraseñas no coinciden.', isError: true });
      return;
    }

    updateAdminPassword(newAdminPassInput);
    setCurrentAdminPassInput('');
    setNewAdminPassInput('');
    setConfirmAdminPassInput('');
    setAdminPassMsg({ text: 'Contraseña de administrador actualizada con éxito.', isError: false });
    setTimeout(() => setAdminPassMsg(null), 4000);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Gestión de Cajeros y Credenciales de Acceso
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Administre las cuentas de cajeros que pueden operar el punto de venta y actualice la contraseña maestra de administración.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setAddError('');
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Agregar Cajero</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de Cajeros */}
        <div className="lg:col-span-2 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Cajeros Autorizados ({cashiers.length})
          </h4>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Nombre</th>
                  <th className="py-2.5 px-3">Usuario (Login)</th>
                  <th className="py-2.5 px-3">PIN / Clave</th>
                  <th className="py-2.5 px-3">Rol Asignado</th>
                  <th className="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashiers.map((cashier) => (
                  <tr key={cashier.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {cashier.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-sky-700 font-bold">
                      {cashier.username}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      •••• ({cashier.pin})
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        Cajero / Ventas
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingCashier({ ...cashier })}
                        className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-sky-700 hover:bg-sky-50 rounded border border-slate-300 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCashier(cashier.id, cashier.name)}
                        disabled={cashiers.length <= 1}
                        title={cashiers.length <= 1 ? 'Debe haber al menos un cajero' : 'Eliminar cajero'}
                        className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded border border-rose-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            * Los cajeros pueden ingresar con su nombre de usuario y PIN para emitir tickets y agregar nuevos productos con fotos, pero requieren autorización de administrador para modificar precios, editar catálogo o borrar datos.
          </p>
        </div>

        {/* Tarjeta: Cambiar Contraseña de Administrador */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
          <form onSubmit={handleChangeAdminPass} className="space-y-3">
            <div className="border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Clave Administrador
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Usuario fijo: <strong className="font-mono text-slate-700">admin</strong>
              </p>
            </div>

            {adminPassMsg && (
              <div
                className={`p-2 rounded text-[11px] font-bold ${
                  adminPassMsg.isError
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                {adminPassMsg.text}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contraseña Actual:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ej: *2026"
                  value={currentAdminPassInput}
                  onChange={(e) => setCurrentAdminPassInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nueva Contraseña:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres"
                  value={newAdminPassInput}
                  onChange={(e) => setNewAdminPassInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirmar Nueva:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repita la nueva contraseña"
                  value={confirmAdminPassInput}
                  onChange={(e) => setConfirmAdminPassInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
              >
                Actualizar Clave Maestra
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal: Agregar Nuevo Cajero */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                Registrar Nuevo Cajero
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {addError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-700">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateCashier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre Completo del Cajero:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: María González"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre de Usuario (para Login):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: maria / caja2"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PIN o Contraseña de Acceso:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 5678"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Guardar Cajero
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Cajero */}
      {editingCashier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">
                Editar Cajero: <span className="text-sky-700">{editingCashier.username}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCashier(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveEditCashier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre Completo:
                </label>
                <input
                  type="text"
                  required
                  value={editingCashier.name}
                  onChange={(e) => setEditingCashier({ ...editingCashier, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Usuario (No editable):
                </label>
                <input
                  type="text"
                  disabled
                  value={editingCashier.username}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  PIN o Contraseña:
                </label>
                <input
                  type="text"
                  required
                  value={editingCashier.pin}
                  onChange={(e) => setEditingCashier({ ...editingCashier, pin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCashier(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Actualizar Credenciales
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DigitalScaleSettingsSection() {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [protocol, setProtocol] = useState<ScaleProtocol>('torrey');
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [autoWeight, setAutoWeight] = useState<boolean>(true);
  const [defaultInputUnit, setDefaultInputUnit] = useState<'g' | 'kg'>('g');
  const [priceBasis, setPriceBasis] = useState<PriceMultiplierBasis>('1kg');
  const [manualWeightPrompt, setManualWeightPrompt] = useState<boolean>(true);
  const [barcodeScaleConfig, setBarcodeScaleConfig] = useState<ScaleBarcodeConfig>(getScaleBarcodeConfig());
  const [currentReading, setCurrentReading] = useState<WeightReading>({
    weight: 0,
    unit: 'kg',
    isStable: true,
    raw: '',
    timestamp: Date.now(),
  });
  const [connecting, setConnecting] = useState(false);
  const [connError, setConnError] = useState<string | null>(null);
  const [connSuccess, setConnSuccess] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(scaleService.isSupported());
    setIsConnected(scaleService.isConnected());
    const cfg = scaleService.getConfig();
    setProtocol(cfg.protocol);
    setBaudRate(cfg.baudRate);
    setAutoWeight(cfg.autoWeight);
    setDefaultInputUnit(cfg.defaultInputUnit || 'g');
    setPriceBasis(cfg.priceBasis || '1kg');
    setManualWeightPrompt(cfg.manualWeightPrompt !== false);
    setBarcodeScaleConfig(getScaleBarcodeConfig());

    const unsub = scaleService.onWeightChange((reading) => {
      setCurrentReading(reading);
      setIsConnected(scaleService.isConnected());
    });

    return () => unsub();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setConnError(null);
    setConnSuccess(null);
    const res = await scaleService.connect({
      protocol,
      baudRate,
      autoWeight,
      enabled: true,
    });
    setConnecting(false);
    if (!res.success) {
      setConnError(res.error || 'No se pudo conectar a la balanza.');
    } else {
      setIsConnected(true);
      setConnSuccess('✓ Balanza conectada exitosamente al puerto serial.');
      setTimeout(() => setConnSuccess(null), 4000);
    }
  };

  const handleDisconnect = async () => {
    await scaleService.disconnect();
    setIsConnected(false);
  };

  const handleProtocolChange = (p: ScaleProtocol) => {
    setProtocol(p);
    scaleService.saveConfig({ protocol: p });
  };

  const handleBaudRateChange = (b: number) => {
    setBaudRate(b);
    scaleService.saveConfig({ baudRate: b });
  };

  const handleAutoWeightToggle = (val: boolean) => {
    setAutoWeight(val);
    scaleService.saveConfig({ autoWeight: val });
  };

  const handleDefaultInputUnitChange = (u: 'g' | 'kg') => {
    setDefaultInputUnit(u);
    scaleService.saveConfig({ defaultInputUnit: u });
  };

  const handlePriceBasisChange = (b: PriceMultiplierBasis) => {
    setPriceBasis(b);
    scaleService.saveConfig({ priceBasis: b });
  };

  const handleManualWeightPromptToggle = (val: boolean) => {
    setManualWeightPrompt(val);
    scaleService.saveConfig({ manualWeightPrompt: val });
  };

  const handleBarcodeConfigUpdate = (partial: Partial<ScaleBarcodeConfig>) => {
    const updated = saveScaleBarcodeConfig(partial);
    setBarcodeScaleConfig(updated);
  };

  const handleSimulate = (kg: number) => {
    scaleService.simulateWeight(kg);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-500" />
            <span>Periféricos: Balanza Electrónica de Mostrador</span>
            {isConnected ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                Conectada
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-300">
                Desconectada
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Conecte su balanza comercial (Torrey, CAS, Toledo, Systel) por puerto USB o Serial RS-232 para pesaje automático en el Punto de Venta.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              type="button"
              onClick={handleDisconnect}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-sm transition-all"
            >
              Desconectar Balanza
            </button>
          ) : (
            <button
              type="button"
              disabled={connecting}
              onClick={handleConnect}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black text-xs rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{connecting ? 'Conectando...' : 'Conectar Balanza (Puerto COM)'}</span>
            </button>
          )}
        </div>
      </div>

      {connError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{connError}</span>
        </div>
      )}

      {connSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{connSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visualizador Digital tipo Display de Balanza */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-lg text-white">
          <div className="flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
            <span>DISPLAY DE BALANZA</span>
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${currentReading.isStable ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              {currentReading.isStable ? 'ESTABLE' : 'PESANDO'}
            </span>
          </div>

          <div className="py-6 text-center">
            <span className="text-5xl font-black font-mono tracking-tighter text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.35)] tabular-numbers">
              {currentReading.weight.toFixed(3)}
            </span>
            <span className="text-xl font-bold font-mono text-emerald-500 ml-2">
              {currentReading.unit}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>Trama Cruda:</span>
              <span className="text-slate-200 truncate max-w-[160px]">{currentReading.raw || '---'}</span>
            </div>

            {/* Simulador para pruebas sin balanza física */}
            <div className="pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Simular Peso para Pruebas:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[0.25, 0.5, 1.25, 0].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleSimulate(w)}
                    className="py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono text-[11px] font-bold rounded border border-slate-700"
                  >
                    {w > 0 ? `${w}kg` : '0 kg'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Protocolo y Comunicación */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Protocolo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Protocolo / Marca de Balanza:
              </label>
              <select
                value={protocol}
                onChange={(e) => handleProtocolChange(e.target.value as ScaleProtocol)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="torrey">Torrey (L-EQ / PCR / MFQ)</option>
                <option value="cas">CAS (PD-II / AP-1 / ER-Plus)</option>
                <option value="toledo">Toledo (8217 / Viva / Mettler)</option>
                <option value="systel">Systel (Croma / Clima / Brio)</option>
                <option value="generic">Genérico Continuo (Cualquier balanza Serial)</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                Ajusta el intérprete de tramas según el modelo conectado a tu puerto USB o COM.
              </p>
            </div>

            {/* Baudios */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Velocidad de Transmisión (Baud Rate):
              </label>
              <select
                value={baudRate}
                onChange={(e) => handleBaudRateChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value={9600}>9600 baudios (Estándar)</option>
                <option value={4800}>4800 baudios</option>
                <option value={2400}>2400 baudios</option>
                <option value={19200}>19200 baudios</option>
                <option value={115200}>115200 baudios</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">
                La mayoría de balanzas de mostrador operan a 9600 baudios, 8 bits, sin paridad.
              </p>
            </div>
          </div>

          {/* Opciones de Operación y Balanza Manual */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>Balanza de Mostrador Sin Cable / Entrada Manual</span>
              <span className="text-[10px] font-normal text-slate-500 normal-case">Configuración para cajeros</span>
            </h4>

            {/* Unidad preferida */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unidad de Entrada Predeterminada:
                </label>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => handleDefaultInputUnitChange('g')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      defaultInputUnit === 'g'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Gramos (g)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDefaultInputUnitChange('kg')}
                    className={`flex-1 py-1.5 rounded-md transition-all ${
                      defaultInputUnit === 'kg'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kilogramos (kg)
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Si eliges Gramos, el cajero digita números enteros (ej: "250" g) en lugar de decimales ("0.250" kg).
                </p>
              </div>

              {/* Múltiplo de Precio Base */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Base del Múltiplo de Precios (Pesables):
                </label>
                <select
                  value={priceBasis}
                  onChange={(e) => handlePriceBasisChange(e.target.value as PriceMultiplierBasis)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="1kg">Por Kilo (1000g) — Estándar Supermercado</option>
                  <option value="100g">Por 100 Gramos — Charcutería / Delicatesses</option>
                  <option value="1g">Por 1 Gramo — Especias y Productos Finos</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Define la fórmula de cálculo del precio según cómo fijas el precio unitario en tu inventario.
                </p>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualWeightPrompt}
                  onChange={(e) => handleManualWeightPromptToggle(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Abrir Ingreso Manual al Tocar un Producto Vendido por Peso
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Si no hay una balanza conectada al computador por cable, muestra la calculadora de gramos/kilos de inmediato.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoWeight}
                  onChange={(e) => handleAutoWeightToggle(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Captura Automática de Puerto Serial (Balanza Conectada)
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Al tener balanza física por USB/COM, toma el peso vivo del plato automáticamente.
                  </span>
                </div>
              </label>
            </div>

            {/* Configuración de Etiquetas EAN-13 GS1 de Balanzas Imprimibles */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <span>Etiquetas de Balanzas Imprimibles (EAN-13 GS1)</span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Decodificador Activo
                    </span>
                  </h5>
                  <p className="text-[11px] text-slate-500">
                    Permite escanear tickets adhesivos con código de barras impresos por balanzas de charcutería, carnicería y supermercado.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={barcodeScaleConfig.enabled}
                    onChange={(e) => handleBarcodeConfigUpdate({ enabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-700">Habilitado</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Prefijos de Peso Variable:
                  </label>
                  <input
                    type="text"
                    value={barcodeScaleConfig.weightPrefixes.join(', ')}
                    onChange={(e) => {
                      const prefixes = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      handleBarcodeConfigUpdate({ weightPrefixes: prefixes });
                    }}
                    placeholder="20, 22, 24"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Estándar: 20, 22 (gramos entre 1000)</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Prefijos de Precio / Importe:
                  </label>
                  <input
                    type="text"
                    value={barcodeScaleConfig.pricePrefixes.join(', ')}
                    onChange={(e) => {
                      const prefixes = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      handleBarcodeConfigUpdate({ pricePrefixes: prefixes });
                    }}
                    placeholder="21, 23"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Estándar: 21 (monto total fijado en balanza)</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Longitud del Código PLU:
                  </label>
                  <select
                    value={barcodeScaleConfig.pluLength}
                    onChange={(e) => handleBarcodeConfigUpdate({ pluLength: Number(e.target.value) as 4 | 5 })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                  >
                    <option value={4}>4 Dígitos (20 + PPPP + VVVVV + C)</option>
                    <option value={5}>5 Dígitos (20 + PPPPP + VVVV + C)</option>
                  </select>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Estructura interna de la balanza</span>
                </div>
              </div>

              {/* Ejemplo en vivo */}
              <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] flex flex-wrap items-center justify-between gap-2 border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">Ejemplo:</span>
                  <span className="text-amber-300 font-black">20</span>
                  <span className="text-sky-300 font-black">0123</span>
                  <span className="text-emerald-400 font-black">00450</span>
                  <span className="text-slate-400">8</span>
                </div>
                <div className="text-[10px] text-slate-300 flex gap-2">
                  <span>PLU: <b className="text-sky-300">0123</b></span>
                  <span>·</span>
                  <span>Peso: <b className="text-emerald-400">0.450 kg (450g)</b></span>
                  <span>·</span>
                  <span className="text-amber-300 font-bold">¡Auto-liquidado!</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
            💡 <strong>Consejo Comercial:</strong> Si tu negocio cuenta con balanza digital de mostrador que no tiene cable al PC, utiliza el botón <strong>"Fijar Peso"</strong> en la barra superior del Punto de Venta para digitar los gramos o kilos en pantalla rápidamente con los botones preajustados (100g, 250g, 500g, 1kg), o escanea directamente las etiquetas impresas de peso variable (EAN-13).
          </div>
        </div>
      </div>
    </div>
  );
}

