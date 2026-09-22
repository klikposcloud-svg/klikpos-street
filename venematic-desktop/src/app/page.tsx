'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (window as any).Capacitor?.isNativePlatform();
      if (isMobile) {
        router.replace('/scanner');
      } else {
        router.replace('/dashboard/pos');
      }
    }
  }, [router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white text-slate-500 font-sans text-sm">
      Iniciando Terminal Venematic POS...
    </div>
  );
}
