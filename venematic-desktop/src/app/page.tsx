'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'done'>('loading');
  const [label, setLabel] = useState('Iniciando sistema...');

  useEffect(() => {
    const labels = [
      'Iniciando sistema...',
      'Cargando catálogo...',
      'Verificando base de datos...',
      'Sincronizando tasa BCV...',
      'Listo',
    ];
    let step = 0;
    const steps = [0, 25, 55, 80, 100];

    const interval = setInterval(() => {
      step++;
      if (step < steps.length) {
        setProgress(steps[step]);
        setLabel(labels[step]);
      }
      if (step >= steps.length - 1) {
        clearInterval(interval);
        setTimeout(() => {
          setPhase('done');
          setTimeout(() => {
            const isMobile =
              /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
              (window as any).Capacitor?.isNativePlatform();
            router.replace(isMobile ? '/scanner' : '/dashboard/pos');
          }, 350);
        }, 250);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center font-sans select-none overflow-hidden bg-white"
      style={{
        background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
        opacity: phase === 'done' ? 0 : 1,
        transition: 'opacity 0.35s ease',
      }}
    >
      {/* Luces decorativas suaves de fondo */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          maxWidth: 400,
          maxHeight: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,79,90,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '45vw',
          height: '45vw',
          maxWidth: 360,
          maxHeight: 360,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2,132,199,0.06) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* Identidad Oficial en Modo Blanco Profesional */}
      <div className="flex flex-col items-center gap-5 z-10">
        <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-lg flex items-center justify-center transition-transform hover:scale-105">
          <img
            src="/brand/klikpos-logo-dark.png"
            alt="KLIK POS"
            className="h-12 sm:h-14 w-auto object-contain"
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            KLIK-POS
          </h1>
          <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mt-1">
            Punto de Venta Profesional · Terminal Local
          </p>
        </div>

        {/* Barra de progreso nítida y elegante */}
        <div className="w-56 mt-2">
          <div className="h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-600 to-teal-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center mt-2.5 text-xs text-slate-500 font-semibold tracking-normal">
            {label}
          </p>
        </div>
      </div>

      <p className="absolute bottom-7 text-[11px] text-slate-400 font-bold tracking-wider uppercase">
        v2.0 · Modo Blanco Profesional
      </p>
    </div>
  );
}
