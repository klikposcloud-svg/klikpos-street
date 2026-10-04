'use client';

import React from 'react';
import { X, Copy, Share2 } from 'lucide-react';

interface QrMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  primaryColor: string;
  menuQrUrl?: string;
}

export function QrMenuModal({
  isOpen,
  onClose,
  isLight,
  primaryColor,
  menuQrUrl,
}: QrMenuModalProps) {
  if (!isOpen) return null;

  const activeMenuUrl = menuQrUrl || (typeof window !== 'undefined' ? `${window.location.origin}/menu` : 'http://localhost:3000/menu');
  const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(activeMenuUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`border rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 active:scale-90 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider" style={{ color: primaryColor }}>
            Menú Digital Interactivo
          </span>
          <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
            Escanea para Ordenar
          </h3>
          <p className="text-xs text-slate-500">
            Apunta con la cámara de tu teléfono para ver la carta y ordenar en mesa.
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-inner mx-auto max-w-[220px] border border-slate-200">
          <img
            src={qrImgSrc}
            alt="Código QR del Menú"
            className="w-36 h-36"
          />
          <span className="text-[10px] font-mono font-black text-slate-900 mt-2 text-center break-all">
            {activeMenuUrl.replace(/^https?:\/\//, '')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(activeMenuUrl);
                alert('¡Enlace del Menú copiado al portapapeles!');
              }
            }}
            className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border hover:bg-slate-50 active:scale-95 transition-transform cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Enlace</span>
          </button>
          <button
            onClick={() => {
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent('Mira nuestro menú digital interactivo aquí: ' + activeMenuUrl)}`, '_blank');
            }}
            className="py-2 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform shadow-md cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
