import React from 'react';
import { Star, Plus } from 'lucide-react';

export interface FeaturedDish {
  id: string;
  name: string;
  restaurantName: string;
  priceUsd: number;
  rating: number;
  imageUrl: string;
  tag: string;
}

const FEATURED_DISHES: FeaturedDish[] = [
  {
    id: 'd1',
    name: 'Doble Bacon Cheddar',
    restaurantName: 'Burger & Co.',
    priceUsd: 8.50,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    tag: 'TOP VENTAS'
  },
  {
    id: 'd2',
    name: 'Pizza Cuatro Quesos',
    restaurantName: 'Piazza Napolitana',
    priceUsd: 9.00,
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80',
    tag: 'OFERTA'
  },
  {
    id: 'd3',
    name: 'Roll Dragón Especial',
    restaurantName: 'Sushi Zen',
    priceUsd: 11.00,
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80',
    tag: 'CHEF PICK'
  },
  {
    id: 'd4',
    name: 'Shawarma Mixto Especial',
    restaurantName: 'Beirut Grill',
    priceUsd: 6.50,
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=400&q=80',
    tag: 'FAVORITO'
  }
];

interface FeaturedDishesCarouselProps {
  bcvRate: number;
  onAddDish: (dish: FeaturedDish) => void;
}

export const FeaturedDishesCarousel: React.FC<FeaturedDishesCarouselProps> = ({ bcvRate, onAddDish }) => {
  return (
    <div style={{ marginBottom: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Star size={17} color="#F59E0B" fill="#F59E0B" />
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>
            Platos Más Pedidos
          </h3>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--brand-electric)', fontWeight: '700', cursor: 'pointer' }}>
          Ver todos →
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'none'
        }}
      >
        {FEATURED_DISHES.map(dish => (
          <div
            key={dish.id}
            style={{
              flex: '0 0 170px',
              borderRadius: '14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              boxShadow: 'var(--card-shadow)',
              position: 'relative'
            }}
          >
            {/* Tag */}
            <span
              style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                padding: '2px 6px',
                borderRadius: '6px',
                background: 'rgba(9, 13, 22, 0.85)',
                backdropFilter: 'blur(6px)',
                color: '#F59E0B',
                fontSize: '9px',
                fontWeight: '900',
                zIndex: 2
              }}
            >
              {dish.tag}
            </span>

            {/* Imagen */}
            <div style={{ height: '110px', width: '100%', overflow: 'hidden' }}>
              <img
                src={dish.imageUrl}
                alt={dish.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Info */}
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {dish.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {dish.restaurantName}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)' }}>
                    ${dish.priceUsd.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    Bs. {(dish.priceUsd * bcvRate).toFixed(0)}
                  </div>
                </div>

                <button
                  onClick={() => onAddDish(dish)}
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'var(--brand-primary)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px var(--brand-glow)'
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};