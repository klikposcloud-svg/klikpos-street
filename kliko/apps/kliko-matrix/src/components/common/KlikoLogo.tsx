import React from 'react';

interface KlikoLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const KlikoLogo: React.FC<KlikoLogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const iconSizes = { sm: 26, md: 34, lg: 44 };
  const textSizes = { sm: '18px', md: '22px', lg: '28px' };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      {/* Icono Insignia "K" de Kliko & KlikPOS */}
      <div
        style={{
          width: `${iconSizes[size]}px`,
          height: `${iconSizes[size]}px`,
          borderRadius: size === 'lg' ? '12px' : '9px',
          background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(37, 99, 235, 0.45)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <span
          style={{
            color: '#FFFFFF',
            fontSize: size === 'lg' ? '24px' : size === 'md' ? '19px' : '15px',
            fontWeight: '900',
            fontFamily: "'Inter', sans-serif",
            letterSpacing: '-0.5px'
          }}
        >
          K
        </span>
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '8px',
            height: '8px',
            background: '#10B981',
            borderRadius: '50%',
            border: '2px solid var(--bg-surface)'
          }}
        />
      </div>

      {/* Marca Nominal */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: textSizes[size], fontWeight: '900', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            Kliko
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: '800',
              padding: '2px 5px',
              borderRadius: '4px',
              background: 'var(--accent-graphite)',
              color: '#FFFFFF', textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Matrix
          </span>
        </div>
        {showSubtitle && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.3px', marginTop: '2px' }}>
            Delivery & Token Network
          </span>
        )}
      </div>
    </div>
  );
};
