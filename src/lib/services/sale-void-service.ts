import { db, LocalSale, LocalProduct, InventoryMovement } from '@/lib/db';

export interface VoidSaleResult {
  success: boolean;
  message: string;
  restoredItemsCount: number;
}

export async function voidSale(
  sale: LocalSale,
  reason: string = 'Devolución de cliente',
  performedBy: string = 'Cajero'
): Promise<VoidSaleResult> {
  if (!sale || !sale.receiptNumber) {
    return { success: false, message: 'Venta inválida', restoredItemsCount: 0 };
  }

  if (sale.status === 'voided') {
    return { success: false, message: 'Esta venta ya fue anulada previamente', restoredItemsCount: 0 };
  }

  try {
    let restoredCount = 0;

    await db.transaction('rw', db.sales, db.products, db.inventoryMovements, db.customers, async () => {
      // 1. Reintegrar stock de cada producto
      for (const item of sale.items) {
        let product = item.productId ? await db.products.get(item.productId) : null;
        if (!product && item.barcode) {
          product = await db.products.where('barcode').equals(item.barcode).first();
        }

        if (product && product.id) {
          const previousStock = product.stock;
          const newStock = previousStock + item.qty;

          await db.products.update(product.id, {
            stock: newStock,
            updatedAt: new Date().toISOString(),
          });

          await db.inventoryMovements.add({
            productId: product.id,
            productName: product.name,
            barcode: product.barcode,
            type: 'void_return',
            reason: 'count_adjustment',
            qtyDelta: item.qty,
            previousStock,
            newStock,
            timestamp: new Date().toISOString(),
            performedBy,
            notes: `Anulación de ticket ${sale.receiptNumber}. Motivo: ${reason}`,
          });

          restoredCount += item.qty;
        }
      }

      // 2. Si la venta fue a crédito (fiado), revertir la deuda del cliente
      if (sale.customerDoc) {
        const customer = await db.customers.where('docId').equals(sale.customerDoc).first();
        if (customer && customer.id) {
          const currentDebt = customer.currentDebtUSD || 0;
          await db.customers.update(customer.id, {
            currentDebtUSD: Math.max(0, currentDebt - (sale.totalUSD || 0)),
          });
        }
      }

      // 3. Marcar venta como voided
      const existingSale = await db.sales.where('receiptNumber').equals(sale.receiptNumber).first();
      if (existingSale && existingSale.id) {
        await db.sales.update(existingSale.id, {
          status: 'voided',
          voidedAt: new Date().toISOString(),
          voidedBy: performedBy,
          voidReason: reason,
        });
      }
    });

    // 4. Sincronizar catálogo actualizado al celular móvil
    try {
      const allProducts = await db.products.toArray();
      await fetch('/api/scanner/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: allProducts }),
      });
    } catch (e) {
      console.warn('Aviso sincronizando inventario con celular tras anulación:', e);
    }

    // 5. Emitir evento global
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('venematic:sale_voided', { detail: { receiptNumber: sale.receiptNumber } }));
    }

    return {
      success: true,
      message: `Venta ${sale.receiptNumber} anulada con éxito. Se reintegraron ${restoredCount} unidades al inventario.`,
      restoredItemsCount: restoredCount,
    };
  } catch (error: any) {
    console.error('Error al anular venta:', error);
    return {
      success: false,
      message: error?.message || 'Error inesperado al anular la venta',
      restoredItemsCount: 0,
    };
  }
}
