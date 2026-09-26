'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window as any).Capacitor?.isNativePlatform();
      if (isMobile) {
        router.push('/scanner');
      } else {
        router.push('/dashboard/pos');
      }
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[var(--brand-primary,#0369a1)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-white/15 border border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Venematic</h1>
        <p className="text-white/80">Sistema Administrativo para Comercios</p>
        <div className="mt-6">
          <div className="w-8 h-8 border-4 border-white/70 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
        <p className="text-white/70 text-sm mt-4">Cargando...</p>
      </div>
    </div>
  )
}
