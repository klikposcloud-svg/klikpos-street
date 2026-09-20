'use client';

import { useState, useEffect } from 'react';
import { venematicDB } from '@/lib/indexeddb/db';
import type { IDBCustomer } from '@/lib/indexeddb/db';

const SAMPLE_CUSTOMERS: IDBCustomer[] = [
  {
    id: 'cust_1',
    storeId: 'default_store',
    name: 'María García',
    email: 'maria.garcia@email.com',
    phone: '0414-5551234',
    rif: 'V-18456789-0',
    totalPurchasesUSD: 450.80,
    visitCount: 14,
    lastVisit: '2023-10-24',
    notes: 'Cliente preferencial minimarket',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust_2',
    storeId: 'default_store',
    name: 'Carlos Mendoza',
    email: 'carlos.mendoza@email.com',
    phone: '0412-8889900',
    rif: 'V-12345678-1',
    totalPurchasesUSD: 820.50,
    visitCount: 28,
    lastVisit: '2023-10-26',
    notes: 'Compras semanales de panadería y lácteos',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust_3',
    storeId: 'default_store',
    name: 'Inversiones Los Altos C.A.',
    email: 'contacto@losaltos.com',
    phone: '0416-3334455',
    rif: 'J-40123456-7',
    totalPurchasesUSD: 1450.00,
    visitCount: 8,
    lastVisit: '2023-10-20',
    notes: 'Compras institucionales al mayor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function CRMPage() {
  const [customers, setCustomers] = useState<IDBCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', rif: '', notes: '' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    let custs = await venematicDB.getCustomersByStore('default_store');
    if (!custs || custs.length === 0) {
      for (const c of SAMPLE_CUSTOMERS) {
        await venematicDB.addCustomer(c);
      }
      custs = await venematicDB.getCustomersByStore('default_store');
    }
    setCustomers(custs);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ? c.phone.includes(search) : false) ||
      (c.email ? c.email.toLowerCase().includes(search.toLowerCase()) : false) ||
      (c.rif ? c.rif.toLowerCase().includes(search.toLowerCase()) : false)
  );

  const addCustomer = async () => {
    if (!newCustomer.name) return;

    const customer: IDBCustomer = {
      id: `cust_${Date.now()}`,
      storeId: 'default_store',
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      rif: newCustomer.rif,
      totalPurchasesUSD: 0,
      visitCount: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      notes: newCustomer.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await venematicDB.addCustomer(customer);
    setCustomers((prev) => [...prev, customer]);
    setNewCustomer({ name: '', email: '', phone: '', rif: '', notes: '' });
    setShowForm(false);
  };

  const totalClients = customers.length;
  const totalSales = customers.reduce((sum, c) => sum + (c.totalPurchasesUSD || 0), 0);
  const totalVisits = customers.reduce((sum, c) => sum + (c.visitCount || 0), 0);

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto font-montserrat">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Directorio de Clientes (CRM)
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Historial de compras, fidelización y contactos
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
        >
          <span className="text-base leading-none font-bold">+</span>
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="card-vm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clientes Activos</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-800 dark:text-white">{totalClients}</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">👥</span>
          </div>
        </div>

        <div className="card-vm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ventas Acumuladas</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-600">${totalSales.toFixed(2)}</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">💳</span>
          </div>
        </div>

        <div className="card-vm flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Visitas Totales</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-purple-600">{totalVisits}</span>
            <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm">🛒</span>
          </div>
        </div>
      </div>

      {/* New Customer Form Modal/Panel */}
      {showForm && (
        <div className="card-vm border-blue-200 dark:border-blue-800 bg-blue-50/20 animate-slide-up">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              Registrar Nuevo Cliente
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Nombre Completo *</label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Cédula / RIF</label>
              <input
                type="text"
                value={newCustomer.rif}
                onChange={(e) => setNewCustomer({ ...newCustomer, rif: e.target.value })}
                placeholder="V-12345678-0"
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Teléfono</label>
              <input
                type="tel"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="0414-1234567"
                className="input-field text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="cliente@email.com"
                className="input-field text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Notas / Observaciones</label>
              <input
                type="text"
                value={newCustomer.notes}
                onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                placeholder="Notas adicionales o preferencias..."
                className="input-field text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              onClick={addCustomer}
              className="bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold px-5 py-2 rounded-xl shadow-md shadow-emerald-500/20"
            >
              Guardar Cliente
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="card-vm py-3 flex items-center gap-3">
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, cédula, teléfono o correo..."
          className="w-full bg-transparent border-none outline-none text-xs font-medium text-slate-800 dark:text-white"
        />
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => (
          <div key={customer.id} className="card-vm flex flex-col justify-between hover:border-blue-300 transition-all shadow-xs">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-extrabold flex items-center justify-center text-sm">
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">{customer.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{customer.rif || 'Sin RIF'}</p>
                  </div>
                </div>

                <span className="badge badge-dairy">
                  {customer.visitCount || 0} compras
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700/60 pt-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">📞</span>
                  <span>{customer.phone || 'No registrado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">✉️</span>
                  <span className="truncate">{customer.email || 'No registrado'}</span>
                </div>
                {customer.notes && (
                  <p className="text-[11px] text-slate-400 italic pt-1 truncate">
                    &quot;{customer.notes}&quot;
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Total Comprado:</span>
              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                ${(customer.totalPurchasesUSD || 0).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
