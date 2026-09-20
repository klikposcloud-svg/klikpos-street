'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { licenseManager, type StoreLicense } from '@/lib/licensing/license-manager'
import { INITIAL_MARKETPLACE_STORES } from '@/lib/delivery/marketplace-engine'
import { playSuccessChime, playBeep } from '@/lib/utils/sound'
import { tokenWalletService } from '@/lib/wallet/token-wallet-service'

export default function MasterCloudLicensePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [enteredPin, setEnteredPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const [license, setLicense] = useState<StoreLicense | null>(null)
  const [daysToAdd, setDaysToAdd] = useState(30)
  const [generatedKey, setGeneratedKey] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<'free_pos' | 'pro_delivery_monthly' | 'enterprise_annual'>('pro_delivery_monthly')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    setLicense(licenseManager.getLicense())
    const unsub = licenseManager.onLicenseChange((lic) => setLicense(lic))
    return () => unsub()
  }, [])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (licenseManager.verifyMasterPIN(enteredPin)) {
      setIsAuthenticated(true)
      setPinError(false)
      playSuccessChime()
      showToast('✓ Acceso concedido al Panel Maestro de Licencias Cloud')
    } else {
      setPinError(true)
      playBeep(400, 0.2, 'sawtooth')
    }
  }

  const handleToggleDelivery = (active: boolean) => {
    licenseManager.setDeliveryModuleStatus(active, daysToAdd)
    playSuccessChime()
    showToast(active ? '✓ Módulo Delivery y D-Panas ACTIVADO' : '⚠️ Módulo Delivery BLOQUEADO')
  }

  const handleGenerateKey = () => {
    const key = licenseManager.generateLicenseKey('store_venemarket_chacao', daysToAdd >= 365 ? 12 : 1)
    setGeneratedKey(key)
    playSuccessChime()
    showToast('Clave de activación generada')
  }

  const handleExtendDays = (extraDays: number) => {
    if (!license) return
    const currentExp = new Date(license.expiresAt).getTime()
    const baseTime = currentExp > Date.now() ? currentExp : Date.now()
    const newExp = new Date(baseTime + 1000 * 60 * 60 * 24 * extraDays).toISOString()

    const updated = {
      ...license,
      status: 'active' as const,
      expiresAt: newExp,
      features: {
        ...license.features,
        deliveryHub: true,
        dpanasIntegration: true,
      }
    }
    licenseManager.saveLicense(updated)
    playSuccessChime()
    showToast(`✓ Suscripción extendida por +${extraDays} días`)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-montserrat flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-3xl p-8 w-full max-w-md border border-slate-700 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-orange-500/20">
            🔐
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-extrabold block">
              Capa Oculta • Master SaaS
            </span>
            <h1 className="text-xl font-extrabold mt-1">Control de Licencias Cloud</h1>
            <p className="text-xs text-slate-400 mt-1">
              Ingresa el PIN Maestro de Administrador del Software Venematic
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="PIN Maestro (6 dígitos)"
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value)
                  setPinError(false)
                }}
                className="w-full bg-slate-900 border-2 border-slate-700 focus:border-amber-500 rounded-2xl py-3 px-4 text-center font-mono text-xl tracking-[0.5em] text-white outline-none transition-all"
              />
              {pinError && (
                <p className="text-xs font-bold text-red-400 mt-2 animate-shake">
                  ❌ PIN incorrecto. Acceso denegado.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
            >
              Desbloquear Capa Maestra
            </button>
          </form>

          <p className="text-[10px] text-slate-500">
            PIN por defecto de desarrollo: <code className="text-amber-400 font-bold">778899</code>
          </p>
        </div>
      </div>
    )
  }

  const isDeliveryActive = licenseManager.isDeliveryActive()
  const daysRemaining = licenseManager.getDaysRemaining()

  return (
    <div className="min-h-screen bg-slate-900 text-white font-montserrat p-4 sm:p-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-amber-500/50 text-xs font-bold flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
              👑
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-extrabold">
                Super Admin Cloud Control
              </span>
              <h1 className="text-xl font-extrabold">Administrador de Licencias y Pagos Mensuales</h1>
              <p className="text-xs text-slate-400">
                Controla remotamente qué comercios tienen activo el módulo de Delivery y D-Panas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/pos"
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-xs font-bold transition-colors"
            >
              ← Volver al POS
            </Link>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded-xl text-xs font-bold border border-red-800/60 transition-colors"
            >
              Bloquear Panel 🔒
            </button>
          </div>
        </div>

        {/* Estado Actual de la Licencia del Negocio */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Estado del Módulo Delivery */}
          <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400">Módulo Delivery & D-Panas</span>
            <div className="flex items-center gap-3">
              <span className={`w-4 h-4 rounded-full ${isDeliveryActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-lg font-black">
                {isDeliveryActive ? 'ACTIVO (PAGADO)' : 'BLOQUEADO / INACTIVO'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isDeliveryActive 
                ? 'El comercio puede recibir pedidos de D-Panas y usar el despacho en el POS.' 
                : 'El comercio tiene la función apagada. No recibe pedidos online.'}
            </p>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => handleToggleDelivery(true)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  isDeliveryActive ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Activar ✓
              </button>
              <button
                onClick={() => handleToggleDelivery(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  !isDeliveryActive ? 'bg-red-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Bloquear ✕
              </button>
            </div>
          </div>

          {/* Card 2: Días Restantes y Expiración */}
          <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400">Vigencia de la Suscripción</span>
            <div className="text-2xl font-black text-amber-400">
              {daysRemaining} días restantes
            </div>
            <p className="text-xs text-slate-400">
              Vence el: <strong className="text-white">{license?.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'N/A'}</strong>
            </p>

            <div className="pt-2 flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleExtendDays(30)}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold"
              >
                +30 Días ($25)
              </button>
              <button
                onClick={() => handleExtendDays(90)}
                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold"
              >
                +3 Meses
              </button>
              <button
                onClick={() => handleExtendDays(365)}
                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold"
              >
                +1 Año
              </button>
            </div>
          </div>

          {/* Card 3: Plan y Respaldo en la Nube */}
          <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-3">
            <span className="text-[10px] uppercase font-bold text-slate-400">Respaldo en Nube (Cloud Backup)</span>
            <div className="flex items-center gap-3">
              <span className={`w-4 h-4 rounded-full ${license?.features?.cloudSync ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-lg font-black">
                {license?.features?.cloudSync ? 'RESPALDO ACTIVO' : 'SIN RESPALDO (LOCAL)'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {license?.features?.cloudSync 
                ? 'El inventario y ventas se respaldan de forma continua en la nube.' 
                : 'El respaldo está bloqueado hasta que el comercio renueve la mensualidad.'}
            </p>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  licenseManager.setCloudSyncStatus(true);
                  playSuccessChime();
                  showToast('✓ Respaldo Cloud ACTIVADO');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  license?.features?.cloudSync ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Activar Sync ✓
              </button>
              <button
                onClick={() => {
                  licenseManager.setCloudSyncStatus(false);
                  playSuccessChime();
                  showToast('⚠️ Respaldo Cloud DESACTIVADO');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  !license?.features?.cloudSync ? 'bg-red-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Pausar Sync ✕
              </button>
            </div>
          </div>
        </div>

        {/* Generador de Claves de Licencia para Clientes */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div>
              <h2 className="text-base font-extrabold">Generador de Claves de Activación (Licencias)</h2>
              <p className="text-xs text-slate-400">
                Genera un código serial para enviárselo por WhatsApp al cliente cuando te pague la mensualidad
              </p>
            </div>

            <button
              onClick={handleGenerateKey}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all"
            >
              + Generar Clave de 30 Días
            </button>
          </div>

          {generatedKey && (
            <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Clave Serial Generada:</span>
                <span className="font-mono text-base font-black text-white select-all">{generatedKey}</span>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedKey)
                  showToast('Clave copiada al portapapeles')
                }}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors"
              >
                Copiar Serial
              </button>
            </div>
          )}
        </div>

        {/* Tesorería y Calce de Reservas Financieras (Blindaje contra la Tasa de Cambio) */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-teal-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-900/60 text-teal-400 flex items-center justify-center font-bold text-xl">
                🏛️
              </div>
              <div>
                <h2 className="text-base font-extrabold text-white">Tesorería & Resguardo de Reserva 1:1</h2>
                <p className="text-xs text-slate-400">
                  Blindaje cambiario: Los tokens en circulación están 100% respaldados en valor USD real
                </p>
              </div>
            </div>

            <Link
              href="/wallet"
              target="_blank"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Abrir Billetera Pay</span>
              <span>↗</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Tokens en Circulación</span>
              <span className="text-lg font-black text-white mt-1 block">
                ${tokenWalletService.getTreasuryMetrics().totalTokensCirculatingUSD.toFixed(2)} USD
              </span>
              <span className="text-[10px] text-slate-500">Pasivo total en usuarios</span>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Reserva en Custodia</span>
              <span className="text-lg font-black text-emerald-400 mt-1 block">
                ${tokenWalletService.getTreasuryMetrics().totalReserveUSD.toFixed(2)} USD
              </span>
              <span className="text-[10px] text-emerald-500 font-bold">✓ 100% Calzado en Divisas</span>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Ganancia por Comisiones</span>
              <span className="text-lg font-black text-amber-400 mt-1 block">
                ${tokenWalletService.getTreasuryMetrics().totalPlatformFeesUSD.toFixed(2)} USD
              </span>
              <span className="text-[10px] text-slate-500">Fee 2.0% en retiros</span>
            </div>

            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-700/80">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Liquidaciones Hechas</span>
              <span className="text-lg font-black text-teal-400 mt-1 block">
                {tokenWalletService.getTreasuryMetrics().totalWithdrawalsCount} Retiros
              </span>
              <span className="text-[10px] text-slate-500">A tasa BCV del día</span>
            </div>
          </div>
        </div>

        {/* Directorio de Tiendas en la Red Cloud */}
        <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-xl space-y-4">
          <h2 className="text-base font-extrabold">Comercios en la Red Multitienda</h2>
          <div className="divide-y divide-slate-700 text-xs">
            {INITIAL_MARKETPLACE_STORES.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">{s.name}</p>
                  <p className="text-slate-400 text-[11px]">📍 {s.zone}, {s.city} • {s.businessTypeLabel}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-900/60 text-emerald-300">
                    Suscripción Activa
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
