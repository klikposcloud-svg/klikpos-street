import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { KlikoHeader } from './components/common/KlikoHeader';
import { KlikoDocker, KlikoNavTab } from './components/common/KlikoDocker';
import { ExplorePage } from './pages/customer/ExplorePage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { KlikoWalletCard } from './components/wallet/KlikoWalletCard';
import { KlikoWallet } from '@packages/domain-core/src/wallet.types';
import { KlikoOrder } from '@packages/domain-core/src/order.types';
import { MerchantData } from './components/customer/MerchantCard';
import { FeaturedDish } from './components/customer/FeaturedDishesCarousel';

const SAMPLE_WALLET: KlikoWallet = {
  userId: 'user-demo-1',
  userType: 'CUSTOMER',
  balanceTokens: 42.50,
  lockedTokens: 0,
  reputationScore: 98,
  creditLimitTokens: 100.00,
  creditUsedTokens: 25.00,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const SAMPLE_ORDERS: KlikoOrder[] = [
  {
    id: 'KLK-9021',
    merchantId: 'rest-1',
    merchantName: 'Burger & Co. Artisan',
    customerId: 'user-demo-1',
    customerName: 'Carlos Mendoza',
    customerPhone: '+58 412 1234567',
    riderId: 'rider-5',
    riderName: 'Alejandro Moto',
    deliveryType: 'DOOR_DELIVERY',
    items: [
      { productId: 'p1', name: 'Doble Bacon Cheddar Burger', priceUsd: 8.50, quantity: 2 },
      { productId: 'p2', name: 'Papas Rústicas Trufadas', priceUsd: 3.50, quantity: 1 }
    ],
    subtotalUsd: 20.50,
    deliveryFeeUsd: 1.50,
    totalUsd: 22.00,
    paymentMethod: 'K_TOKENS',
    bcvRate: 871.37,
    totalBs: 19170.14,
    status: 'IN_TRANSIT',
    deliveryCoords: { lat: 10.4806, lng: -66.9036, address: 'Av. Principal, Edif. Altamira' },
    otpCode: '8492',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<KlikoNavTab>('explore');
  const [wallet, setWallet] = useState<KlikoWallet>(SAMPLE_WALLET);
  const [orders, setOrders] = useState<KlikoOrder[]>(SAMPLE_ORDERS);
  const [cartItemsCount, setCartItemsCount] = useState<number>(0);
  const [bcvRate] = useState<number>(871.37);

  const handleSelectMerchant = (merchant: MerchantData) => {
    alert(`Has seleccionado: ${merchant.name}\n(Conectado en tiempo real con la cocina de KlikPOS Cloud)`);
  };

  const handleAddDish = (dish: FeaturedDish) => {
    setCartItemsCount(prev => prev + 1);
    alert(`Agregado al carrito: ${dish.name} ($${dish.priceUsd.toFixed(2)} USD)`);
  };

  const handleSpinWheel = () => {
    const rewards = [2.00, 5.00, 1.50, 10.00, 0.50];
    const won = rewards[Math.floor(Math.random() * rewards.length)];
    setWallet(prev => ({ ...prev, balanceTokens: prev.balanceTokens + won }));
    alert(`🎉 ¡Felicidades! Has ganado +${won.toFixed(2)} K-Tokens en la Rueda de la Fortuna Kliko!`);
  };

  return (
    <ThemeProvider>
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
        {/* Header Superior Inteligente */}
        <KlikoHeader
          bcvRate={bcvRate}
          cartCount={cartItemsCount}
          tokenBalance={wallet.balanceTokens}
          onOpenWallet={() => setActiveTab('wallet')}
          onOpenCart={() => alert(`Carrito Kliko: ${cartItemsCount} productos seleccionados`)}
        />

        {/* Contenido Principal por Pestaña */}
        <main style={{ flex: 1, maxWidth: '640px', width: '100%', margin: '0 auto' }}>
          {activeTab === 'explore' && (
            <ExplorePage
              bcvRate={bcvRate}
              tokenBalance={wallet.balanceTokens}
              onSelectMerchant={handleSelectMerchant}
              onAddDish={handleAddDish}
              onSpinWheel={handleSpinWheel}
            />
          )}

          {activeTab === 'wallet' && (
            <div style={{ padding: '16px', paddingBottom: '95px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Mi Economía Digital
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Ahorra, transfiere y pide crédito en comercios afiliados a KlikPOS
                </p>
              </div>

              <KlikoWalletCard
                wallet={wallet}
                bcvRate={bcvRate}
                onDeposit={() => alert('Recarga en Bolívares vía Pago Móvil automatizado')}
                onPayWithTokens={() => alert('Escanea el QR del comercio para pagar con K-Tokens')}
                onRequestCredit={() => alert('Solicitud de K-Crédito pre-aprobado')}
              />
            </div>
          )}

          {activeTab === 'orders' && (
            <OrdersPage orders={orders} bcvRate={bcvRate} />
          )}

          {activeTab === 'profile' && (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Perfil de Usuario
              </h3>
              <p style={{ fontSize: '13px' }}>ID: user-demo-1 • Nivel VIP Gold ⭐</p>
            </div>
          )}
        </main>

        {/* Docker Flotante Inferior */}
        <KlikoDocker
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeOrdersCount={orders.filter(o => o.status !== 'DELIVERED').length}
        />
      </div>
    </ThemeProvider>
  );
};

export default App;