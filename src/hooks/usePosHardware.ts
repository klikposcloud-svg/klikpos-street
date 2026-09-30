'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { scaleService, WeightReading } from '@/lib/hardware/scale';
import { kickCashDrawer } from '@/lib/hardware/cash-drawer';
import { parseScaleBarcode, findProductByScalePLU } from '@/lib/hardware/scale-barcode';
import { soundEffects } from '@/lib/utils/sound';
import { LocalProduct } from '@/lib/db';

interface UsePosHardwareParams {
  productsRef: React.MutableRefObject<LocalProduct[]>;
  onAddToCart: (p: LocalProduct, qty?: number) => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export function usePosHardware({
  productsRef,
  onAddToCart,
  onShowToast,
}: UsePosHardwareParams) {
  // Estado de Balanza Digital
  const [scaleReading, setScaleReading] = useState<WeightReading>({
    weight: 0,
    unit: 'kg',
    isStable: true,
    raw: '',
    timestamp: Date.now(),
  });
  const [scaleConnected, setScaleConnected] = useState<boolean>(false);

  // Estado de Escáner Móvil QR
  const [showScannerModal, setShowScannerModal] = useState<boolean>(false);
  const [scannerUrl, setScannerUrl] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [phoneConnected, setPhoneConnected] = useState<boolean>(false);
  const [phoneDeviceName, setPhoneDeviceName] = useState<string>('');

  // Suscripción al bus de datos de balanza RS232 / USB
  useEffect(() => {
    const unsub = scaleService.onWeightChange((reading: WeightReading) => {
      setScaleReading(reading);
      setScaleConnected(true);
    });
    return () => {
      unsub();
    };
  }, []);

  // Procesador universal de código de barras (GS1 Balanza & EAN/UPC estándar)
  const processBarcodeScan = (scannedCode: string): boolean => {
    const code = (scannedCode || '').trim();
    if (!code) return false;

    // 1. Verificar si es etiqueta emitida por balanza (GS1 In-Store con PLU)
    const parsedScale = parseScaleBarcode(code);
    if (parsedScale) {
      const product = findProductByScalePLU(productsRef.current, parsedScale);
      if (product) {
        const weightKg = parsedScale.value;
        soundEffects.playBeep();
        onAddToCart(product, weightKg);
        onShowToast(`⚖️ Balanza [${parsedScale.prefix}]: ${product.name} (${parsedScale.formattedValue})`, 'success');
        return true;
      } else {
        soundEffects.playError();
        onShowToast(`Etiqueta de balanza detectada (${code}), pero el producto con PLU "${parsedScale.plu}" no existe.`, 'error');
        return false;
      }
    }

    // 2. Búsqueda por código de barras tradicional
    const exact = productsRef.current.find(
      (p) => p.barcode.toLowerCase() === code.toLowerCase()
    );
    if (exact) {
      soundEffects.playBeep();
      onAddToCart(exact, 1);
      onShowToast(`✓ Agregado: ${exact.name}`, 'success');
      return true;
    }

    return false;
  };

  // Abrir modal y generar QR para celular
  const openScannerModal = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/scanner?station=Caja1` : '';
    setScannerUrl(url);
    if (url) {
      try {
        const qr = await QRCode.toDataURL(url);
        setQrCodeDataUrl(qr);
      } catch {}
    }
    setShowScannerModal(true);
  };

  // Disparar apertura de gaveta
  const handleKickCashDrawer = async () => {
    try {
      const res = await kickCashDrawer();
      onShowToast(res.message, 'success');
    } catch {
      onShowToast('Error al enviar pulso a gaveta', 'error');
    }
  };

  return {
    scaleReading,
    scaleConnected,
    showScannerModal,
    setShowScannerModal,
    scannerUrl,
    qrCodeDataUrl,
    phoneConnected,
    phoneDeviceName,
    processBarcodeScan,
    openScannerModal,
    handleKickCashDrawer,
  };
}
