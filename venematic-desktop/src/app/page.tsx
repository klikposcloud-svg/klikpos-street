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
          }, 400);
        }, 300);
      }
    }, 420);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div
      className="h-screen w-screen flex flex-col items-center justify-center font-sans select-none overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #f0f6ff 0%, #ffffff 50%, #f0fdf4 100%)',
        opacity: phase === 'done' ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: '50vw', height: '50vw', maxWidth: 400, maxHeight: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,79,90,0.08) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%',
        width: '45vw', height: '45vw', maxWidth: 360, maxHeight: 360,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(5,150,105,0.07) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      {/* Logo + Nombre */}
      <div className="flex flex-col items-center gap-5 z-10">
        {/* Icono animado */}
        <div style={{
          width: 88, height: 88, borderRadius: 22,
          background: 'linear-gradient(135deg, #0e4f5a 0%, #0a9396 100%)',
          boxShadow: '0 20px 60px rgba(14,79,90,0.30), 0 4px 16px rgba(14,79,90,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'venePulse 2s ease-in-out infinite',
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>

        {/* Nombre */}
        <div className="text-center">
          <h1 style={{
            fontSize: 28, fontWeight: 900, letterSpacing: '-0.5px',
            color: '#0e4f5a', lineHeight: 1,
          }}>
            VENEMATIC
          </h1>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: 3, marginTop: 4, textTransform: 'uppercase' }}>
            Punto de Venta
          </p>
        </div>

        {/* Barra de progreso */}
        <div style={{ width: 220, marginTop: 12 }}>
          <div style={{
            height: 4, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg, #0e4f5a, #0a9396)',
              width: `${progress}%`,
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          </div>
          <p style={{
            textAlign: 'center', marginTop: 10, fontSize: 11,
            color: '#94a3b8', fontWeight: 600, letterSpacing: 0.3,
          }}>
            {label}
          </p>
        </div>

        {/* Puntos animados */}
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%', background: '#0e4f5a',
              opacity: 0.3,
              animation: `veneDot 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      </div>

      {/* Versión */}
      <p style={{
        position: 'absolute', bottom: 28, fontSize: 10, color: '#cbd5e1',
        fontWeight: 600, letterSpacing: 1,
      }}>
        v2.0 · Terminal Comercial
      </p>

      <style>{`
        @keyframes venePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 20px 60px rgba(14,79,90,0.30); }
          50% { transform: scale(1.04); box-shadow: 0 24px 70px rgba(14,79,90,0.42); }
        }
        @keyframes veneDot {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
