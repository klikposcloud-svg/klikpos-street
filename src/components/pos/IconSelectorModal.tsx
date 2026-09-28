'use client';

import React, { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Search, X, Check, Sparkles, Palette, Tag } from 'lucide-react';
import { db, LocalProduct } from '@/lib/db';

interface IconSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: LocalProduct | null;
  onIconSelected?: (iconName: string, color?: string) => void;
}

// Catálogo curado de íconos Iconify por rubros comerciales
const ICON_CATEGORIES: { name: string; icon: string; icons: string[] }[] = [
  {
    name: 'Charcutería & Carnes',
    icon: 'mdi:food-drumstick',
    icons: [
      'mdi:food-drumstick',
      'mdi:food-steak',
      'ph:meat-fill',
      'fluent-emoji-flat:cut-of-meat',
      'fluent-emoji-flat:poultry-leg',
      'fluent-emoji-flat:bacon',
      'lucide:beef',
      'solar:chef-hat-bold',
      'mdi:food-hot-dog',
      'fluent-emoji-flat:hot-dog',
      'fluent-emoji-flat:hamburger',
      'tabler:sausage',
      'fluent:food-pig-24-filled',
    ]
  },
  {
    name: 'Lácteos & Quesos',
    icon: 'ph:cheese-fill',
    icons: [
      'ph:cheese-fill',
      'fluent-emoji-flat:cheese-wedge',
      'fluent-emoji-flat:glass-of-milk',
      'fluent-emoji-flat:butter',
      'lucide:milk',
      'solar:cup-bold',
      'fluent:drink-bottle-32-filled',
      'tabler:milk',
      'ph:cow-fill',
      'mdi:bottle-tonic',
    ]
  },
  {
    name: 'Panadería & Pastelería',
    icon: 'ph:bread-fill',
    icons: [
      'ph:bread-fill',
      'fluent-emoji-flat:bread',
      'fluent-emoji-flat:croissant',
      'fluent-emoji-flat:baguette-bread',
      'fluent-emoji-flat:bagel',
      'fluent-emoji-flat:flatbread',
      'fluent-emoji-flat:pancakes',
      'fluent-emoji-flat:waffle',
      'fluent-emoji-flat:birthday-cake',
      'fluent-emoji-flat:shortcake',
      'fluent-emoji-flat:pie',
      'fluent-emoji-flat:cupcake',
      'lucide:croissant',
      'lucide:cake',
      'lucide:cookie',
    ]
  },
  {
    name: 'Cafetería & Bebidas',
    icon: 'solar:cup-bold',
    icons: [
      'solar:cup-bold',
      'fluent-emoji-flat:hot-beverage',
      'fluent-emoji-flat:teacup-without-handle',
      'fluent-emoji-flat:cup-with-straw',
      'fluent-emoji-flat:bubble-tea',
      'fluent-emoji-flat:beverage-box',
      'fluent-emoji-flat:mate',
      'fluent-emoji-flat:beer-mug',
      'fluent-emoji-flat:clinking-beer-mugs',
      'fluent-emoji-flat:wine-glass',
      'fluent-emoji-flat:cocktail-glass',
      'fluent-emoji-flat:tropical-drink',
      'fluent-emoji-flat:bottle-with-popping-cork',
      'lucide:coffee',
      'lucide:cup-soda',
      'lucide:wine',
    ]
  },
  {
    name: 'Víveres & Despensa',
    icon: 'solar:shop-2-bold',
    icons: [
      'solar:shop-2-bold',
      'solar:bag-3-bold',
      'solar:box-minimalistic-bold',
      'fluent-emoji-flat:canned-food',
      'fluent-emoji-flat:bowl-with-spoon',
      'fluent-emoji-flat:pot-of-food',
      'fluent-emoji-flat:cooking',
      'fluent-emoji-flat:salt',
      'fluent-emoji-flat:olive',
      'lucide:shopping-bag',
      'lucide:package',
      'lucide:boxes',
      'tabler:basket',
      'ph:shopping-bag-open-fill',
    ]
  },
  {
    name: 'Frutas & Vegetales',
    icon: 'fluent-emoji-flat:red-apple',
    icons: [
      'fluent-emoji-flat:red-apple',
      'fluent-emoji-flat:green-apple',
      'fluent-emoji-flat:banana',
      'fluent-emoji-flat:avocado',
      'fluent-emoji-flat:tomato',
      'fluent-emoji-flat:lemon',
      'fluent-emoji-flat:watermelon',
      'fluent-emoji-flat:grapes',
      'fluent-emoji-flat:strawberry',
      'fluent-emoji-flat:orange',
      'fluent-emoji-flat:pineapple',
      'fluent-emoji-flat:mango',
      'fluent-emoji-flat:carrot',
      'fluent-emoji-flat:potato',
      'fluent-emoji-flat:onion',
      'fluent-emoji-flat:garlic',
      'fluent-emoji-flat:broccoli',
      'lucide:apple',
    ]
  },
  {
    name: 'Snacks & Golosinas',
    icon: 'fluent-emoji-flat:popcorn',
    icons: [
      'fluent-emoji-flat:popcorn',
      'fluent-emoji-flat:candy',
      'fluent-emoji-flat:lollipop',
      'fluent-emoji-flat:chocolate-bar',
      'fluent-emoji-flat:cookie',
      'fluent-emoji-flat:doughnut',
      'fluent-emoji-flat:soft-ice-cream',
      'fluent-emoji-flat:ice-cream',
      'fluent-emoji-flat:french-fries',
      'fluent-emoji-flat:pretzel',
    ]
  },
  {
    name: 'Higiene, Limpieza & Otros',
    icon: 'fluent-emoji-flat:soap',
    icons: [
      'fluent-emoji-flat:soap',
      'fluent-emoji-flat:lotion-bottle',
      'fluent-emoji-flat:sponge',
      'fluent-emoji-flat:roll-of-paper',
      'fluent-emoji-flat:pill',
      'fluent-emoji-flat:adhesive-bandage',
      'fluent-emoji-flat:shopping-cart',
      'fluent-emoji-flat:wrapped-gift',
      'solar:tag-price-bold',
      'solar:star-bold',
      'solar:shield-check-bold',
      'solar:heart-bold',
      'lucide:gift',
      'lucide:sparkles',
    ]
  }
];

