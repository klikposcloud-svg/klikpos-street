'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Package,
  Plus,
  Trash2,
  UploadCloud,
  CheckCircle2,
  Lock,
  Search,
  ExternalLink,
  Layers,
  Tag,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { db as firestoreDb } from '@/lib/firebase/config';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { VisualPack, VisualPackProduct, DEFAULT_VISUAL_PACKS } from '@/lib/marketplace/visual-packs-service';

export default function AdminVisualPacksPage() {
  const [packs, setPacks] = useState<VisualPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Formulario de nuevo paquete
  const [formData, setFormData] = useState<Partial<VisualPack>>({
    title: '',
    description: '',
    category: 'Bodegón & Licores',
    badge: 'Nuevo',
    version: '1.0.0',
    coverImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=600&auto=format&fit=crop&q=80',
    isFree: true,
    accessCode: '',
    tags: ['general'],
    products: [],
  });

  // Formulario para añadir un producto al paquete
  const [productForm, setProductForm] = useState<VisualPackProduct>({
    name: '',
    category: 'General',
    priceUsd: 1.0,
    costUsd: 0.7,
    barcode: '',
    imageUrl: '',
    stock: 50,
  });

  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([]);
  const [isSearchingImages, setIsSearchingImages] = useState(false);

  useEffect(() => {
    loadCloudPacks();
  }, []);

  const loadCloudPacks = async () => {
    setIsLoading(true);
    try {
      const colRef = collection(firestoreDb, 'marketplace_packs');
      const snap = await getDocs(colRef);
      const cloudPacks: VisualPack[] = [];

      if (!snap.empty) {
        snap.forEach(d => {
          cloudPacks.push({ ...(d.data() as VisualPack), id: d.id });
        });
      }

      // Si no hay paquetes en Firestore aún, mostrar los por defecto como base
      if (cloudPacks.length === 0) {
        setPacks(DEFAULT_VISUAL_PACKS);
      } else {
        setPacks(cloudPacks);
      }
    } catch (err) {
      console.warn('Error cargando paquetes de Firestore:', err);
      setPacks(DEFAULT_VISUAL_PACKS);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchImages = async () => {
    if (!imageSearchQuery.trim()) return;
    setIsSearchingImages(true);
    try {
      const res = await fetch(`/api/products/search-images?q=${encodeURIComponent(imageSearchQuery)}`);
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        setImageSearchResults(data.results);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingImages(false);
    }
  };

  const handleAddProductToPack = () => {
    if (!productForm.name.trim()) return;

    setFormData(prev => ({
      ...prev,
      products: [...(prev.products || []), { ...productForm }],
    }));

    setProductForm({
      name: '',
      category: formData.category || 'General',
      priceUsd: 1.0,
      costUsd: 0.7,
      barcode: '',
      imageUrl: '',
      stock: 50,
    });
    setImageSearchResults([]);
    setImageSearchQuery('');
  };

  const handleRemoveProductFromPack = (index: number) => {
    setFormData(prev => ({
      ...prev,
      products: (prev.products || []).filter((_, i) => i !== index),
    }));
  };

  const handleSavePackToCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim() || !formData.products || formData.products.length === 0) {
      alert('Debes agregar un título y al menos 1 producto al paquete.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const packId = formData.id || `pack-${Date.now()}`;
      const payload: VisualPack = {
        id: packId,
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        category: formData.category || 'General',
        badge: formData.badge || 'Nuevo',
        version: formData.version || '1.0.0',
        totalProducts: formData.products.length,
        coverImage: formData.coverImage || 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=600&auto=format&fit=crop&q=80',
        isFree: formData.isFree ?? true,
        accessCode: formData.accessCode ? formData.accessCode.trim().toUpperCase() : '',
        tags: formData.tags || ['general'],
        products: formData.products,
        createdAt: new Date().toISOString(),
      };

      const docRef = doc(firestoreDb, 'marketplace_packs', packId);
      await setDoc(docRef, payload, { merge: true });

      setSaveSuccess(true);
      setShowCreateModal(false);
      await loadCloudPacks();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Error guardando paquete en Firestore:', err);
      alert('No se pudo guardar en Firestore. Verifica la conexión y permisos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePack = async (packId: string) => {
    if (!confirm('¿Estás seguro de eliminar este paquete de la nube?')) return;
    try {
      const docRef = doc(firestoreDb, 'marketplace_packs', packId);
      await deleteDoc(docRef);
      setPacks(prev => prev.filter(p => p.id !== packId));
    } catch (err) {
      console.error('Error eliminando paquete:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ENCABEZADO DE NAVEGACIÓN */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/settings"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Gestor de Paquetes Visuales & Catálogos
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Admin Panel Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Crea, publica y comercializa paquetes de imágenes, códigos de barra y rubros para tus clientes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadCloudPacks}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all text-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
              <span>Refrescar</span>
            </button>

            <button
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  category: 'Bodegón & Licores',
                  badge: 'Nuevo',
                  version: '1.0.0',
                  coverImage: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=600&auto=format&fit=crop&q=80',
                  isFree: true,
                  accessCode: '',
                  tags: ['general'],
                  products: [],
                });
                setShowCreateModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nuevo Paquete</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold">
              ¡Paquete publicado exitosamente en Firestore! Ahora todos tus clientes pueden descargarlo desde su POS.
            </span>
          </div>
        )}

        {/* LISTA DE PAQUETES ACTIVOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-500" />
              <span className="text-xs font-bold">Cargando paquetes de la nube...</span>
            </div>
          ) : packs.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs">
              No hay paquetes registrados aún. Haz clic en "Crear Nuevo Paquete" para comenzar.
            </div>
          ) : (
            packs.map(p => (
              <div
                key={p.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="relative h-40 bg-slate-800 overflow-hidden">
                    <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-4 flex flex-col justify-end">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                          {p.category}
                        </span>
                        {p.accessCode ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            {p.accessCode}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/30 text-emerald-300">
                            Público
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-black text-white line-clamp-1">{p.title}</h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-[11px] text-slate-300">
                      <div>
                        <span className="text-slate-500">Productos: </span>
                        <span className="font-black text-white">{p.products.length}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Versión: </span>
                        <span className="font-mono font-bold text-sky-400">v{p.version}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-slate-800/60 mt-2">
                  <span className="text-[10px] text-slate-500">ID: {p.id.substring(0, 14)}...</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDeletePack(p.id)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                      title="Eliminar paquete de la nube"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* MODAL CREAR / PUBLICAR NUEVO PAQUETE */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs">
            <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
              <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">Crear y Publicar Paquete Visual Cloud</h2>
                    <p className="text-xs text-slate-400">El paquete se sincronizará automáticamente en Firestore.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </header>

              <form onSubmit={handleSavePackToCloud} className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Datos Básicos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300">Título del Paquete</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Bodegón VIP & Bebidas Frías"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">Categoría / Rubro</label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-sky-500"
                    >
                      <option value="Bodegón & Licores">Bodegón & Licores</option>
                      <option value="Restaurante & Fast Food">Restaurante & Fast Food</option>
                      <option value="Víveres & Abarrotes">Víveres & Abarrotes</option>
                      <option value="Farmacia & Cuidado">Farmacia & Cuidado</option>
                      <option value="Panadería & Pastelería">Panadería & Pastelería</option>
                      <option value="Ferretería & Repuestos">Ferretería & Repuestos</option>
                      <option value="Personalizado">Personalizado</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">Descripción</label>
                    <textarea
                      rows={2}
                      placeholder="Breve resumen de lo que incluye este catálogo..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">URL Portada del Paquete</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.coverImage}
                      onChange={e => setFormData({ ...formData, coverImage: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300">Código de Acceso Privado (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: VIP-CLIENTE-MARACAIBO (Dejar vacío para público)"
                      value={formData.accessCode}
                      onChange={e => setFormData({ ...formData, accessCode: e.target.value.toUpperCase() })}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Sección de Agregar Productos al Paquete */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <Plus className="w-3.5 h-3.5" />
                      Agregar Productos con Fotos al Paquete ({formData.products?.length || 0})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400">Nombre del Producto</label>
                      <input
                        type="text"
                        placeholder="Ej: Ron Añejo 750ml"
                        value={productForm.name}
                        onChange={e => {
                          setProductForm({ ...productForm, name: e.target.value });
                          setImageSearchQuery(e.target.value);
                        }}
                        className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400">Precio Sugerido ($ USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productForm.priceUsd}
                        onChange={e => setProductForm({ ...productForm, priceUsd: parseFloat(e.target.value) || 0 })}
                        className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400">Código de Barras (Opcional)</label>
                      <input
                        type="text"
                        placeholder="759..."
                        value={productForm.barcode}
                        onChange={e => setProductForm({ ...productForm, barcode: e.target.value })}
                        className="w-full mt-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-400">URL Imagen HD</label>
                      <div className="flex gap-2 mt-1">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={productForm.imageUrl}
                          onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleSearchImages}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold rounded-xl flex items-center gap-1"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Buscar Foto</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Resultados de búsqueda de imagen web */}
                  {imageSearchResults.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] font-bold text-slate-400">Haz clic en una imagen para seleccionarla:</span>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {imageSearchResults.map((img, i) => (
                          <img
                            key={i}
                            src={img.url}
                            alt=""
                            onClick={() => setProductForm({ ...productForm, imageUrl: img.url })}
                            className={`w-14 h-14 rounded-xl object-cover cursor-pointer border-2 bg-white ${
                              productForm.imageUrl === img.url ? 'border-sky-500 scale-105' : 'border-slate-800 hover:border-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddProductToPack}
                      disabled={!productForm.name.trim()}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Producto a la Lista</span>
                    </button>
                  </div>

                  {/* Lista de Productos Añadidos */}
                  {formData.products && formData.products.length > 0 && (
                    <div className="pt-3 border-t border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                      {formData.products.map((p, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover bg-white shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                📦
                              </div>
                            )}
                            <div className="min-w-0 truncate">
                              <span className="font-bold text-white block truncate">{p.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">${p.priceUsd.toFixed(2)}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveProductFromPack(idx)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BOTÓN FINAL DE PUBLICACIÓN */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !formData.title || !formData.products?.length}
                    className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    <span>{isSaving ? 'Publicando en Firestore...' : 'Publicar Paquete en la Nube'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
