'use client';

import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  LayoutGrid, 
  Plus, 
  ClipboardList, 
  Bike, 
  ShoppingCart, 
  DollarSign, 
  Grid 
} from 'lucide-react';

interface TabletPosBottomNavProps {
  activeTab: 'menu' | 'mesas' | 'pedidos' | 'delivery' | 'cobro';
  isLight?: boolean;
  isLiteMode?: boolean;
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
  isLight = false,
  isLiteMode = true,
  totalItems,
  primaryColor = '#f59e0b',
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
          --color-neon: ${primaryColor || '#f59e0b'};
          --color-neon-glow: ${primaryColor ? primaryColor + '66' : 'rgba(245, 158, 11, 0.45)'};
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

        /* ARO CONCÉNTRICO GRUESO */
        .radial-disk {
          position: absolute;
          top: 0;
          left: 0;
          width: 300px;
          height: 300px;
          margin-top: -150px;
          margin-left: -150px;
          border-radius: 50%;
          background: radial-gradient(
            circle at center,
            transparent 0%,
            transparent 33%,
            rgba(255, 255, 255, 0.12) 33.5%,
            rgba(22, 30, 44, 0.96) 35%,
            rgba(16, 23, 36, 0.94) 68%,
            rgba(255, 255, 255, 0.15) 70%,
            transparent 70.5%
          );
          box-shadow: 0 0 35px rgba(0, 0, 0, 0.7);
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
          z-index: 46;
          pointer-events: none;
          transform: rotate(0deg) translateY(0) scale(0.3);
          transition: transform 0.4s cubic-bezier(0.34, 1.5, 0.64, 1), opacity 0.22s ease;
        }

        .radial-cobrar-menu.is-open .radial-btn {
          pointer-events: auto;
          opacity: 1;
          transform: rotate(var(--angle)) translateY(-130px) rotate(calc(-1 * var(--angle))) scale(1);
        }

        .radial-btn__circle {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #1c2330;
          border: 1.2px solid rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 
            0 10px 24px rgba(0, 0, 0, 0.7),
            0 0 10px rgba(255, 255, 255, 0.12),
            inset 0 1px 2px rgba(255, 255, 255, 0.2);
          transition: transform 0.15s ease, border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }

        .radial-btn__circle svg {
          width: 25px;
          height: 25px;
        }

        .radial-btn:hover .radial-btn__circle,
        .radial-btn:active .radial-btn__circle {
          transform: scale(1.06);
          border-color: var(--color-neon);
          background: #252f40;
          box-shadow: 
            0 12px 28px rgba(0, 0, 0, 0.8),
            0 0 16px var(--color-neon-glow),
            inset 0 1px 2px rgba(255, 255, 255, 0.3);
        }

