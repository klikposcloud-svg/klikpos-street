'use client';

import { useState, useCallback } from 'react';
import type { CartItem, Product } from '@/types/tablet-pos';

const CART_STORAGE_KEY = 'klikpos_tablet_cart';

/** Sonido háptico digital sutil (Cero latencia, 100% offline) */
function playDigitalTapSound() {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.035);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.035);
  } catch {}
}

export interface UseCartReturn {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (prod: Product) => void;
  updateQty: (id: string, delta: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getCartQty: (productId: string) => number;
  editingItemNotes: CartItem | null;
  setEditingItemNotes: (item: CartItem | null) => void;
  saveItemNotes: (itemId: string, notes: string) => void;
}

export function useCart(initialCart: CartItem[] = []): UseCartReturn {
  const [cart, setCart] = useState<CartItem[]>(initialCart);
  const [editingItemNotes, setEditingItemNotes] = useState<CartItem | null>(null);

  const persistCart = useCallback((updatedCart: CartItem[]) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
    } catch {}
  }, []);

  const addToCart = useCallback((prod: Product) => {
    playDigitalTapSound();
    setCart((prev) => {
      const exists = prev.find((item) => item.id === prod.id);
      const updated = exists
        ? prev.map((item) =>
            item.id === prod.id ? { ...item, qty: item.qty + 1 } : item
          )
        : [
            ...prev,
            {
              id: prod.id,
              name: prod.name,
              priceUSD: prod.priceUSD,
              qty: 1,
              category: prod.category,
              image: prod.image,
              sku: prod.sku,
            },
          ];
      persistCart(updated);
      return updated;
    });
  }, [persistCart]);

  const updateQty = useCallback((id: string, delta: number) => {
    playDigitalTapSound();
    setCart((prev) => {
      const updated = prev
        .map((item) => (item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item))
        .filter((item) => item.qty > 0);
      persistCart(updated);
      return updated;
    });
  }, [persistCart]);

  const removeFromCart = useCallback((id: string) => {
    playDigitalTapSound();
    setCart((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      persistCart(updated);
      return updated;
    });
  }, [persistCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    persistCart([]);
  }, [persistCart]);

  const getCartQty = useCallback((productId: string) => {
    return cart.find((i) => i.id === productId)?.qty ?? 0;
  }, [cart]);

  const saveItemNotes = useCallback((itemId: string, notes: string) => {
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.id === itemId ? { ...item, notes } : item
      );
      persistCart(updated);
      return updated;
    });
    setEditingItemNotes(null);
  }, [persistCart]);

  return {
    cart,
    setCart,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    getCartQty,
    editingItemNotes,
    setEditingItemNotes,
    saveItemNotes,
  };
}
