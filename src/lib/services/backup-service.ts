import { db } from '@/lib/db';

export async function exportDatabaseBackup(prefix: string = 'backup'): Promise<boolean> {
  try {
    const products = await db.products.toArray();
    const sales = await db.sales.toArray();
    const customers = await db.customers.toArray();
    const shifts = await db.cashShifts.toArray();
    const settings = await db.settings.toArray();
    let movements: any[] = [];
    let creditPayments: any[] = [];

    try {
      movements = await db.inventoryMovements.toArray();
      creditPayments = await db.customerCreditPayments.toArray();
    } catch {}

    const backupData = {
      app: 'Venematic POS',
      version: 2,
      createdAt: new Date().toISOString(),
      products,
      sales,
      customers,
      shifts,
      settings,
      movements,
      creditPayments,
    };

    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const filename = `venematic_${prefix}_${dateStr}.json`;

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error exportando backup:', error);
    return false;
  }
}
