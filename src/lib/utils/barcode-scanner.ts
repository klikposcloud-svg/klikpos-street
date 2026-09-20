import { Html5Qrcode, Html5QrcodeSupportedFormats, type QrcodeErrorCallback, type QrcodeSuccessCallback } from 'html5-qrcode'
import { venematicDB } from '@/lib/indexeddb/db'
import type { IDBProduct } from '@/lib/indexeddb/db'

export interface ScanResult {
  type: 'barcode' | 'qr'
  value: string
  product: IDBProduct | null
}

export interface ScannerState {
  isScanning: boolean
  lastResult: ScanResult | null
  error: string | null
  cameraPermission: 'granted' | 'denied' | 'prompt'
}

export class BarcodeScanner {
  private html5QrCode: Html5Qrcode | null = null
  private onScanCallback: ((result: ScanResult) => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null

  async initialize(elementId: string): Promise<void> {
    this.html5QrCode = new Html5Qrcode(elementId)

    const permission = await navigator.permissions.query({ name: 'camera' as PermissionName })
    const cameraPermission = permission.state as 'granted' | 'denied' | 'prompt'

    if (cameraPermission === 'denied') {
      throw new Error('Camera permission denied')
    }
  }

  async startScanning(
    onScan: (result: ScanResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.html5QrCode) {
      throw new Error('Scanner not initialized')
    }

    this.onScanCallback = onScan
    this.onErrorCallback = onError

    const config = {
      fps: 15,
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.0,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_93,
        Html5QrcodeSupportedFormats.ITF,
      ],
    }

    const successCallback: QrcodeSuccessCallback = async (decodedText: string) => {
      const result = await this.processScan(decodedText)
      if (this.onScanCallback) {
        this.onScanCallback(result)
      }
    }

    const errorCallback: QrcodeErrorCallback = (errorMessage: string) => {
      if (this.onErrorCallback && errorMessage.includes('NotFoundException')) {
        return
      }
    }

    try {
      await this.html5QrCode.start(
        { facingMode: 'environment' },
        config,
        successCallback,
        errorCallback
      )
    } catch (error) {
      if (this.onErrorCallback) {
        this.onErrorCallback('Failed to start camera. Please check permissions.')
      }
    }
  }

  async stopScanning(): Promise<void> {
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.stop()
      } catch (error) {
        console.error('Error stopping scanner:', error)
      }
    }
  }

  async processScan(value: string): Promise<ScanResult> {
    const isQR = value.length > 20 || value.includes('http') || value.includes('{')

    let product: IDBProduct | null = null
    if (!isQR) {
      product = await venematicDB.getProductByBarcode(value)
    }

    return {
      type: isQR ? 'qr' : 'barcode',
      value,
      product,
    }
  }

  async scanFromImage(imageFile: File): Promise<ScanResult> {
    if (!this.html5QrCode) {
      this.html5QrCode = new Html5Qrcode('hidden-scanner')
    }

    try {
      const result = await this.html5QrCode.scanFile(imageFile, false)
      return this.processScan(result)
    } catch (error) {
      throw new Error('No barcode found in image')
    }
  }

  cleanup(): void {
    if (this.html5QrCode) {
      this.html5QrCode.clear()
    }
  }
}
