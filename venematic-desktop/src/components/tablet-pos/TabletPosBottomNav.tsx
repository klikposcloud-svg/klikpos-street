'use client';

import React, { useState } from 'react';

interface TabletPosBottomNavProps {
  activeTab: 'menu' | 'mesas' | 'pedidos' | 'delivery' | 'cobro';
  isLight: boolean;
  totalItems: number;
  totalUSD?: number;
  primaryColor?: string;
  onSelectTab: (tab: 'menu' | 'mesas' | 'pedidos' | 'delivery' | 'cobro') => void;
  onOpenCobro: () => void;
  onOpenQrModal?: () => void;
  onToggleDocker?: () => void;
  isDockerOpen?: boolean;
  onToggleOrderDrawer?: () => void;
  isOrderDrawerOpen?: boolean;
}

export const TabletPosBottomNav: React.FC<TabletPosBottomNavProps> = ({
  activeTab,
  isLight,
  totalItems,
  onSelectTab,
  onOpenCobro,
  onOpenQrModal,
  onToggleDocker,
  isDockerOpen,
  onToggleOrderDrawer,
  isOrderDrawerOpen
}) => {
  const [isRadialOpen, setIsRadialOpen] = useState(false);

  const handleToggleRadial = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRadialOpen((prev) => !prev);
  };

  const handleAction = (type: 'orden' | 'qr' | 'cobro' | 'mesas', e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRadialOpen(false);
    if (type === 'orden') {
      if (onToggleOrderDrawer) onToggleOrderDrawer();
    } else if (type === 'qr') {
      if (onOpenQrModal) onOpenQrModal();
    } else if (type === 'cobro') {
      onOpenCobro();
    } else if (type === 'mesas') {
      onSelectTab('mesas');
    }
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --nav-bg: #090d16;
          --nav-border: rgba(255, 255, 255, 0.14);
          --color-neon: #f59e0b;
          --color-neon-glow: rgba(245, 158, 11, 0.45);
          --color-inactive: #94a3b8;
        }

        /* Backdrop INVISIBLE para cerrar al tocar fuera SIN difuminar ni oscurecer la página activa */
        .radial-backdrop {
          position: fixed;
          inset: 0;
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          z-index: 40;
          pointer-events: none;
        }

        .radial-backdrop.is-active {
          pointer-events: auto;
        }

        /* Contenedor maestro del Navbar y del Abanico Trasero */
        .pos-navbar-wrapper {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 74px;
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
          z-index: 50;
          user-select: none;
          pointer-events: none;
        }

        /* ============================================================ */
        /* CAPA TRASERA: ABANICO EN ARO CONCÉNTRICO (Z-INDEX 45)        */
        /* ============================================================ */
        .radial-cobrar-menu {
          position: absolute;
          bottom: 36px;
          left: 50%;
          width: 0;
          height: 0;
          z-index: 45; /* Por detrás de la barra de navegación */
          pointer-events: none;
        }

        /* ARO CONCÉNTRICO GRUESO (Donut Ring / Pista Orbital Hueca) */
        .radial-disk {
          position: absolute;
          top: 0;
          left: 0;
          width: 300px;
          height: 300px;
          margin-top: -150px;
          margin-left: -150px;
          border-radius: 50%;
          /* Aro grueso: centro transparente, franja con bordes concéntricos */
          background: radial-gradient(
            circle at center,
            transparent 0%,
            transparent 33%,
            ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)'} 33.5%,
            ${isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(22, 30, 44, 0.96)'} 35%,
            ${isLight ? 'rgba(241, 245, 249, 0.97)' : 'rgba(16, 23, 36, 0.94)'} 68%,
            ${isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.15)'} 70%,
            transparent 70.5%
          );
          box-shadow: 0 0 35px rgba(0, 0, 0, ${isLight ? '0.15' : '0.7'});
          opacity: 0;
          transform: scale(0.3);
          transition: transform 0.38s cubic-bezier(0.34, 1.45, 0.64, 1), opacity 0.25s ease;
          pointer-events: none;
        }

        .radial-cobrar-menu.is-open .radial-disk {
          opacity: 1;
          transform: scale(1);
        }

        /* Botones satélite orbitales en la capa trasera */
        .radial-btn {
          position: absolute;
          top: 0;
          left: 0;
          margin-top: -29px;
          margin-left: -29px;
          opacity: 0;
          background: none;
          border: none;
          outline: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          z-index: 46; /* Encima del aro pero debajo del Navbar */
          pointer-events: none;
          transform: rotate(0deg) translateY(0) scale(0.3);
          transition: transform 0.4s cubic-bezier(0.34, 1.5, 0.64, 1), opacity 0.22s ease;
        }

        /* Proyección orbital a 130px para que los textos queden perfectamente despejados sobre la media luna */
        .radial-cobrar-menu.is-open .radial-btn {
          pointer-events: auto;
          opacity: 1;
          transform: rotate(var(--angle)) translateY(-130px) rotate(calc(-1 * var(--angle))) scale(1);
        }

        /* Burbujas circulares con borde delgado y contraste de alta visibilidad */
        .radial-btn__circle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: ${isLight ? '#ffffff' : '#1c2330'};
          border: 1.2px solid ${isLight ? '#0f172a' : '#ffffff'};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${isLight ? '#0f172a' : '#ffffff'};
          box-shadow: 
            0 10px 24px rgba(0, 0, 0, ${isLight ? '0.18' : '0.7'}),
            0 0 10px ${isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.12)'},
            inset 0 1px 2px ${isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.2)'};
          transition: transform 0.15s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }

        .radial-btn__circle svg {
          width: 25px;
          height: 25px;
        }

        .radial-btn:hover .radial-btn__circle,
        .radial-btn:active .radial-btn__circle {
          transform: scale(1.06);
          border-color: ${isLight ? '#059669' : '#ffffff'};
          background: ${isLight ? '#f8fafc' : '#252f40'};
          box-shadow: 
            0 12px 28px rgba(0, 0, 0, ${isLight ? '0.22' : '0.8'}),
            0 0 16px ${isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(255, 255, 255, 0.3)'},
            inset 0 1px 2px rgba(255, 255, 255, 0.3);
        }

        /* Micro-etiqueta tipográfica compacta y nítida */
        .radial-btn__label {
          font-size: 10px;
          font-weight: 800;
          color: ${isLight ? '#0f172a' : '#ffffff'};
          letter-spacing: 0.3px;
          white-space: nowrap;
          padding: 1.5px 6px;
          border-radius: 6px;
          background: ${isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(12, 18, 28, 0.82)'};
          border: 1px solid ${isLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.12)'};
          box-shadow: 0 2px 6px rgba(0, 0, 0, ${isLight ? '0.15' : '0.75'});
          text-shadow: ${isLight ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.9)'};
          line-height: 1.1;
        }

        /* ============================================================ */
        /* CAPA DELANTERA: BARRA DE NAVEGACIÓN Y BOTÓN CENTRAL (Z-INDEX 50) */
        /* ============================================================ */
        .pos-navbar {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 50; /* Capa superior delantera */
          pointer-events: auto;
        }

        /* Silueta fluida SVG integrada */
        .pos-navbar__bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          filter: drop-shadow(0 -6px 20px rgba(0, 0, 0, 0.65));
        }

        .pos-navbar__bg svg {
          width: 100%;
          height: 100%;
          fill: #090d16;
        }

        .pos-navbar__bg path {
          fill: #090d16;
          stroke: rgba(255, 255, 255, 0.14);
          stroke-width: 1.5;
        }

        /* Grilla de items con CENTRADO VERTICAL */
        .pos-navbar__items {
          position: relative;
          z-index: 52;
          display: grid;
          grid-template-columns: 1fr 1fr 1.15fr 1fr 1fr;
          align-items: center;
          height: 100%;
          padding-top: 18px; /* Equilibrio con la curva superior de la barra */
          padding-bottom: 4px;
        }

        /* Botón individual centrado verticalmente */
        .nav-item {
          background: none;
          border: none;
          outline: none;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          color: var(--color-inactive);
          transition: color 0.2s ease, transform 0.15s ease;
          padding: 2px 0;
        }

        .nav-item:active {
          transform: scale(0.92);
        }

        .nav-item .icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-item .icon-wrap svg {
          width: 22px;
          height: 22px;
          transition: transform 0.2s ease;
        }

        .nav-item .label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.2px;
          line-height: 1.1;
        }

        /* Indicador LED Neón debajo de las pestañas */
        .neon-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: transparent;
          box-shadow: none;
          transition: all 0.25s ease;
          margin-top: 1px;
        }

        .nav-item.active {
          color: ${isLight ? '#0f172a' : '#ffffff'};
          font-weight: 700;
        }

        .nav-item.active .neon-dot {
          background: var(--color-neon);
          box-shadow: 0 0 8px 2px var(--color-neon), 0 0 14px var(--color-neon-glow);
          transform: scale(1.2);
        }

        /* Contenedor del Botón Central en la joroba fluida */
        .nav-hero-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-top: -20px; /* Anclado justo en la cúspide de la curva */
          z-index: 55;
        }

        /* Botón Central Gatillador (FAB Plus ➕) */
        .hero-cobrar {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: ${isLight ? '#f8fafc' : '#090d16'};
          border: 1px solid ${isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.16)'};
          cursor: pointer;
          outline: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(0, 0, 0, ${isLight ? '0.2' : '0.7'}), inset 0 1px 2px rgba(255, 255, 255, 0.08);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease;
          z-index: 56;
        }

        .hero-cobrar:active {
          transform: scale(0.95);
        }

        /* Rotación dinámica a ✕ cuando está abierto */
        .hero-cobrar.is-open {
          transform: rotate(45deg);
        }

        .hero-cobrar.is-open .fab-plus-icon {
          color: #f59e0b;
        }

        /* Anillo Neón con Resplandor */
        .neon-ring {
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          border: 2px solid var(--color-neon);
          box-shadow: 0 0 12px var(--color-neon-glow), inset 0 0 8px var(--color-neon-glow);
          pointer-events: none;
        }

        .fab-plus-icon {
          width: 26px;
          height: 26px;
          color: var(--color-neon);
          filter: drop-shadow(0 0 8px var(--color-neon-glow));
          z-index: 2;
          transition: transform 0.25s ease, color 0.2s ease;
        }

        /* Notificación Flotante (Badge) */
        .hero-cobrar .badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #f59e0b;
          color: #111;
          font-size: 11px;
          font-weight: 900;
          width: 19px;
          height: 19px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          z-index: 3;
        }

        .label-cobrar {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.6px;
          color: var(--color-neon);
          text-transform: uppercase;
          margin-top: 2px;
          line-height: 1;
        }
      `}</style>

      {/* 1. Backdrop INVISIBLE (Cierra al tocar fuera SIN difuminar la página activa) */}
      <div
        className={`radial-backdrop ${isRadialOpen ? 'is-active' : ''}`}
        onClick={() => setIsRadialOpen(false)}
      />

      {/* 2. Contenedor Maestro con Capas Z-Index Separadas */}
      <div className="pos-navbar-wrapper">
        
        {/* ============================================================ */}
        {/* CAPA TRASERA: ARO CONCÉNTRICO CON ACCIONES RÁPIDAS (Z-INDEX 45) */}
        {/* ============================================================ */}
        <div className={`radial-cobrar-menu ${isRadialOpen ? 'is-open' : ''}`} id="radialMenu">
          {/* Aro Concéntrico Grueso / Pista Orbital Hueca */}
          <div className="radial-disk" />

          {/* 1. Izquierda (-58deg): Orden en Curso */}
          <button
            type="button"
            className="radial-btn"
            style={{ '--angle': '-58deg' } as React.CSSProperties}
            data-action="orden"
            onClick={(e) => handleAction('orden', e)}
            aria-label="Orden"
          >
            <div className="radial-btn__circle relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="radial-btn__label">Orden</span>
          </button>

          {/* 2. Centro Superior (0deg): $ (Cobrar) */}
          <button
            type="button"
            className="radial-btn"
            style={{ '--angle': '0deg' } as React.CSSProperties}
            data-action="cobrar"
            onClick={(e) => handleAction('cobro', e)}
            aria-label="Cobrar"
          >
            <div className="radial-btn__circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span className="radial-btn__label">Cobrar</span>
          </button>

          {/* 3. Derecha (+58deg): Mesas */}
          <button
            type="button"
            className="radial-btn"
            style={{ '--angle': '58deg' } as React.CSSProperties}
            data-action="mesas"
            onClick={(e) => handleAction('mesas', e)}
            aria-label="Mesas"
          >
            <div className="radial-btn__circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
            </div>
            <span className="radial-btn__label">Mesas</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* CAPA DELANTERA: BARRA DE NAVEGACIÓN HORIZONTAL (Z-INDEX 50)   */}
        {/* ============================================================ */}
        <nav className="pos-navbar">
          {/* Fondo SVG con la curva líquida central */}
          <div className="pos-navbar__bg">
            <svg viewBox="0 0 500 80" preserveAspectRatio="none">
              <path
                d="M 0,25 
                   L 180,25 
                   C 215,25 210,0 250,0 
                   C 290,0 285,25 320,25 
                   L 500,25 
                   L 500,80 
                   L 0,80 Z"
                fill="#090d16"
                stroke="rgba(255, 255, 255, 0.14)"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="pos-navbar__items">
            {/* 1. Menú (Tenedor y Cuchillo) */}
            <button
              type="button"
              onClick={() => {
                setIsRadialOpen(false);
                onSelectTab('menu');
              }}
              className={`nav-item ${activeTab === 'menu' ? 'active' : ''}`}
              data-tab="menu"
              aria-label="Menú"
            >
              <div className="icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 3v5a3 3 0 0 0 3 3v10" />
                  <path d="M10 3v5a3 3 0 0 1-3 3" />
                  <path d="M7 3v8" />
                  <path d="M17 3v7a3 3 0 0 0 3 3v8" />
                  <path d="M17 3c2 0 3 2 3 5v5" />
                </svg>
              </div>
              <span className="label">Menú</span>
              <span className="neon-dot"></span>
            </button>

            {/* 2. Docker (Herramientas & Módulos Rápidos) */}
            <button
              type="button"
              onClick={() => {
                setIsRadialOpen(false);
                if (onToggleDocker) {
                  onToggleDocker();
                }
              }}
              className={`nav-item ${isDockerOpen ? 'active' : ''}`}
              data-tab="docker"
              aria-label="Docker"
            >
              <div className="icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  <path d="M5 3v4" />
                  <path d="M19 17v4" />
                  <path d="M3 5h4" />
                  <path d="M17 19h4" />
                </svg>
              </div>
              <span className="label">Docker</span>
              <span className="neon-dot"></span>
            </button>

            {/* 3. BOTÓN CENTRAL HERO: PLUS (➕) */}
            <div className="nav-hero-container">
              <button
                type="button"
                onClick={handleToggleRadial}
                className={`hero-cobrar ${isRadialOpen ? 'is-open' : ''}`}
                data-tab="acciones"
                aria-label="Acciones Rápidas"
              >
                <div className="neon-ring"></div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="fab-plus-icon">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {totalItems > 0 && !isRadialOpen && <span className="badge">{totalItems}</span>}
              </button>
              <span className="label-cobrar">ACCIONES</span>
            </div>

            {/* 4. Pedidos (Portapapeles) */}
            <button
              type="button"
              onClick={() => {
                setIsRadialOpen(false);
                onSelectTab('pedidos');
              }}
              className={`nav-item ${activeTab === 'pedidos' ? 'active' : ''}`}
              data-tab="pedidos"
              aria-label="Pedidos"
            >
              <div className="icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="M9 12h6" />
                  <path d="M9 16h6" />
                </svg>
              </div>
              <span className="label">Pedidos</span>
              <span className="neon-dot"></span>
            </button>

            {/* 5. Delivery (Moto) */}
            <button
              type="button"
              onClick={() => {
                setIsRadialOpen(false);
                onSelectTab('delivery');
              }}
              className={`nav-item ${activeTab === 'delivery' ? 'active' : ''}`}
              data-tab="delivery"
              aria-label="Delivery"
            >
              <div className="icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5.5" cy="17.5" r="3.5" />
                  <circle cx="18.5" cy="17.5" r="3.5" />
                  <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h3" />
                </svg>
              </div>
              <span className="label">Delivery</span>
              <span className="neon-dot"></span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};



