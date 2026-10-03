import React, { useState, useEffect } from 'react';

export const KlikoHeroBanner: React.FC = () => {
  const [slide, setSlide] = useState(0);

  const SLIDES = [
    {
      titleLine1: '¡Delivery Gratis en',
      titleLine2: 'tu primera orden!',
      cta: 'Free delivery',
      subtitle: 'En restaurantes y comercios afiliados KlikPOS'
    },
    {
      titleLine1: 'Ahorra 50% retirando',
      titleLine2: 'en Puntos Kliko Hub',
      cta: 'Puntos Kliko',
      subtitle: 'Retira en tu comercio vecino sin esperas'
    },
    {
      titleLine1: '15% Cashback pagando',
      titleLine2: 'con tus K-Tokens',
      cta: 'K-Wallet Pay',
      subtitle: 'Tu saldo rinde más y acumula recompensas'
    },
    {
      titleLine1: 'Crédito inmediato',
      titleLine2: 'con Kliko Cuotas',
      cta: 'Ver Límite',
      subtitle: 'Compra hoy en comercios y paga quincenal'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlide(prev => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [SLIDES.length]);

  const current = SLIDES[slide];

  return (
    <div
      style={{
        borderRadius: '26px',
        padding: '22px 24px 16px 24px',
        background: 'linear-gradient(145deg, #1C2027 0%, #13161C 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 16px 36px -10px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '20px',
        minHeight: '168px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none'
      }}
    >
      {/* Sutil halo ambiental */}
      <div
        style={{
          position: 'absolute',
          top: '-30px',
          right: '20px',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.18) 0%, transparent 70%)',
          filter: 'blur(28px)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', zIndex: 2 }}>
        {/* Lado Izquierdo: Textos y Botón Pill */}
        <div style={{ flex: '1 1 58%', maxWidth: '220px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: '800',
              lineHeight: '1.22',
              color: '#FFFFFF',
              letterSpacing: '-0.3px',
              margin: '0 0 14px 0',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}
          >
            <div>{current.titleLine1}</div>
            <div>{current.titleLine2}</div>
          </h2>

          <button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '9px 22px',
              borderRadius: '9999px',
              background: '#FFFFFF',
              border: 'none',
              color: '#111827',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.15s ease, background 0.2s ease',
              fontFamily: 'inherit'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {current.cta}
          </button>
        </div>

        {/* Lado Derecho: Ilustración exacta del Courier en Scooter con Grocery Bag y Monedas Flotantes */}
        <div style={{ flex: '0 0 135px', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <svg width="135" height="115" viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Moneda Flotante Superior Izquierda */}
            <g transform="translate(36, 14)">
              <circle cx="11" cy="11" r="11" fill="#FBBF24" opacity="0.95" />
              <circle cx="11" cy="11" r="9" stroke="#F59E0B" strokeWidth="1.5" fill="#FDE68A" />
              <path d="M11 6.5 V15.5 M8.5 8.5 H13.5 M8.5 13.5 H13.5" stroke="#B45309" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Moneda Flotante Superior Derecha */}
            <g transform="translate(100, 20)">
              <circle cx="12" cy="12" r="12" fill="#F59E0B" />
              <circle cx="12" cy="12" r="9.5" stroke="#D97706" strokeWidth="1.5" fill="#FBBF24" />
              <text x="12" y="16" fill="#78350F" fontSize="11" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">K</text>
            </g>

            {/* Líneas sutiles de velocidad / movimiento */}
            <path d="M12 96 H30" stroke="#475569" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
            <path d="M22 102 H45" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />

            {/* Bolsa Kraft con comestibles (Delante / Lado) */}
            <g transform="translate(24, 48)">
              {/* Bolsa de papel marrón */}
              <path d="M3 14 L24 14 L21 44 L5 44 Z" fill="#D97706" opacity="0.95" />
              <path d="M3 14 L24 14 L23 18 L2 18 Z" fill="#B45309" />
              {/* Baguette saliendo */}
              <rect x="7" y="0" width="6" height="18" rx="3" transform="rotate(-15 7 0)" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
              {/* Vegetales verdes (apio / lechuga) */}
              <circle cx="17" cy="8" r="5" fill="#10B981" />
              <circle cx="21" cy="6" r="4" fill="#059669" />
              {/* Pliegue de la bolsa */}
              <path d="M13 18 L13 44" stroke="#B45309" strokeWidth="1.5" strokeDasharray="2 2" />
            </g>

            {/* Scooter / Moto */}
            {/* Rueda Trasera */}
            <circle cx="50" cy="92" r="15" fill="#0F172A" stroke="#475569" strokeWidth="3" />
            <circle cx="50" cy="92" r="6" fill="#E2E8F0" />

            {/* Rueda Delantera */}
            <circle cx="112" cy="92" r="15" fill="#0F172A" stroke="#475569" strokeWidth="3" />
            <circle cx="112" cy="92" r="6" fill="#E2E8F0" />

            {/* Carrocería Scooter Rojo-Naranja */}
            {/* Guardabarros trasero y plataforma */}
            <path d="M42 86 C42 75 58 75 62 84 L96 84 L104 60" stroke="#EA580C" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="62" y="80" width="30" height="5" rx="2" fill="#1E293B" /> {/* Reposapiés */}

            {/* Columna de dirección y manillar */}
            <line x1="96" y1="84" x2="106" y2="52" stroke="#EA580C" strokeWidth="5" strokeLinecap="round" />
            <line x1="102" y1="52" x2="114" y2="52" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" /> {/* Manillar */}
            <circle cx="114" cy="52" r="2.5" fill="#F97316" />

            {/* Faro delantero */}
            <ellipse cx="111" cy="60" rx="3" ry="5" fill="#FEF08A" />

            {/* Caja Térmica Naranja en Parrilla Trasera */}
            <rect x="44" y="55" width="22" height="22" rx="4" fill="#F97316" stroke="#C2410C" strokeWidth="1.5" />
            <rect x="48" y="62" width="14" height="8" rx="2" fill="#FFFFFF" opacity="0.9" />
            <circle cx="55" cy="66" r="2" fill="#EA580C" />

            {/* Conductor / Rider */}
            {/* Piernas con pantalón oscuro / azul */}
            <path d="M68 68 L76 74 L84 82" stroke="#1E3A8A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx="86" cy="83" rx="4" ry="2.5" fill="#0F172A" /> {/* Zapato */}

            {/* Torso con Chaqueta Naranja */}
            <path d="M68 64 L78 48 L98 52" stroke="#EA580C" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />

            {/* Brazos hacia el manubrio */}
            <path d="M78 48 L94 52 L106 52" stroke="#EA580C" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="106" cy="52" r="3" fill="#FDBA74" /> {/* Mano */}

            {/* Cabeza y Casco */}
            <circle cx="82" cy="34" r="10" fill="#EF4444" />
            <path d="M84 31 Q92 34 88 40" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" /> {/* Visor reflectante */}
            <rect x="76" y="38" width="8" height="4" rx="2" fill="#DC2626" />
          </svg>
        </div>
      </div>

      {/* Indicador de 4 Puntos (Dots) exacto a la maqueta */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '14px', zIndex: 2 }}>
        {SLIDES.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setSlide(idx)}
            style={{
              width: slide === idx ? '18px' : '6px',
              height: '6px',
              borderRadius: '9999px',
              background: slide === idx ? '#FFFFFF' : 'rgba(255, 255, 255, 0.28)',
              transition: 'all 0.25s ease',
              cursor: 'pointer'
            }}
          />
        ))}
      </div>
    </div>
  );
};