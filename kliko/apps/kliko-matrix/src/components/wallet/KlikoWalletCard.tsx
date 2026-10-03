import React from 'react';
import { Coins, ArrowUpRight, ArrowDownLeft, ShieldCheck, Zap } from 'lucide-react';
import { KlikoWallet } from '@packages/domain-core/src/wallet.types';

interface KlikoWalletCardProps {
  wallet: KlikoWallet;
  bcvRate: number;
  onDeposit: () => void;
  onPayWithTokens: () => void;
  onRequestCredit?: () => void;
}

export const KlikoWalletCard: React.FC<KlikoWalletCardProps> = ({
  wallet,
  bcvRate,
  onDeposit,
  onPayWithTokens,
  onRequestCredit
}) => {
  const bsEquivalent = (wallet.balanceTokens * bcvRate).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Glow Superior */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'var(--token-glow)',
          filter: 'blur(30px)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}
          >
            <Coins size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Billetera K-Tokens</h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Circuito Económico Seguro</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--success-emerald)',
            fontSize: '11px',
            fontWeight: '700'
          }}
        >
          <ShieldCheck size={13} />
          <span>Indexado USD</span>
        </div>
      </div>

      {/* Saldo Grande */}
      <div style={{ margin: '14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1px' }}>
            {wallet.balanceTokens.toFixed(2)}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--token-gold)' }}>K-Tokens</span>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          ≈ <strong style={{ color: 'var(--text-primary)' }}>Bs. {bsEquivalent}</strong> (Tasa BCV: {bcvRate.toFixed(2)})
        </div>
      </div>

      {/* K-Crédito Pre-Aprobado (BNPL) */}
      {wallet.creditLimitTokens > 0 && (
        <div
          style={{
            margin: '12px 0',
            padding: '10px 12px',
            borderRadius: '10px',
            background: 'var(--bg-elevated)',
            border: '1px dashed var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="#F59E0B" />
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>K-Crédito Disponible:</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
            ${(wallet.creditLimitTokens - wallet.creditUsedTokens).toFixed(2)} USD
          </span>
        </div>
      )}

      {/* Botones de Acción */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
        <button
          onClick={onDeposit}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            borderRadius: '10px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <ArrowDownLeft size={16} color="var(--brand-electric)" />
          Recargar Bs.
        </button>

        <button
          onClick={onPayWithTokens}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px',
            borderRadius: '10px',
            background: 'var(--brand-primary)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px var(--brand-glow)'
          }}
        >
          <ArrowUpRight size={16} />
          Pagar con K
        </button>
      </div>
    </div>
  );
};

