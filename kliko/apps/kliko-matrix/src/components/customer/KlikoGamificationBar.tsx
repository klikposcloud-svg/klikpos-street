import React from 'react';
import { Sparkles, Gift } from 'lucide-react';

interface KlikoGamificationBarProps {
  tokens: number;
  onSpinWheel: () => void;
}

export const KlikoGamificationBar: React.FC<KlikoGamificationBarProps> = ({ tokens, onSpinWheel }) => {
  return (
    <div
      style={{
        borderRadius: '14px',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.05) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
          }}
        >
          <Gift size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {tokens.toFixed(2)} K-Tokens
            </span>
            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 5px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.2)', color: 'var(--token-gold)' }}>
              VIP GOLD ⭐
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Gira la rueda y gana descuentos diarios
          </div>
        </div>
      </div>

      <button
        onClick={onSpinWheel}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '8px 14px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #F59E0B, #D97706)',
          border: 'none',
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: '900',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
          letterSpacing: '0.5px'
        }}
      >
        <Sparkles size={14} />
        <span>GIRAR</span>
      </button>
    </div>
  );
};