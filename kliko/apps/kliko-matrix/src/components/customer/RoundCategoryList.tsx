import React from 'react';
import { ShoppingCart, UtensilsCrossed, Pill, Tv, MoreHorizontal } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ size: number; color?: string }>;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'groceries', name: 'Bodegón', icon: ShoppingCart },
  { id: 'food', name: 'Comida', icon: UtensilsCrossed },
  { id: 'pharmacy', name: 'Farmacia', icon: Pill },
  { id: 'tech', name: 'Tecno', icon: Tv },
  { id: 'more', name: 'Más', icon: MoreHorizontal }
];

interface RoundCategoryListProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export const RoundCategoryList: React.FC<RoundCategoryListProps> = ({ activeId, onSelect }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '22px',
        padding: '2px 4px'
      }}
    >
      {CATEGORIES.map(cat => {
        const Icon = cat.icon;
        const isActive = activeId === cat.id;

        return (
          <div
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              flex: 1
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: isActive ? 'var(--brand-primary)' : 'var(--bg-surface)',
                border: '1px solid',
                borderColor: isActive ? 'var(--brand-electric)' : 'var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--card-shadow)',
                transition: 'all 0.2s ease',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              <Icon size={22} color={isActive ? '#FFFFFF' : 'var(--text-primary)'} />
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: isActive ? '800' : '600',
                color: isActive ? 'var(--brand-electric)' : 'var(--text-secondary)',
                textAlign: 'center'
              }}
            >
              {cat.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};