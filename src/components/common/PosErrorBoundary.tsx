'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class PosErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PosErrorBoundary] Error no capturado en interfaz POS:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-500/40 shadow-2xl max-w-lg mx-auto my-4 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>

          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {this.props.fallbackTitle || 'Aviso en Módulo POS'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Ocurrió un detalle al calcular o renderizar esta sección. Tus datos y ventas están protegidos en memoria local.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl text-left font-mono text-[11px] text-rose-600 dark:text-rose-400 overflow-x-auto max-h-28 border border-slate-200 dark:border-slate-800">
              <span className="font-bold">Error:</span> {this.state.error.message || String(this.state.error)}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar / Restaurar Vista</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Recargar POS</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
