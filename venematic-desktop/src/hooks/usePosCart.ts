'use client';

import { useState, useRef, useMemo } from 'react';
import { LocalProduct, SaleItem } from '@/lib/db';
import { scaleService, WeightReading } from '@/lib/hardware/scale';
import { soundEffects } from '@/lib/utils/sound';

export interface CartItem extends SaleItem {
  stock: number;
}

export type PosProductInput = Partial<LocalProduct> & {
  id?: number;
  name: string;
  priceUSD: number;
};

interface UsePosCartParams {
  bcvRate: number;
  scaleReading: WeightReading;
  scaleConnected: boolean;
  onRequireManualWeight: (product: LocalProduct) => void;
  onShowToast: (text: string, type?: 'success' | 'error' | 'info') => void;
}

export function usePosCart({
  bcvRate,
  scaleReading,
  scaleConnected,
  onRequireManualWeight,
  onShowToast,
}: UsePosCartParams) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCartItemId, setSelectedCartItemId] = useState<number | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState<number | null>(null);

  const cartRef = useRef<CartItem[]>([]);
  cartRef.current = cart;

  const selectedCartItemIdRef = useRef<number | null>(null);
  selectedCartItemIdRef.current = selectedCartItemId;

  const pendingQuantityRef = useRef<number | null>(null);
  pendingQuantityRef.current = pendingQuantity;

  // Totales
  const subtotalUSD = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalUSD, 0);
  }, [cart]);

  const totalUSD = subtotalUSD;

  const totalVES = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (item.isFixedPriceVES && item.fixedPriceVES) {
        return sum + item.fixedPriceVES * item.qty;
      }
      return sum + item.totalUSD * bcvRate;
    }, 0);
  }, [cart, bcvRate]);

  // Agregar al carrito
  const addToCart = (product: PosProductInput, customQty: number = 1) => {
    let qtyToAdd =
      pendingQuantityRef.current && pendingQuantityRef.current > 0
        ? pendingQuantityRef.current
        : customQty;

    const unitLower = (product.unit || '').toLowerCase().trim();
    const isWeighed =
      unitLower.includes('kg') ||
      unitLower.includes('kilo') ||
      unitLower.includes('gr') ||
      unitLower.includes('gram') ||
      unitLower === 'g' ||
      unitLower.includes('pesable') ||
      unitLower.includes('peso');

    const scaleCfg = scaleService.getConfig();
    const isPhysicalScaleConnected = scaleConnected || scaleService.isConnected();

    if (
      isWeighed &&
      isPhysicalScaleConnected &&
      scaleCfg.autoWeight &&
      scaleReading.weight > 0 &&
      pendingQuantityRef.current === null &&
      customQty === 1
    ) {
      qtyToAdd = scaleReading.weight;
      onShowToast(`⚖️ Balanza: ${scaleReading.weight.toFixed(3)} kg para ${product.name}`, 'info');
    } else if (isWeighed && pendingQuantityRef.current === null && customQty === 1) {
      onRequireManualWeight(product as LocalProduct);
      return;
    }

    if (pendingQuantityRef.current !== null) {
      setPendingQuantity(null);
    }

    const targetProductId = product.id ?? Date.now();

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === targetProductId);
      if (existing) {
        const newQty = existing.qty + qtyToAdd;
        return prev.map((item) =>
          item.productId === targetProductId
            ? { ...item, qty: Number(newQty.toFixed(3)), totalUSD: newQty * item.priceUSD }
            : item
        );
      } else {
        const isFixed = product.isFixedPriceVES && product.fixedPriceVES;
        const itemPriceUSD = isFixed ? product.fixedPriceVES! / bcvRate : product.priceUSD;
        return [
          ...prev,
          {
            productId: targetProductId,
            name: product.name,
            barcode: product.barcode || '',
            qty: Number(qtyToAdd.toFixed(3)),
            priceUSD: itemPriceUSD,
            totalUSD: qtyToAdd * itemPriceUSD,
            stock: typeof product.stock === 'number' ? product.stock : 999,
            isFixedPriceVES: product.isFixedPriceVES,
            fixedPriceVES: product.fixedPriceVES,
          },
        ];
      }
    });

    setSelectedCartItemId(targetProductId);
  };

  const updateItemQty = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      removeItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, qty: newQty, totalUSD: newQty * item.priceUSD }
          : item
      )
    );
  };

  const removeItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
    if (selectedCartItemId === productId) {
      setSelectedCartItemId(null);
    }
  };

  const clearCart = () => {
    setCart([]);
    setPendingQuantity(null);
    setSelectedCartItemId(null);
  };

  return {
    cart,
    setCart,
    cartRef,
    selectedCartItemId,
    setSelectedCartItemId,
    selectedCartItemIdRef,
    pendingQuantity,
    setPendingQuantity,
    pendingQuantityRef,
    subtotalUSD,
    totalUSD,
    totalVES,
    addToCart,
    updateItemQty,
    removeItem,
    clearCart,
  };
}
