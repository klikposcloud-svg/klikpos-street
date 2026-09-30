'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import {
  Utensils,
  ShoppingBag,
  Bike,
  Users,
  Clock,
  CheckCircle2,
  RefreshCw,
  Printer,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Search,
  X,
} from 'lucide-react';

interface LiveTable {
  id: string;
  label: string;
  zone: 'salon' | 'terraza' | 'barra' | 'vip';
  seats: number;
  status: 'available' | 'occupied' | 'billing';
  pax?: number;
  customerName?: string;
  orderNumber?: number;
  items?: Array<{
    name: string;
    qty: number;
    priceUSD: number;
    notes?: string;
  }>;
  totalUSD?: number;
  totalVES?: number;
  openedAt?: string;
  lastUpdated?: string;
}

const INITIAL_TABLES: LiveTable[] = [
  // Salón Principal
  { id: 'M-01', label: 'Mesa 01', zone: 'salon', seats: 4, status: 'available' },
  { id: 'M-02', label: 'Mesa 02', zone: 'salon', seats: 4, status: 'available' },
  { id: 'M-03', label: 'Mesa 03', zone: 'salon', seats: 2, status: 'available' },
  {
    id: 'M-04',
    label: 'Mesa 04',
    zone: 'salon',
    seats: 6,
    status: 'occupied',
    pax: 2,
    customerName: 'Maria V. (Comanda #1042)',
    orderNumber: 1042,
    items: [
      { name: 'Hamburguesa Clásica con Queso', qty: 1, priceUSD: 4.80 },
      { name: 'Refresco de Cola (500ml)', qty: 2, priceUSD: 2.54 },
      { name: 'Papas Fritas Medianas', qty: 1, priceUSD: 2.25 },
    ],
    totalUSD: 9.59,
    totalVES: 8296.00,
    openedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  { id: 'M-05', label: 'Mesa 05', zone: 'salon', seats: 4, status: 'available' },
  { id: 'M-06', label: 'Mesa 06', zone: 'salon', seats: 2, status: 'available' },
  { id: 'M-07', label: 'Mesa 07', zone: 'salon', seats: 4, status: 'available' },
  { id: 'M-08', label: 'Mesa 08', zone: 'salon', seats: 8, status: 'available' },

  // Terraza
  { id: 'T-01', label: 'Terraza 01', zone: 'terraza', seats: 4, status: 'available' },
  { id: 'T-02', label: 'Terraza 02', zone: 'terraza', seats: 4, status: 'available' },
  { id: 'T-03', label: 'Terraza 03', zone: 'terraza', seats: 2, status: 'available' },
  { id: 'T-04', label: 'Terraza 04', zone: 'terraza', seats: 6, status: 'available' },
  { id: 'T-05', label: 'Terraza 05', zone: 'terraza', seats: 4, status: 'available' },
  { id: 'T-06', label: 'Terraza 06', zone: 'terraza', seats: 4, status: 'available' },

  // Barra
  { id: 'B-01', label: 'Barra 01', zone: 'barra', seats: 1, status: 'available' },
  { id: 'B-02', label: 'Barra 02', zone: 'barra', seats: 1, status: 'available' },
  { id: 'B-03', label: 'Barra 03', zone: 'barra', seats: 1, status: 'available' },
  { id: 'B-04', label: 'Barra 04', zone: 'barra', seats: 1, status: 'available' },

  // VIP
  { id: 'VIP-1', label: 'VIP Lounge 1', zone: 'vip', seats: 8, status: 'available' },
  { id: 'VIP-2', label: 'VIP Lounge 2', zone: 'vip', seats: 6, status: 'available' },
  { id: 'VIP-3', label: 'VIP Lounge 3', zone: 'vip', seats: 10, status: 'available' },
];

export default function LiveTablesPage() {
  const [tables, setTables] = useState<LiveTable[]>(INITIAL_TABLES);
  const [activeZone, setActiveZone] = useState<'all' | 'salon' | 'terraza' | 'barra' | 'vip'>('all');
  const [selectedTable, setSelectedTable] = useState<LiveTable | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());

  // Listen to KlikMenu BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    try {
      const channel = new BroadcastChannel('klikpos_sync_channel');
      channel.onmessage = (event) => {
        if (!event.data) return;

        if (event.data.type === 'TABLE_ORDER_UPDATE' || event.data.type === 'SALE_COMPLETED') {
          const payload = event.data.data;
          if (payload && payload.tableNumber) {
            setTables((prev) =>
              prev.map((t) => {
                if (t.label === payload.tableNumber || t.id === payload.tableNumber) {
                  return {
                    ...t,
                    status: event.data.type === 'SALE_COMPLETED' ? 'available' : 'occupied',
                    pax: payload.paxCount || t.pax || 2,
                    customerName: payload.customerName || t.customerName,
                    orderNumber: payload.orderNumber,
                    items: payload.items || [],
                    totalUSD: payload.totalUSD || 0,
                    totalVES: payload.totalVES || 0,
                    lastUpdated: new Date().toLocaleTimeString(),
                  };
                }
                return t;
              })
            );
            setLastSyncTime(new Date().toLocaleTimeString());
          }
        }
      };

      return () => {
        channel.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }, []);

  const occupiedCount = tables.filter((t) => t.status !== 'available').length;
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const totalOccupiedUSD = tables.reduce((acc, t) => acc + (t.totalUSD || 0), 0);

  const filteredTables = activeZone === 'all' ? tables : tables.filter((t) => t.zone === activeZone);

  const handleFreeTable = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, status: 'available', items: [], totalUSD: 0, totalVES: 0, customerName: undefined } : t))
    );
    setSelectedTable(null);
  };

  const handlePrintKitchenTicket = (table: LiveTable) => {
    const win = window.open('', '_blank', 'width=380,height=600');
    if (!win) return;

    const itemsHtml = (table.items || [])
      .map(
        (it) => `
      <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:14px; font-weight:bold;">
        <span>${it.qty}x ${it.name}</span>
      </div>
    `
      )
      .join('');

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comanda Cocina - ${table.label}</title>
        <style>
          body { font-family: monospace; padding: 14px; margin: 0; font-size: 13px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .hr { border-bottom: 2px dashed #000; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size:18px;">*** COMANDA DE COCINA ***</div>
        <div class="center bold" style="font-size:16px; background:#000; color:#fff; padding:4px; margin-top:6px;">
          ${table.label.toUpperCase()} (${table.pax || 2} PERSONAS)
        </div>
        <div class="hr"></div>
        <div>Fecha: ${new Date().toLocaleString()}</div>
        ${table.customerName ? `<div>Cliente: ${table.customerName}</div>` : ''}
        <div class="hr"></div>
        <div class="bold" style="font-size:15px; margin-bottom:8px;">PLATILLOS / PEDIDO:</div>
        ${itemsHtml}
        <div class="hr"></div>
        <div class="center" style="font-size:12px;">KlikMenu &bull; KlikPOS Sync</div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Banner & Sync Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Mesas en Vivo & Salón
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                KlikMenu Sync Activo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoreo interactivo en tiempo real de mesas, salones y comandas de KlikMenu
            </p>
          </div>
        </div>

        {/* Sync Controls & Open KlikMenu */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setIsSyncing(true);
              setTimeout(() => {
                setIsSyncing(false);
                setLastSyncTime(new Date().toLocaleTimeString());
              }, 400);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Última Sync: {lastSyncTime}</span>
          </button>

          <a
            href="http://localhost:3005"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 transition shadow-sm"
          >
            <span>Abrir KlikMenu</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mesas Ocupadas</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{occupiedCount} <span className="text-xs font-bold text-slate-400">/ {tables.length}</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mesas Libres</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{availableCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ventas en Curso (Salón)</span>
            <div className="text-2xl font-black text-blue-600 mt-1">${totalOccupiedUSD.toFixed(2)} <span className="text-xs font-bold text-slate-400">USD</span></div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Comensales en Sala</span>
            <div className="text-2xl font-black text-purple-600 mt-1">
              {tables.filter((t) => t.status !== 'available').reduce((acc, t) => acc + (t.pax || 0), 0)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Zone Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveZone('all')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${
            activeZone === 'all'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todas las Zonas ({tables.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveZone('salon')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${
            activeZone === 'salon'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🍽️ Salón Principal (8)
        </button>
        <button
          type="button"
          onClick={() => setActiveZone('terraza')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${
            activeZone === 'terraza'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🌿 Terraza Exterior (6)
        </button>
        <button
          type="button"
          onClick={() => setActiveZone('barra')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${
            activeZone === 'barra'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          🍸 Barra & Bar (4)
        </button>
        <button
          type="button"
          onClick={() => setActiveZone('vip')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition ${
            activeZone === 'vip'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          ✨ Zona VIP (3)
        </button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filteredTables.map((table) => {
          const isOccupied = table.status !== 'available';
          return (
            <div
              key={table.id}
              onClick={() => isOccupied && setSelectedTable(table)}
              className={`p-4 rounded-2xl border transition relative flex flex-col justify-between min-h-[140px] ${
                isOccupied
                  ? 'bg-amber-50/70 border-amber-300 shadow-md shadow-amber-500/10 hover:border-amber-400 cursor-pointer'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  {table.id}
                </span>
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {table.seats}
                </span>
              </div>

              {/* Table Name & Status */}
              <div className="my-2">
                <h3 className="font-black text-slate-900 text-base">{table.label}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold ${
                      isOccupied ? 'text-amber-800' : 'text-emerald-700'
                    }`}
                  >
                    {isOccupied ? `Ocupada (${table.pax || 2}p)` : 'Disponible'}
                  </span>
                </div>
              </div>

              {/* Footer / Total */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {isOccupied ? (
                  <>
                    <span className="text-xs font-black text-slate-900">
                      ${(table.totalUSD || 0).toFixed(2)} USD
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                      Ver &rarr;
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">Libre</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comanda / Table Modal */}
      {selectedTable && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    {selectedTable.label} &bull; Comanda #{selectedTable.orderNumber || 1042}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    {selectedTable.customerName || 'Cliente en Salón'} &bull; {selectedTable.pax || 2} Comensales
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items List */}
            <div className="p-5 space-y-3 max-h-[340px] overflow-y-auto">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ítems Pedidos desde KlikMenu:
              </div>
              {(selectedTable.items || []).map((it, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                      {it.qty}x
                    </span>
                    <span className="font-bold text-slate-800 text-sm">{it.name}</span>
                  </div>
                  <span className="font-black text-slate-900 text-sm">
                    ${(it.priceUSD * it.qty).toFixed(2)} USD
                  </span>
                </div>
              ))}

              {/* Totals */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-500">Total a Facturar:</span>
                <div className="text-right">
                  <div className="font-black text-xl text-slate-900">
                    ${(selectedTable.totalUSD || 0).toFixed(2)} USD
                  </div>
                  <div className="text-xs font-bold text-slate-500">
                    Bs. {(selectedTable.totalVES || 0).toLocaleString()} VES
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => handlePrintKitchenTicket(selectedTable)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Cocina</span>
              </button>

              <button
                type="button"
                onClick={() => handleFreeTable(selectedTable.id)}
                className="py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
              >
                Liberar Mesa
              </button>

              <button
                type="button"
                onClick={() => {
                  alert(`Orden de ${selectedTable.label} lista para cobro en POS.`);
                  setSelectedTable(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Cobrar en POS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
