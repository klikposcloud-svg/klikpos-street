/**
 * KlikPOS Native Sentry Telemetry & Crash Reporter
 * Sistema autónomo de telemetría y captura de errores en tiempo real
 * Sin dependencias externas ni costos mensuales (100% Privado & Conforme a GDPR)
 */

export interface CrashReport {
  id: string;
  timestamp: string;
  edition: string;
  version: string;
  terminalId: string;
  errorMessage: string;
  errorStack?: string;
  componentStack?: string;
  route: string;
  userAgent: string;
  severity: 'error' | 'warning' | 'fatal';
  resolved?: boolean;
}

const STORAGE_KEY = 'klikpos_telemetry_crash_reports';

export class CrashReporterService {
  private static instance: CrashReporterService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): CrashReporterService {
    if (!CrashReporterService.instance) {
      CrashReporterService.instance = new CrashReporterService();
    }
    return CrashReporterService.instance;
  }

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // 1. Interceptar errores globales de JavaScript
    window.addEventListener('error', (event) => {
      this.recordCrash({
        errorMessage: event.message || 'Error no controlado en la aplicación',
        errorStack: event.error?.stack,
        route: window.location.pathname,
        severity: 'error',
      });
    });

    // 2. Interceptar promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
      this.recordCrash({
        errorMessage: event.reason?.message || String(event.reason || 'Unhandled Promise Rejection'),
        errorStack: event.reason?.stack,
        route: window.location.pathname,
        severity: 'warning',
      });
    });
  }

  public async recordCrash(params: {
    errorMessage: string;
    errorStack?: string;
    componentStack?: string;
    route?: string;
    severity?: 'error' | 'warning' | 'fatal';
  }) {
    if (typeof window === 'undefined') return;

    try {
      const edition = localStorage.getItem('klikpos_active_edition') || 'KLIKPOS_ELITE';
      const version = '3.0.0';
      const terminalId = localStorage.getItem('klikpos_terminal_hwid') || 'HWID-PC-' + Math.random().toString(36).substring(2, 8).toUpperCase();

      const report: CrashReport = {
        id: `crash_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        edition,
        version,
        terminalId,
        errorMessage: params.errorMessage.substring(0, 500),
        errorStack: params.errorStack?.substring(0, 2000),
        componentStack: params.componentStack?.substring(0, 1500),
        route: params.route || window.location.pathname,
        userAgent: navigator.userAgent.substring(0, 200),
        severity: params.severity || 'error',
        resolved: false,
      };

      // Guardar localmente
      const existing = this.getLocalReports();
      existing.unshift(report);
      // Mantener máximo 50 reportes locales
      const trimmed = existing.slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));

      // Enviar silenciosamente al endpoint central
      fetch('/api/telemetry/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      }).catch(() => {
        // Si no hay conexión o falla, continúa offline
      });

    } catch (e) {
      console.warn('[CrashReporter] Error al registrar evento:', e);
    }
  }

  public getLocalReports(): CrashReport[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public clearLocalReports() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
}

export const crashReporter = CrashReporterService.getInstance();
