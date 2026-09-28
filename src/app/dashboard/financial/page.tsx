'use client';

import React, { useState, useEffect, useMemo } from 'react';
import FeatureGate from '@/components/FeatureGate';
import { financialDB, OperationalExpense } from '@/lib/db/financial-db';
import { db } from '@/lib/db';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Plus, 
  Calendar, 
  PieChart, 
  Layers, 
  Wallet, 
  FileText, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  CreditCard,
  BarChart3
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function FinancialDashboardPage() {
  const [bcvRate, setBcvRate] = useState<number>(848.55);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);

  // Formulario de Gasto
  const [expDescription, setExpDescription] = useState('');
  const [expAmountUSD, setExpAmountUSD] = useState('');
  const [expCategory, setExpCategory] = useState<OperationalExpense['category']>('otros');
  const [expPaymentMethod, setExpPaymentMethod] = useState('Efectivo USD');

  useEffect(() => {
    // 1. Cargar Tasa BCV
    fetch('/api/bcv')
      .then(res => res.json())
      .then(d => { if (d?.rate) setBcvRate(d.rate); })
      .catch(() => {});

    // 2. Cargar Gastos
    setExpenses(financialDB.getExpenses());

    // 3. Cargar Ventas Locales
    db.sales.toArray().then(items => setSales(items || [])).catch(() => {});
  }, []);

  // Cálculos Financieros del Período
  const metrics = useMemo(() => {
    const now = new Date();
    const filteredSales = sales.filter(s => {
      const d = new Date(s.timestamp || s.createdAt || Date.now());
      if (period === 'day') {
        return d.toDateString() === now.toDateString();
      } else if (period === 'week') {
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      } else if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else {
        return d.getFullYear() === now.getFullYear();
      }
    });

    const filteredExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      if (period === 'day') {
        return d.toDateString() === now.toDateString();
      } else if (period === 'week') {
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      } else if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else {
        return d.getFullYear() === now.getFullYear();
      }
    });

    // 1. Ingresos Brutos
    const grossIncomeUSD = filteredSales.reduce((acc, s) => acc + (s.totalUSD || s.total || 0), 0);

    // 2. Costo Estimado de Mercancía (COGS = ~60% o costo real asignado)
    const cogsUSD = filteredSales.reduce((acc, s) => {
      if (s.cogsUSD && typeof s.cogsUSD === 'number') return acc + s.cogsUSD;
      return acc + ((s.totalUSD || s.total || 0) * 0.58);
    }, 0);

    // 3. Gastos Operativos
    const totalExpensesUSD = filteredExpenses.reduce((acc, e) => acc + (e.amountUSD || 0), 0);

    // 4. Ganancia Neta
    const netProfitUSD = grossIncomeUSD - cogsUSD - totalExpensesUSD;
    const marginPct = grossIncomeUSD > 0 ? (netProfitUSD / grossIncomeUSD) * 100 : 0;

    return {
      grossIncomeUSD,
      grossIncomeVES: grossIncomeUSD * bcvRate,
      cogsUSD,
      cogsVES: cogsUSD * bcvRate,
      totalExpensesUSD,
      totalExpensesVES: totalExpensesUSD * bcvRate,
      netProfitUSD,
      netProfitVES: netProfitUSD * bcvRate,
      marginPct,
      salesCount: filteredSales.length,
      filteredExpenses,
    };
  }, [sales, expenses, period, bcvRate]);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expAmountUSD);
    if (!amount || amount <= 0 || !expDescription.trim()) {
      alert('Ingresa una descripción y monto válido.');
      return;
    }

    const created = financialDB.saveExpense({
      category: expCategory,
      description: expDescription.trim(),
      amountUSD: amount,
      amountVES: amount * bcvRate,
      bcvRate: bcvRate,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: expPaymentMethod,
    });

    setExpenses(prev => [created, ...prev]);
    setShowExpenseModal(false);
    setExpDescription('');
    setExpAmountUSD('');
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('¿Deseas eliminar este registro de gasto?')) {
      financialDB.deleteExpense(id);
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  return (
    <FeatureGate
      flag="analytics_financial"
      title="Dashboard Financiero & Rentabilidad Neta"
      description="Visualiza en tiempo real tus ventas brutas, costo de mercancía vendida (COGS), gastos operativos y margen de utilidad real en $ USD y Bolívares."
    >
      <div className="space-y-6 max-w-7xl mx-auto p-2 sm:p-6 pb-24">
        {/* Cabecera Superior y Filtro Temporal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Inteligencia Financiera & Estado de Resultados
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Ganancia Neta, Costo de Ventas (COGS) y Gastos en Tiempo Real
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de Período */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setPeriod('day')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  period === 'day' ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-black' : 'text-slate-500'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setPeriod('week')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  period === 'week' ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-black' : 'text-slate-500'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  period === 'month' ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-black' : 'text-slate-500'
                }`}
              >
                Mes
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  period === 'year' ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs font-black' : 'text-slate-500'
                }`}
              >
                Año
              </button>
            </div>

            <button
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrar Gasto</span>
            </button>
          </div>
        </div>

        {/* 4 Tarjetas de Métricas Principales (KPI Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Ingresos Brutos */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Ventas Brutas
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono block">
                ${metrics.grossIncomeUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                Bs. {metrics.grossIncomeVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              {metrics.salesCount} tickets facturados
            </div>
          </div>

          {/* 2. Costo de Mercancía (COGS) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Costo Mercancía (COGS)
              </span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono block">
                ${metrics.cogsUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                Bs. {metrics.cogsVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Costo de reposición e insumos
            </div>
          </div>

          {/* 3. Gastos Operativos */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Gastos del Negocio
              </span>
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <ArrowDownRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono block">
                ${metrics.totalExpensesUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-slate-500 font-mono">
                Bs. {metrics.totalExpensesVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Alquiler, sueldos, empaques, luz
            </div>
          </div>

          {/* 4. Ganancia Neta Real */}
          <div className="bg-gradient-to-tr from-emerald-600 to-teal-700 text-white p-5 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
                Ganancia Neta Real
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black font-mono">
                {metrics.marginPct.toFixed(1)}% Margen
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black font-mono block">
                ${metrics.netProfitUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-bold text-emerald-100 font-mono">
                Bs. {metrics.netProfitVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-100">
              Utilidad neta de bolsillo disponible
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN VISUAL DE GRÁFICOS INTERACTIVOS (CIRCULAR Y BARRAS WOW)          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Gráfico 1: Estructura Financiera & Margen de Rentabilidad (Doughnut Circular) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                  Estructura del Ingreso
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-mono">
                {metrics.marginPct.toFixed(1)}% Margen
              </span>
            </div>

            <div className="relative h-56 flex items-center justify-center my-3">
              <Doughnut
                data={{
                  labels: ['Ganancia Neta', 'Costo de Mercancía', 'Gastos Operativos'],
                  datasets: [
                    {
                      data: [
                        Math.max(0, metrics.netProfitUSD),
                        metrics.cogsUSD,
                        metrics.totalExpensesUSD,
                      ],
                      backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
                      borderColor: ['#059669', '#d97706', '#e11d48'],
                      borderWidth: 2,
                      hoverOffset: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '72%',
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: function (ctx) {
                          const val = ctx.parsed || 0;
                          const total = metrics.grossIncomeUSD || 1;
                          const pct = ((val / total) * 100).toFixed(1);
                          return ` ${ctx.label}: $${val.toFixed(2)} (${pct}%)`;
                        },
                      },
                    },
                  },
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                  Ingreso Total
                </span>
                <span className="font-mono font-black text-base text-slate-900 dark:text-white leading-tight">
                  ${metrics.grossIncomeUSD.toFixed(2)}
                </span>
                <span className="font-mono text-[9px] font-bold text-slate-500">
                  Bs. {metrics.grossIncomeVES.toLocaleString('es-VE', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            {/* Leyenda Visual del Gráfico Circular */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mb-1" />
                <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Ganancia</span>
                <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
                  ${Math.max(0, metrics.netProfitUSD).toFixed(0)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/30">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block mb-1" />
                <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Costos</span>
                <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400">
                  ${metrics.cogsUSD.toFixed(0)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/30">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block mb-1" />
                <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Gastos</span>
                <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400">
                  ${metrics.totalExpensesUSD.toFixed(0)}
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico 2: Comparativa de Ingresos vs Utilidad Real (Barras Duales) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                  Comparativa de Rendimiento Financiero
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Venta Bruta
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Ganancia Neta
                </span>
              </div>
            </div>

            <div className="h-64 pt-3">
              <Bar
                data={{
                  labels: ['Ventas Brutas', 'Costo Reposición', 'Gastos Fijos/Variables', 'Utilidad Neta'],
                  datasets: [
                    {
                      label: 'Monto en USD ($)',
                      data: [
                        metrics.grossIncomeUSD,
                        metrics.cogsUSD,
                        metrics.totalExpensesUSD,
                        Math.max(0, metrics.netProfitUSD),
                      ],
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.85)',
                        'rgba(245, 158, 11, 0.85)',
                        'rgba(244, 63, 94, 0.85)',
                        'rgba(16, 185, 129, 0.85)',
                      ],
                      borderColor: [
                        '#2563eb',
                        '#d97706',
                        '#e11d48',
                        '#059669',
                      ],
                      borderWidth: 2,
                      borderRadius: 10,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: function (ctx) {
                          const val = ctx.parsed.y || 0;
                          const ves = val * bcvRate;
                          return ` Monto: $${val.toFixed(2)} | Bs. ${ves.toLocaleString('es-VE', { maximumFractionDigits: 2 })}`;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: { font: { weight: 'bold', size: 11 }, color: '#64748b' },
                      grid: { display: false },
                    },
                    y: {
                      ticks: {
                        font: { family: 'monospace', size: 11 },
                        color: '#64748b',
                        callback: function (value) {
                          return '$' + value;
                        },
                      },
                      grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    },
                  },
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-medium">
              <span>Indicador de Salud de Caja: <strong>{metrics.marginPct >= 25 ? '🟢 Excelente' : metrics.marginPct >= 15 ? '🟡 Estable' : '🔴 Ajustar Costos'}</strong></span>
              <span>Margen sobre Ventas: <strong className="text-slate-800 dark:text-white font-mono">{metrics.marginPct.toFixed(1)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Tabla y Desglose de Gastos Operativos */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Desglose de Gastos del Período ({metrics.filteredExpenses.length})
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-500">
              Tasa BCV: <strong className="font-mono text-slate-800 dark:text-white">Bs. {bcvRate.toFixed(2)}</strong>
            </span>
          </div>

          {metrics.filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hay gastos registrados en este período. Haz clic en "+ Registrar Gasto" para añadir nómina, alquiler o insumos.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Categoría</th>
                    <th className="pb-3">Descripción</th>
                    <th className="pb-3">Método</th>
                    <th className="pb-3 text-right">Monto ($)</th>
                    <th className="pb-3 text-right">Monto (Bs.)</th>
                    <th className="pb-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {metrics.filteredExpenses.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 text-slate-500 font-mono">{exp.date}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{exp.description}</td>
                      <td className="py-3 text-slate-500">{exp.paymentMethod}</td>
                      <td className="py-3 text-right font-black font-mono text-slate-900 dark:text-white">
                        ${exp.amountUSD.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-bold font-mono text-slate-500">
                        Bs. {exp.amountVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Registrar Nuevo Gasto */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-500" />
              <span>Registrar Gasto Operativo</span>
            </h3>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Descripción del Gasto:</label>
                <input
                  type="text"
                  placeholder="Ej: Pago de alquiler quincenal, Compra de hielo, Pago de luz..."
                  value={expDescription}
                  onChange={e => setExpDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Monto en Dólares ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expAmountUSD}
                    onChange={e => setExpAmountUSD(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Categoría:</label>
                  <select
                    value={expCategory}
                    onChange={e => setExpCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="alquiler">🏢 Alquiler</option>
                    <option value="nomina">👥 Sueldos / Nómina</option>
                    <option value="servicios">⚡ Luz / Agua / Internet</option>
                    <option value="empaques">🛍️ Bolsas / Empaques</option>
                    <option value="mantenimiento">🔧 Mantenimiento</option>
                    <option value="impuestos">🏛️ Impuestos / Tasas</option>
                    <option value="otros">📦 Otros Insumos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Método de Pago:</label>
                <select
                  value={expPaymentMethod}
                  onChange={e => setExpPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="Efectivo USD">💵 Efectivo USD</option>
                  <option value="Pago Móvil">📱 Pago Móvil (Bs.)</option>
                  <option value="Transferencia Bancaria">🏦 Transferencia Bancaria</option>
                  <option value="Punto de Venta / Débito">💳 Tarjeta / Punto</option>
                  <option value="Zelle">🇺🇸 Zelle</option>
                  <option value="Binance USDT">🪙 Binance USDT</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-md"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </FeatureGate>
  );
}
