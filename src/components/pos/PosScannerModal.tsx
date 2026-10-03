'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, X, ShieldCheck, Copy, Check, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

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
  const [activeTab, setActiveTab] = useState<'satellite' | 'admin'>('admin');
  const [terminalHwid, setTerminalHwid] = useState('KLIK-PC-POS');
  const [adminQrUrl, setAdminQrUrl] = useState('');
  const [copiedHwid, setCopiedHwid] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let hwid = localStorage.getItem('klikpos_terminal_hwid') || localStorage.getItem('venematic_terminal_hwid');
      if (!hwid) {
        hwid = 'KLIK-PC-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem('klikpos_terminal_hwid', hwid);
      }
      setTerminalHwid(hwid);

      // Generar payload de emparejamiento completo para KlikAdmin
      const adminConfig = {
        serverUrl: window.location.origin,
        storeId: hwid,
        licenseId: hwid,
        hwid: hwid,
        projectId: 'klikpos-cloud'
      };

      QRCode.toDataURL(JSON.stringify(adminConfig), { margin: 2, width: 280 })
        .then(url => setAdminQrUrl(url))
        .catch(() => setAdminQrUrl(qrCodeDataUrl));
    }
  }, [qrCodeDataUrl, isOpen]);

  if (!isOpen) return null;

  const handleCopyHwid = () => {
    navigator.clipboard.writeText(terminalHwid);
    setCopiedHwid(true);
    onShowToast(`✓ ID de Computador copiado: ${terminalHwid}`, 'success');
    setTimeout(() => setCopiedHwid(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-300 shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-700 text-white flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 tracking-tight">
                Vincular Dispositivos Móviles
              </h3>
              <p className="text-[11px] text-slate-500">
                Conecta la App de Dueño (KlikAdmin) o tu Celular como Escáner
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de Selección */}
        <div className="p-2 bg-slate-100 border-b border-slate-200 flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <span>👑</span> <span>App Dueño (KlikAdmin)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('satellite')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'satellite'
                ? 'bg-sky-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <span>📱</span> <span>Celular Escáner / Mesas</span>
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="p-5 overflow-y-auto space-y-4 flex flex-col items-center text-center">
          {activeTab === 'admin' ? (
            /* VISTA KLIKADMIN (DUEÑO & NUBE) */
            <>
              {/* Tarjeta de ID de Computador / Licencia */}
              <div className="w-full bg-amber-500/10 border border-amber-400/40 rounded-2xl p-3 flex items-center justify-between text-left">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
                    ID del Computador / Licencia:
                  </span>
                  <span className="text-sm font-mono font-black text-slate-900">
                    {terminalHwid}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyHwid}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all"
                >
                  {copiedHwid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHwid ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              {/* Código QR de Emparejamiento 1-Segundo */}
              <div className="p-3 bg-white border-2 border-amber-400/60 rounded-2xl shadow-md relative">
                {adminQrUrl ? (
                  <img
                    src={adminQrUrl}
                    alt="QR KlikAdmin"
                    className="w-52 h-52 object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                    <span className="text-xs font-semibold">Generando código QR...</span>
                  </div>
                )}
              </div>

              {/* Instrucciones Claras */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-left space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span className="text-slate-700">
                    Abre la app <b>KlikAdmin</b> en tu teléfono móvil.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span className="text-slate-700">
                    Toca el botón <b>"📷 Escanear PC"</b> en el encabezado y apunta a este código QR.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <span className="text-slate-700">
                    ¡Listo! Podrás consultar ventas en vivo tanto <b>en red local</b> como <b>en la nube fuera del negocio</b> usando el ID <code>{terminalHwid}</code>.
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* VISTA CELULAR ESCÁNER (SATÉLITE) */
            <>
              {/* Código QR Satélite */}
              <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm relative">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="Escáner QR"
                    className="w-52 h-52 object-contain"
                  />
                ) : (
                  <div className="w-52 h-52 flex flex-col items-center justify-center text-slate-400 gap-2">
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

              {/* URL directa */}
              {scannerUrl && (
                <div className="w-full text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Enlace para el navegador del móvil:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={scannerUrl}
                      className="flex-1 px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-mono text-slate-700 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(scannerUrl);
                        onShowToast('Enlace copiado al portapapeles', 'info');
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all"
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all active:scale-95"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