        .radial-btn__label {
          font-size: 10px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.3px;
          white-space: nowrap;
          padding: 2px 7px;
          border-radius: 6px;
          background: rgba(12, 18, 28, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.75);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.9);
          line-height: 1.1;
        }

        /* ============================================================ */
        /* CAPA DELANTERA: BARRA DE NAVEGACIÓN Y BOTÓN CENTRAL (Z-INDEX 50) */
        /* ============================================================ */
        .pos-navbar {
          position: relative;
          width: 100%;
          height: 100%;
          z-index: 50;
          pointer-events: auto;
        }

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

        /* Grilla de items con CENTRADO VERTICAL EQUILIBRADO DENTRO DE LA BARRA */
        .pos-navbar__items {
          position: relative;
          z-index: 52;
          display: grid;
          grid-template-columns: 1fr 1fr 1.15fr 1fr 1fr;
          align-items: center;
          height: 100%;
          padding-top: 24px;
          padding-bottom: 6px;
          box-sizing: border-box;
        }

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
          height: 100%;
          box-sizing: border-box;
        }

        .nav-item:active {
          transform: scale(0.92);
        }

        .nav-item .icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
        }

        .nav-item .icon-wrap svg {
          width: 20px;
          height: 20px;
          transition: transform 0.2s ease;
        }

        .nav-item .label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.2px;
          line-height: 1.1;
        }

        .neon-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: transparent;
          box-shadow: none;
          transition: all 0.25s ease;
          margin-top: 1px;
        }

        .nav-item.active {
          color: #ffffff;
          font-weight: 800;
        }

        .nav-item.active .neon-dot {
          background: var(--color-neon);
          box-shadow: 0 0 8px 2px var(--color-neon), 0 0 14px var(--color-neon-glow);
          transform: scale(1.2);
        }

        .nav-hero-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-top: -30px;
          z-index: 55;
        }

        .hero-cobrar {
          position: relative;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #090d16;
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          outline: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.75), inset 0 1px 2px rgba(255, 255, 255, 0.12);
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease;
          z-index: 56;
        }

        .hero-cobrar:active {
          transform: scale(0.95);
        }

        .hero-cobrar.is-open {
          transform: rotate(45deg);
        }

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

        .hero-cobrar .badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--color-neon);
          color: #090d16;
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
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.6px;
          color: var(--color-neon);
          text-transform: uppercase;
          margin-top: 3px;
          line-height: 1;
        }
      `}</style>

      {/* 1. Backdrop INVISIBLE */}
      <div
        className={`radial-backdrop ${isRadialOpen ? 'is-active' : ''}`}
        onClick={() => setIsRadialOpen(false)}
      />

      {/* 2. Contenedor Maestro */}
      <div className="pos-navbar-wrapper">
        
        {/* ============================================================ */}
        {/* CAPA TRASERA: ARO CONCÉNTRICO CON ACCIONES RÁPIDAS           */}
        {/* ============================================================ */}
        <div className={`radial-cobrar-menu ${isRadialOpen ? 'is-open' : ''}`} id="radialMenu">
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
              <ShoppingCart className="w-6 h-6 text-white" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="radial-btn__label">Orden</span>
          </button>

          {/* 2. Centro Superior (0deg): Cobrar */}
          <button
            type="button"
            className="radial-btn"
            style={{ '--angle': '0deg' } as React.CSSProperties}
            data-action="cobrar"
            onClick={(e) => handleAction('cobro', e)}
            aria-label="Cobrar"
          >
            <div className="radial-btn__circle">
              <DollarSign className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <span className="radial-btn__label">Cobrar</span>
          </button>

          {/* 3. Derecha (+58deg): Mesas o Ventas */}
          <button
            type="button"
            className="radial-btn"
            style={{ '--angle': '58deg' } as React.CSSProperties}
            data-action={isLiteMode ? "pedidos" : "mesas"}
            onClick={(e) => {
              if (isLiteMode) {
                e.stopPropagation();
                setIsRadialOpen(false);
                onSelectTab('pedidos');
              } else {
                handleAction('mesas', e);
              }
            }}
            aria-label={isLiteMode ? "Ventas" : "Mesas"}
          >
            <div className="radial-btn__circle">
              {isLiteMode ? <ClipboardList className="w-6 h-6 text-white" /> : <Grid className="w-6 h-6 text-white" />}
            </div>
            <span className="radial-btn__label">{isLiteMode ? "Ventas" : "Mesas"}</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* CAPA DELANTERA: BARRA DE NAVEGACIÓN HORIZONTAL               */}
        {/* ============================================================ */}
        <nav className="pos-navbar">
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
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="label">Menú</span>
              <span className="neon-dot"></span>
            </button>

            {/* 2. Docker (Herramientas & Módulos Rápidos) - Lucide LayoutGrid Icon */}
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
                <LayoutGrid className="w-5 h-5" />
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
                <Plus className="fab-plus-icon stroke-[2.8]" />
                {totalItems > 0 && !isRadialOpen && <span className="badge">{totalItems}</span>}
              </button>
              <span className="label-cobrar">ACCIONES</span>
            </div>

            {/* 4. Ventas / Pedidos */}
            <button
              type="button"
              onClick={() => {
                setIsRadialOpen(false);
                onSelectTab('pedidos');
              }}
              className={`nav-item ${activeTab === 'pedidos' ? 'active' : ''}`}
              data-tab="pedidos"
              aria-label={isLiteMode ? "Ventas" : "Pedidos"}
            >
              <div className="icon-wrap">
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="label">{isLiteMode ? "Ventas" : "Pedidos"}</span>
              <span className="neon-dot"></span>
            </button>

            {/* 5. Cobrar (en Modo Lite/Street) o Delivery (en Modo Restaurante Completo) */}
            {isLiteMode ? (
              <button
                type="button"
                onClick={() => {
                  setIsRadialOpen(false);
                  onOpenCobro();
                }}
                className={`nav-item ${activeTab === 'cobro' ? 'active' : ''}`}
                data-tab="cobro"
                aria-label="Cobrar"
              >
                <div className="icon-wrap">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="label text-emerald-400">Cobrar</span>
                <span className="neon-dot"></span>
              </button>
            ) : (
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
                  <Bike className="w-5 h-5" />
                </div>
                <span className="label">Delivery</span>
                <span className="neon-dot"></span>
              </button>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};




