import React from 'react';
import { Star, Clock, Bike, ShieldCheck } from 'lucide-react';

export interface MerchantData {
  id: string;
  name: string;
  category: string;
  rating: number;
  deliveryTime: string;
  deliveryFeeUsd: number;
  bannerUrl: string;
  logoUrl?: string;
  hasKlikPos: boolean;
  isOpen: boolean;
}

interface MerchantCardProps {
  merchant: MerchantData;
  onClick: (merchant: MerchantData) => void;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({ merchant, onClick }) => {
  return (
    <div
      onClick={() => onClick(merchant)}
      style={{
        borderRadius: '16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--card-shadow)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        userSelect: 'none'
      }}
    >
      {/* Imagen / Banner */}
      <div style={{ height: '130px', position: 'relative', background: 'var(--bg-elevated)' }}>
        <img
          src={merchant.bannerUrl || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80'}
          alt={merchant.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Badge KlikPOS Conectado */}
        {merchant.hasKlikPos && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(9, 13, 22, 0.85)',
              backdropFilter: 'blur(8px)',
              color: '#60A5FA',
              fontSize: '10px',
              fontWeight: '800',
              border: '1px solid rgba(59, 130, 246, 0.4)'
            }}
          >
            <ShieldCheck size={12} color="#3B82F6" />
            <span>KlikPOS Cloud</span>
          </div>
        )}

        {/* Estado Abierto / Cerrado */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '3px 8px',
            borderRadius: '6px',
            background: merchant.isOpen ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
            color: '#FFFFFF',
            fontSize: '10px',
            fontWeight: '800'
          }}
        >
          {merchant.isOpen ? 'ABIERTO' : 'CERRADO'}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {merchant.name}
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{merchant.category}</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: 'rgba(245, 158, 11, 0.12)',
              padding: '3px 6px',
              borderRadius: '6px',
              color: 'var(--token-gold)',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            <Star size={13} fill="currentColor" />
            <span>{merchant.rating.toFixed(1)}</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            marginTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            <span>{merchant.deliveryTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Bike size={13} />
            <span>${merchant.deliveryFeeUsd.toFixed(2)} USD</span>
          </div>
        </div>
      </div>
    </div>
  );
};
