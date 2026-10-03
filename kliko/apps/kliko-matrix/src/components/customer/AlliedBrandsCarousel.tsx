import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface BrandItem {
  id: string;
  name: string;
  logoUrl: string;
}

const ALLIED_BRANDS: BrandItem[] = [
  { id: 'b1', name: 'Burger & Co', logoUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=100&q=80' },
  { id: 'b2', name: 'Napolitana', logoUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=100&q=80' },
  { id: 'b3', name: 'Sushi Zen', logoUrl: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=100&q=80' },
  { id: 'b4', name: 'Beirut Grill', logoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=100&q=80' },
  { id: 'b5', name: 'Bodegón 24', logoUrl: 'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=100&q=80' },
  { id: 'b6', name: 'FarmaKlik', logoUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&q=80' }
];

export const AlliedBrandsCarousel: React.FC = () => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <ShieldCheck size={16} color="var(--brand-electric)" />
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
          Marcas y Red Aliada KlikPOS
        </h4>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '14px',
          overflowX: 'auto',
          paddingBottom: '6px',
          scrollbarWidth: 'none'
        }}
      >
        {ALLIED_BRANDS.map(brand => (
          <div
            key={brand.id}
            style={{
              flex: '0 0 68px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--bg-surface)',
                border: '2px solid var(--border-color)',
                padding: '2px',
                boxShadow: 'var(--card-shadow)',
                overflow: 'hidden'
              }}
            >
              <img
                src={brand.logoUrl}
                alt={brand.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
            <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '68px' }}>
              {brand.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};