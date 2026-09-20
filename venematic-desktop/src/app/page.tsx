'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/pos');
  }, [router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white text-slate-500 font-sans text-sm">
      Iniciando Terminal Venematic POS...
    </div>
  );
}
