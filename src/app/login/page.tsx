'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/pos');
  }, [router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[var(--industrial-bg,#f8fafc)] text-[var(--industrial-text,#0f172a)] font-sans text-sm">
      Redirigiendo a Punto de Venta...
    </div>
  );
}
