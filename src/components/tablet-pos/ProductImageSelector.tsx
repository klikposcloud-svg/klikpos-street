'use client';

import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Upload, Search, X, Loader2 } from 'lucide-react';
import ProductImageSearchModal from '@/components/ProductImageSearchModal';

interface ProductImageSelectorProps {
  currentImage?: string;
  onImageSelected: (imageUrl: string) => void;
  productName?: string;
  barcode?: string;
  isLight?: boolean;
}

/**
 * Comprime y optimiza imágenes tomadas con cámara o galería en el móvil.
 * Utiliza createImageBitmap y URL.createObjectURL para mantener el uso de RAM
 * inferior a 2MB y evitar que el sistema operativo mate el proceso del navegador.
 */
const compressImageSafely = async (file: File, maxWidth = 400, quality = 0.75): Promise<string> => {
  // Estrategia 1: createImageBitmap con redimensionamiento nativo por hardware (RAM < 1MB)
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    try {
      let bitmap: ImageBitmap | null = null;
      try {
        bitmap = await createImageBitmap(file, {
          resizeWidth: maxWidth,
          resizeQuality: 'medium',
        });
      } catch {
        bitmap = await createImageBitmap(file);
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
      console.warn('Fallback a createObjectURL:', e);
    }
  }

  // Estrategia 2: URL.createObjectURL para evitar inflar la memoria en Base64 de 30MB
  return new Promise((resolve, reject) => {
    let objectUrl: string | null = null;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {}

    if (objectUrl) {
      const img = new Image();
      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width || 400;
          let height = img.naturalHeight || img.height || 400;
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
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            if (objectUrl) URL.revokeObjectURL(objectUrl);
            resolve(dataUrl);
            return;
          }
        } catch (err) {}
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error('No se pudo procesar la foto'));
      };
      img.onerror = () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        reject(new Error('Error al decodificar foto'));
      };
      img.src = objectUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Fallo al leer archivo'));
      reader.readAsDataURL(file);
    }
  });
};

export const ProductImageSelector: React.FC<ProductImageSelectorProps> = ({
  currentImage,
  onImageSelected,
  productName = '',
  barcode = '',
  isLight = false
}) => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Manejador ultra-seguro para cámara o archivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setProcessError(null);
      const compressedDataUrl = await compressImageSafely(file);
      onImageSelected(compressedDataUrl);
    } catch (err: any) {
      console.error('Error al procesar foto:', err);
      setProcessError('No se pudo procesar la foto. Intenta nuevamente.');
    } finally {
      setIsProcessing(false);
      if (e.target) {
        try {
          e.target.value = '';
        } catch {}
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Inputs Ocultos del Sistema para Foto y Galería */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        onClick={(e) => {
          e.stopPropagation();
        }}
      />

      {/* Barra de Vista Previa y Botones de Acción Inmediata */}
      <div className="flex items-center gap-2">
        {/* Thumbnail Preview */}
        <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-700 bg-slate-900 shrink-0 flex items-center justify-center relative">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          ) : currentImage ? (
            <img src={currentImage} alt="Foto" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="w-5 h-5 text-slate-500" />
          )}
        </div>

        {/* Botones de Acción Estilizados y Homogéneos */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          {/* Botón 1: Cámara */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              cameraInputRef.current?.click();
            }}
            disabled={isProcessing}
            className="flex-1 h-9 px-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            title="Tomar foto con la cámara"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Cámara</span>
          </button>

          {/* Botón 2: Google */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowSearchModal(true);
            }}
            disabled={isProcessing}
            className="flex-1 h-9 px-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            title="Buscar foto en Google"
          >
            <Search className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Google</span>
          </button>

          {/* Botón 3: Galería */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              galleryInputRef.current?.click();
            }}
            disabled={isProcessing}
            className="flex-1 h-9 px-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            title="Elegir foto de las descargas o galería"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Galería</span>
          </button>

          {currentImage && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onImageSelected('');
              }}
              className="h-9 px-2 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0"
              title="Quitar foto"
            >
              Quitar
            </button>
          )}
        </div>
      </div>

      {processError && (
        <p className="text-[10px] text-rose-400 font-bold">{processError}</p>
      )}

      {/* MODAL OFICIAL DE BÚSQUEDA EN GOOGLE E INTERNET (INTEGRADO INTERNAMENTE) */}
      <ProductImageSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        initialQuery={productName}
        barcode={barcode}
        onSelectImage={(dataUrl) => {
          onImageSelected(dataUrl);
          setShowSearchModal(false);
        }}
      />
    </div>
  );
};