export default function IconSelectorModal({
  isOpen,
  onClose,
  product,
  onIconSelected
}: IconSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [currentIcon, setCurrentIcon] = useState(product?.icon || '');
  const [customInput, setCustomInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filtrar íconos
  const filteredIcons = useMemo(() => {
    if (!search.trim()) {
      return ICON_CATEGORIES[selectedTab]?.icons || [];
    }
    const q = search.toLowerCase();
    const all: string[] = [];
    ICON_CATEGORIES.forEach(cat => {
      cat.icons.forEach(ico => {
        if (ico.toLowerCase().includes(q) && !all.includes(ico)) {
          all.push(ico);
        }
      });
    });
    return all;
  }, [search, selectedTab]);

  if (!isOpen) return null;

  const handleSelectIcon = async (iconKey: string) => {
    setCurrentIcon(iconKey);
    if (onIconSelected) {
      onIconSelected(iconKey);
    }
    if (product?.id) {
      setIsSaving(true);
      try {
        await db.products.update(product.id, { icon: iconKey });
      } catch (err) {
        console.error('Error guardando ícono en producto:', err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleApplyCustom = async () => {
    if (!customInput.trim()) return;
    await handleSelectIcon(customInput.trim());
    setCustomInput('');
  };

  const handleRemoveIcon = async () => {
    setCurrentIcon('');
    if (onIconSelected) {
      onIconSelected('');
    }
    if (product?.id) {
      await db.products.update(product.id, { icon: undefined });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Personalizador de Íconos Iconify
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {product ? `Asignando ícono a: ${product.name}` : 'Selecciona un ícono para personalizar el catálogo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Buscador & Preview Activo */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar ícono (ej. carne, café, pizza, cheese)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Preview del ícono actual */}
          <div className="flex items-center gap-2.5 shrink-0 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Actual:</span>
            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-lg">
              {currentIcon ? <Icon icon={currentIcon} className="w-6 h-6" /> : <Tag className="w-4 h-4 text-slate-400" />}
            </div>
            {currentIcon && (
              <button
                type="button"
                onClick={handleRemoveIcon}
                className="text-[10px] font-bold text-rose-500 hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
        </div>

        {/* Pestañas de categorías si no hay búsqueda activa */}
        {!search.trim() && (
          <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 scrollbar-none">
            {ICON_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                onClick={() => setSelectedTab(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedTab === idx
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <Icon icon={cat.icon} className="w-4 h-4" />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Rejilla de Íconos */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {filteredIcons.map((iconKey) => {
              const isSelected = currentIcon === iconKey;
              return (
                <button
                  key={iconKey}
                  type="button"
                  onClick={() => handleSelectIcon(iconKey)}
                  className={`relative aspect-square rounded-2xl p-2 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-sky-50 dark:bg-sky-950/50 border-2 border-sky-500 text-sky-600 dark:text-sky-400 shadow-md scale-105'
                      : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 hover:scale-105 shadow-2xs'
                  }`}
                  title={iconKey}
                >
                  <Icon icon={iconKey} className="w-8 h-8 group-hover:scale-110 transition-transform duration-150" />
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filteredIcons.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Tag className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                No se encontraron íconos en esta colección.
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Prueba escribiendo el nombre técnico de Iconify abajo.
              </p>
            </div>
          )}
        </div>

        {/* Input Técnico Directo de Iconify & Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <input
              type="text"
              placeholder="O ingresa código Iconify (ej: mdi:coffee, ph:pizza)..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={handleApplyCustom}
              disabled={!customInput.trim()}
              className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 disabled:opacity-40 transition-colors shrink-0"
            >
              Aplicar
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md transition-all active:scale-[0.98]"
          >
            {isSaving ? 'Guardando...' : 'Listo / Cerrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
