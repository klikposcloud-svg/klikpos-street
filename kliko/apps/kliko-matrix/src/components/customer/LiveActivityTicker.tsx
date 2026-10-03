import React, { useState, useEffect } from 'react';
import { Flame, Sparkles } from 'lucide-react';

const ACTIVITIES = [
  "🔥 ¡Carlos en Altamira acaba de pedir una Doble Bacon Burger!",
  "✨ María calificó con 5 estrellas a 'Piazza Napolitana'",
  "🏍️ ¡Repartidor en camino con entrega en tiempo récord!",
  "🍔 12 personas están viendo el menú de 'Burger & Co.'",
  "⭐ 'Sushi Zen' es el local más popular de la tarde"
];

export const LiveActivityTicker: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % ACTIVITIES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '9999px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        fontSize: '11px',
        fontWeight: '600',
        color: 'var(--text-secondary)',
        marginBottom: '14px',
        overflow: 'hidden',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-electric)', fontWeight: '800' }}>
        <Sparkles size={12} />
        <span>EN VIVO:</span>
      </div>
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
        {ACTIVITIES[index]}
      </span>
    </div>
  );
};