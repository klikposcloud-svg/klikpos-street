import React from 'react';
import { Clock, CheckCircle2, Bike, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';
import { KlikoOrder, OrderItem } from '@packages/domain-core/src/order.types';

interface OrdersPageProps {
  orders: KlikoOrder[];
  bcvRate: number;
}

export const OrdersPage: React.FC<OrdersPageProps> = ({ orders, bcvRate }) => {
  const getStatusBadge = (status: KlikoOrder['status']) => {
    switch (status) {
      case 'SUBMITTED':
        return { label: 'Enviado a Cocina', color: '#F59E0B' };
      case 'ACCEPTED_MERCHANT':
      case 'PREPARING':
        return { label: 'En Preparación (KlikPOS)', color: '#3B82F6' };
      case 'READY_FOR_PICKUP':
        return { label: 'Listo para Despacho', color: '#8B5CF6' };
      case 'ASSIGNED_RIDER':
      case 'IN_TRANSIT':
        return { label: 'Motorizado en Camino 🏍️', color: '#10B981' };
      case 'DELIVERED':
        return { label: 'Entregado con Éxito', color: '#10B981' };
      default:
        return { label: status, color: '#64748B' };
    }
  };

  return (
    <div style={{ padding: '16px', paddingBottom: '90px' }}>
      <div style={{ marginBottom: '18px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
          Mis Pedidos en Curso
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Seguimiento en tiempo real conectado a las comandas de KlikPOS
        </p>
      </div>

      {orders.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            background: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)'
          }}
        >
          <Clock size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>No tienes pedidos activos</h4>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Explora tus restaurantes favoritos y haz tu primer pedido.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {orders.map(order => {
            const badge = getStatusBadge(order.status);
            return (
              <div
                key={order.id}
                style={{
                  borderRadius: '16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                  boxShadow: 'var(--card-shadow)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                      {order.merchantName}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Orden #{order.id}</span>
                  </div>

                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: `${badge.color}1A`,
                      color: badge.color,
                      fontSize: '11px',
                      fontWeight: '800'
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Resumen de Items */}
                <div style={{ margin: '10px 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>{item.quantity}x {item.name}</span>
                      <span>${(item.priceUsd * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Código de Seguridad OTP para el Motorizado */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-elevated)',
                    border: '1px dashed var(--border-subtle)',
                    margin: '12px 0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="var(--brand-electric)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Código de Entrega (OTP):</span>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: '900', letterSpacing: '2px', color: 'var(--brand-electric)' }}>
                    {order.otpCode}
                  </span>
                </div>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Total (Bs. {(order.totalUsd * bcvRate).toFixed(2)}):
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>
                    ${order.totalUsd.toFixed(2)} USD
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

