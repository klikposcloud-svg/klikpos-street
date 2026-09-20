'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { playBeep } from '@/lib/utils/sound'

interface CameraScannerModalProps {
  isOpen: boolean
  onClose: () => void
  onScan: (barcode: string) => void
  sessionId: string
}

export function CameraScannerModal({
  isOpen,
  onClose,
  onScan,
  sessionId,
}: CameraScannerModalProps) {
  const [activeTab, setActiveTab] = useState<'camera' | 'remote'>('camera')
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null)
  const [scannerUrl, setScannerUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastTimeRef = useRef<{ [k: string]: number }>({})
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    fetch('/api/server-info')
      .then((r) => r.json())
      .then((data) => {
        setScannerUrl(`${data.baseUrl}/scanner?session=${sessionId}`)
      })
      .catch(() => {
        if (typeof window !== 'undefined') {
          setScannerUrl(`${window.location.origin}/scanner?session=${sessionId}`)
        }
      })
  }, [sessionId])

  useEffect(() => {
    if (activeTab === 'remote' && scannerUrl && qrCanvasRef.current) {
      import('qrcode').then(({ default: QRCode }) => {
        if (qrCanvasRef.current) {
          QRCode.toCanvas(qrCanvasRef.current, scannerUrl, {
            width: 200,
            margin: 1,
            color: { dark: '#0f172a', light: '#ffffff' },
          })
        }
      })
    }
  }, [activeTab, scannerUrl, isOpen])

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, activeTab])

  const startCamera = async () => {
    try {
      setCameraError(null)
      // Dar un pequeño delay para que el DOM renderice el elemento #pos-local-reader
      setTimeout(async () => {
        try {
          if (!document.getElementById('pos-local-reader')) return
          const scanner = new Html5Qrcode('pos-local-reader')
          scannerRef.current = scanner

          const config = {
            fps: 15,
            qrbox: { width: 260, height: 160 },
            aspectRatio: 1.0,
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.QR_CODE,
            ],
          }

          await scanner.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              const code = decodedText.trim()
              const now = Date.now()
              if (now - (lastTimeRef.current[code] || 0) < 1500) return
              lastTimeRef.current[code] = now

              setLastScannedCode(code)
              playBeep(2100, 0.08)
              onScan(code)
            },
            () => {}
          )
          setIsCameraActive(true)
        } catch (err: any) {
          console.error('Error starting POS local camera:', err)
          setCameraError('No se pudo acceder a la cámara. Asegúrate de dar permisos.')
          setIsCameraActive(false)
        }
      }, 200)
    } catch (err: any) {
      setCameraError('Error al inicializar cámara.')
    }
  }

  const stopCamera = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        // ignore
      }
      setIsCameraActive(false)
    }
  }

  const copyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(scannerUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  if (!isOpen) return null

  // URL del código QR para vincular el celular
  const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    scannerUrl
  )}`

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Escáner de Códigos de Barra
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sustituto de lector de POS con cámara
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 flex gap-2 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-850">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'camera'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Cámara Local / Web</span>
          </button>

          <button
            onClick={() => setActiveTab('remote')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'remote'
                ? 'border-blue-600 text-blue-600 bg-white dark:bg-slate-800 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Vincular Celular Inalámbrico</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold mb-2">{cameraError}</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-4/3 flex items-center justify-center shadow-inner">
                  <div id="pos-local-reader" className="w-full h-full" />
                </div>
              )}

              {lastScannedCode && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs text-emerald-800 dark:text-emerald-200 font-bold">
                      Código leído: <strong className="font-mono">{lastScannedCode}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-white">
                    Agregado al carrito ✓
                  </span>
                </div>
              )}

              <p className="text-xs text-slate-500 text-center">
                Apunta cualquier código de barra o QR hacia la cámara para agregarlo de inmediato a la orden.
              </p>
            </div>
          )}

          {activeTab === 'remote' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md">
                <canvas ref={qrCanvasRef} className="rounded-lg" />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Sesión activa: {sessionId}
                </span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Escanea con tu celular para usarlo como escáner inalámbrico
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Cualquier código que escanees con tu teléfono se transmitirá instantáneamente a esta laptop.
                </p>
              </div>

              {/* Enlace directo para abrir o copiar */}
              <div className="w-full flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={scannerUrl}
                  className="flex-1 text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 select-all font-mono"
                />
                <button
                  onClick={copyLink}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
