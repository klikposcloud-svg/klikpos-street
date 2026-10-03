import React from 'react';
import { Home, PackageCheck, MapPin, Sparkles } from 'lucide-react';
import { DeliveryType, KlikoHub } from '@packages/domain-core/src/order.types';

interface KlikoHubSelectorProps {
  selectedType: DeliveryType;
  selectedHubId?: string;
  onSelectType: (type: DeliveryType) => void;
  onSelectHub: (hub: KlikoHub) => void;
  hubs: KlikoHub[];
  doorFeeUsd: number;
}

export const KlikoHubSelector: React.FC<KlikoHubSelectorProps> = ({
  selectedType,
  selectedHubId,
  onSelectType,
  onSelectHub,
  hubs,
  doorFeeUsd
}) => {
  return (
    <div
      style={{
        borderRadius: '16px',
        padding: '16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)',
        marginBottom: '16px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>
          Método de Despacho
        </h4>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Opciones Flexibles</span>
      </div>

      {/* Tabs Selector: Puerta vs Punto Kliko */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        <button
          onClick={() => onSelectType('DOOR_DELIVERY')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '10px',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: selectedType === 'DOOR_DELIVERY' ? 'var(--brand-electric)' : 'var(--border-color)',
            background: selectedType === 'DOOR_DELIVERY' ? 'var(--bg-elevated)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Home size={18} color={selectedType === 'DOOR_DELIVERY' ? 'var(--brand-electric)' : 'var(--text-muted)'} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>En Puerta</span>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>${doorFeeUsd.toFixed(2)} USD</span>
        </button>

        <button
          onClick={() => onSelectType('KLIKO_HUB_PICKUP')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            padding: '10px',
            borderRadius: '12px',
            border: '1px solid',
            borderColor: selectedType === 'KLIKO_HUB_PICKUP' ? 'var(--success-emerald)' : 'var(--border-color)',
            background: selectedType === 'KLIKO_HUB_PICKUP' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s ease'
          }}
        >
          {/* Badge Ahorro */}
          <div
            style={{
              position: 'absolute',
              top: '-7px',
              right: '8px',
              padding: '2px 6px',
              borderRadius: '9999px',
              background: 'var(--success-emerald)',
              color: '#FFFFFF',
              fontSize: '9px',
              fontWeight: '900'
            }}
          >
            AHORRA 50%
          </div>

          <PackageCheck size={18} color={selectedType === 'KLIKO_HUB_PICKUP' ? 'var(--success-emerald)' : 'var(--text-muted)'} />
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>Punto Kliko</span>
          <span style={{ fontSize: '11px', color: 'var(--success-emerald)', fontWeight: '800' }}>$0.80 USD</span>
        </button>
      </div>

      {/* Lista de Puntos Kliko Cercanos si se seleccionó Hub */}
      {selectedType === 'KLIKO_HUB_PICKUP' && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Selecciona el local para retirar tu pedido:
          </div>

          {hubs.map(hub => {
            const isSelected = selectedHubId === hub.id;
            return (
              <div
                key={hub.id}
                onClick={() => onSelectHub(hub)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--success-emerald)' : 'var(--border-subtle)',
                  background: isSelected ? 'rgba(16, 185, 129, 0.06)' : 'var(--bg-elevated)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {hub.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} />
                    <span>{hub.address} ({hub.zone})</span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '800',
                    color: isSelected ? 'var(--success-emerald)' : 'var(--text-muted)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'transparent'
                  }}
                >
                  {isSelected ? 'Seleccionado ✓' : 'Elegir'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};