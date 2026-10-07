'use client';

import React, { useRef, useState } from 'react';
import { Phone, X, QrCode, Upload, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { PagoMovilInfo } from '@/types/tablet-pos';
import { VENEZUELAN_BANKS } from '@/lib/data/tablet-pos-rubros';

interface PagoMovilConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  pagoMovilInfo: PagoMovilInfo;
  setPagoMovilInfo: React.Dispatch<React.SetStateAction<PagoMovilInfo>>;
  onSave: (e: React.FormEvent) => void;
}

// Compresión por hardware obligatoria (Anti-Regression Gate: RAM < 1.5MB en Android)
const compressQrImageSafely = async (file: File, maxWidth = 500, quality = 0.85): Promise<string> => {
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      let bitmap: ImageBitmap | null = null;
      try {
        bitmap = await createImageBitmap(file, {
          resizeWidth: maxWidth,
          resizeQuality: 'medium',
        });
      } catch {
        bitmap = null;
      }

      if (bitmap) {
        let width = bitmap.width;
        let height = bitmap.height;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(bitmap, 0, 0, width, height);
          bitmap.close();
          return canvas.toDataURL('image/jpeg', quality);
        }
        bitmap.close();
      }
    } catch (e) {
      console.warn('[PagoMovilConfigModal] createImageBitmap fallback:', e);
    }
  }

  // Fallback con createObjectURL y revokeObjectURL inmediato (Anti-OOM)
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        reject(new Error('Canvas context not available'));
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
  });
};

export function PagoMovilConfigModal({
  isOpen,
  onClose,
  isLight,
  pagoMovilInfo,
  setPagoMovilInfo,
  onSave,
}: PagoMovilConfigModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setUploadError(null);
      const compressedDataUrl = await compressQrImageSafely(file);
      setPagoMovilInfo(prev => ({ ...prev, qrImage: compressedDataUrl }));
    } catch (err: any) {
      console.error('[PagoMovilConfigModal] Error al procesar imagen de QR:', err);
      setUploadError('No se pudo procesar la imagen del QR. Intenta con otra imagen o captura.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveQr = () => {
    setPagoMovilInfo(prev => ({ ...prev, qrImage: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`border rounded-3xl p-5 max-w-lg w-full max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl relative ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white active:scale-90 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-black" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
            Configurar Datos y QR de Pago Móvil
          </h3>
        </div>

        <form onSubmit={onSave} className="space-y-3.5">
          {/* Banco Receptor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Banco Receptor:
            </label>
            <select
              value={pagoMovilInfo.bank}
              onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, bank: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            >
              {VENEZUELAN_BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Teléfono y Documento */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Teléfono Pago Móvil:
              </label>
              <input
                type="text"
                required
                placeholder="Ej: 04248298026"
                value={pagoMovilInfo.phone}
                onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Cédula / RIF Titular:
              </label>
              <input
                type="text"
                required
                placeholder="Ej: V-20123456"
                value={pagoMovilInfo.idDoc}
                onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, idDoc: e.target.value })}
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border outline-none ${
                  isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          {/* Nombre Titular */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
              Nombre del Titular de la Cuenta:
            </label>
            <input
              type="text"
              required
              placeholder="Nombre o Razón Social registrada en el banco"
              value={pagoMovilInfo.ownerName}
              onChange={(e) => setPagoMovilInfo({ ...pagoMovilInfo, ownerName: e.target.value })}
              className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

          {/* SECCIÓN OBLIGATORIA: QR OFICIAL DEL BANCO (SUICHE 7B / BDV / BANESCO) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>QR Oficial del Banco (Recomendado para BDVApp):</span>
              </label>
              {pagoMovilInfo.qrImage && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Activo</span>
                </span>
              )}
            </div>

            {/* Explicación de la realidad bancaria en Venezuela */}
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-900 dark:text-amber-100">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>¿Por qué subir tu QR oficial del banco?</span>
              </p>
              <span>
                Las aplicaciones bancarias (como <strong>BDVApp</strong>, <strong>Banesco</strong> o <strong>Bancamiga</strong>) exigen el estándar de seguridad cifrado de Suiche 7B para autocompletar automáticamente el teléfono y la cédula. Sube aquí la captura o foto del QR descargado de <strong>BDVenlínea Empresas</strong> o de tu BDVApp (&quot;Mi QR&quot;) para que tus clientes escaneen y paguen sin escribir datos.
              </span>
            </div>

            {/* Previsualización o Botón de Subida */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {pagoMovilInfo.qrImage ? (
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pagoMovilInfo.qrImage}
                  alt="QR Oficial"
                  className="w-24 h-24 object-contain rounded-xl bg-white p-1 border border-slate-200 shadow-xs"
                />
                <div className="flex-1 space-y-1.5">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                    Imagen de QR Oficial Cargada
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Se mostrará en la pantalla de cobro para escaneo 100% compatible con BDVApp.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressing}
                      className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      {isCompressing ? 'Procesando...' : 'Cambiar Imagen'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveQr}
                      className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-100 cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-emerald-400/50 hover:border-emerald-500 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 text-center cursor-pointer transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <Upload className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                  {isCompressing ? 'Comprimiendo imagen por hardware...' : 'Subir Imagen / Captura de tu QR Oficial'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Toca aquí para seleccionar desde la galería o tomar foto (JPG o PNG)
                </p>
              </div>
            )}

            {uploadError && (
              <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                {uploadError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all bg-emerald-600 hover:bg-emerald-500 mt-2 cursor-pointer"
          >
            Guardar Datos y QR de Pago Móvil
          </button>
        </form>
      </div>
    </div>
  );
}

