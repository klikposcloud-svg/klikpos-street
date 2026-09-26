'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface I18nContextType {
  t: (key: string) => string
  locale: string
  setLocale: (locale: string) => void
  i18n: {
    language: string
    changeLanguage: (lang: string) => void
  }
}

const translations: Record<string, Record<string, string>> = {
  es: {
    'common.online': 'En línea',
    'common.offline': 'Sin conexión',
    'common.subtotal': 'Subtotal',
    'common.total': 'Total',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.search': 'Buscar',
    'common.actions': 'Acciones',
    'common.date': 'Fecha',
    'common.status': 'Estado',
    'common.quantity': 'Cantidad',
    'common.price': 'Precio',
    'common.discount': 'Descuento',
    'common.syncing': 'Sincronizando',
    'pos.title': 'Punto de Venta',
    'pos.scanProduct': 'Escanear con Cámara',
    'pos.connectScanner': 'Vincular Celular como Escáner',
    'pos.searchProduct': 'Buscar producto por nombre o código...',
    'pos.allCategories': 'Todas las Categorías',
    'pos.lowStock': 'Stock bajo',
    'pos.outOfStock': 'Agotado',
    'pos.noProducts': 'Sin productos disponibles',
    'pos.newSale': 'Nueva Venta',
    'pos.applyIgtf': 'Aplicar IGTF (3%)',
    'pos.cash': 'Efectivo',
    'pos.card': 'Tarjeta / Débito',
    'pos.transfer': 'Transferencia Bancaria',
    'pos.mobile': 'Pago Móvil',
    'pos.mixed': 'Pago Mixto',
    'pos.customerEmail': 'Correo del cliente',
    'pos.customerPhone': 'Teléfono del cliente',
    'pos.completeSale': 'Cobrar / Completar Venta',
    'pos.saleCompleted': '¡Venta Realizada con Éxito!',
    'pos.paymentMethod': 'Método de pago',
    'delivery.title': 'Delivery y Pedidos Online',
    'delivery.newOrder': 'Nuevo Pedido',
    'delivery.inPreparation': 'En Preparación',
    'delivery.ready': 'Listo para Despacho',
    'delivery.onTheWay': 'En Camino',
    'delivery.delivered': 'Entregado',
    'delivery.cancelled': 'Cancelado',
    'delivery.dispatch': 'Despachar a Repartidor',
    'inventory.title': 'Control de Inventario',
    'inventory.addProduct': 'Agregar Producto',
    'inventory.stock': 'Existencia',
    'inventory.priceUSD': 'Precio ($)',
    'inventory.costUSD': 'Costo ($)',
  },
  en: {
    'common.online': 'Online',
    'common.offline': 'Offline',
    'common.subtotal': 'Subtotal',
    'common.total': 'Total',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'pos.title': 'Point of Sale',
    'pos.scanProduct': 'Scan with Camera',
    'pos.connectScanner': 'Pair Mobile Scanner',
    'pos.searchProduct': 'Search product...',
    'pos.allCategories': 'All',
    'pos.lowStock': 'Low stock',
    'pos.outOfStock': 'Out of stock',
    'pos.noProducts': 'No products',
    'pos.newSale': 'New Sale',
    'pos.applyIgtf': 'Apply IGTF (3%)',
    'pos.cash': 'Cash',
    'pos.card': 'Card',
    'pos.transfer': 'Transfer',
    'pos.mobile': 'Mobile Payment',
    'pos.mixed': 'Mixed',
    'pos.customerEmail': 'Customer email',
    'pos.customerPhone': 'Phone',
    'pos.completeSale': 'Complete Sale',
    'pos.saleCompleted': 'Sale Completed!',
    'pos.paymentMethod': 'Payment method',
  }
}

const I18nContext = createContext<I18nContextType>({
  t: (key) => key,
  locale: 'es',
  setLocale: () => {},
  i18n: {
    language: 'es',
    changeLanguage: () => {}
  }
})

export function useTranslation() {
  return useContext(I18nContext)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState('es')

  useEffect(() => {
    const saved = localStorage.getItem('i18nextLng')
    if (saved && translations[saved]) {
      setLocale(saved)
    } else {
      setLocale('es')
      localStorage.setItem('i18nextLng', 'es')
    }
  }, [])

  const t = (key: string): string => {
    const lang = translations[locale] || translations['es']
    return lang[key] || key
  }

  const handleSetLocale = (newLocale: string) => {
    if (translations[newLocale]) {
      setLocale(newLocale)
      localStorage.setItem('i18nextLng', newLocale)
    }
  }

  return (
    <I18nContext.Provider value={{
      t,
      locale,
      setLocale: handleSetLocale,
      i18n: {
        language: locale,
        changeLanguage: handleSetLocale
      }
    }}>
      {children}
    </I18nContext.Provider>
  )
}
