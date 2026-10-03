import { OrderStatus } from './order.types';

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  SUBMITTED: ['ACCEPTED_MERCHANT', 'CANCELLED'],
  ACCEPTED_MERCHANT: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['ASSIGNED_RIDER', 'CANCELLED'],
  ASSIGNED_RIDER: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['STORED_IN_HUB', 'DELIVERED', 'CANCELLED'],
  STORED_IN_HUB: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: []
};

export function canTransitionOrder(current: OrderStatus, next: OrderStatus): boolean {
  const allowed = VALID_ORDER_TRANSITIONS[current] || [];
  return allowed.includes(next);
}