'use client';

import React from 'react';
import { Truck, X, Plus, Bike, Share2, Trash2 } from 'lucide-react';
import { Motorizado } from '@/types/tablet-pos';

interface DeliveryDriversModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  drivers: Motorizado[];
  newDriverForm: { name: string; phone: string; vehicle: string };
  setNewDriverForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; vehicle: string }>>;
  onAddDriver: (e: React.FormEvent) => void;
  onToggleDriverStatus: (id: string) => void;
  onDispatchOrderWhatsApp: (phone: string, name: string) => void;
  onDeleteDriver: (id: string) => void;
}

export function DeliveryDriversModal({
  isOpen,
  onClose,
  isLight,
  drivers,
  newDriverForm,
  setNewDriverForm,
  onAddDriver,
  onToggleDriverStatus,
  onDispatchOrderWhatsApp,
  onDeleteDriver,
}: DeliveryDriversModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`border rounded-3xl p-5 max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl relative ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Motorizados y Delivery WhatsApp
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Despacha pedidos en 1 clic directamente al teléfono de tus repartidores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Formulario de Alta Rápida de Motorizado */}
          <form onSubmit={onAddDriver} className={`p-3.5 rounded-2xl border space-y-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Registrar Nuevo Chofer
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Daniel Pérez"
                  value={newDriverForm.name}
                  onChange={(e) => setNewDriverForm({ ...newDriverForm, name: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-semibold ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Teléfono WhatsApp *</label>
                <input
                  type="tel"
                  required
                  placeholder="04121234567"
                  value={newDriverForm.phone}
                  onChange={(e) => setNewDriverForm({ ...newDriverForm, phone: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-mono font-bold ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Vehículo / Placa</label>
                <input
                  type="text"
                  placeholder="Bera SBR Azul / AF1G22"
                  value={newDriverForm.vehicle}
                  onChange={(e) => setNewDriverForm({ ...newDriverForm, vehicle: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs border outline-none font-semibold ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Guardar Motorizado</span>
              </button>
            </div>
          </form>

          {/* Lista de Motorizados */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
              Choferes Afiliados ({drivers.length})
            </span>

            <div className="space-y-2">
              {drivers.map((d) => (
                <div
                  key={d.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                      <Bike className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                          {d.name}
                        </h4>
                        <button
                          onClick={() => onToggleDriverStatus(d.id)}
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            d.status === 'disponible' ? 'bg-emerald-500/10 text-emerald-600' :
                            d.status === 'en_ruta' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-slate-150 text-slate-500'
                          }`}
                        >
                          {d.status}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {d.vehicle} • WhatsApp: {d.phone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDispatchOrderWhatsApp(d.phone, d.name)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black rounded-xl flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                      title="Enviar comanda activa por WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteDriver(d.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                      title="Eliminar chofer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black rounded-xl"
          >
            Cerrar Motorizados
          </button>
        </div>
      </div>
    </div>
  );
}
