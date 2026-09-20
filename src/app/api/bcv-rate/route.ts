import { NextResponse } from 'next/server'

interface BcvRateResponse {
  rate: number
  date: string
  source: string
  updatedAt: string
}

let memoryCache: {
  data: BcvRateResponse | null
  timestamp: number
} = {
  data: null,
  timestamp: 0,
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora en caché

async function fetchFromDolarApi(): Promise<BcvRateResponse | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    })
    clearTimeout(timeoutId)

    if (!res.ok) return null
    const data = await res.json()
    if (data && typeof data.promedio === 'number' && data.promedio > 0) {
      return {
        rate: Number(data.promedio.toFixed(4)),
        date: data.fechaActualizacion ? data.fechaActualizacion.split('T')[0] : new Date().toISOString().split('T')[0],
        source: 'BCV Oficial (DolarApi)',
        updatedAt: new Date().toISOString()
      }
    }
  } catch (err) {
    console.warn('DolarApi fetch failed:', err)
  }
  return null
}

async function fetchFromDolarVzla(): Promise<BcvRateResponse | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    const res = await fetch('https://rates.dolarvzla.com/bcv/current.json', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    })
    clearTimeout(timeoutId)

    if (!res.ok) return null
    const data = await res.json()
    const usd = data?.current?.usd
    if (typeof usd === 'number' && usd > 0) {
      return {
        rate: Number(usd.toFixed(4)),
        date: data.current.date || new Date().toISOString().split('T')[0],
        source: 'BCV Oficial (DolarVzla)',
        updatedAt: new Date().toISOString()
      }
    }
  } catch (err) {
    console.warn('DolarVzla fetch failed:', err)
  }
  return null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const forceRefresh = searchParams.get('refresh') === 'true'
  const now = Date.now()

  if (!forceRefresh && memoryCache.data && (now - memoryCache.timestamp < CACHE_TTL_MS)) {
    return NextResponse.json(memoryCache.data)
  }

  // 1. Probar fuente primaria (DolarApi)
  let result = await fetchFromDolarApi()

  // 2. Probar fuente secundaria (DolarVzla)
  if (!result) {
    result = await fetchFromDolarVzla()
  }

  if (result) {
    memoryCache = {
      data: result,
      timestamp: now,
    }
    return NextResponse.json(result)
  }

  // Si fallan las APIs pero tenemos un caché previo (aunque haya expirado)
  if (memoryCache.data) {
    return NextResponse.json({
      ...memoryCache.data,
      source: `${memoryCache.data.source} (Caché previo)`,
      warning: 'No se pudo conectar a los servidores del BCV en este momento. Se usa la última tasa conocida.'
    })
  }

  // Si no hay nada en caché, devolver fallback seguro
  const today = new Date().toISOString().split('T')[0]
  const fallback = {
    rate: 50.50,
    date: today,
    source: 'Tasa de contingencia manual',
    updatedAt: new Date().toISOString(),
    warning: 'Servidores de tasa no disponibles. Por favor verifique o ajuste manualmente.'
  }
  return NextResponse.json(fallback)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { rate, updatedBy } = body

    if (!rate || typeof rate !== 'number' || rate <= 0) {
      return NextResponse.json({ error: 'Tasa inválida' }, { status: 400 })
    }

    const today = new Date().toISOString().split('T')[0]
    const manualRate: BcvRateResponse = {
      rate: Number(rate.toFixed(4)),
      date: today,
      source: `Manual (${updatedBy || 'Cajero'})`,
      updatedAt: new Date().toISOString()
    }

    // Actualizar caché en memoria
    memoryCache = {
      data: manualRate,
      timestamp: Date.now()
    }

    return NextResponse.json(manualRate)
  } catch (error) {
    console.error('Error al actualizar tasa manual:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
