'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  Scale,
  Cpu,
  Printer,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Building,
  KeyRound,
  Download,
} from 'lucide-react';
import { getMachineHWID } from '@/lib/licensing/hwid';
import { getStoredLicenseStatus, ActivatedLicenseInfo } from '@/lib/licensing/license-crypto';
import { LEGAL_DOCUMENTS } from '@/lib/legal/legal-agreements';
import LegalViewerModal from '@/components/LegalViewerModal';

export default function LegalSettingsTab() {
  const [hwid, setHwid] = useState('');
  const [licenseStatus, setLicenseStatus] = useState<ActivatedLicenseInfo | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<'eula' | 'terms' | 'privacy'>('eula');
  const [showViewerModal, setShowViewerModal] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = getMachineHWID();
      setHwid(id);
      const status = getStoredLicenseStatus(id);
      setLicenseStatus(status);
    }
  }, []);

  const openDocument = (docId: 'eula' | 'terms' | 'privacy') => {
    setSelectedDoc(docId);
    setShowViewerModal(true);
  };

  const handlePrintDocument = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner Principal de Cumplimiento Legal */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-emerald-500/5 to-transparent border border-sky-200/80 dark:border-sky-800/60 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Marco Legal & Licenciamiento de Uso Comercial
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  Normativa 2026
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Instrumentos jurídicos de protección de propiedad intelectual, descargo fiscal SENIAT y privacidad On-Premise.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePrintDocument}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="Imprimir los acuerdos legales"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Acuerdos</span>
          </button>
        </div>
      </div>

      {/* Resumen del Estado de Licencia del Comercio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tarjeta 1: Titularidad del Software */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-2 text-sky-600 dark:text-sky-400">
            <KeyRound className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">Régimen Jurídico</span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Licencia de Uso No Exclusiva
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            El software no es objeto de venta; se confiere únicamente derecho de explotación comercial por puesto.
          </p>
        </div>

        {/* Tarjeta 2: Huella Hardware HWID */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">Identificador Criptográfico</span>
          </div>
          <div className="text-xs font-mono font-bold text-slate-900 dark:text-white break-all">
            {hwid || 'CARGANDO...'}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {licenseStatus?.status === 'active' ? (
              <span className="text-emerald-600 font-bold">● Estación autenticada ({licenseStatus.payload?.plan || 'PRO'})</span>
            ) : (
              <span className="text-amber-600 font-bold">● Período de demostración / Sin activar</span>
            )}
          </p>
        </div>

        {/* Tarjeta 3: Descargo Tributario SENIAT */}
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
            <Scale className="w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-wider">Responsabilidad Fiscal</span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">
            Herramienta Administrativa
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            La obligación legal y tributaria ante el SENIAT es responsabilidad directa y exclusiva del comerciante.
          </p>
        </div>
      </div>

      {/* Los 3 Instrumentos Jurídicos Principales */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Instrumentos Legales Vigentes
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* EULA */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-sky-400 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  EULA
                </span>
              </div>
              <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                Contrato de Licencia de Uso (EULA)
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Establece la prohibición de ingeniería inversa, elusión criptográfica, reventa y reserva total de derechos de autor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openDocument('eula')}
              className="mt-4 w-full py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Contrato Completo</span>
            </button>
          </div>

          {/* Términos & SENIAT */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  T&C
                </span>
              </div>
              <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                Términos, SENIAT & Electricidad
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Descargos de responsabilidad por cortes de energía, requerimientos de UPS, periféricos y cumplimiento tributario.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openDocument('terms')}
              className="mt-4 w-full py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Términos y Descargos</span>
            </button>
          </div>

          {/* Privacidad & DPA */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-emerald-400 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  DPA
                </span>
              </div>
              <h5 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                Aviso de Privacidad & DPA Local
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Garantiza que la base de datos es 100% On-Premise y que el comerciante es el Responsable del Tratamiento de sus clientes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openDocument('privacy')}
              className="mt-4 w-full py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Política de Privacidad</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Visor Legal */}
      <LegalViewerModal
        isOpen={showViewerModal}
        onClose={() => setShowViewerModal(false)}
        defaultDoc={selectedDoc}
      />
    </div>
  );
}
