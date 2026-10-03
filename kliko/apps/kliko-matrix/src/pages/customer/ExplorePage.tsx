import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { MerchantCard, MerchantData } from '../../components/customer/MerchantCard';
import { LiveActivityTicker } from '../../components/customer/LiveActivityTicker';
import { KlikoHeroBanner } from '../../components/customer/KlikoHeroBanner';
import { RoundCategoryList } from '../../components/customer/RoundCategoryList';
import { KlikoGamificationBar } from '../../components/customer/KlikoGamificationBar';
import { FeaturedDishesCarousel, FeaturedDish } from '../../components/customer/FeaturedDishesCarousel';
import { AlliedBrandsCarousel } from '../../components/customer/AlliedBrandsCarousel';
import { KlikoHubSelector } from '../../components/customer/KlikoHubSelector';
import { DeliveryType, KlikoHub } from '@packages/domain-core/src/order.types';

const SAMPLE_MERCHANTS: MerchantData[] = [
  {
    id: 'rest-1',
    name: 'Burger & Co. Artisan',
    category: 'Hamburguesas & Grill',
    rating: 4.9,
    deliveryTime: '20-30 min',
    deliveryFeeUsd: 1.50,
    bannerUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
    hasKlikPos: true,
    isOpen: true
  },
  {
    id: 'rest-2',
    name: 'Piazza Napolitana',
    category: 'Pizzas a la Leña',
    rating: 4.8,
    deliveryTime: '25-40 min',
    deliveryFeeUsd: 2.00,
    bannerUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80',
    hasKlikPos: true,
    isOpen: true
  },
  {
    id: 'rest-3',
    name: 'Sushi Zen & Bowls',
    category: 'Comida Asiática',
    rating: 4.7,
    deliveryTime: '30-45 min',
    deliveryFeeUsd: 2.50,
    bannerUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&q=80',
    hasKlikPos: true,
    isOpen: true
  },
  {
    id: 'rest-4',
    name: 'Bodegón Express & Vinos',
    category: 'Bebidas & Snacks',
    rating: 4.9,
    deliveryTime: '15-25 min',
    deliveryFeeUsd: 1.50,
    bannerUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&q=80',
    hasKlikPos: true,
    isOpen: true
  }
];

const SAMPLE_HUBS: KlikoHub[] = [
  { id: 'hub-1', name: 'Panadería La Francesa (Punto Kliko)', address: 'Av. Libertador, Local 4', merchantId: 'rest-1', zone: 'Centro', coords: { lat: 10.48, lng: -66.90 }, custodyFeeUsd: 0.35, isOpen: true },
  { id: 'hub-2', name: 'Bodegón Altamira (Punto Kliko)', address: 'Plaza Altamira Sur', merchantId: 'rest-4', zone: 'Norte', coords: { lat: 10.49, lng: -66.85 }, custodyFeeUsd: 0.35, isOpen: true }
];

interface ExplorePageProps {
  bcvRate: number;
  tokenBalance: number;
  onSelectMerchant: (merchant: MerchantData) => void;
  onAddDish: (dish: FeaturedDish) => void;
  onSpinWheel: () => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  bcvRate,
  tokenBalance,
  onSelectMerchant,
  onAddDish,
  onSpinWheel
}) => {
  const [activeCategory, setActiveCategory] = useState('food');
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('DOOR_DELIVERY');
  const [selectedHub, setSelectedHub] = useState<KlikoHub | undefined>(SAMPLE_HUBS[0]);

  const filteredMerchants = SAMPLE_MERCHANTS.filter(m => {
    return m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           m.category.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div style={{ padding: '16px', paddingBottom: '95px' }}>
      {/* 1. Ticker Social de Actividad */}
      <LiveActivityTicker />

      {/* 2. Barra de Búsqueda */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--bg-surface)',
          padding: '11px 14px',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
          marginBottom: '16px'
        }}
      >
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="¿Qué buscas hoy? (Ej. Burger, Pizza, Bodegón...)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '14px',
            width: '100%',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* 3. HERO BANNER OFICIAL (Inspirado en la imagen de referencia: Repartidor en Scooter, Monedas, Botón Pill y Dots) */}
      <KlikoHeroBanner />

      {/* 4. Categorías Circulares Modernas (Bodegón, Comida, Farmacia, Tecno, Más) */}
      <RoundCategoryList activeId={activeCategory} onSelect={setActiveCategory} />

      {/* 5. Selector de Despacho (Puerta vs Punto Kliko PUDO) */}
      <KlikoHubSelector
        selectedType={deliveryType}
        selectedHubId={selectedHub?.id}
        onSelectType={setDeliveryType}
        onSelectHub={setSelectedHub}
        hubs={SAMPLE_HUBS}
        doorFeeUsd={1.50}
      />

      {/* 6. Barra de Recompensas y Rueda de la Fortuna */}
      <KlikoGamificationBar tokens={tokenBalance} onSpinWheel={onSpinWheel} />

      {/* 7. Platos Más Pedidos */}
      <FeaturedDishesCarousel bcvRate={bcvRate} onAddDish={onAddDish} />

      {/* 8. Marcas Aliadas */}
      <AlliedBrandsCarousel />

      {/* 9. Grid Principal de Tiendas y Restaurantes Conectados a KlikPOS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)' }}>
          Trending Stores (KlikPOS Cloud)
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--brand-electric)', fontWeight: '700', cursor: 'pointer' }}>
          Ver todas →
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filteredMerchants.map(merchant => (
          <MerchantCard key={merchant.id} merchant={merchant} onClick={onSelectMerchant} />
        ))}
      </div>
    </div>
  );
};