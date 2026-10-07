'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  Radio, 
  Camera, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Share2, 
  Zap, 
  ShieldCheck, 
  Check, 
  UploadCloud,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import { PagoMovilInfo } from '@/types/tablet-pos';
import { DEFAULT_WEBHOOK_SECRET, getWebhookSecret } from '@/lib/payments/pago-movil-webhook-store';

interface PagoMovilSmartValidatorProps {
  isLight: boolean;
  totalVES: number;
  totalUSD: number;
  bcvRate: number;
  pagoMovilInfo: PagoMovilInfo;
  pagoMovilRefInput: string;
  setPagoMovilRefInput: (val: string) => void;
  onAutoConfirmSale?: () => void;
  primaryColor?: string;
}

interface WebhookPaymentItem {
  id: string;
  referencia: string;
  monto: number;
  banco: string;
  telefono?: string;
  pagador?: string;
  timestamp: number;
  used: boolean;
}

export function PagoMovilSmartValidator({
  isLight,
  totalVES,
  totalUSD,
  bcvRate,
  pagoMovilInfo,
  pagoMovilRefInput,
  setPagoMovilRefInput,
  onAutoConfirmSale,
  primaryColor = '#10b981'
}: PagoMovilSmartValidatorProps) {
  // Pestaña activa: 'qr' (QR Dinámico) | 'live' (Detector Webhook) | 'ocr' (Escanear Recibo)
  const [activeTab, setActiveTab] = useState<'qr' | 'live' | 'ocr'>('qr');

  // Estado del QR
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Estado del Detector en Vivo (Webhook)
  const [isPollingLive, setIsPollingLive] = useState(true);
  const [liveMatchedPayment, setLiveMatchedPayment] = useState<WebhookPaymentItem | null>(null);
  const [recentPayments, setRecentPayments] = useState<WebhookPaymentItem[]>([]);
  const [isSimulatingTestPayment, setIsSimulatingTestPayment] = useState(false);

  // Estado del Escáner OCR de Recibo
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const [receiptAnalysisResult, setReceiptAnalysisResult] = useState<{
    banco?: string;
    referencia?: string;
    montoVES?: number;
    pagador?: string;
    fechaHora?: string;
    esComprobanteValido?: boolean;
    confianza?: string;
    matchesExpectedAmount?: boolean;
  } | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extraer código de banco y datos con fallbacks blindados (Cero Excepciones)
  const safeBank = pagoMovilInfo?.bank || '0134 - Banesco Banco Universal';
  const bankCode = safeBank.includes(' - ') ? safeBank.split(' - ')[0].trim() : (safeBank.slice(0, 4) || '0134');
  const cleanPhone = (pagoMovilInfo?.phone || '04248298026').replace(/[^0-9]/g, '');
  const cleanDoc = (pagoMovilInfo?.idDoc || 'V-20123456').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const safeOwner = pagoMovilInfo?.ownerName || 'KlikPOS Inversiones C.A.';
  const safeTotalVES = typeof totalVES === 'number' && !isNaN(totalVES) ? totalVES : 0;
  const safeTotalUSD = typeof totalUSD === 'number' && !isNaN(totalUSD) ? totalUSD : 0;
  const safeBcvRate = typeof bcvRate === 'number' && !isNaN(bcvRate) && bcvRate > 0 ? bcvRate : 871.37;

  // Cadena oficial de Sudeban / Interbancario para Pago Móvil dinámico
  const sudebanPayload = `PAGOMOVIL|${bankCode}|${cleanDoc}|${cleanPhone}|${safeTotalVES.toFixed(2)}|KLIKPOS`;

  // 1. Generar código QR dinámico con el monto exacto
  useEffect(() => {
    let isMounted = true;
    if (totalVES > 0) {
      QRCode.toDataURL(sudebanPayload, {
        width: 240,
        margin: 1,
        color: {
          dark: '#020617',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      })
        .then((url) => {
          if (isMounted) setQrDataUrl(url);
        })
        .catch((err) => {
          console.error('[PagoMovilSmartValidator] Error generando QR:', err);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [sudebanPayload, totalVES]);

  // 2. Polling del Webhook en Vivo (Busca pagos recibidos que coincidan con totalVES)
  useEffect(() => {
    if (!isPollingLive || totalVES <= 0) return;

    let intervalId: NodeJS.Timeout;

    const checkIncomingPayments = async () => {
      try {
        const secret = getWebhookSecret();
        const res = await fetch(`/api/payments/webhook?match_ves=${totalVES.toFixed(2)}&tolerance=2&secret=${encodeURIComponent(secret)}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.match && !data.match.used) {
            setLiveMatchedPayment(data.match);
            // Si la referencia actual está vacía, pre-cargar la detectada
            if (!pagoMovilRefInput) {
              setPagoMovilRefInput(data.match.referencia);
            }
          }
        }
      } catch (err) {
        // Silencioso en caso de desconexión momentánea
      }
    };

    // Ejecutar chequeo inicial y luego cada 3 segundos
    checkIncomingPayments();
    intervalId = setInterval(checkIncomingPayments, 3000);

    return () => clearInterval(intervalId);
  }, [isPollingLive, totalVES, pagoMovilRefInput, setPagoMovilRefInput]);

  // 3. Consultar últimos pagos para la pestaña del detector
  const fetchRecentPayments = async () => {
    try {
      const secret = getWebhookSecret();
      const res = await fetch(`/api/payments/webhook?secret=${encodeURIComponent(secret)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.payments)) {
          setRecentPayments(data.payments);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (activeTab === 'live') {
      fetchRecentPayments();
    }
  }, [activeTab]);

  // Manejador de copia al portapapeles
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  // Compartir por WhatsApp con el cliente
  const handleShareWhatsApp = () => {
    const text = 
      `*PAGO MÓVIL KLIKPOS*\n` +
      `🏦 *Banco:* ${safeBank}\n` +
      `📱 *Teléfono:* ${cleanPhone}\n` +
      `📄 *Cédula/RIF:* ${cleanDoc}\n` +
      `👤 *Titular:* ${safeOwner}\n` +
      `💰 *Monto exacto:* Bs. ${safeTotalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
      `(Ref: $${safeTotalUSD.toFixed(2)} a tasa BCV Bs. ${safeBcvRate.toFixed(2)})\n\n` +
      `_Por favor envíanos la captura o el número de referencia al realizar la transferencia._`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Simulación de prueba para entrenamiento de cajero / demostración
  const handleSimulateTestPayment = async () => {
    setIsSimulatingTestPayment(true);
    try {
      const secret = getWebhookSecret();
      const testRef = Math.floor(100000 + Math.random() * 900000).toString();
      const res = await fetch(
        `/api/payments/webhook?action=test&monto=${totalVES.toFixed(2)}&banco=Banco+de+Venezuela&ref=${testRef}&secret=${encodeURIComponent(secret)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.payment) {
          setLiveMatchedPayment(data.payment);
          setPagoMovilRefInput(data.payment.referencia);
          fetchRecentPayments();
        }
      }
    } catch (err) {
      console.error('Error simulando pago:', err);
    } finally {
      setIsSimulatingTestPayment(false);
    }
  };

  // Aplicar pago detectado en vivo
  const handleApplyLivePayment = async (item: WebhookPaymentItem) => {
    setPagoMovilRefInput(item.referencia);
    // Marcar como usado en el webhook store
    try {
      const secret = getWebhookSecret();
      await fetch(`/api/payments/webhook?mark_used=${item.referencia}&secret=${encodeURIComponent(secret)}`);
    } catch {}

    if (onAutoConfirmSale) {
      onAutoConfirmSale();
    }
  };

  // Procesamiento de captura de recibo cumpliendo la DIRECTIVA QUIRÚRGICA ANTI-REGRESIÓN
  // (createImageBitmap por hardware, memoria < 1.5MB, nunca FileReader directo en imagen cruda)
  const handleReceiptFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingReceipt(true);
    setReceiptError(null);
    setReceiptAnalysisResult(null);

    let objectUrlToRevoke: string | null = null;

    try {
      let base64Image = '';

      // Compresión por hardware obligatoria (Directiva Cero Regresión)
      if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
        try {
          const bitmap = await createImageBitmap(file, {
            resizeWidth: 800,
            resizeQuality: 'medium'
          });
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(bitmap, 0, 0);
            base64Image = canvas.toDataURL('image/jpeg', 0.82);
          }
          bitmap.close();
        } catch (bitmapErr) {
          console.warn('[ReceiptScanner] Fallback createImageBitmap:', bitmapErr);
        }
      }

      // Fallback seguro con createObjectURL
      if (!base64Image) {
        objectUrlToRevoke = URL.createObjectURL(file);
        setReceiptPreviewUrl(objectUrlToRevoke);
        const img = new Image();
        img.src = objectUrlToRevoke;
        await new Promise((resolve, reject) => {
          img.onload = () => resolve(true);
          img.onerror = reject;
        });
        const canvas = document.createElement('canvas');
        const maxW = 800;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          base64Image = canvas.toDataURL('image/jpeg', 0.82);
        }
      } else {
        setReceiptPreviewUrl(base64Image);
      }

      // Enviar a la API de análisis antifraude
      const apiKey = localStorage.getItem('klikpos_gemini_api_key') || '';
      const response = await fetch('/api/payments/verify-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          expectedVES: totalVES,
          expectedBank: pagoMovilInfo.bank,
          apiKey
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || 'Error al analizar el comprobante bancario');
      }

      if (resData.data) {
        setReceiptAnalysisResult(resData.data);
        if (resData.data.referencia) {
          setPagoMovilRefInput(resData.data.referencia);
        }
      }
    } catch (err: any) {
      console.error('[Receipt Analysis Error]:', err);
      setReceiptError(err.message || 'No se pudo leer el comprobante. Ingrese la referencia manualmente.');
    } finally {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
      setIsAnalyzingReceipt(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className={`rounded-2xl border transition-all space-y-3.5 p-3.5 shadow-xs ${
      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
    }`}>
      {/* ─── Encabezado y Selector de Métodos de Validación ─── */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wide text-slate-900 dark:text-white">
            Pago Móvil Inteligente
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">Total a Cobrar</span>
          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
            Bs. {totalVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* ─── Pestañas de Interacción Rápida ─── */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab('qr')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all ${
            activeTab === 'qr'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>QR Dinámico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('live')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all relative ${
            activeTab === 'live'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
          <span>Detector en Vivo</span>
          {liveMatchedPayment && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ocr')}
          className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all ${
            activeTab === 'ocr'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-amber-500" />
          <span>Escanear Recibo</span>
        </button>
      </div>

      {/* ─── PESTAÑA 1: QR DINÁMICO INTERBANCARIO (SUDEBAN/BCV) ─── */}
      {activeTab === 'qr' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            {/* Visualización del QR */}
            <div className="relative p-2 bg-white rounded-xl shadow-xs border border-slate-200 shrink-0">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR Pago Móvil Dinámico"
                  className="w-36 h-36 object-contain"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center bg-slate-100 rounded-lg">
                  <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              )}
              <div className="text-[9px] font-black text-center text-slate-600 uppercase mt-1 tracking-tighter">
                Escanear con App Bancaria
              </div>
            </div>

            {/* Datos para Copiar / Transferir */}
            <div className="flex-1 w-full space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500">Banco:</span>
                <span className="font-black text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                  {safeBank}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(safeBank, 'banco')}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"
                  title="Copiar Banco"
                >
                  {copiedItem === 'banco' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500">Teléfono:</span>
                <span className="font-black font-mono text-slate-900 dark:text-white">
                  {cleanPhone}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(cleanPhone, 'tel')}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"
                  title="Copiar Teléfono"
                >
                  {copiedItem === 'tel' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-1.5 bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500">Cédula/RIF:</span>
                <span className="font-black font-mono text-slate-900 dark:text-white">
                  {cleanDoc}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(cleanDoc, 'doc')}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"
                  title="Copiar Documento"
                >
                  {copiedItem === 'doc' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between p-1.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">Monto Exacto:</span>
                <span className="font-black font-mono text-emerald-700 dark:text-emerald-300">
                  Bs. {safeTotalVES.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(safeTotalVES.toFixed(2), 'monto')}
                  className="p-1 hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded text-emerald-700 dark:text-emerald-400"
                  title="Copiar Monto"
                >
                  {copiedItem === 'monto' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Botones de Acción de Compartir */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-xs active:scale-98 transition-all"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar Datos por WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const fullText = `PAGO MÓVIL:\nBanco: ${safeBank}\nTel: ${cleanPhone}\nDoc: ${cleanDoc}\nTitular: ${safeOwner}\nMonto: Bs. ${safeTotalVES.toFixed(2)}`;
                handleCopy(fullText, 'todos');
              }}
              className="py-2 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1 transition-all"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedItem === 'todos' ? '¡Copiado!' : 'Copiar Todo'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── PESTAÑA 2: DETECTOR EN VIVO (WEBHOOK & SMS POLLING) ─── */}
      {activeTab === 'live' && (
        <div className="space-y-3">
          {/* Banner de Pago Encontrado en Vivo */}
          {liveMatchedPayment ? (
            <div className="p-3 bg-emerald-500/15 border-2 border-emerald-500 rounded-xl space-y-2 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="text-xs font-black">¡PAGO MÓVIL DETECTADO EN VIVO!</h4>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300">
                    Se recibió una transferencia bancaria coincidente en el banco de la empresa.
                  </p>
                </div>
              </div>

              <div className="p-2 bg-white dark:bg-slate-900 rounded-lg text-xs font-mono space-y-0.5 border border-emerald-500/30">
                <p><b>Banco:</b> {liveMatchedPayment.banco}</p>
                <p><b>Referencia:</b> <span className="text-emerald-600 font-black">{liveMatchedPayment.referencia}</span></p>
                <p><b>Monto Recibido:</b> Bs. {liveMatchedPayment.monto.toFixed(2)}</p>
                {liveMatchedPayment.pagador && <p><b>Pagador:</b> {liveMatchedPayment.pagador}</p>}
                {liveMatchedPayment.telefono && <p><b>Teléfono:</b> {liveMatchedPayment.telefono}</p>}
              </div>

              <button
                type="button"
                onClick={() => handleApplyLivePayment(liveMatchedPayment)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>⚡ Conciliar y Asignar Referencia #{liveMatchedPayment.referencia}</span>
              </button>
            </div>
          ) : (
            <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-xl text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-sky-600 dark:text-sky-400">
                <Radio className="w-4 h-4 animate-ping" />
                <span className="text-xs font-black">Escuchando Pagos en Tiempo Real</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Esperando confirmación SMS o push de su banco por <b>Bs. {totalVES.toFixed(2)}</b>. Cuando el cliente pague, aparecerá aquí automáticamente.
              </p>
              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateTestPayment}
                  disabled={isSimulatingTestPayment}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-black rounded-lg shadow-xs active:scale-95 transition-all flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  <span>{isSimulatingTestPayment ? 'Simulando...' : '🧪 Probar con Pago Simulado'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Historial de últimos pagos recibidos en la cuenta */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-500 uppercase">
              Últimas Transferencias Recibidas en la Cuenta:
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {recentPayments.length === 0 ? (
                <div className="text-[11px] text-slate-400 italic p-2 text-center bg-slate-100 dark:bg-slate-900 rounded-lg">
                  No hay pagos registrados recientemente en el buffer.
                </div>
              ) : (
                recentPayments.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                      p.used
                        ? 'bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <span>{p.banco}</span>
                        <span className="font-mono text-emerald-600">Ref: {p.referencia}</span>
                        {p.used && <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-1 rounded">Usado</span>}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {p.pagador ? `De: ${p.pagador} • ` : ''}Bs. {p.monto.toFixed(2)}
                      </div>
                    </div>
                    {!p.used && (
                      <button
                        type="button"
                        onClick={() => handleApplyLivePayment(p)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-bold"
                      >
                        Usar
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── PESTAÑA 3: ESCANEAR RECIBO (OCR ANTIFRAUDE CON GEMINI VISION) ─── */}
      {activeTab === 'ocr' && (
        <div className="space-y-3">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleReceiptFileSelected}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-white/50 dark:bg-slate-900/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-center"
          >
            <Camera className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-white">
                Tome una foto o suba la captura del comprobante
              </p>
              <p className="text-[10px] text-slate-500">
                La IA antifraude extraerá la referencia, banco y validará que el monto coincida con la cuenta.
              </p>
            </div>
          </div>

          {isAnalyzingReceipt && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-amber-600 text-xs font-bold">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analizando comprobante bancario por hardware y visión artificial...</span>
            </div>
          )}

          {receiptError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-600 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{receiptError}</span>
            </div>
          )}

          {receiptAnalysisResult && (
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Comprobante Analizado
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  receiptAnalysisResult.matchesExpectedAmount ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {receiptAnalysisResult.matchesExpectedAmount ? 'Monto Correcto' : 'Discrepancia en Monto'}
                </span>
              </div>

              <div className="text-xs font-mono space-y-0.5 text-slate-800 dark:text-slate-200">
                <p><b>Banco Detectado:</b> {receiptAnalysisResult.banco || 'No identificado'}</p>
                <p><b>Referencia Extraída:</b> <span className="font-bold text-emerald-600">{receiptAnalysisResult.referencia || 'S/R'}</span></p>
                <p><b>Monto en Recibo:</b> Bs. {receiptAnalysisResult.montoVES?.toFixed(2) || '0.00'}</p>
                {receiptAnalysisResult.fechaHora && <p><b>Fecha/Hora:</b> {receiptAnalysisResult.fechaHora}</p>}
                {receiptAnalysisResult.pagador && <p><b>Pagador:</b> {receiptAnalysisResult.pagador}</p>}
              </div>

              {receiptAnalysisResult.referencia && (
                <button
                  type="button"
                  onClick={() => setPagoMovilRefInput(receiptAnalysisResult.referencia || '')}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 active:scale-98 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Usar Referencia #{receiptAnalysisResult.referencia}</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── CAJA DE TEXTO DE REFERENCIA (ALTO CONTRASTE EXTERIOR PERMANENTE) ─── */}
      <div className="pt-1">
        <label className="block text-xs font-black mb-1 text-slate-900 dark:text-white flex items-center justify-between">
          <span>Número de Referencia Bancaria (4 a 8 dígitos):</span>
          {pagoMovilRefInput && (
            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Referencia Ingresada
            </span>
          )}
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Ej: 948271"
            value={pagoMovilRefInput}
            onChange={(e) => setPagoMovilRefInput(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono font-bold bg-white border-2 border-emerald-500 text-slate-950 placeholder-slate-400 outline-none shadow-sm focus:ring-2 focus:ring-emerald-400/50"
          />
        </div>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
          💡 La referencia puede venir del QR, del detector en vivo, de la foto del recibo o escrita a mano.
        </span>
      </div>
    </div>
  );
}
