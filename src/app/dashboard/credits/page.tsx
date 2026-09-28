'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Send,
  Plus,
  ArrowUpRight,
  Search,
  FileText,
  Calendar,
  Phone,
  UserCheck,
  TrendingUp,
  Receipt,
  X
} from 'lucide-react';
import { FeatureGate } from '@/components/FeatureGate';
import { financialDB, CustomerCreditRecord } from '@/lib/db/financial-db';

export default function CreditsPage() {
  const [credits, setCredits] = useState<CustomerCreditRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [bcvRate, setBcvRate] = useState<number>(45.50);
  
  // Modals
  const [showNewCreditModal, setShowNewCreditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerCrmModal, setShowCustomerCrmModal] = useState(false);
  
  const [selectedCredit, setSelectedCredit] = useState<CustomerCreditRecord | null>(null);
  const [paymentAmountUSD, setPaymentAmountUSD] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pago_movil');
  const [paymentReference, setPaymentReference] = useState('');

  // New Credit Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDocId, setCustomerDocId] = useState('');
  const [initialAmountUSD, setInitialAmountUSD] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [itemsSummary, setItemsSummary] = useState('');

  useEffect(() => {
    loadData();
    // Obtener tasa BCV guardada
    try {
      const savedRate = localStorage.getItem('klikpos_bcv_rate');
      if (savedRate) {
        const parsed = parseFloat(savedRate);
        if (parsed > 0) setBcvRate(parsed);
      }
    } catch {}
  }, []);

  const loadData = () => {
    const list = financialDB.getCredits();
    if (list.length === 0) {
      // Sembrar datos de prueba si está vacío para visualización inmediata
      seedInitialCredits();
    } else {
      setCredits(list);
    }
  };

  const seedInitialCredits = () => {
    const sample1 = financialDB.saveCredit({
      customerId: 'cli_01',
      customerName: 'Dra. Carmen Rodríguez',
      customerPhone: '04141234567',
      customerDocId: 'V-14589320',
      saleId: 'sale_901',
      ticketNumber: 'FAC-00428',
      initialAmountUSD: 45.00,
      bcvRateAtSale: bcvRate,
      dateIssued: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      itemsSummary: '2x Harina PAN, 1x Queso Paisa 500g, 1x Jamón Cocido',
    });
    const sample2 = financialDB.saveCredit({
      customerId: 'cli_02',
      customerName: 'Ing. Roberto Hernández',
      customerPhone: '04249876543',
      customerDocId: 'V-18765432',
      saleId: 'sale_902',
      ticketNumber: 'FAC-00435',
      initialAmountUSD: 120.00,
      bcvRateAtSale: bcvRate,
      dateIssued: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      itemsSummary: 'Combo Asado Familiar, 2x Refresco 2L, 1x Ron Santa Teresa',
    });
    setCredits([sample1, sample2]);
  };

  const handleCreateCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !initialAmountUSD) return;

    const amount = parseFloat(initialAmountUSD);
    if (isNaN(amount) || amount <= 0) return;

    const newRecord = financialDB.saveCredit({
      customerId: `cli_${Date.now()}`,
      customerName,
      customerPhone: customerPhone || '04140000000',
      customerDocId: customerDocId || 'V-00000000',
      saleId: `sale_${Date.now()}`,
      ticketNumber: `FAC-${Math.floor(1000 + Math.random() * 9000)}`,
      initialAmountUSD: amount,
      bcvRateAtSale: bcvRate,
      dateIssued: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      itemsSummary: itemsSummary || 'Consumo en tienda / Mercancía general',
    });

    setCredits(prev => [newRecord, ...prev]);
    setShowNewCreditModal(false);
    // Limpiar
    setCustomerName('');
    setCustomerPhone('');
    setCustomerDocId('');
    setInitialAmountUSD('');
    setItemsSummary('');
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredit || !paymentAmountUSD) return;

    const amount = parseFloat(paymentAmountUSD);
    if (isNaN(amount) || amount <= 0) return;

    const updated = financialDB.registerCreditPayment(selectedCredit.id, {
      amountUSD: amount,
      amountVES: amount * bcvRate,
      bcvRate: bcvRate,
      method: paymentMethod,
      reference: paymentReference || undefined,
    });

    if (updated) {
      setCredits(prev => prev.map(c => c.id === updated.id ? updated : c));
    }
    setShowPaymentModal(false);
    setSelectedCredit(null);
    setPaymentAmountUSD('');
    setPaymentReference('');
  };

  const sendWhatsAppReminder = (credit: CustomerCreditRecord) => {
    const rawPhone = credit.customerPhone.replace(/\D/g, '');
    let formattedPhone = rawPhone;
    if (rawPhone.startsWith('0')) {
      formattedPhone = '58' + rawPhone.substring(1);
    } else if (!rawPhone.startsWith('58') && rawPhone.length === 10) {
      formattedPhone = '58' + rawPhone;
    }

    const pendingBs = (credit.remainingAmountUSD * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const pendingUSD = credit.remainingAmountUSD.toFixed(2);
    
    const message = `👋 Hola estimado(a) *${credit.customerName}*,\n\nLe saludamos cordialmente de *KlikPOS*. Le recordamos amablemente su estado de cuenta pendiente:\n\n📄 *Ticket/Factura:* ${credit.ticketNumber}\n💰 *Saldo Pendiente:* $${pendingUSD} USD (o Bs. ${pendingBs} a Tasa BCV: ${bcvRate.toFixed(2)})\n📅 *Vencimiento:* ${credit.dueDate}\n\nPuede abonar vía Pago Móvil, Zelle o en efectivo en nuestra tienda. ¡Muchas gracias por su preferencia! ✨`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${formattedPhone}?text=${encoded}`, '_blank');
  };

  // Cálculos de métricas
  const totalPendingUSD = credits.reduce((acc, c) => acc + (c.status !== 'pagado' ? c.remainingAmountUSD : 0), 0);
  const totalPendingVES = totalPendingUSD * bcvRate;
  const activeDebtorsCount = credits.filter(c => c.status !== 'pagado').length;
  const totalPaidMonthUSD = credits.reduce((acc, c) => {
    return acc + c.payments.reduce((pAcc, p) => pAcc + p.amountUSD, 0);
  }, 0);

  const filteredCredits = credits.filter(c => {
    const matchesSearch = c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.customerDocId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterStatus === 'todos') return matchesSearch;
    return matchesSearch && c.status === filterStatus;
  });

  return (
    <FeatureGate flag="credit_management" featureName="Módulo de Cuentas por Cobrar & CRM de Créditos">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header con botón de nuevo crédito */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <CreditCard className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Cuentas por Cobrar & Créditos (Fiados)</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Control de saldos de clientes, límites de financiamiento y cobranza automatizada vía WhatsApp a Tasa BCV.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewCreditModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Nuevo Fiado / Crédito
            </button>
          </div>
        </div>

        {/* Métricas Top KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total por Cobrar (USD)</p>
              <h3 className="text-2xl font-black text-slate-900">${totalPendingUSD.toFixed(2)}</h3>
              <p className="text-xs font-medium text-amber-700 mt-0.5">Bs. {totalPendingVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Clientes con Saldo</p>
              <h3 className="text-2xl font-black text-slate-900">{activeDebtorsCount} Clientes</h3>
              <p className="text-xs font-medium text-slate-600 mt-0.5">Cuentas activas en libro</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cobrado este Mes</p>
              <h3 className="text-2xl font-black text-slate-900">${totalPaidMonthUSD.toFixed(2)}</h3>
              <p className="text-xs font-medium text-emerald-700 mt-0.5">Abonos recibidos</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tasa BCV Aplicada</p>
              <h3 className="text-2xl font-black text-slate-900">Bs. {bcvRate.toFixed(2)}</h3>
              <p className="text-xs font-medium text-purple-700 mt-0.5">Conversión en vivo</p>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por cliente, cédula o ticket..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            {['todos', 'pendiente', 'parcial', 'pagado'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                  filterStatus === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de Créditos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Cliente</th>
                  <th className="px-5 py-3.5">Ticket</th>
                  <th className="px-5 py-3.5">Monto Inicial</th>
                  <th className="px-5 py-3.5">Saldo Pendiente</th>
                  <th className="px-5 py-3.5">Vencimiento</th>
                  <th className="px-5 py-3.5">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCredits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-600">
                      No se encontraron registros de créditos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredCredits.map((credit) => {
                    const isOverdue = new Date(credit.dueDate) < new Date() && credit.status !== 'pagado';
                    const pendingBs = credit.remainingAmountUSD * bcvRate;

                    return (
                      <tr key={credit.id} className="hover:bg-slate-50 transition">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{credit.customerName}</div>
                          <div className="text-xs text-slate-500">{credit.customerDocId} • {credit.customerPhone}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-800 font-semibold">{credit.ticketNumber}</span>
                          <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[160px]">{credit.itemsSummary}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">${credit.initialAmountUSD.toFixed(2)}</div>
                          <div className="text-xs text-slate-500">Emisión: {credit.dateIssued}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900 text-base">${credit.remainingAmountUSD.toFixed(2)}</div>
                          <div className="text-xs text-indigo-700 font-semibold">Bs. {pendingBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className={`text-xs font-bold ${isOverdue ? 'text-red-600 flex items-center gap-1' : 'text-slate-700'}`}>
                            {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                            {credit.dueDate}
                          </div>
                          <div className="text-[11px] text-slate-500">{isOverdue ? 'Vencido' : 'En plazo'}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                            credit.status === 'pagado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : credit.status === 'parcial'
                              ? 'bg-blue-100 text-blue-800'
                              : isOverdue
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {credit.status === 'pagado' ? 'Pagado' : isOverdue ? 'Vencido' : credit.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {credit.status !== 'pagado' && (
                              <>
                                <button
                                  onClick={() => sendWhatsAppReminder(credit)}
                                  title="Enviar recordatorio por WhatsApp"
                                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCredit(credit);
                                    setPaymentAmountUSD(credit.remainingAmountUSD.toString());
                                    setShowPaymentModal(true);
                                  }}
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition"
                                >
                                  Abonar
                                </button>
                              </>
                            )}
                            {credit.payments.length > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedCredit(credit);
                                  setShowCustomerCrmModal(true);
                                }}
                                title="Ver historial de abonos"
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Registrar Nuevo Fiado / Crédito */}
        {showNewCreditModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Plus className="w-5 h-5" />
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">Registrar Fiado / Crédito</h3>
                </div>
                <button
                  onClick={() => setShowNewCreditModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCredit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo del Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Carmen Rodríguez"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cédula / RIF</label>
                    <input
                      type="text"
                      placeholder="V-12345678"
                      value={customerDocId}
                      onChange={e => setCustomerDocId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono WhatsApp</label>
                    <input
                      type="text"
                      placeholder="04141234567"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monto Total ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="45.00"
                      value={initialAmountUSD}
                      onChange={e => setInitialAmountUSD(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fecha Límite Pago</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Resumen de Productos / Concepto</label>
                  <textarea
                    rows={2}
                    placeholder="Ej: 2x Harina PAN, 1x Aceite Mazeite, Queso 1kg"
                    value={itemsSummary}
                    onChange={e => setItemsSummary(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewCreditModal(false)}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                  >
                    Guardar Crédito
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Abonar / Pagar Deuda */}
        {showPaymentModal && selectedCredit && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Registrar Abono</h3>
                  <p className="text-xs text-slate-600 mt-0.5">Cliente: <span className="font-bold text-slate-900">{selectedCredit.customerName}</span></p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterPayment} className="mt-5 space-y-4">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                  <p className="text-xs uppercase font-bold text-indigo-600">Saldo Pendiente Actual</p>
                  <p className="text-2xl font-black text-indigo-950 mt-1">${selectedCredit.remainingAmountUSD.toFixed(2)} USD</p>
                  <p className="text-xs font-semibold text-indigo-700 mt-0.5">Bs. {(selectedCredit.remainingAmountUSD * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} (Tasa: {bcvRate.toFixed(2)})</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monto a Abonar ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedCredit.remainingAmountUSD}
                    required
                    value={paymentAmountUSD}
                    onChange={e => setPaymentAmountUSD(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {paymentAmountUSD && !isNaN(parseFloat(paymentAmountUSD)) && (
                    <p className="text-xs text-slate-700 font-bold mt-1">
                      Equivalente: Bs. {(parseFloat(paymentAmountUSD) * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Método de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pago_movil">Pago Móvil (Bs.)</option>
                    <option value="efectivo_usd">Efectivo ($ USD)</option>
                    <option value="efectivo_ves">Efectivo (Bs.)</option>
                    <option value="zelle">Zelle ($ USD)</option>
                    <option value="punto_debito">Punto de Venta / Débito</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Referencia Bancaria / Comprobante</label>
                  <input
                    type="text"
                    placeholder="Últimos 4 dígitos o # comprobante"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                  >
                    Confirmar Abono
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Historial CRM de Abonos del Cliente */}
        {showCustomerCrmModal && selectedCredit && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Historial de Pagos y Abonos</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedCredit.customerName} • {selectedCredit.ticketNumber}</p>
                </div>
                <button
                  onClick={() => setShowCustomerCrmModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
                {selectedCredit.payments.map((p, idx) => (
                  <div key={p.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">Abono #{idx + 1} - {p.method.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-slate-500">{p.date} {p.reference ? `• Ref: ${p.reference}` : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600 text-sm">+${p.amountUSD.toFixed(2)} USD</div>
                      <div className="text-slate-500">Bs. {p.amountVES.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setShowCustomerCrmModal(false)}
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
