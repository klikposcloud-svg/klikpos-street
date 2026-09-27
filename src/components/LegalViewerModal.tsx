'use client';

import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Lock,
  AlertTriangle,
  X,
  Printer,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { LEGAL_DOCUMENTS, LegalDocument } from '@/lib/legal/legal-agreements';

interface LegalViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDoc?: 'eula' | 'terms' | 'privacy';
  onAccept?: () => void;
}

export default function LegalViewerModal({
  isOpen,
  onClose,
  defaultDoc = 'eula',
  onAccept,
}: LegalViewerModalProps) {
  const [activeTab, setActiveTab] = useState<'eula' | 'terms' | 'privacy'>(defaultDoc);

  if (!isOpen) return null;

  const currentDoc = LEGAL_DOCUMENTS[activeTab] || LEGAL_DOCUMENTS.eula;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Marco Legal & Licenciamiento
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {currentDoc.badge}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                VENEMATIC POS • República Bolivariana de Venezuela • Versión {currentDoc.lastUpdated}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Imprimir acuerdo legal"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Segmented Control / Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 dark:border-slate-800 flex gap-2 overflow-x-auto bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('eula')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'eula'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            📜 Contrato de Licencia (EULA)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ⚖️ Términos & Descargo SENIAT
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            🔒 Privacidad & Datos (DPA)
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white">
              Documento: {currentDoc.title}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              ID: {currentDoc.id.toUpperCase()}
            </span>
          </div>

          {currentDoc.sections.map((sec, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${
                sec.highlight
                  ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-700/50'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <h4 className="font-black text-slate-900 dark:text-white text-xs mb-2 flex items-center gap-1.5">
                {sec.highlight && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                {sec.title}
              </h4>
              <p className="whitespace-pre-line text-slate-600 dark:text-slate-300 font-normal">
                {sec.content}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Al activar el software acepta plenamente estos instrumentos.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aceptar y Continuar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
