import { NextResponse } from 'next/server'
import { searchMarketplaceProducts, STORE_INVENTORIES, INITIAL_MARKETPLACE_STORES } from '@/lib/delivery/marketplace-engine'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || searchParams.get('query') || ''
  const category = searchParams.get('category') || 'all'
  const businessType = searchParams.get('businessType') || 'all'
  const zoneKey = searchParams.get('zone') || 'all'
  const storeId = searchParams.get('storeId')
  const userLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
  const userLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined

  let rate = 848.55
  try {
    const res = await fetch('http://localhost:3000/api/bcv-rate')
    if (res.ok) {
      const data = await res.json()
      if (data.rate) rate = data.rate
    }
  } catch {
    // fallback rate
  }

  // Si se solicita el catálogo de una tienda en específico
  if (storeId) {
    const store = INITIAL_MARKETPLACE_STORES.find(s => s.id === storeId)
    const rawProducts = STORE_INVENTORIES[storeId] || []
    let products = rawProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category || 'General',
      priceUSD: p.priceUSD,
      priceBS: Number((p.priceUSD * rate).toFixed(2)),
      stock: p.stock ?? 10,
      isAvailable: (p.stock ?? 10) > 0,
      barcode: p.barcode,
      image: p.image || '',
      storeId: store?.id || storeId,
      storeName: store?.name || 'Tienda Venematic',
    }))

    if (category && category !== 'all') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase())
    }

    if (query) {
      const q = query.toLowerCase()
      products = products.filter(p => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)))
    }

    return NextResponse.json({
      store,
      bcvRate: rate,
      totalProducts: products.length,
      products,
    })
  }

  // Búsqueda en toda la red de inventarios (Cross-store Search)
  const products = searchMarketplaceProducts({
    query,
    category,
    businessType,
    zoneKey,
    userLat,
    userLng,
    bcvRate: rate,
  })

  return NextResponse.json({
    bcvRate: rate,
    totalResults: products.length,
    query,
    zone: zoneKey,
    products,
  })
}
