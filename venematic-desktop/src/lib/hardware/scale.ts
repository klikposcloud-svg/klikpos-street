// scale.ts - Controlador y Conector de Balanza Digital Comercial
// Compatible con Web Serial API (Chrome, Edge, Tauri WebView2)
// Soporta protocolos: Torrey, CAS, Toledo, Systel, Dibal y Genérico Continuo

export type ScaleProtocol = 'torrey' | 'cas' | 'toledo' | 'systel' | 'generic';
export type PriceMultiplierBasis = '1kg' | '100g' | '1g'; // Base de cálculo del precio para pesables

export interface ScaleConfig {
  enabled: boolean;
  baudRate: number;
  protocol: ScaleProtocol;
  autoWeight: boolean; // Si true, al elegir un producto por kilo toma el peso automáticamente
  defaultInputUnit: 'kg' | 'g'; // Entrada preferida en el mostrador: kg o gramos
  priceBasis: PriceMultiplierBasis; // Multiplicador de precio: 1kg (1000g), 100g, o 1g
  manualWeightPrompt: boolean; // Si no hay balanza conectada, abrir modal manual al tocar producto pesable
}

export function calculateWeightPrice(params: {
  weight: number;
  inputUnit: 'kg' | 'g';
  priceUSD: number;
  priceBasis?: PriceMultiplierBasis;
}) {
  const { weight, inputUnit, priceUSD, priceBasis = '1kg' } = params;
  const weightInKg = inputUnit === 'kg' ? weight : weight / 1000;
  const weightInGrams = inputUnit === 'g' ? weight : weight * 1000;

  let multiplier = weightInKg; // Por defecto: base 1000g (1 kg)
  if (priceBasis === '100g') {
    // Si el comercio publica el precio por cada 100g (ej: charcutería $1.20 los 100g)
    multiplier = weightInGrams / 100;
  } else if (priceBasis === '1g') {
    multiplier = weightInGrams;
  }

  const totalUSD = multiplier * priceUSD;
  return {
    weightInKg,
    weightInGrams,
    multiplier,
    totalUSD,
  };
}

export interface WeightReading {
  weight: number; // En kilogramos (ej: 0.850)
  unit: 'kg' | 'lb' | 'g';
  isStable: boolean;
  raw: string;
  timestamp: number;
}

type WeightListener = (reading: WeightReading) => void;

class ScaleService {
  private port: any | null = null;
  private reader: any | null = null;
  private keepReading = false;
  private listeners: Set<WeightListener> = new Set();
  private lastReading: WeightReading = {
    weight: 0,
    unit: 'kg',
    isStable: true,
    raw: '',
    timestamp: Date.now(),
  };

  private config: ScaleConfig = {
    enabled: true,
    baudRate: 9600,
    protocol: 'torrey',
    autoWeight: true,
    defaultInputUnit: 'g', // Gramos por defecto para mostrador tradicional
    priceBasis: '1kg',
    manualWeightPrompt: true,
  };

  constructor() {
    this.loadSavedConfig();
  }

