export function formatUSD(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return '$0.00';
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatVES(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return 'Bs. 0,00';
  return `Bs. ${val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDateShort(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return isoString;
  }
}
