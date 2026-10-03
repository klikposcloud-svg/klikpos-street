import React from 'react';
import { Compass, Wallet, Clock, User } from 'lucide-react';

export type KlikoNavTab = 'explore' | 'wallet' | 'orders' | 'profile';

interface KlikoDockerProps {
  activeTab: KlikoNavTab;
  onTabChange: (tab: KlikoNavTab) => void;
  activeOrdersCount?: number;
}

export const KlikoDocker: React.FC<KlikoDockerProps> = ({
  activeTab,
  onTabChange,
  activeOrdersCount = 0
}) => {
  const tabs = [
    { id: 'explore' as KlikoNavTab, label: 'Explorar', icon: Compass },
    { id: 'wallet' as KlikoNavTab, label: 'K-Wallet', icon: Wallet },
    { id: 'orders' as KlikoNavTab, label: 'Pedidos', icon: Clock, badge: activeOrdersCount },
    { id: 'profile' as KlikoNavTab, label: 'Perfil', icon: User }
  ];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '440px',
        background: 'var(--docker-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.4)',
        zIndex: 100
      }}
    >
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '6px 4px',
              borderRadius: '16px',
              border: 'none',
              background: isActive ? 'var(--bg-elevated)' : 'transparent',
              color: isActive ? 'var(--brand-electric)' : 'var(--text-muted)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '11px', fontWeight: isActive ? '800' : '500' }}>
              {tab.label}
            </span>

            {/* Badge de Pedidos Activos */}
            {Boolean(tab.badge && tab.badge > 0) && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '18px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--brand-electric)',
                  boxShadow: '0 0 8px var(--brand-electric)'
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
