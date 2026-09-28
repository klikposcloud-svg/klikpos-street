'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Building2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Plus,
  Search,
  Phone,
  Mail,
  FileSpreadsheet,
  Receipt,
  X,
  Clock,
  ArrowDownLeft
} from 'lucide-react';
import { FeatureGate } from '@/components/FeatureGate';
import { financialDB, SupplierRecord, SupplierInvoiceRecord } from '@/lib/db/financial-db';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoiceRecord[]>([]);
  const [bcvRate, setBcvRate] = useState<number>(45.50);
  const [activeTab, setActiveTab] = useState<'invoices' | 'directory'>('invoices');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showNewSupplierModal, setShowNewSupplierModal] = useState(false);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Selected for Payment
  const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoiceRecord | null>(null);
  const [paymentAmountUSD, setPaymentAmountUSD] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('transferencia');
  const [paymentReference, setPaymentReference] = useState('');

  // Form State: New Supplier
  const [supName, setSupName] = useState('');
  const [supRif, setSupRif] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supCategory, setSupCategory] = useState('Alimentos y Bebidas');
  const [supCreditDays, setSupCreditDays] = useState('15');

  // Form State: New Invoice
  const [invSupplierId, setInvSupplierId] = useState('');
  const [invNumber, setInvNumber] = useState('');
  const [invAmountUSD, setInvAmountUSD] = useState('');
  const [invDueDate, setInvDueDate] = useState('');
  const [invNotes, setInvNotes] = useState('');

  useEffect(() => {
    loadData();
    try {
      const savedRate = localStorage.getItem('klikpos_bcv_rate');
      if (savedRate) {
        const parsed = parseFloat(savedRate);
        if (parsed > 0) setBcvRate(parsed);
      }
    } catch {}
  }, []);

  const loadData = () => {
    const sups = financialDB.getSuppliers();
    setSuppliers(sups);
    if (sups.length > 0 && !invSupplierId) {
      setInvSupplierId(sups[0].id);
    }

    const invs = financialDB.getSupplierInvoices();
    if (invs.length === 0) {
      seedInitialInvoices(sups);
    } else {
      setInvoices(invs);
    }
  };

  const seedInitialInvoices = (sups: SupplierRecord[]) => {
    if (sups.length === 0) return;
    const inv1 = financialDB.saveSupplierInvoice({
      supplierId: sups[0].id,
      supplierName: sups[0].name,
      supplierRif: sups[0].rif,
      invoiceNumber: 'FC-89301',
      dateIssued: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      totalAmountUSD: 480.00,
      bcvRate: bcvRate,
      itemsCount: 12,
      notes: 'Despacho de refrescos y agua mineral en cajas',
    });
    const inv2 = financialDB.saveSupplierInvoice({
      supplierId: sups[1] ? sups[1].id : sups[0].id,
      supplierName: sups[1] ? sups[1].name : sups[0].name,
      supplierRif: sups[1] ? sups[1].rif : sups[0].rif,
      invoiceNumber: 'FAC-0918',
      dateIssued: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
      dueDate: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      totalAmountUSD: 230.50,
      bcvRate: bcvRate,
      itemsCount: 5,
      notes: 'Queso amarillo y jamón para rebanar',
    });
    setInvoices([inv1, inv2]);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName || !supRif) return;

    const newSup = financialDB.saveSupplier({
      name: supName,
      rif: supRif,
      contactName: supContact || 'Encargado de Ventas',
      phone: supPhone || '04140000000',
      category: supCategory,
      creditDays: parseInt(supCreditDays) || 15,
    });

    setSuppliers(prev => [newSup, ...prev]);
    setShowNewSupplierModal(false);
    setSupName('');
    setSupRif('');
    setSupContact('');
    setSupPhone('');
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === invSupplierId);
    if (!sup || !invNumber || !invAmountUSD) return;

    const amount = parseFloat(invAmountUSD);
    if (isNaN(amount) || amount <= 0) return;

    const newInv = financialDB.saveSupplierInvoice({
      supplierId: sup.id,
      supplierName: sup.name,
      supplierRif: sup.rif,
      invoiceNumber: invNumber,
      dateIssued: new Date().toISOString().split('T')[0],
      dueDate: invDueDate || new Date(Date.now() + sup.creditDays * 86400000).toISOString().split('T')[0],
      totalAmountUSD: amount,
      bcvRate: bcvRate,
      itemsCount: 1,
      notes: invNotes,
    });

    setInvoices(prev => [newInv, ...prev]);
    setShowNewInvoiceModal(false);
    setInvNumber('');
    setInvAmountUSD('');
    setInvNotes('');
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || !paymentAmountUSD) return;

    const amount = parseFloat(paymentAmountUSD);
    if (isNaN(amount) || amount <= 0) return;

    const updated = financialDB.registerSupplierPayment(selectedInvoice.id, {
      amountUSD: amount,
      method: paymentMethod,
      reference: paymentReference || undefined,
    });

    if (updated) {
      setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
    }
    setShowPaymentModal(false);
    setSelectedInvoice(null);
    setPaymentAmountUSD('');
    setPaymentReference('');
  };

  // KPIs
  const totalPayableUSD = invoices.reduce((acc, i) => acc + (i.status !== 'pagada' ? i.remainingAmountUSD : 0), 0);
  const totalPayableVES = totalPayableUSD * bcvRate;
  const overdueCount = invoices.filter(i => new Date(i.dueDate) < new Date() && i.status !== 'pagada').length;

  const filteredInvoices = invoices.filter(i => {
    return i.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           i.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredSuppliers = suppliers.filter(s => {
    return s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.rif.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.category.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <FeatureGate flag="payables_suppliers" featureName="Módulo de Proveedores & Cuentas por Pagar">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Truck className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Proveedores & Cuentas por Pagar</h1>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Registro de compras a crédito, directorio de distribuidores mayoristas y programación de pagos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewSupplierModal(true)}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Nuevo Proveedor
            </button>
            <button
              onClick={() => setShowNewInvoiceModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95"
            >
              <Receipt className="w-4 h-4" />
              Registrar Factura por Pagar
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Deuda a Proveedores</p>
              <h3 className="text-2xl font-black text-slate-900">${totalPayableUSD.toFixed(2)} USD</h3>
              <p className="text-xs font-medium text-red-700 mt-0.5">Bs. {totalPayableVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Facturas Vencidas</p>
              <h3 className="text-2xl font-black text-slate-900">{overdueCount} Facturas</h3>
              <p className="text-xs font-medium text-amber-700 mt-0.5">Requieren pago inmediato</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Proveedores Registrados</p>
              <h3 className="text-2xl font-black text-slate-900">{suppliers.length} Empresas</h3>
              <p className="text-xs font-medium text-purple-700 mt-0.5">Directorio comercial activo</p>
            </div>
          </div>
        </div>

        {/* Pestañas & Búsqueda */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition ${
                activeTab === 'invoices'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Facturas por Pagar ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition ${
                activeTab === 'directory'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Directorio de Proveedores ({suppliers.length})
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={activeTab === 'invoices' ? 'Buscar factura o proveedor...' : 'Buscar proveedor o RIF...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Tab 1: Facturas por Pagar */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Proveedor</th>
                    <th className="px-5 py-3.5"># Factura</th>
                    <th className="px-5 py-3.5">Total Compra</th>
                    <th className="px-5 py-3.5">Saldo Pendiente</th>
                    <th className="px-5 py-3.5">Vencimiento</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-slate-600">
                        No hay facturas registradas.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isOverdue = new Date(inv.dueDate) < new Date() && inv.status !== 'pagada';
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900">{inv.supplierName}</div>
                            <div className="text-xs text-slate-500">{inv.supplierRif}</div>
                          </td>
                          <td className="px-5 py-4 font-mono font-bold text-slate-900">
                            {inv.invoiceNumber}
                            {inv.notes && <div className="text-xs font-normal text-slate-500 truncate max-w-[150px]">{inv.notes}</div>}
                          </td>
                          <td className="px-5 py-4 font-bold text-slate-900">
                            ${inv.totalAmountUSD.toFixed(2)}
                            <div className="text-xs text-slate-500">Emisión: {inv.dateIssued}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 text-base">${inv.remainingAmountUSD.toFixed(2)}</div>
                            <div className="text-xs text-purple-700 font-semibold">Bs. {(inv.remainingAmountUSD * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                              {inv.dueDate}
                            </div>
                            <div className="text-[11px] text-slate-500">{isOverdue ? '¡Vencida!' : 'A tiempo'}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold uppercase ${
                              inv.status === 'pagada'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'parcial'
                                ? 'bg-blue-100 text-blue-800'
                                : isOverdue
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {inv.status === 'pagada' ? 'Pagada' : isOverdue ? 'Vencida' : inv.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {inv.status !== 'pagada' && (
                              <button
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setPaymentAmountUSD(inv.remainingAmountUSD.toString());
                                  setShowPaymentModal(true);
                                }}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition"
                              >
                                Pagar / Abonar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Directorio de Proveedores */}
        {activeTab === 'directory' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((s) => (
              <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
                    <p className="text-xs text-purple-700 font-bold">{s.rif}</p>
                  </div>
                  <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-full font-bold uppercase text-slate-700">
                    {s.category}
                  </span>
                </div>
                
                <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Contacto:</span> {s.contactName}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Plazo de Crédito: <span className="font-bold text-slate-900">{s.creditDays} días</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Registrar Factura por Pagar */}
        {showNewInvoiceModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Registrar Factura por Pagar</h3>
                <button onClick={() => setShowNewInvoiceModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateInvoice} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Proveedor</label>
                  <select
                    value={invSupplierId}
                    onChange={e => setInvSupplierId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.rif})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1"># Factura / Control</label>
                    <input
                      type="text"
                      required
                      placeholder="FC-00123"
                      value={invNumber}
                      onChange={e => setInvNumber(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monto Total ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="250.00"
                      value={invAmountUSD}
                      onChange={e => setInvAmountUSD(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={invDueDate}
                    onChange={e => setInvDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notas / Detalle de Mercancía</label>
                  <textarea
                    rows={2}
                    placeholder="Descripción de la mercancía ingresada..."
                    value={invNotes}
                    onChange={e => setInvNotes(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewInvoiceModal(false)}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                  >
                    Guardar Factura
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Nuevo Proveedor */}
        {showNewSupplierModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Añadir Proveedor al Directorio</h3>
                <button onClick={() => setShowNewSupplierModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSupplier} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Razón Social / Nombre Comercial</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Distribuidora Nacional C.A."
                    value={supName}
                    onChange={e => setSupName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">RIF Empresa</label>
                    <input
                      type="text"
                      required
                      placeholder="J-12345678-0"
                      value={supRif}
                      onChange={e => setSupRif(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plazo de Crédito (Días)</label>
                    <input
                      type="number"
                      value={supCreditDays}
                      onChange={e => setSupCreditDays(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Persona de Contacto</label>
                    <input
                      type="text"
                      placeholder="Ej: Lic. Pedro Pérez"
                      value={supContact}
                      onChange={e => setSupContact(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono Móvil / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="04141234567"
                      value={supPhone}
                      onChange={e => setSupPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewSupplierModal(false)}
                    className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                  >
                    Guardar Proveedor
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Pagar Factura Proveedor */}
        {showPaymentModal && selectedInvoice && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Registrar Pago a Proveedor</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{selectedInvoice.supplierName} • {selectedInvoice.invoiceNumber}</p>
                </div>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleRegisterPayment} className="mt-5 space-y-4">
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 text-center">
                  <p className="text-xs uppercase font-bold text-purple-700">Saldo Pendiente</p>
                  <p className="text-2xl font-black text-purple-950 mt-1">${selectedInvoice.remainingAmountUSD.toFixed(2)} USD</p>
                  <p className="text-xs font-semibold text-purple-800 mt-0.5">Bs. {(selectedInvoice.remainingAmountUSD * bcvRate).toLocaleString('es-VE', { minimumFractionDigits: 2 })} (Tasa: {bcvRate.toFixed(2)})</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Monto del Pago ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedInvoice.remainingAmountUSD}
                    required
                    value={paymentAmountUSD}
                    onChange={e => setPaymentAmountUSD(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Método de Egreso / Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="transferencia">Transferencia Bancaria (Bs.)</option>
                    <option value="pago_movil">Pago Móvil Empresa</option>
                    <option value="efectivo_usd">Efectivo ($ USD)</option>
                    <option value="zelle">Zelle ($ USD)</option>
                    <option value="efectivo_ves">Efectivo (Bs.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Número de Transferencia / Referencia</label>
                  <input
                    type="text"
                    placeholder="Referencia bancaria"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                    className="w-1/2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md transition"
                  >
                    Confirmar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </FeatureGate>
  );
}
