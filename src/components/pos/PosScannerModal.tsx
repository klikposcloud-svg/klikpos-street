'use client';

import React from 'react';
import { Smartphone, RefreshCw, X } from 'lucide-react';

interface PosScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCodeDataUrl: string;
  phoneConnected: boolean;
  phoneDeviceName: string;
  scannerUrl: string;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function PosScannerModal({
  isOpen,
  onClose,
  qrCodeDataUrl,
  phoneConnected,
  phoneDeviceName,
  scannerUrl,
  onShowToast,
}: PosScannerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-700 text-white flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 tracking-tight">
                Vincular Celular como Escáner
              </h3>
              <p className="text-[11px] text-slate-500">
                Pistola de código de barras y registro móvil con foto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido Modal */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {/* Código QR */}
          <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm relative group">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Escáner QR"
                className="w-56 h-56 object-contain"
              />
            ) : (
              <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-700" />
                <span className="text-xs font-semibold">Generando código QR...</span>
              </div>
            )}
          </div>

          {/* Estado de Conexión */}
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${
              phoneConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                phoneConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            <span>
              {phoneConnected
                ? `¡Celular Conectado! (${phoneDeviceName || 'Móvil'})`
                : 'Esperando escaneo del código QR...'}
            </span>
          </div>

          {/* Instrucciones Paso a Paso */}
          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-left space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <span className="text-slate-600">
                Asegúrate de que tu celular esté conectado al <b>mismo Wi-Fi</b> que esta computadora.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <span className="text-slate-600">
                Abre la cámara del celular, apunta a este código QR y presiona el enlace.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <span className="text-slate-600">
                Verás un botón <b>"Instalar App"</b> para guardarla en la pantalla de inicio de tu celular, consultar inventario, precios en Bs/$ y escanear códigos al instante.
              </span>
            </div>
          </div>

          {/* URL directa */}
          {scannerUrl && (
            <div className="w-full text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                O abre este enlace en el navegador de tu móvil:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={scannerUrl}
                  className="flex-1 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-700 select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(scannerUrl);
                    onShowToast('Enlace copiado al portapapeles', 'info');
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Copiar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
          >
            Listo, Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