  // Cargar configuración guardada en localStorage
  private loadSavedConfig() {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('venematic_scale_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {}
  }

  public saveConfig(cfg: Partial<ScaleConfig>) {
    this.config = { ...this.config, ...cfg };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('venematic_scale_config', JSON.stringify(this.config));
      } catch {}
    }
  }

  public getConfig(): ScaleConfig {
    return { ...this.config };
  }

  // Verifica si el navegador soporta Web Serial API
  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public isConnected(): boolean {
    return this.port !== null;
  }

  public getLastReading(): WeightReading {
    return this.lastReading;
  }

  // Suscribirse a cambios de peso
  public onWeightChange(listener: WeightListener): () => void {
    this.listeners.add(listener);
    // Emitir última lectura inmediatamente
    listener(this.lastReading);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(reading: WeightReading) {
    this.lastReading = reading;
    this.listeners.forEach((fn) => {
      try {
        fn(reading);
      } catch (err) {
        console.error('Error in scale listener:', err);
      }
    });
  }

  // Solicitar permiso y conectar al puerto COM de la balanza
  public async connect(overrideConfig?: Partial<ScaleConfig>): Promise<{ success: boolean; error?: string }> {
    if (!this.isSupported()) {
      return {
        success: false,
        error: 'Tu navegador o entorno no soporta Web Serial API. Usa Google Chrome, Microsoft Edge o la app Desktop de Venematic.',
      };
    }

    if (overrideConfig) {
      this.saveConfig(overrideConfig);
    }

    try {
      if (this.port) {
        await this.disconnect();
      }

      // Abre el diálogo nativo de selección de dispositivo USB-Serial
      const navSerial = (navigator as any).serial;
      this.port = await navSerial.requestPort();

      await this.port.open({
        baudRate: this.config.baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
      });

      this.keepReading = true;
      this.startReadingLoop();

      return { success: true };
    } catch (err: any) {
      this.port = null;
      console.warn('Error al conectar balanza:', err);
      return {
        success: false,
        error: err.name === 'NotFoundError' ? 'No seleccionaste ningún puerto.' : err.message || 'Error al conectar con el puerto COM.',
      };
    }
  }

  // Bucle de lectura asíncrono
  private async startReadingLoop() {
    if (!this.port || !this.port.readable) return;

    let textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let buffer = '';

    try {
      while (this.keepReading && this.reader) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          // Las balanzas envían tramas delimitadas por \r o \n
          const lines = buffer.split(/[\r\n]+/);
          if (lines.length > 1) {
            // Procesamos las líneas completas excepto el remanente
            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i].trim();
              if (line) {
                const parsed = this.parseRawWeight(line, this.config.protocol);
                if (parsed) {
                  this.emit(parsed);
                }
              }
            }
            buffer = lines[lines.length - 1];
          }
        }
      }
    } catch (err) {
      console.warn('Lectura de balanza finalizada o interrumpida:', err);
    } finally {
      if (this.reader) {
        try {
          this.reader.releaseLock();
        } catch {}
      }
      this.reader = null;
    }
  }

  // Parsear tramas según el protocolo
  public parseRawWeight(raw: string, protocol: ScaleProtocol): WeightReading | null {
    if (!raw) return null;
    const clean = raw.trim();

    let weight = 0;
    let unit: 'kg' | 'lb' | 'g' = 'kg';
    let isStable = true;

    if (protocol === 'torrey') {
      // Formato Torrey común: "ST,GS,  1.250kg" o "  0.450" o "US,GS,  1.250kg"
      isStable = !clean.startsWith('US'); // US = Unstable, ST = Stable
      const numMatch = clean.match(/[-+]?\s*([0-9]+\.?[0-9]*)/);
      if (numMatch) {
        weight = parseFloat(numMatch[1]);
      }
      if (clean.toLowerCase().includes('lb')) unit = 'lb';
    } else if (protocol === 'cas') {
      // Formato CAS: "ST,GS,+  0.500kg"
      isStable = clean.includes('ST');
      const numMatch = clean.match(/[-+]?\s*([0-9]+\.?[0-9]*)/);
      if (numMatch) {
        weight = parseFloat(numMatch[1]);
      }
    } else if (protocol === 'toledo') {
      // Formato Toledo: "S      0.750 kg"
      isStable = clean.startsWith('S');
      const numMatch = clean.match(/([0-9]+\.[0-9]+)/);
      if (numMatch) {
        weight = parseFloat(numMatch[1]);
      }
    } else {
      // Genérico / Cualquier número decimal en la trama
      const numMatch = clean.match(/([0-9]+\.[0-9]{2,3})/);
      if (numMatch) {
        weight = parseFloat(numMatch[1]);
      } else {
        const anyNum = clean.match(/([0-9]+)/);
        if (anyNum) weight = parseFloat(anyNum[1]) / 1000;
      }
    }

    if (isNaN(weight) || weight < 0) return null;

    return {
      weight,
      unit,
      isStable,
      raw: clean,
      timestamp: Date.now(),
    };
  }

  // Enviar comando para solicitar peso (para balanzas bajo demanda)
  public async requestWeight(): Promise<number> {
    if (this.port && this.port.writable) {
      try {
        const writer = this.port.writable.getWriter();
        // Comando W o P estándar según protocolo
        const cmd = this.config.protocol === 'torrey' ? 'P\r\n' : 'W\r\n';
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(cmd));
        writer.releaseLock();
      } catch (err) {
        console.warn('Error enviando comando a balanza:', err);
      }
    }
    return this.lastReading.weight;
  }

  // Desconectar el puerto COM
  public async disconnect(): Promise<void> {
    this.keepReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {}
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch {}
      this.port = null;
    }
    this.emit({
      weight: 0,
      unit: 'kg',
      isStable: true,
      raw: 'Desconectado',
      timestamp: Date.now(),
    });
  }

  // Simular peso (útil para pruebas y desarrollo en PC sin balanza física conectada)
  public simulateWeight(kg: number) {
    this.emit({
      weight: Math.max(0, kg),
      unit: 'kg',
      isStable: true,
      raw: `SIM:${kg.toFixed(3)}kg`,
      timestamp: Date.now(),
    });
  }

  // Ingreso manual de peso para comercios con balanzas tradicionales no conectadas al PC
  public setManualWeight(weight: number, unit: 'kg' | 'g' = 'kg') {
    const weightInKg = unit === 'kg' ? weight : weight / 1000;
    this.emit({
      weight: Math.max(0, weightInKg),
      unit: 'kg',
      isStable: true,
      raw: `MANUAL:${weight}${unit}`,
      timestamp: Date.now(),
    });
  }

  public clearManualWeight() {
    this.emit({
      weight: 0,
      unit: 'kg',
      isStable: true,
      raw: 'MANUAL:0',
      timestamp: Date.now(),
    });
  }
}

export const scaleService = new ScaleService();
