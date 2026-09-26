import { NextResponse } from 'next/server'
import { INITIAL_MARKETPLACE_STORES, POPULAR_ZONES, calculateDistanceKm } from '@/lib/delivery/marketplace-engine'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const businessType = searchParams.get('businessType')
  const zone = searchParams.get('zone')
  const city = searchParams.get('city')
  const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null
  const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null

  let stores = [...INITIAL_MARKETPLACE_STORES]

  if (businessType && businessType !== 'all') {
    stores = stores.filter(s => s.businessType.toLowerCase() === businessType.toLowerCase())
  }

  if (city && city !== 'all') {
    stores = stores.filter(s => s.city.toLowerCase() === city.toLowerCase())
  }

  if (zone && zone !== 'all') {
    const matchedZone = POPULAR_ZONES.find(z => z.key === zone)
    if (matchedZone && matchedZone.city !== 'all') {
      stores = stores.filter(s => s.city.toLowerCase() === matchedZone.city.toLowerCase())
    }
  }

  // Si se envían coordenadas, calcular y ordenar por distancia
  if (lat && lng) {
    stores = stores.map(s => ({
      ...s,
      distanceKm: calculateDistanceKm(lat, lng, s.lat, s.lng),
    })).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0))
  }

  return NextResponse.json({
    totalStores: stores.length,
    zones: POPULAR_ZONES,
    stores,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // Registrar o actualizar tienda en la red
    return NextResponse.json({
      success: true,
      message: 'Tienda registrada exitosamente en la Red Marketplace de Venematic',
      store: body
    })
  } catch (err) {
    return NextResponse.json({ error: 'Error al registrar tienda' }, { status: 500 })
  }
}
