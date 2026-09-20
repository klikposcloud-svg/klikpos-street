/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope

const CACHE_NAME = 'venematic-v1'
const RUNTIME_CACHE = 'venematic-runtime-v1'
const FIREBASE_CACHE = 'venematic-firebase-v1'
const BCV_CACHE = 'venematic-bcv-v1'
const IMAGE_CACHE = 'venematic-images-v1'

const STATIC_ASSETS = [
  '/',
  '/dashboard/pos',
  '/dashboard/inventory',
  '/dashboard/analytics',
  '/dashboard/crm',
  '/dashboard/settings',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

const FIREBASE_HOSTS = [
  'firestore.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
]

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key !== CACHE_NAME &&
              key !== RUNTIME_CACHE &&
              key !== FIREBASE_CACHE &&
              key !== BCV_CACHE &&
              key !== IMAGE_CACHE
          )
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  if (FIREBASE_HOSTS.some((host) => url.hostname.includes(host))) {
    event.respondWith(handleFirebaseRequest(request))
    return
  }

  if (url.pathname.startsWith('/api/bcv-rate')) {
    event.respondWith(handleBcvRateRequest(request))
    return
  }

  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(handleImageRequest(request))
    return
  }

  if (request.destination === 'font' || url.pathname.includes('fonts.googleapis') || url.pathname.includes('fonts.gstatic')) {
    event.respondWith(handleFontRequest(request))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  event.respondWith(handleDefaultRequest(request))
})

async function handleFirebaseRequest(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request, { signal: AbortSignal.timeout(10000) })

    if (networkResponse.ok) {
      const cache = await caches.open(FIREBASE_CACHE)
      const responseToCache = networkResponse.clone()
      await cache.put(request, responseToCache)
    }

    return networkResponse
  } catch (error) {
    const cache = await caches.open(FIREBASE_CACHE)
    const cachedResponse = await cache.match(request)

    if (cachedResponse) {
      return cachedResponse
    }

    return new Response(
      JSON.stringify({
        offline: true,
        message: 'Sin conexión. Los datos se guardan localmente.',
        timestamp: Date.now(),
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

async function handleBcvRateRequest(request: Request): Promise<Response> {
  try {
    const cache = await caches.open(BCV_CACHE)
    const cached = await cache.match(request)

    if (cached) {
      const cachedData = await cached.clone().json()
      const cacheAge = Date.now() - (cachedData.timestamp || 0)

      if (cacheAge < 60 * 60 * 1000) {
        fetch(request).then(async (response) => {
          if (response.ok) {
            await cache.put(request, response.clone())
          }
        }).catch(() => {})

        return cached
      }
    }

    const networkResponse = await fetch(request, { signal: AbortSignal.timeout(15000) })
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    const cache = await caches.open(BCV_CACHE)
    const cached = await cache.match(request)

    if (cached) return cached

    return new Response(
      JSON.stringify({
        error: 'No se pudo obtener la tasa. Use la actualización manual.',
        offline: true,
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleImageRequest(request: Request): Promise<Response> {
  try {
    const cache = await caches.open(IMAGE_CACHE)
    const cached = await cache.match(request)
    if (cached) return cached

    const response = await fetch(request, { signal: AbortSignal.timeout(10000) })
    if (response.ok) {
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    const cache = await caches.open(IMAGE_CACHE)
    const cached = await cache.match(request)
    if (cached) return cached

    return new Response('', { status: 404 })
  }
}

async function handleFontRequest(request: Request): Promise<Response> {
  try {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    if (cached) return cached

    const response = await fetch(request, { signal: AbortSignal.timeout(10000) })
    if (response.ok) {
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    if (cached) return cached

    return new Response('', { status: 404 })
  }
}

async function handleNavigationRequest(request: Request): Promise<Response> {
  try {
    const networkResponse = await fetch(request, { signal: AbortSignal.timeout(10000) })
    return networkResponse
  } catch {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match('/dashboard/pos')
    if (cached) return cached

    const match = await caches.match('/dashboard/pos')
    return match || new Response('Offline', { status: 503 })
  }
}

async function handleDefaultRequest(request: Request): Promise<Response> {
  try {
    const cache = await caches.open(RUNTIME_CACHE)
    const cached = await cache.match(request)
    if (cached) return cached

    const response = await fetch(request, { signal: AbortSignal.timeout(10000) })
    if (response.ok) {
      await cache.put(request, response.clone())
    }
    return response
  } catch {
    const cache = await caches.open(RUNTIME_CACHE)
    const cached = await cache.match(request)
    if (cached) return cached

    return new Response('Offline', { status: 503 })
  }
}

self.addEventListener('sync' as any, (event: any) => {
  if (event.tag === 'sync-sales') {
    event.waitUntil(syncPendingSales())
  }
  if (event.tag === 'sync-all') {
    event.waitUntil(syncAllData())
  }
})

async function syncPendingSales(): Promise<void> {
  const clients = await self.clients.matchAll()
  clients.forEach((client: any) => {
    client.postMessage({ type: 'SYNC_STATUS', status: 'syncing' })
  })

  try {
    const queue = await getSyncQueueFromIndexedDB()

    for (const item of queue) {
      try {
        await postToFirestore(item)
        await markSyncedInIndexedDB(item.id)
      } catch (error) {
        await incrementRetryInIndexedDB(item.id, String(error))
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }

  clients.forEach((client: any) => {
    client.postMessage({ type: 'SYNC_STATUS', status: 'synced' })
  })
}

async function syncAllData(): Promise<void> {
  await syncPendingSales()
}

function getSyncQueueFromIndexedDB(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('venematic-db', 4)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('sync_queue', 'readonly')
      const store = tx.objectStore('sync_queue')
      const index = store.index('synced')
      const getAll = index.getAll(false as any)
      getAll.onsuccess = () => {
        const items = getAll.result || []
        resolve(items.sort((a: any, b: any) => a.priority - b.priority || a.createdAt - b.createdAt))
      }
      getAll.onerror = () => reject(getAll.error)
    }
    request.onerror = () => reject(request.error)
  })
}

function postToFirestore(_item: any): Promise<void> {
  return fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }).then(() => {})
}

function markSyncedInIndexedDB(_id: string): Promise<void> {
  return Promise.resolve()
}

function incrementRetryInIndexedDB(_id: string, _error: string): Promise<void> {
  return Promise.resolve()
}

self.addEventListener('push' as any, (event: any) => {
  const data = event.data?.json() || {}

  event.waitUntil(
    self.registration.showNotification(data.title || 'Venematic', {
      body: data.body || 'Nueva notificación',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
    } as any)
  )
})

self.addEventListener('notificationclick' as any, (event: any) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/dashboard/pos'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: readonly any[]) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(urlToOpen)
    })
  )
})

export {}
