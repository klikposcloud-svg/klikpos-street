'use client';

import React, { useState, useEffect } from 'react';
import { db, LocalCustomer, CustomerCreditPayment } from '@/lib/db';
import { formatUSD, formatVES } from '@/lib/formatters';
import { soundEffects } from '@/lib/utils/sound';
import { Users, DollarSign, CreditCard, CheckCircle2, History, PlusCircle } from 'lucide-react';

export default function DesktopCustomersPage() {
  const [customers, setCustomers] = useState<LocalCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State Nuevo Cliente
  const [docId, setDocId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creditLimitUSD, setCreditLimitUSD] = useState('100');

  // Modal de Abonos / Cobro de Deuda
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<LocalCustomer | null>(null);
  const [paymentAmountUSD, setPaymentAmountUSD] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_usd' | 'cash_ves' | 'pago_movil' | 'zelle' | 'transfer'>('pago_movil');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [bcvRate, setBcvRate] = useState(848.55);

  // Historial de abonos
  const [paymentHistory, setPaymentHistory] = useState<CustomerCreditPayment[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCustomers = async () => {
    const list = await db.customers.toArray();
    setCustomers(list);
  };

  const loadHistory = async (customerId: number) => {
    const history = await db.customerCreditPayments
      .where('customerId')
      .equals(customerId)
      .reverse()
      .sortBy('createdAt');
    setPaymentHistory(history);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docId || !name) return;

    const limit = parseFloat(creditLimitUSD) || 0;

    await db.customers.add({
      docId,
      name,
      phone,
      address,
      currentCreditUSD: 0,
      creditLimitUSD: limit,
      currentDebtUSD: 0,
      createdAt: new Date().toISOString(),
    });

    setDocId('');
    setName('');
    setPhone('');
    setAddress('');
    setCreditLimitUSD('100');
    setShowAddModal(false);
    showToast('Cliente registrado con cupo de crédito.');
    loadCustomers();
  };

  const handleOpenPaymentModal = (c: LocalCustomer) => {
    setSelectedCustomerForPayment(c);
    setPaymentAmountUSD((c.currentDebtUSD || 0).toFixed(2));
    setPaymentReference('');
    setPaymentNotes('');
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerForPayment || !selectedCustomerForPayment.id) return;

    const amount = parseFloat(paymentAmountUSD);
    if (isNaN(amount) || amount <= 0) {
      alert('Por favor ingrese un monto válido mayor a 0');
      return;
    }

    const currentDebt = selectedCustomerForPayment.currentDebtUSD || 0;
    const newDebt = Math.max(0, currentDebt - amount);
    const amountVES = amount * bcvRate;

    // Registrar en tabla customerCreditPayments
    await db.customerCreditPayments.add({
      customerId: selectedCustomerForPayment.id,
      customerDoc: selectedCustomerForPayment.docId,
      customerName: selectedCustomerForPayment.name,
      amountUSD: amount,
      amountVES: amountVES,
      bcvRate: bcvRate,
      method: paymentMethod,
      reference: paymentReference || undefined,
      notes: paymentNotes || undefined,
      cashierName: 'caja-1',
      timestamp: new Date().toISOString(),
    });

    // Actualizar deuda del cliente
    await db.customers.update(selectedCustomerForPayment.id, {
      currentDebtUSD: newDebt,
      currentCreditUSD: newDebt,
    });

    soundEffects.success();
    showToast(`Abono de ${formatUSD(amount)} (${formatVES(amountVES)}) procesado exitosamente.`);
    setSelectedCustomerForPayment(null);
    loadCustomers();
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.docId.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const totalDebtUSD = customers.reduce((acc, c) => acc + (c.currentDebtUSD || 0), 0);

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden bg-[var(--industrial-bg,#ffffff)] font-sans">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabecera */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-700" />
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
              Directorio de Clientes & Cuentas por Cobrar (Fiado)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Control de clientes frecuentes, límites de fiado, saldos pendientes y registro de abonos
          </p>
        </div>

        {/* Resumen Cartera */}
        <div className="flex items-center gap-4 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-amber-800 block">Total en la Calle (Fiado)</span>
            <span className="font-mono font-black text-amber-900 text-sm">{formatUSD(totalDebtUSD)}</span>
            <span className="text-[10px] text-amber-700 block font-mono">≈ {formatVES(totalDebtUSD * bcvRate)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por cédula, RIF o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Tabla de Clientes */}
      <div className="flex-1 bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px] sticky top-0">
              <tr>
                <th className="py-3 px-4">Cédula / RIF</th>
                <th className="py-3 px-4">Nombre / Razón Social</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4 text-right">Límite Fiado</th>
                <th className="py-3 px-4 text-right">Saldo Deudor</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => {
                const debt = c.currentDebtUSD || 0;
                const limit = c.creditLimitUSD || 0;
                const hasDebt = debt > 0.01;

                return (
                  <tr key={c.id} className={`hover:bg-slate-50 transition-colors ${hasDebt ? 'bg-amber-50/40' : ''}`}>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {c.docId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{c.address || 'Sin dirección'}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {c.phone || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-600">
                      {formatUSD(limit)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasDebt ? (
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            {formatUSD(debt)}
                          </span>
                          <span className="block text-[10px] font-mono text-rose-600">
                            {formatVES(debt * bcvRate)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-bold font-mono text-xs">Al día ($0.00)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenPaymentModal(c)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1 ${
                            hasDebt
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          }`}
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>Abonar</span>
                        </button>

                        <button
                          onClick={async () => {
                            if (c.id) {
                              await loadHistory(c.id);
                              setSelectedCustomerForPayment(c);
                              setShowHistoryModal(true);
                            }
                          }}
                          className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                          title="Ver historial de pagos de deuda"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Abono / Pagar Deuda */}
      {selectedCustomerForPayment && !showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Registrar Abono / Cancelación de Deuda</h3>
                <p className="text-xs text-slate-500">{selectedCustomerForPayment.name} ({selectedCustomerForPayment.docId})</p>
              </div>
              <button
                onClick={() => setSelectedCustomerForPayment(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            {/* Saldo Actual */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex justify-between items-center">
              <span className="text-xs font-bold text-rose-800">Deuda Pendiente Actual:</span>
              <div className="text-right">
                <span className="font-mono font-black text-rose-900 text-base">
                  {formatUSD(selectedCustomerForPayment.currentDebtUSD || 0)}
                </span>
                <span className="block text-[10px] font-mono text-rose-700">
                  ≈ {formatVES((selectedCustomerForPayment.currentDebtUSD || 0) * bcvRate)}
                </span>
              </div>
            </div>

            <form onSubmit={handleRegisterPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Monto a Abonar en Dólares (USD):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-mono font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    autoFocus
                    value={paymentAmountUSD}
                    onChange={(e) => setPaymentAmountUSD(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                {paymentAmountUSD && !isNaN(parseFloat(paymentAmountUSD)) && (
                  <p className="text-[11px] font-mono text-slate-500 mt-1">
                    Equivalente en Bs: {formatVES(parseFloat(paymentAmountUSD) * bcvRate)} (Tasa {formatVES(bcvRate)})
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Método de Pago:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="pago_movil">Pago Móvil (VES)</option>
                  <option value="cash_usd">Efectivo Dólares (USD)</option>
                  <option value="cash_ves">Efectivo Bolívares (VES)</option>
                  <option value="zelle">Zelle (USD)</option>
                  <option value="transfer">Transferencia Bancaria</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Número de Referencia / Comprobante:
                </label>
                <input
                  type="text"
                  placeholder="Últimos 4 dígitos o referencia bancaria"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nota u Observación (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej: Abono parcial semana 38"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerForPayment(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrar Abono</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial de Pagos de Crédito */}
      {showHistoryModal && selectedCustomerForPayment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Historial de Abonos Recibidos</h3>
                <p className="text-xs text-slate-500">{selectedCustomerForPayment.name} ({selectedCustomerForPayment.docId})</p>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedCustomerForPayment(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {paymentHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No hay abonos registrados para este cliente aún.
                </div>
              ) : (
                paymentHistory.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 capitalize">
                        {p.method.replace('_', ' ')} {p.reference ? `(Ref: ${p.reference})` : ''}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(p.timestamp).toLocaleString()} {p.notes ? `• ${p.notes}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-700">+{formatUSD(p.amountUSD)}</div>
                      <div className="font-mono text-[10px] text-slate-500">+{formatVES(p.amountVES)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedCustomerForPayment(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-300 w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Registrar Nuevo Cliente</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cédula o RIF:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej: V-18456123 o J-40123456-1"
                  value={docId}
                  onChange={(e) => setDocId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre Completo o Razón Social:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: María Rodríguez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Teléfono de Contacto:
                  </label>
                  <input
                    type="tel"
                    placeholder="0412-1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Límite Fiado (USD):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="100.00"
                    value={creditLimitUSD}
                    onChange={(e) => setCreditLimitUSD(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dirección:
                </label>
                <input
                  type="text"
                  placeholder="Calle o sector"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 rounded-lg border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
