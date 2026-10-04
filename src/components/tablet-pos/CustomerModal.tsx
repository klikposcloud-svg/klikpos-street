'use client';

import React, { useState } from 'react';
import { User, X, Search, Check } from 'lucide-react';
import { Customer } from '@/types/tablet-pos';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  primaryColor: string;
  customers: Customer[];
  selectedCustomer: Customer;
  onSelectCustomer: (customer: Customer) => void;
  newCustomerForm: { name: string; docId: string; phone: string; address: string };
  setNewCustomerForm: React.Dispatch<React.SetStateAction<{ name: string; docId: string; phone: string; address: string }>>;
  onCreateCustomer: (e: React.FormEvent) => void;
}

export function CustomerModal({
  isOpen,
  onClose,
  isLight,
  primaryColor,
  customers,
  selectedCustomer,
  onSelectCustomer,
  newCustomerForm,
  setNewCustomerForm,
  onCreateCustomer,
}: CustomerModalProps) {
  const [customerSearch, setCustomerSearch] = useState('');

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(
    c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
         c.docId.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`border rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <User className="w-5 h-5" style={{ color: primaryColor }} />
          <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
            Seleccionar o Registrar Cliente
          </h3>
        </div>

        {/* Formulario de Nuevo Cliente */}
        <form onSubmit={onCreateCustomer} className={`p-3 rounded-2xl border space-y-2 shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <span className="text-[10px] font-black uppercase text-slate-500 block">
            + Agregar Nuevo Cliente:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nombre / Razón Social *"
              required
              value={newCustomerForm.name}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
              className={`px-2.5 py-1.5 rounded-xl text-xs border outline-none font-bold ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
            <input
              type="text"
              placeholder="Cédula / RIF *"
              required
              value={newCustomerForm.docId}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, docId: e.target.value })}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Teléfono (Opcional)"
              value={newCustomerForm.phone}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-mono border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
              }`}
            />
            <button
              type="submit"
              className="py-1.5 text-white text-xs font-black rounded-xl active:scale-95 transition-all shadow-xs cursor-pointer"
              style={{ backgroundColor: primaryColor }}
            >
              Guardar y Seleccionar
            </button>
          </div>
        </form>

        {/* Buscador de Clientes Existentes */}
        <div className="relative shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre o cédula..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className={`w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border outline-none ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
            }`}
          />
        </div>

        {/* Lista de Clientes */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              onClick={() => {
                onSelectCustomer(cust);
                onClose();
              }}
              className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-98 ${
                selectedCustomer.id === cust.id
                  ? 'border-2 shadow-xs'
                  : isLight ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
              }`}
              style={{
                borderColor: selectedCustomer.id === cust.id ? primaryColor : undefined
              }}
            >
              <div>
                <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                  {cust.name}
                </h4>
                <span className="text-[10px] font-mono text-slate-500 font-bold">
                  {cust.docId} {cust.phone && `• ${cust.phone}`}
                </span>
              </div>
              {selectedCustomer.id === cust.id && (
                <Check className="w-4 h-4" style={{ color: primaryColor }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
