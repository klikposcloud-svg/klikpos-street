'use client';

import React, { useState } from 'react';
import { User, X, Search, Check, UserPlus, Phone, MapPin, IdCard, Users, ArrowRight } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'search' | 'create'>('search');
  const [customerSearch, setCustomerSearch] = useState('');
  const [docPrefix, setDocPrefix] = useState<'V-' | 'J-' | 'E-' | 'G-'>('V-');

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(
    c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
         c.docId.toLowerCase().includes(customerSearch.toLowerCase()) ||
         (c.phone && c.phone.includes(customerSearch))
  );

  // Helper para asignar prefijo de documento
  const handleDocIdChange = (rawVal: string) => {
    // Si ya viene con prefijo, lo limpiamos para no duplicar
    const cleaned = rawVal.replace(/^[VvJjEeGg]-?/, '');
    setNewCustomerForm(prev => ({ ...prev, docId: `${docPrefix}${cleaned}` }));
  };

  const handleSelectPrefix = (prefix: 'V-' | 'J-' | 'E-' | 'G-') => {
    setDocPrefix(prefix);
    const cleaned = (newCustomerForm.docId || '').replace(/^[VvJjEeGg]-?/, '');
    setNewCustomerForm(prev => ({ ...prev, docId: `${prefix}${cleaned}` }));
  };

  const handleQuickCreateFromSearch = () => {
    const isNumber = /^\d+$/.test(customerSearch.trim());
    if (isNumber) {
      setNewCustomerForm(prev => ({ ...prev, docId: `${docPrefix}${customerSearch.trim()}` }));
    } else {
      setNewCustomerForm(prev => ({ ...prev, name: customerSearch.trim() }));
    }
    setActiveTab('create');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm select-none">
      <div 
        className="w-full max-w-lg rounded-3xl border shadow-2xl relative max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        style={{
          backgroundColor: isLight ? '#ffffff' : '#090d16',
          borderColor: isLight ? '#cbd5e1' : '#1e293b',
          color: isLight ? '#0f172a' : '#ffffff'
        }}
      >
        {/* ============================================================== */}
        {/* ENCABEZADO ESTILO APP MÓVIL                                   */}
        {/* ============================================================== */}
        <div 
          className="px-5 sm:px-6 pt-5 pb-3 border-b flex flex-col gap-3 shrink-0"
          style={{
            backgroundColor: isLight ? '#f8fafc' : '#0c1220',
            borderColor: isLight ? '#e2e8f0' : '#1e293b'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-md shrink-0"
                style={{ backgroundColor: primaryColor }}
              >
                <Users className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Gestión de Clientes
                </h3>
                <p className={`text-[11px] sm:text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Asigna cliente a la orden para factura, ticket o crédito
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2.5 rounded-2xl transition-all active:scale-90 cursor-pointer ${
                isLight ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title="Cerrar"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* SELECTOR SEGMENTADO (TABS ESTILO APP TOUCH) */}
          <div className={`p-1 rounded-2xl border grid grid-cols-2 gap-1.5 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#070a12] border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-101'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>Buscar Cliente ({customers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black scale-101'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PESTAÑA 1: BUSCADOR DE CLIENTES EXISTENTES                     */}
        {/* ============================================================== */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {/* Campo de Búsqueda Grande Tipo App Móvil */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Escribe nombre, cédula o teléfono..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                autoFocus
                className={`w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm sm:text-base font-bold border-2 outline-none transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white' 
                    : 'bg-[#0c1220] border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-400 focus:bg-[#070a12]'
                }`}
              />
              {customerSearch && (
                <button
                  type="button"
                  onClick={() => setCustomerSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Opción Rápida: Consumidor Final (Venta Mostrador) */}
            <div
              onClick={() => {
                onSelectCustomer({
                  id: '0',
                  name: 'Consumidor Final',
                  docId: 'V-00000000',
                  phone: '',
                  address: ''
                });
                onClose();
              }}
              className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all active:scale-98 ${
                selectedCustomer.name === 'Consumidor Final'
                  ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                  : isLight 
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200' 
                    : 'bg-[#0c1220] hover:bg-slate-800/80 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-black text-xs">
                  CF
                </div>
                <div>
                  <h4 className={`text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Consumidor Final (Venta Genérica)
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500 font-bold block">
                    V-00000000 • Sin datos fiscales
                  </span>
                </div>
              </div>

              {selectedCustomer.name === 'Consumidor Final' && (
                <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Lista de Clientes Registrados */}
            <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
              {filteredCustomers.length === 0 ? (
                <div className={`p-6 rounded-2xl border border-dashed text-center space-y-3 ${
                  isLight ? 'border-slate-300 bg-slate-50 text-slate-700' : 'border-slate-800 bg-[#0c1220] text-slate-300'
                }`}>
                  <User className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-sm font-black">
                      No encontramos clientes con &ldquo;{customerSearch}&rdquo;
                    </p>
                    <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Puedes registrarlo en 5 segundos con el botón de abajo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickCreateFromSearch}
                    className="py-2.5 px-4 rounded-xl bg-amber-500 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Registrar &ldquo;{customerSearch}&rdquo; ahora</span>
                  </button>
                </div>
              ) : (
                filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomer.id === cust.id;
                  const initials = cust.name
                    ? cust.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'CL';

                  return (
                    <div
                      key={cust.id}
                      onClick={() => {
                        onSelectCustomer(cust);
                        onClose();
                      }}
                      className={`p-3.5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all active:scale-98 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm'
                          : isLight 
                            ? 'bg-white hover:bg-slate-50 border-slate-200' 
                            : 'bg-[#090d16] hover:bg-slate-800/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0"
                          style={{
                            backgroundColor: isSelected ? primaryColor : (isLight ? '#e2e8f0' : '#1e293b'),
                            color: isSelected ? '#020617' : (isLight ? '#334155' : '#cbd5e1')
                          }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-sm font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {cust.name}
                          </h4>
                          <div className="flex items-center gap-2 flex-wrap text-xs mt-0.5">
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                              {cust.docId}
                            </span>
                            {cust.phone && (
                              <span className={`flex items-center gap-1 text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Phone className="w-2.5 h-2.5" />
                                {cust.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <ArrowRight className={`w-4 h-4 shrink-0 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: REGISTRO DE NUEVO CLIENTE (CAMPOS GRANDES TOUCH)   */}
        {/* ============================================================== */}
        {activeTab === 'create' && (
          <form onSubmit={onCreateCustomer} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Selector de Prefijo Venezolano + Cédula / RIF */}
            <div className="space-y-1.5">
              <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <IdCard className="w-4 h-4 text-amber-500" />
                <span>Documento de Identidad (Cédula o RIF) *</span>
              </label>

              <div className="flex gap-2">
                {/* Botones de Prefijo V / J / E / G */}
                <div className={`p-1 rounded-2xl border flex items-center gap-1 shrink-0 ${
                  isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#0c1220] border-slate-700'
                }`}>
                  {(['V-', 'J-', 'E-', 'G-'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleSelectPrefix(p)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        docPrefix === p
                          ? 'bg-amber-500 text-slate-950 font-black shadow-xs scale-102'
                          : isLight ? 'text-slate-700 hover:text-slate-950' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Input de Número de Cédula/RIF */}
                <input
                  type="text"
                  placeholder="Número de cédula o RIF..."
                  required
                  value={(newCustomerForm.docId || '').replace(/^[VvJjEeGg]-?/, '')}
                  onChange={(e) => handleDocIdChange(e.target.value)}
                  className={`flex-1 px-4 py-3.5 rounded-2xl text-base font-mono font-bold border-2 outline-none transition-all ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white' 
                      : 'bg-[#0c1220] border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-400 focus:bg-[#070a12]'
                  }`}
                />
              </div>
            </div>

            {/* Nombre o Razón Social */}
            <div className="space-y-1.5">
              <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <User className="w-4 h-4 text-amber-500" />
                <span>Nombre Completo o Razón Social *</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez o Inversiones Los Llanos C.A."
                required
                value={newCustomerForm.name}
                onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-4 py-3.5 rounded-2xl text-base font-bold border-2 outline-none transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white' 
                    : 'bg-[#0c1220] border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-400 focus:bg-[#070a12]'
                }`}
              />
            </div>

            {/* Teléfono (WhatsApp) */}
            <div className="space-y-1.5">
              <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <Phone className="w-4 h-4 text-emerald-500" />
                <span>Teléfono / WhatsApp (Opcional)</span>
              </label>
              <input
                type="tel"
                placeholder="Ej: 0412-1234567 o 0414-9876543"
                value={newCustomerForm.phone}
                onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                className={`w-full px-4 py-3.5 rounded-2xl text-base font-mono border-2 outline-none transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white' 
                    : 'bg-[#0c1220] border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-400 focus:bg-[#070a12]'
                }`}
              />
            </div>

            {/* Dirección / Referencia de Entrega */}
            <div className="space-y-1.5">
              <label className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                <MapPin className="w-4 h-4 text-purple-500" />
                <span>Dirección o Punto de Entrega (Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Calle 4, Casa #22, frente a la plaza"
                value={newCustomerForm.address}
                onChange={(e) => setNewCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                className={`w-full px-4 py-3.5 rounded-2xl text-sm border-2 outline-none transition-all ${
                  isLight 
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white' 
                    : 'bg-[#0c1220] border-slate-700 text-white placeholder:text-slate-500 focus:border-amber-400 focus:bg-[#070a12]'
                }`}
              />
            </div>

            {/* Botón Principal de Acción Grande Tipo App Móvil */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-4 px-4 rounded-2xl text-base sm:text-lg font-black text-slate-950 flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Guardar y Seleccionar Cliente</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('search')}
                className={`w-full py-2.5 text-xs font-bold transition-all text-center ${
                  isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                Volver a la lista de clientes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
