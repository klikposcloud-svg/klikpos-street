'use client';

import React from 'react';
import { Icon } from '@iconify/react';

export function getProductIcon(name: string, category: string = '', image?: string, sizeClass: string = 'w-16 h-16', customIcon?: string) {
  if (customIcon) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-3xl shadow-xs text-slate-800 dark:text-slate-100`}>
        <Icon icon={customIcon} className="w-4/5 h-4/5" />
      </div>
    );
  }

  if (image) {
    if (image.startsWith('data:') || image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')) {
      return (
        <div className={`${sizeClass} rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 shadow-xs flex items-center justify-center`}>
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
      );
    }
    // If it's an Iconify icon string (contains :)
    if (image.includes(':')) {
      return (
        <div className={`${sizeClass} rounded-2xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center text-3xl shadow-xs text-slate-800 dark:text-slate-100`}>
          <Icon icon={image} className="w-4/5 h-4/5" />
        </div>
      );
    }
    // If it's a short string (like emoji)
    if (image.length <= 4) {
      return (
        <div className={`${sizeClass} rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-3xl shadow-xs`}>
          {image}
        </div>
      );
    }
  }

  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (n.includes('apple') || n.includes('manzana')) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-3xl shadow-xs`}>
        🍏
      </div>
    );
  }
  if (n.includes('banana') || n.includes('plátano') || n.includes('cambur')) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-3xl shadow-xs`}>
        🍌
      </div>
    );
  }
  if (n.includes('bread') || n.includes('pan') || n.includes('trigo')) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-3xl shadow-xs`}>
        🍞
      </div>
    );
  }
  if (n.includes('milk') || n.includes('leche')) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-3xl shadow-xs`}>
        🥛
      </div>
    );
  }
  if (n.includes('cheese') || n.includes('queso')) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-yellow-50 dark:bg-yellow-950/40 flex items-center justify-center text-3xl shadow-xs`}>
        🧀
      </div>
    );
  }
  if (n.includes('egg') || n.includes('huevo')) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-3xl shadow-xs`}>
        🥚
      </div>
    );
  }
  if (n.includes('chicken') || n.includes('pollo') || n.includes('breast') || n.includes('pechuga') || n.includes('meat') || n.includes('carne')) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-3xl shadow-xs`}>
        🍗
      </div>
    );
  }
  if (n.includes('soda') || n.includes('refresco') || n.includes('coke') || n.includes('pepsi') || n.includes('jugo') || n.includes('agua')) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-3xl shadow-xs`}>
        🥤
      </div>
    );
  }
  if (n.includes('chip') || n.includes('snack') || n.includes('dorito') || n.includes('papas') || n.includes('cereal') || n.includes('galleta')) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-3xl shadow-xs`}>
        🍟
      </div>
    );
  }
  if (n.includes('coffee') || n.includes('café')) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-3xl shadow-xs`}>
        ☕
      </div>
    );
  }
  if (n.includes('detergent') || n.includes('jabón') || n.includes('limpieza') || n.includes('cloro')) {
    return (
      <div className={`${sizeClass} rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-3xl shadow-xs`}>
        🧴
      </div>
    );
  }

  // Category fallback
  if (c.includes('produce') || c.includes('fruta') || c.includes('verdura')) {
    return <div className={`${sizeClass} rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-3xl shadow-xs`}>🥗</div>;
  }
  if (c.includes('bakery') || c.includes('panadería') || c.includes('panaderia')) {
    return <div className={`${sizeClass} rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-3xl shadow-xs`}>🥐</div>;
  }
  if (c.includes('dairy') || c.includes('lácteo') || c.includes('lacteo')) {
    return <div className={`${sizeClass} rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-3xl shadow-xs`}>🧈</div>;
  }
  if (c.includes('meat') || c.includes('carnicería') || c.includes('carniceria')) {
    return <div className={`${sizeClass} rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-3xl shadow-xs`}>🥩</div>;
  }
  if (c.includes('snack')) {
    return <div className={`${sizeClass} rounded-2xl bg-yellow-50 dark:bg-yellow-950/40 flex items-center justify-center text-3xl shadow-xs`}>🍿</div>;
  }
  if (c.includes('beverage') || c.includes('bebida')) {
    return <div className={`${sizeClass} rounded-2xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-3xl shadow-xs`}>🧃</div>;
  }
  if (c.includes('cleaning') || c.includes('limpieza')) {
    return <div className={`${sizeClass} rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center text-3xl shadow-xs`}>🧹</div>;
  }

  return (
    <div className={`${sizeClass} rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl text-slate-500 dark:text-slate-300 shadow-xs`}>
      📦
    </div>
  );
}

export const INITIAL_DEMO_PRODUCTS = [
  {
    id: 'prod_1',
    storeId: 'default_store',
    name: 'Apples',
    description: 'Fresh organic green apples',
    barcode: '7591234001',
    category: 'Produce',
    subcategory: 'Fruits',
    priceUSD: 2.50,
    costUSD: 1.20,
    stock: 45,
    minStock: 10,
    maxStock: 100,
    unit: 'kg' as const,
    image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
    supplier: 'AgroFresh',
    tags: ['fruit', 'fresh'],
    isScanned: false,
    visualCategory: 'Produce',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    storeId: 'default_store',
    name: 'Bananas',
    description: 'Fresh ripe bananas',
    barcode: '7591234002',
    category: 'Bakery',
    subcategory: 'Fruits',
    priceUSD: 1.20,
    costUSD: 0.60,
    stock: 30,
    minStock: 5,
    maxStock: 80,
    unit: 'kg' as const,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
    supplier: 'AgroFresh',
    tags: ['fruit', 'banana'],
    isScanned: false,
    visualCategory: 'Bakery',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    storeId: 'default_store',
    name: 'Bread',
    description: 'Freshly baked sliced bread',
    barcode: '7591234003',
    category: 'Dairy',
    subcategory: 'Bakery',
    priceUSD: 2.80,
    costUSD: 1.40,
    stock: 25,
    minStock: 5,
    maxStock: 50,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
    supplier: 'Panadería Central',
    tags: ['bread', 'bakery'],
    isScanned: false,
    visualCategory: 'Dairy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_4',
    storeId: 'default_store',
    name: 'Milk',
    description: 'Whole pasteurized milk 1L',
    barcode: '7591234004',
    category: 'Meat',
    subcategory: 'Dairy',
    priceUSD: 2.20,
    costUSD: 1.30,
    stock: 20,
    minStock: 6,
    maxStock: 60,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
    supplier: 'Lácteos Los Andes',
    tags: ['dairy', 'milk'],
    isScanned: false,
    visualCategory: 'Meat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_5',
    storeId: 'default_store',
    name: 'Cheese',
    description: 'Cheddar cheese wedge',
    barcode: '7591234005',
    category: 'Snacks',
    subcategory: 'Dairy',
    priceUSD: 5.50,
    costUSD: 3.20,
    stock: 18,
    minStock: 4,
    maxStock: 40,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
    supplier: 'Lácteos Los Andes',
    tags: ['cheese', 'dairy'],
    isScanned: false,
    visualCategory: 'Snacks',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_6',
    storeId: 'default_store',
    name: 'Egges',
    description: 'Fresh farm eggs carton (12 pcs)',
    barcode: '7591234006',
    category: 'Produce',
    subcategory: 'Poultry',
    priceUSD: 3.80,
    costUSD: 2.10,
    stock: 22,
    minStock: 5,
    maxStock: 50,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80',
    supplier: 'Granja Avícola',
    tags: ['eggs'],
    isScanned: false,
    visualCategory: 'Produce',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_7',
    storeId: 'default_store',
    name: 'Eggs',
    description: 'Farm fresh brown eggs (30 pcs)',
    barcode: '7591234007',
    category: 'Bakery',
    subcategory: 'Poultry',
    priceUSD: 4.50,
    costUSD: 2.80,
    stock: 15,
    minStock: 5,
    maxStock: 40,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&q=80',
    supplier: 'Granja Avícola',
    tags: ['eggs'],
    isScanned: false,
    visualCategory: 'Bakery',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_8',
    storeId: 'default_store',
    name: 'Chicken Breast',
    description: 'Fresh skinless chicken breast fillet',
    barcode: '7591234008',
    category: 'Dairy',
    subcategory: 'Meat',
    priceUSD: 6.80,
    costUSD: 4.00,
    stock: 12,
    minStock: 3,
    maxStock: 30,
    unit: 'kg' as const,
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',
    supplier: 'Carnes Premier',
    tags: ['meat', 'chicken'],
    isScanned: false,
    visualCategory: 'Dairy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_9',
    storeId: 'default_store',
    name: 'Soda',
    description: 'Chilled cola soda can 355ml',
    barcode: '7591234009',
    category: 'Meat',
    subcategory: 'Beverages',
    priceUSD: 1.50,
    costUSD: 0.75,
    stock: 50,
    minStock: 10,
    maxStock: 100,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
    supplier: 'Refrescos Nacionales',
    tags: ['soda', 'drink'],
    isScanned: false,
    visualCategory: 'Meat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_10',
    storeId: 'default_store',
    name: 'Chips',
    description: 'Crispy salted potato chips',
    barcode: '7591234010',
    category: 'Snacks',
    subcategory: 'Snacks',
    priceUSD: 1.80,
    costUSD: 0.90,
    stock: 40,
    minStock: 8,
    maxStock: 80,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
    supplier: 'Snack Foods',
    tags: ['chips', 'snack'],
    isScanned: false,
    visualCategory: 'Snacks',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_11',
    storeId: 'default_store',
    name: 'Coffee',
    description: 'Hot specialty brewed coffee',
    barcode: '7591234011',
    category: 'Produce',
    subcategory: 'Beverages',
    priceUSD: 2.00,
    costUSD: 0.80,
    stock: 35,
    minStock: 5,
    maxStock: 60,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
    supplier: 'Café Carbone',
    tags: ['coffee', 'hot'],
    isScanned: false,
    visualCategory: 'Produce',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_12',
    storeId: 'default_store',
    name: 'Dalti Soda',
    description: 'Flavored sparkling soda',
    barcode: '7591234012',
    category: 'Bakery',
    subcategory: 'Beverages',
    priceUSD: 1.75,
    costUSD: 0.85,
    stock: 28,
    minStock: 6,
    maxStock: 50,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&q=80',
    supplier: 'Refrescos Nacionales',
    tags: ['soda'],
    isScanned: false,
    visualCategory: 'Bakery',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_13',
    storeId: 'default_store',
    name: 'Chipps Chips',
    description: 'Barbecue flavored chips',
    barcode: '7591234013',
    category: 'Dairy',
    subcategory: 'Snacks',
    priceUSD: 2.20,
    costUSD: 1.00,
    stock: 19,
    minStock: 5,
    maxStock: 40,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80',
    supplier: 'Snack Foods',
    tags: ['chips'],
    isScanned: false,
    visualCategory: 'Dairy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_14',
    storeId: 'default_store',
    name: 'Snacks Chips',
    description: 'Sour cream & onion potato crisps',
    barcode: '7591234014',
    category: 'Meat',
    subcategory: 'Snacks',
    priceUSD: 2.50,
    costUSD: 1.10,
    stock: 25,
    minStock: 5,
    maxStock: 50,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=400&q=80',
    supplier: 'Snack Foods',
    tags: ['chips'],
    isScanned: false,
    visualCategory: 'Meat',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_15',
    storeId: 'default_store',
    name: 'Out-of-Stock',
    description: 'Currently unavailable product',
    barcode: '7591234015',
    category: 'Snacks',
    subcategory: 'General',
    priceUSD: 0.00,
    costUSD: 0.00,
    stock: 0,
    minStock: 5,
    maxStock: 20,
    unit: 'unit' as const,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
    supplier: 'General Supply',
    tags: ['out-of-stock'],
    isScanned: false,
    visualCategory: 'Snacks',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
