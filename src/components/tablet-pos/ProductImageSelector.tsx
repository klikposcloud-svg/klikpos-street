'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, Upload, Search, X, Loader2, RefreshCw } from 'lucide-react';
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
 * Utiliza createImageBitmap con resize o URL.createObjectURL para mantener el uso de RAM
 * inferior a 1.5MB y evitar que el sistema operativo mate el proceso del navegador.
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
        // NUNCA decodificar la foto cruda completa sin resize, causaría OOM en Android
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
      console.warn('[ImageCompress] Fallback a createObjectURL:', e);
    }
  }

  // Estrategia 2: URL.createObjectURL decodificado en canvas controlado
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
      reject(new Error('No se pudo leer el archivo'));
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
  const [showInAppCamera, setShowInAppCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Detener cámara en vivo
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Iniciar cámara en vivo interna (0 cierres de app, 0 recargas del sistema)
  const startInAppCamera = async (mode: 'environment' | 'user') => {
    stopCameraStream();
    setProcessError(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        setShowInAppCamera(false);
        cameraInputRef.current?.click();
      }
    } catch (err) {
      console.warn('[Camera] Fallback a cámara estándar del SO:', err);
      setShowInAppCamera(false);
      cameraInputRef.current?.click();
    }
  };

  // Disparador de foto desde la cámara interna
  const captureInAppPhoto = () => {
    if (!videoRef.current) return;
    try {
      setIsProcessing(true);
      const video = videoRef.current;
      const vWidth = video.videoWidth || 640;
      const vHeight = video.videoHeight || 640;
      const minDim = Math.min(vWidth, vHeight);
      const sx = (vWidth - minDim) / 2;
      const sy = (vHeight - minDim) / 2;

      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 400, 400);
        ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, 400, 400);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.80);
        onImageSelected(dataUrl);
      }
      stopCameraStream();
      setShowInAppCamera(false);
    } catch (err: any) {
      console.error('Error al capturar foto:', err);
      setProcessError('Error al capturar fotograma.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startInAppCamera(nextMode);
  };

  // Manejador ultra-seguro para archivo de galería
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
      {/* Inputs Ocultos de Respaldo */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        onClick={(e) => e.stopPropagation()}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        onClick={(e) => e.stopPropagation()}
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
          {/* Botón 1: Cámara en Vivo (Directa en pantalla, sin matar la app) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowInAppCamera(true);
              startInAppCamera(facingMode);
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

      {/* MODAL DE CÁMARA DIRECTA EN PANTALLA (CERO SALIDAS AL SISTEMA OPERATIVO) */}
      {showInAppCamera && (
        <div 
          className="fixed inset-0 z-[99999] bg-black/95 flex flex-col justify-between p-4 animate-in fade-in duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del Visor */}
          <div className="flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-white text-xs font-black uppercase tracking-wider">
                Cámara en Vivo • KlikPOS Street
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setShowInAppCamera(false);
              }}
              className="w-9 h-9 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Viewfinder Centrado Cuadrado */}
          <div className="flex-1 flex items-center justify-center my-3 relative overflow-hidden">
            <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-2xl bg-slate-900">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 border border-white/20 pointer-events-none rounded-2xl flex items-center justify-center">
                <div className="w-16 h-16 border-2 border-white/40 border-dashed rounded-xl pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Controles de Disparo */}
          <div className="flex items-center justify-around pb-6 pt-2 z-10 max-w-sm mx-auto w-full">
            {/* Voltear Cámara */}
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="p-3 rounded-full bg-slate-800/80 text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              title="Girar cámara (Frontal / Trasera)"
            >
              <RefreshCw className="w-6 h-6" />
            </button>

            {/* Botón Central de Disparo */}
            <button
              type="button"
              onClick={captureInAppPhoto}
              disabled={isProcessing}
              className="w-18 h-18 rounded-full border-4 border-emerald-400 bg-white hover:bg-emerald-50 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-emerald-500/30 cursor-pointer disabled:opacity-50"
              title="Capturar foto ahora"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                <Camera className="w-7 h-7" />
              </div>
            </button>

            {/* Fallback a Galería del teléfono si la cámara falla */}
            <button
              type="button"
              onClick={() => {
                stopCameraStream();
                setShowInAppCamera(false);
                galleryInputRef.current?.click();
              }}
              className="p-3 rounded-full bg-slate-800/80 text-slate-300 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
              title="Elegir de Galería"
            >
              <Upload className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL OFICIAL DE BÚSQUEDA EN GOOGLE E INTERNET */}
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
