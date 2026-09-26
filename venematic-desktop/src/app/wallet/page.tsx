'use client';

import React, { useState, useEffect } from 'react';
import { tokenWalletService } from '@/lib/wallet/token-wallet-service';
import { WalletAccount, WalletTransaction } from '@/types/wallet';

const VENEZUELAN_BANKS = [
  { code: '0102', name: 'Banco de Venezuela (BDV)' },
  { code: '0134', name: 'Banesco Banco Universal' },
  { code: '0105', name: 'Banco Mercantil' },
  { code: '0172', name: 'Bancamiga Banco Universal' },
  { code: '0108', name: 'BBVA Provincial' },
  { code: '0191', name: 'Banco Nacional de Crédito (BNC)' },
  { code: '0114', name: 'Bancaribe' },
  { code: '0115', name: 'Banco Exterior' },
];

export default function WalletPage() {
  const [activeWallet, setActiveWallet] = useState<WalletAccount | null>(null);
  const [allWallets, setAllWallets] = useState<WalletAccount[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [rateBCV, setRateBCV] = useState<number>(49.20);
  const [activeTab, setActiveTab] = useState<'home' | 'send' | 'receive' | 'topup' | 'pay' | 'cashout'>('home');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Send P2P Form State
  const [recipientInput, setRecipientInput] = useState('');
  const [sendAmountUSD, setSendAmountUSD] = useState('');
  const [sendConcept, setSendConcept] = useState('');

  // Topup Form State
  const [topupIdentifier, setTopupIdentifier] = useState('');
  const [topupAmountUSD, setTopupAmountUSD] = useState('');
  const [topupMethod, setTopupMethod] = useState<'cash_usd' | 'cash_ves' | 'pago_movil' | 'zelle'>('cash_usd');
  const [topupRef, setTopupRef] = useState('');

  // Pay Merchant State
  const [payStoreName, setPayStoreName] = useState('Venemarket Chacao');
  const [payAmountUSD, setPayAmountUSD] = useState('');
  const [payConcept, setPayConcept] = useState('Compra de víveres / productos');

  // Cashout / Withdrawal State
  const [cashoutAmountUSD, setCashoutAmountUSD] = useState('');
  const [cashoutBank, setCashoutBank] = useState('0102 - Banco de Venezuela');
  const [cashoutPhone, setCashoutPhone] = useState('');
  const [cashoutDocId, setCashoutDocId] = useState('');

  const refreshWalletData = () => {
    const current = tokenWalletService.getActiveWallet();
    setActiveWallet(current);
    setAllWallets(tokenWalletService.getAllWallets());
    setTransactions(tokenWalletService.getTransactions(current.walletId));
    setTopupIdentifier(current.userDocId);
    setCashoutPhone(current.userPhone);
    setCashoutDocId(current.userDocId);
  };

  useEffect(() => {
    refreshWalletData();
  }, []);

  const handleSwitchAccount = (wId: string) => {
    tokenWalletService.setActiveWallet(wId);
    refreshWalletData();
    setFeedback({ type: 'success', message: `Cambiaste a la cuenta de ${tokenWalletService.getActiveWallet().userName}` });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSendP2P = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWallet) return;
    const amt = parseFloat(sendAmountUSD);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({ type: 'error', message: 'Ingresa un monto válido mayor a 0.' });
      return;
    }

    const res = tokenWalletService.transferP2P(
      {
        senderWalletId: activeWallet.walletId,
        recipientIdentifier: recipientInput,
        amountUSD: amt,
        concept: sendConcept || 'Transferencia P2P',
      },
      rateBCV
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setSendAmountUSD('');
      setRecipientInput('');
      setSendConcept('');
      setActiveTab('home');
      refreshWalletData();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(topupAmountUSD);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({ type: 'error', message: 'Ingresa un monto válido.' });
      return;
    }

    const res = tokenWalletService.topupWallet({
      walletIdentifier: topupIdentifier || (activeWallet?.userDocId ?? ''),
      amountUSD: amt,
      paymentMethod: topupMethod,
      rateBCV: rateBCV,
      referenceNumber: topupRef || `PM-${Math.floor(Math.random() * 900000 + 100000)}`,
      agentStoreName: 'Caja Venemarket Principal',
    });

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTopupAmountUSD('');
      setTopupRef('');
      setActiveTab('home');
      refreshWalletData();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handlePayMerchant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWallet) return;
    const amt = parseFloat(payAmountUSD);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({ type: 'error', message: 'Ingresa un monto válido.' });
      return;
    }

    const res = tokenWalletService.payMerchant(
      {
        customerWalletId: activeWallet.walletId,
        storeId: 'store_chacao',
        storeName: payStoreName,
        amountUSD: amt,
        concept: payConcept,
      },
      rateBCV
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setPayAmountUSD('');
      setActiveTab('home');
      refreshWalletData();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleCashOut = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWallet) return;
    const amt = parseFloat(cashoutAmountUSD);
    if (isNaN(amt) || amt <= 0) {
      setFeedback({ type: 'error', message: 'Ingresa un monto válido para retirar.' });
      return;
    }

    const res = tokenWalletService.requestWithdrawal({
      walletId: activeWallet.walletId,
      amountUSD: amt,
      bankName: cashoutBank,
      bankPhone: cashoutPhone,
      bankDocId: cashoutDocId,
      rateBCV: rateBCV,
      feePercent: 2.0,
    });

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setCashoutAmountUSD('');
      setActiveTab('home');
      refreshWalletData();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  if (!activeWallet) {
    return <div className="p-8 text-center text-slate-500">Cargando Billetera...</div>;
  }

  const balanceVES = (activeWallet.balanceUSD * rateBCV).toLocaleString('es-VE', { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 font-montserrat text-slate-800 dark:text-slate-100 pb-20">
      {/* Header Superior */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-500/20">
              V
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-slate-900 dark:text-white">Venematic Pay</h1>
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  Tokens USD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeWallet.userName} ({activeWallet.userDocId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Tasa BCV</span>
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">Bs. {rateBCV.toFixed(2)}</span>
            </div>

            <a
              href="/dashboard/pos"
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
            >
              Ir a Caja ↗
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Selector de Cuentas Demo para Pruebas P2P */}
        <div className="bg-blue-50/80 dark:bg-slate-900/60 border border-blue-200/80 dark:border-slate-800 p-3 rounded-2xl flex items-center justify-between gap-2 text-xs">
          <span className="font-bold text-blue-900 dark:text-blue-300 text-[11px]">
            👤 Cambiar cuenta activa de prueba:
          </span>
          <div className="flex gap-1.5 overflow-x-auto">
            {allWallets.map(w => (
              <button
                key={w.walletId}
                onClick={() => handleSwitchAccount(w.walletId)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  w.walletId === activeWallet.walletId
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {w.userName.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
              feedback.type === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800'
            }`}
          >
            <span>{feedback.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Card Principal de Saldo Blindado */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white p-6 rounded-3xl shadow-xl border border-slate-800">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300 tracking-wider uppercase">
                Saldo Blindado Inmune a Devaluación
              </span>
            </div>
            <div className="bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold text-indigo-200">
              1 Token = $1.00 USD
            </div>
          </div>

          <div className="space-y-1 my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight text-white">
                {activeWallet.balanceUSD.toFixed(2)}
              </span>
              <span className="text-lg font-bold text-emerald-400">Tokens USD</span>
            </div>
            <p className="text-xs font-semibold text-slate-400">
              Equivalente oficial hoy: <strong className="text-slate-200">Bs. {balanceVES}</strong> (Tasa BCV {rateBCV.toFixed(2)})
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 block">ID Billetera</span>
              <span className="font-mono font-bold text-slate-200">{activeWallet.userDocId}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Teléfono Enlazado</span>
              <span className="font-mono font-bold text-slate-200">{activeWallet.userPhone}</span>
            </div>
          </div>
        </div>

        {/* 5 Botones de Acción Rápida */}
        <div className="grid grid-cols-5 gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'send' ? 'home' : 'send')}
            className={`p-2.5 rounded-2xl text-center flex flex-col items-center gap-1 transition-all active:scale-95 ${
              activeTab === 'send'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-blue-400'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm">
              🚀
            </div>
            <span className="text-[10px] font-black">Enviar</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'receive' ? 'home' : 'receive')}
            className={`p-2.5 rounded-2xl text-center flex flex-col items-center gap-1 transition-all active:scale-95 ${
              activeTab === 'receive'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-purple-400'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm">
              📥
            </div>
            <span className="text-[10px] font-black">QR / Cobro</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'topup' ? 'home' : 'topup')}
            className={`p-2.5 rounded-2xl text-center flex flex-col items-center gap-1 transition-all active:scale-95 ${
              activeTab === 'topup'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-400'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm">
              💵
            </div>
            <span className="text-[10px] font-black">Recargar</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'pay' ? 'home' : 'pay')}
            className={`p-2.5 rounded-2xl text-center flex flex-col items-center gap-1 transition-all active:scale-95 ${
              activeTab === 'pay'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm">
              🛍️
            </div>
            <span className="text-[10px] font-black">Pagar</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'cashout' ? 'home' : 'cashout')}
            className={`p-2.5 rounded-2xl text-center flex flex-col items-center gap-1 transition-all active:scale-95 ${
              activeTab === 'cashout'
                ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/20'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 hover:border-teal-400'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center text-sm">
              🏦
            </div>
            <span className="text-[10px] font-black">Retirar</span>
          </button>
        </div>

        {/* Panel Desplegable: Enviar P2P */}
        {activeTab === 'send' && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-blue-200 dark:border-blue-900 shadow-lg space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🚀</span> Transferencia Instantánea P2P
              </h3>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                0% Comisión
              </span>
            </div>

            <form onSubmit={handleSendP2P} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cédula o Teléfono del Destinatario
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: V-24567890 o 04249876543"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Enviar (Tokens USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={activeWallet.balanceUSD}
                    placeholder="0.00"
                    value={sendAmountUSD}
                    onChange={(e) => setSendAmountUSD(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl pl-7 pr-3 py-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
                {sendAmountUSD && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Equivalente en Bs: ~Bs. {(parseFloat(sendAmountUSD) * rateBCV || 0).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Concepto / Nota (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago almuerzo / aporte"
                  value={sendConcept}
                  onChange={(e) => setSendConcept(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 active:scale-98 transition-all"
                >
                  Confirmar Envío
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Panel Desplegable: Recibir / QR */}
        {activeTab === 'receive' && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-purple-200 dark:border-purple-900 shadow-lg text-center space-y-4 animate-scale-up">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              📥 Recibir Pagos o Recargas en Mostrador
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Muestra este código o tus datos en cualquier tienda Venemarket o a un contacto para recibir saldo
            </p>

            <div className="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-purple-300 shadow-inner">
              <div className="w-44 h-44 bg-slate-900 rounded-xl p-2 flex flex-col justify-between text-white font-mono text-[9px] relative overflow-hidden">
                <div className="flex justify-between">
                  <div className="w-10 h-10 border-4 border-white rounded-lg bg-black" />
                  <div className="w-10 h-10 border-4 border-white rounded-lg bg-black" />
                </div>
                <div className="text-center font-bold text-emerald-400">
                  {activeWallet.userDocId}
                </div>
                <div className="flex justify-between items-end">
                  <div className="w-10 h-10 border-4 border-white rounded-lg bg-black" />
                  <div className="text-[8px] text-slate-400">VNK-PAY</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/60 p-3 rounded-2xl text-xs space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Titular:</span>
                <span className="font-bold text-slate-800 dark:text-white">{activeWallet.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cédula / RIF:</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{activeWallet.userDocId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Teléfono:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">{activeWallet.userPhone}</span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('home')}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Panel Desplegable: Recargar Saldo (Cash-in) */}
        {activeTab === 'topup' && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900 shadow-lg space-y-4 animate-scale-up">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>💵</span> Recarga de Tokens (En Mostrador o Pago Móvil)
              </h3>
              <p className="text-[11px] text-slate-500">
                Paga en efectivo USD, Bolívares o Pago Móvil y tu saldo queda congelado en valor dólar.
              </p>
            </div>

            <form onSubmit={handleTopup} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Método de Recarga
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTopupMethod('cash_usd')}
                    className={`py-2 px-3 rounded-xl font-bold border text-left flex items-center gap-2 ${
                      topupMethod === 'cash_usd'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>💵</span>
                    <span>Efectivo USD</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopupMethod('pago_movil')}
                    className={`py-2 px-3 rounded-xl font-bold border text-left flex items-center gap-2 ${
                      topupMethod === 'pago_movil'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>📲</span>
                    <span>Pago Móvil (Bs)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Recargar (Tokens USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="20.00"
                    value={topupAmountUSD}
                    onChange={(e) => setTopupAmountUSD(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl pl-7 pr-3 py-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
                {topupAmountUSD && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-xl mt-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                    {topupMethod === 'pago_movil'
                      ? `Pagas en Bolívares: Bs. ${(parseFloat(topupAmountUSD) * rateBCV || 0).toFixed(2)} → Recibes: ${parseFloat(topupAmountUSD).toFixed(2)} Tokens USD`
                      : `Entregas en efectivo: $${parseFloat(topupAmountUSD).toFixed(2)} USD`}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Referencia / Comprobante
                </label>
                <input
                  type="text"
                  placeholder="Ej: 0102-839210 o Efectivo en Caja"
                  value={topupRef}
                  onChange={(e) => setTopupRef(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 active:scale-98 transition-all"
                >
                  Procesar Recarga
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Panel Desplegable: Pagar en Comercio / D-Panas */}
        {activeTab === 'pay' && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-amber-200 dark:border-amber-900 shadow-lg space-y-4 animate-scale-up">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🛍️</span> Pagar en Comercio o Delivery con Tokens
              </h3>
              <p className="text-[11px] text-slate-500">
                Paga de inmediato sin necesidad de billetes rotos ni vueltos en caramelos.
              </p>
            </div>

            <form onSubmit={handlePayMerchant} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Comercio o Servicio
                </label>
                <select
                  value={payStoreName}
                  onChange={(e) => setPayStoreName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium"
                >
                  <option value="Venemarket Chacao">Venemarket Chacao (Víveres & Market)</option>
                  <option value="Farmacia San Rafael">Farmacia San Rafael</option>
                  <option value="Panadería La Mansión">Panadería La Mansión</option>
                  <option value="D-Panas Delivery & Moto-Taxi">D-Panas Delivery & Moto-Taxi</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Pagar (Tokens USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={activeWallet.balanceUSD}
                    placeholder="0.00"
                    value={payAmountUSD}
                    onChange={(e) => setPayAmountUSD(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl pl-7 pr-3 py-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Concepto de Compra
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pedido #1234 / Carrera delivery"
                  value={payConcept}
                  onChange={(e) => setPayConcept(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md shadow-amber-500/20 active:scale-98 transition-all"
                >
                  Confirmar Pago
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Panel Desplegable: Retirar a Banco (Cash-out / Liquidación) */}
        {activeTab === 'cashout' && (
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-teal-200 dark:border-teal-900 shadow-lg space-y-4 animate-scale-up">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🏦</span> Retiro / Liquidación a Cuenta Bancaria (Bs)
                </h3>
                <span className="text-[10px] text-teal-700 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full font-bold">
                  Comisión: 2.0%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Tus tokens se liquidan a la tasa BCV del día ({rateBCV.toFixed(2)} Bs/$) y se transfieren por Pago Móvil.
              </p>
            </div>

            <form onSubmit={handleCashOut} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Retirar (Tokens USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={activeWallet.balanceUSD}
                    placeholder="0.00"
                    value={cashoutAmountUSD}
                    onChange={(e) => setCashoutAmountUSD(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl pl-7 pr-3 py-2.5 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {cashoutAmountUSD && (
                <div className="bg-teal-50 dark:bg-teal-950/40 p-3 rounded-2xl border border-teal-200 dark:border-teal-900 space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Tokens solicitados:</span>
                    <span className="font-bold">${parseFloat(cashoutAmountUSD).toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Comisión Plataforma (2%):</span>
                    <span className="text-amber-600 font-bold">
                      -${((parseFloat(cashoutAmountUSD) * 0.02) || 0).toFixed(2)} USD
                    </span>
                  </div>
                  <div className="flex justify-between text-teal-800 dark:text-teal-300 font-black border-t border-teal-200/60 dark:border-teal-800 pt-1 text-xs">
                    <span>Recibes en tu banco:</span>
                    <span>
                      Bs. {(((parseFloat(cashoutAmountUSD) * 0.98) * rateBCV) || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Banco Destino (Venezuela)
                </label>
                <select
                  value={cashoutBank}
                  onChange={(e) => setCashoutBank(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-medium"
                >
                  {VENEZUELAN_BANKS.map((b) => (
                    <option key={b.code} value={`${b.code} - ${b.name}`}>
                      {b.code} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono Pago Móvil
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="04141234567"
                    value={cashoutPhone}
                    onChange={(e) => setCashoutPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cédula / RIF Titular
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="V-18234567"
                    value={cashoutDocId}
                    onChange={(e) => setCashoutDocId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white uppercase"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('home')}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md shadow-teal-500/20 active:scale-98 transition-all"
                >
                  Confirmar y Liquidar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Historial de Movimientos */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/80 dark:border-slate-700 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋</span> Movimientos Recientes
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {transactions.length} operaciones
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No tienes movimientos registrados todavía.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {transactions.map(tx => {
                const isIncoming = tx.type === 'cash_in' || tx.type === 'p2p_transfer_in';
                const isWithdrawal = tx.type === 'cash_out';
                return (
                  <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isIncoming
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : isWithdrawal
                            ? 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isIncoming ? '↓' : isWithdrawal ? '🏦' : '↑'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                          {tx.concept}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(tx.timestamp).toLocaleString('es-VE')} • Ref: {tx.referenceNumber}
                        </p>
                      </div>
                    </div>

                    <div className="text-right whitespace-nowrap">
                      <p
                        className={`font-black ${
                          isIncoming
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isWithdrawal
                            ? 'text-teal-600 dark:text-teal-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {isIncoming ? '+' : '-'}${tx.amountUSD.toFixed(2)} USD
                      </p>
                      <p className="text-[10px] text-slate-400">
                        ~Bs. {(tx.netAmountVES || tx.amountVES).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
