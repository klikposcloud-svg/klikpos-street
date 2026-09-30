'use client';

import { useEffect } from 'react';

interface UsePosHotkeysParams {
  onToggleCurrency: () => void;
  onFocusSearch: () => void;
  onOpenCreditSale: () => void;
  onOpenManualWeight: () => void;
  onToggleNumpadMode: () => void;
  onClearCart: () => void;
  onOpenScannerModal: () => void;
  onOpenShiftModal: () => void;
  onKickDrawer: () => void;
  onOpenPaymentModal: () => void;
}

export function usePosHotkeys({
  onToggleCurrency,
  onFocusSearch,
  onOpenCreditSale,
  onOpenManualWeight,
  onToggleNumpadMode,
  onClearCart,
  onOpenScannerModal,
  onOpenShiftModal,
  onKickDrawer,
  onOpenPaymentModal,
}: UsePosHotkeysParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        onToggleCurrency();
      } else if (e.key === 'F3') {
        e.preventDefault();
        onFocusSearch();
      } else if (e.key === 'F4') {
        e.preventDefault();
        onOpenCreditSale();
      } else if (e.key === 'F5') {
        e.preventDefault();
        onOpenManualWeight();
      } else if (e.key === 'F6') {
        e.preventDefault();
        onToggleNumpadMode();
      } else if (e.key === 'F7') {
        e.preventDefault();
        onClearCart();
      } else if (e.key === 'F8') {
        e.preventDefault();
        onOpenScannerModal();
      } else if (e.key === 'F9') {
        e.preventDefault();
        onOpenShiftModal();
      } else if (e.key === 'F10') {
        e.preventDefault();
        onKickDrawer();
      } else if (e.key === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      } else if (e.key === 'F12') {
        e.preventDefault();
        onOpenPaymentModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onToggleCurrency,
    onFocusSearch,
    onOpenCreditSale,
    onOpenManualWeight,
    onToggleNumpadMode,
    onClearCart,
    onOpenScannerModal,
    onOpenShiftModal,
    onKickDrawer,
    onOpenPaymentModal,
  ]);
}
