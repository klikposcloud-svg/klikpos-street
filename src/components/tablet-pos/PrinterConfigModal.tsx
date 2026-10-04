'use client';

import React from 'react';
import { Printer, X, CheckCircle2, Receipt } from 'lucide-react';
import { PrinterConfig } from '@/types/tablet-pos';

interface PrinterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  printerConfig: PrinterConfig;
  setPrinterConfig: React.Dispatch<React.SetStateAction<PrinterConfig>>;
  onSave: (e: React.FormEvent) => void;
  onTestPrint: () => void;
  printerTestAlert: boolean;
}

export function PrinterConfigModal({
  isOpen,
  onClose,
  isLight,
  printerConfig,
  setPrinterConfig,
  onSave,
  onTestPrint,
  printerTestAlert,
}: PrinterConfigModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`border rounded-3xl p-5 max-w-md w-full shadow-2xl relative ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Impresora Térmica POS
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Tickets de comanda y recibos fiscales
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

        <form onSubmit={onSave} className="space-y-4 py-4">
          {/* Tipo de Conexión */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Tipo de Conexión</label>
            <div className="grid grid-cols-3 gap-2">
              {(['bluetooth', 'lan', 'usb'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPrinterConfig({ ...printerConfig, connection: type })}
                  className={`py-2 px-2 rounded-xl border text-xs font-black uppercase transition-all ${
                    printerConfig.connection === type
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {type === 'lan' ? 'Red LAN' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Parámetros de Red LAN si aplica */}
          {printerConfig.connection === 'lan' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">IP de la Impresora</label>
                <input
                  type="text"
                  value={printerConfig.ip || '192.168.1.200'}
                  onChange={(e) => setPrinterConfig({ ...printerConfig, ip: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold border outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Puerto (Default 9100)</label>
                <input
                  type="number"
                  value={printerConfig.port || 9100}
                  onChange={(e) => setPrinterConfig({ ...printerConfig, port: parseInt(e.target.value) || 9100 })}
                  className={`w-full px-3 py-1.5 rounded-xl text-xs font-mono font-bold border outline-none ${
                    isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Ancho del Papel */}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">Ancho del Papel Térmico</label>
            <div className="grid grid-cols-2 gap-2">
              {(['58mm', '80mm'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPrinterConfig({ ...printerConfig, paperWidth: w })}
                  className={`py-2 px-3 rounded-xl border text-xs font-black transition-all ${
                    printerConfig.paperWidth === w
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : isLight ? 'bg-slate-100 border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  {w} (Formato Estándar)
                </button>
              ))}
            </div>
          </div>

          {/* Alerta de prueba de impresión */}
          {printerTestAlert && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>¡Comando de prueba enviado exitosamente a la impresora!</span>
            </div>
          )}

          {/* Botón de prueba y guardado */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onTestPrint}
              className="py-2.5 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>Ticket Prueba</span>
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all"
            >
              Guardar Impresora
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
