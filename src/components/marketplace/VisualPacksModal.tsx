'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Sparkles,
  Package,
  Search,
  CheckCircle2,
  Lock,
  KeyRound,
  RefreshCw,
  Layers,
  Image as ImageIcon,
  Tag,
  AlertCircle,
  TrendingUp,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  VisualPack,
  getAvailableVisualPacks,
  getInstalledPackIds,
  importVisualPackToLocalDb,
  unlockPrivatePack,
  uninstallVisualPack,
  clearAllProductsCatalog,
} from '@/lib/marketplace/visual-packs-service';

interface VisualPacksModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight?: boolean;
  primaryColor?: string;
  onPackImported?: (count: number) => void;
}

export default function VisualPacksModal({
  isOpen,
  onClose,
  isLight = false,
  primaryColor = '#0284c7',
  onPackImported,
}: VisualPacksModalProps) {
  const [packs, setPacks] = useState<VisualPack[]>([]);
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedPack, setSelectedPack] = useState<VisualPack | null>(null);
  const [isImporting, setIsImporting] = useState<string | null>(null);
  const [isUninstalling, setIsUninstalling] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<{ id: string; count: number } | null>(null);
  const [uninstallSuccess, setUninstallSuccess] = useState<{ id: string; count: number } | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadPacks();
    }
  }, [isOpen]);

  const loadPacks = async () => {
    setIsLoading(true);
    try {
      const data = await getAvailableVisualPacks();
      setPacks(data);
      setInstalledIds(getInstalledPackIds());
      if (data.length > 0 && !selectedPack) {
        setSelectedPack(data[0]);
      }
    } catch (err) {
      console.error('Error cargando paquetes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (pack: VisualPack) => {
    setIsImporting(pack.id);
    setImportSuccess(null);
    try {
      const result = await importVisualPackToLocalDb(pack);
      setInstalledIds(getInstalledPackIds());
      setImportSuccess({ id: pack.id, count: result.importedCount });
      if (onPackImported) {
        onPackImported(result.importedCount);
      }
      setTimeout(() => {
        setImportSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error importando paquete:', err);
      alert('Hubo un inconveniente al importar el paquete. Revisa el almacenamiento local.');
    } finally {
      setIsImporting(null);
    }
  };

  const handleUninstall = async (pack: VisualPack) => {
    if (!confirm(`¿Eliminar la colección "${pack.title}" de tu catálogo? Se retirarán sus productos de tu POS.`)) {
      return;
    }
    setIsUninstalling(pack.id);
    setUninstallSuccess(null);
    try {
      const result = await uninstallVisualPack(pack);
      setInstalledIds(getInstalledPackIds());
      setUninstallSuccess({ id: pack.id, count: result.uninstalledCount });
      if (onPackImported) {
        onPackImported(0);
      }
      setTimeout(() => {
        setUninstallSuccess(null);
      }, 5000);
    } catch (err) {
      console.error('Error desinstalando paquete:', err);
      alert('Hubo un inconveniente al desinstalar la colección.');
    } finally {
      setIsUninstalling(null);
    }
  };

  const handleClearAllCatalog = async () => {
    setIsClearingAll(true);
    try {
      const result = await clearAllProductsCatalog();
      setInstalledIds([]);
      setShowClearAllConfirm(false);
      if (onPackImported) {
        onPackImported(0);
      }
      alert(`Catálogo vaciado con éxito (${result.clearedCount} productos eliminados). El POS ahora está listo para una nueva marca.`);
    } catch (err) {
      console.error('Error limpiando catálogo:', err);
      alert('Hubo un inconveniente al limpiar el catálogo.');
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCodeInput.trim()) return;

    setIsRedeeming(true);
    setAccessCodeError('');

    try {
      const foundPack = await unlockPrivatePack(accessCodeInput);
      if (foundPack) {
        setPacks(prev => {
          const exists = prev.some(p => p.id === foundPack.id);
          return exists ? prev : [foundPack, ...prev];
        });
        setSelectedPack(foundPack);
        setAccessCodeInput('');
      } else {
        setAccessCodeError('Código de paquete inválido o no encontrado en la nube.');
      }
    } catch (err) {
      setAccessCodeError('Error de conexión al validar código.');
    } finally {
      setIsRedeeming(false);
    }
  };

  if (!isOpen) return null;

  const categories = ['todos', ...Array.from(new Set(packs.map(p => p.category)))];

  const filteredPacks = packs.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'todos' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs">
      <div
        className={`relative w-full max-w-5xl h-[90vh] max-h-[750px] rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* HEADER LIMPIO Y DESPEJADO */}
        <header className="px-4 sm:px-5 py-3 border-b flex items-center justify-between shrink-0 gap-3" style={{ borderColor: isLight ? '#e2e8f0' : '#1e293b' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold tracking-tight truncate leading-tight" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                Paquetes Visuales
              </h2>
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                Fotos HD listas para importar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* COLUMNA IZQUIERDA: BUSCADOR & LISTA DE PAQUETES (5 COLS) */}
          <div
            className="md:col-span-5 border-r flex flex-col p-4 overflow-y-auto space-y-3"
            style={{ borderColor: isLight ? '#e2e8f0' : '#1e293b', backgroundColor: isLight ? '#f8fafc' : '#0b1329' }}
          >
            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por rubro o producto..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs outline-none transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-sky-500'
                }`}
              />
            </div>

            {/* Filtro de Categorías */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-sky-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Canjear Código Privado */}
            <form onSubmit={handleRedeemCode} className="p-2.5 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-purple-500/5 to-transparent space-y-2 border-sky-500/20">
              <div className="flex items-center gap-1.5 text-[11px] font-black text-sky-400">
                <KeyRound className="w-3.5 h-3.5" />
                <span>¿Tienes un código de paquete privado?</span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Ej: PACK-CLIENTE-VIP"
                  value={accessCodeInput}
                  onChange={e => setAccessCodeInput(e.target.value)}
                  className={`flex-1 px-2.5 py-1.5 rounded-xl border text-xs uppercase font-mono outline-none ${
                    isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-950 border-slate-800 text-slate-200'
                  }`}
                />
                <button
                  type="submit"
                  disabled={isRedeeming || !accessCodeInput.trim()}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-black rounded-xl active:scale-95 transition-all shadow-xs"
                >
                  {isRedeeming ? '...' : 'Canjear'}
                </button>
              </div>
              {accessCodeError && (
                <p className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {accessCodeError}
                </p>
              )}
            </form>

            {/* Listado de Paquetes */}
            <div className="space-y-2 flex-1">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-sky-500" />
                  <span className="text-xs">Consultando catálogo en la nube...</span>
                </div>
              ) : filteredPacks.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No se encontraron paquetes con ese criterio.
                </div>
              ) : (
                filteredPacks.map(pack => {
                  const isInstalled = installedIds.includes(pack.id);
                  const isSelected = selectedPack?.id === pack.id;

                  return (
                    <div
                      key={pack.id}
                      onClick={() => setSelectedPack(pack)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex gap-3 ${
                        isSelected
                          ? 'ring-2 border-transparent'
                          : isLight
                          ? 'bg-white hover:bg-slate-100/80 border-slate-200'
                          : 'bg-slate-900/90 hover:bg-slate-800/80 border-slate-800'
                      }`}
                      style={{
                        borderColor: isSelected ? primaryColor : undefined,
                        boxShadow: isSelected ? `0 0 0 2px ${primaryColor}` : undefined,
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0 relative">
                        <img
                          src={pack.coverImage}
                          alt={pack.title}
                          className="w-full h-full object-cover"
                          onError={(e: any) => {
                            e.target.src = '/packs/comida-street/hamburguesa.png';
                          }}
                        />
                        {isInstalled && (
                          <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black truncate" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                            {pack.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {pack.category} • {pack.products.length} productos
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          {pack.badge && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {pack.badge}
                            </span>
                          )}
                          {isInstalled ? (
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Instalado
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-sky-400">Disponible</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA: DETALLES DEL PAQUETE SELECCIONADO (7 COLS) */}
          <div className="md:col-span-7 flex flex-col p-6 overflow-y-auto justify-between space-y-6">
            {selectedPack ? (
              <div className="space-y-6">
                {/* Portada & Resumen */}
                <div className="relative h-44 rounded-3xl overflow-hidden border border-slate-800 shadow-lg">
                  <img
                    src={selectedPack.coverImage}
                    alt={selectedPack.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-5 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white backdrop-blur-md">
                        {selectedPack.category}
                      </span>
                      <span className="text-xs text-slate-300 font-mono">v{selectedPack.version}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-white">{selectedPack.title}</h3>
                  </div>
                </div>

                {/* Mensaje de Éxito de Importación */}
                {importSuccess && importSuccess.id === selectedPack.id && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 animate-in fade-in zoom-in-95">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <div className="text-xs font-bold">
                      ¡Paquete instalado con éxito! Se añadieron {importSuccess.count} productos con imágenes HD a tu POS.
                    </div>
                  </div>
                )}

                {/* Mensaje de Éxito de Desinstalación */}
                {uninstallSuccess && uninstallSuccess.id === selectedPack.id && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-400 animate-in fade-in zoom-in-95">
                    <Trash2 className="w-5 h-5 shrink-0 text-amber-400" />
                    <div className="text-xs font-bold">
                      Colección eliminada con éxito ({uninstallSuccess.count} productos retirados). Tu POS se ha actualizado.
                    </div>
                  </div>
                )}

                {/* Descripción y Estadísticas */}
                <div className="space-y-3">
                  <p className="text-xs leading-relaxed text-slate-400">{selectedPack.description}</p>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className={`p-3 rounded-2xl border text-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                      <Package className="w-4 h-4 mx-auto mb-1 text-sky-400" />
                      <div className="text-xs font-black">{selectedPack.products.length}</div>
                      <div className="text-[10px] text-slate-400">Productos HD</div>
                    </div>
                    <div className={`p-3 rounded-2xl border text-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                      <Layers className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                      <div className="text-xs font-black">
                        {new Set(selectedPack.products.map(p => p.category)).size}
                      </div>
                      <div className="text-[10px] text-slate-400">Categorías</div>
                    </div>
                    <div className={`p-3 rounded-2xl border text-center ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'}`}>
                      <ImageIcon className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                      <div className="text-xs font-black">100%</div>
                      <div className="text-[10px] text-slate-400">Fondo Blanco</div>
                    </div>
                  </div>
                </div>

                {/* Muestra de Productos Incluidos */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Vista Previa de Productos del Paquete
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {selectedPack.products.map((prod, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border flex items-center gap-2.5 ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                        }`}
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-10 h-10 rounded-lg object-contain bg-slate-900/60 p-0.5 shrink-0 border border-slate-200 dark:border-slate-800"
                          onError={(e: any) => {
                            e.target.src = '/packs/comida-street/hamburguesa.png';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate" style={{ color: isLight ? '#0f172a' : '#ffffff' }}>
                            {prod.name}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                            <span>{prod.category}</span>
                            <span className="font-mono font-black text-emerald-500">${prod.priceUsd.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Selecciona un paquete para ver sus detalles.
              </div>
            )}

            {/* BOTONES DE ACCIÓN INFERIOR */}
            {selectedPack && (
              <div className="pt-4 border-t shrink-0 flex items-center justify-between gap-3" style={{ borderColor: isLight ? '#e2e8f0' : '#1e293b' }}>
                <div className="text-xs">
                  <span className="text-slate-400">Estado: </span>
                  {installedIds.includes(selectedPack.id) ? (
                    <span className="font-black text-emerald-500">Ya instalado en este POS</span>
                  ) : (
                    <span className="font-black text-sky-400">Listo para descargar</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {installedIds.includes(selectedPack.id) && (
                    <button
                      type="button"
                      onClick={() => handleUninstall(selectedPack)}
                      disabled={isUninstalling === selectedPack.id || isImporting === selectedPack.id}
                      className="px-4 py-2.5 rounded-2xl font-bold text-xs bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
                      title="Eliminar todos los productos de esta colección"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>{isUninstalling === selectedPack.id ? 'Eliminando...' : 'Eliminar Colección'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleImport(selectedPack)}
                    disabled={isImporting === selectedPack.id || isUninstalling === selectedPack.id}
                    className="px-6 py-2.5 rounded-2xl font-black text-xs text-white flex items-center gap-2 active:scale-95 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isImporting === selectedPack.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Descargando...</span>
                      </>
                    ) : installedIds.includes(selectedPack.id) ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        <span>Re-descargar</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Descargar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DIÁLOGO MODAL DE CONFIRMACIÓN PARA LIMPIAR TODO EL CATÁLOGO (MARCA NUEVA) */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/35 bg-[#0b101b] text-white p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-white">¿Limpiar Todo el Catálogo?</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Esta acción vaciará por completo todos los productos, categorías e imágenes locales para que puedas comenzar con una <strong>marca nueva</strong> desde cero.
              </p>
              <p className="text-[11px] text-amber-400 font-mono pt-1">
                ⚠️ Podrás re-descargar cualquier paquete cuando lo desees.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearAllCatalog}
                disabled={isClearingAll}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isClearingAll ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isClearingAll ? 'Limpiando...' : 'Sí, Limpiar Todo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
