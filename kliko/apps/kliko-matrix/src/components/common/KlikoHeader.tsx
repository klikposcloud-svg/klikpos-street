import React from 'react';
import { Sun, Moon, ShoppingBag, Bell, Sparkles } from 'lucide-react';
import { KlikoLogo } from './KlikoLogo';
import { useKlikoTheme } from '../../context/ThemeContext';

interface KlikoHeaderProps {
  bcvRate: number;
  cartCount?: number;
  tokenBalance?: number;
  onOpenCart?: () => void;
  onOpenWallet?: () => void;
}

export const KlikoHeader: React.FC<KlikoHeaderProps> = ({
  bcvRate,
  cartCount = 0,
  tokenBalance = 0,
  onOpenCart,
  onOpenWallet
}) => {
  const { theme, toggleTheme } = useKlikoTheme();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--card-shadow)'
      }}
    >
      {/* Logotipo Oficial */}
      <KlikoLogo size="sm" showSubtitle={false} />

      {/* Controles y Métricas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Tasa BCV */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '9999px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            fontSize: '11px',
            fontWeight: '700',
            color: 'var(--text-secondary)'
          }}
        >
          <span style={{ color: 'var(--success-emerald)' }}>●</span>
          <span>BCV: Bs. {bcvRate.toFixed(2)}</span>
        </div>

        {/* Saldo Rápido de Tokens */}
        <button
          onClick={onOpenWallet}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: 'var(--token-gold)',
            fontSize: '12px',
            fontWeight: '800',
            cursor: 'pointer'
          }}
        >
          <Sparkles size={13} />
          <span>{tokenBalance.toFixed(2)} K</span>
        </button>

        {/* Toggle Tema (Obsidian vs Blanco Grafito) */}
        <button
          onClick={toggleTheme}
          title={theme === 'obsidian' ? 'Cambiar a Blanco Grafito' : 'Cambiar a Obsidian Dark'}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)'
          }}
        >
          {theme === 'obsidian' ? <Sun size={17} color="#F59E0B" /> : <Moon size={17} color="#334155" />}
        </button>

        {/* Carrito Flotante con Contador */}
        <button
          onClick={onOpenCart}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--brand-primary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#FFFFFF',
            position: 'relative',
            boxShadow: '0 4px 12px var(--brand-glow)'
          }}
        >
          <ShoppingBag size={17} />
          {cartCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-surface)'
              }}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
