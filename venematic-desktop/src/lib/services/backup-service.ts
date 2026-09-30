import { db } from '@/lib/db';

export interface BackupDataStructure {
  app: string;
  version: number;
  createdAt: string;
  products: any[];
  sales: any[];
  customers: any[];
  shifts: any[];
  settings: any[];
  movements: any[];
  creditPayments: any[];
  cashMovements?: any[];
}

export async function exportDatabaseBackup(prefix: string = 'backup'): Promise<boolean> {
  try {
    const products = await db.products.toArray();
    const sales = await db.sales.toArray();
    const customers = await db.customers.toArray();
    const shifts = await db.cashShifts.toArray();
    const settings = await db.settings.toArray();
    let movements: any[] = [];
    let creditPayments: any[] = [];
    let cashMovements: any[] = [];

    try {
      movements = await db.inventoryMovements.toArray();
      creditPayments = await db.customerCreditPayments.toArray();
      cashMovements = await db.cashMovements.toArray();
    } catch {}

    const backupData: BackupDataStructure = {
      app: 'Venematic POS',
      version: 3,
      createdAt: new Date().toISOString(),
      products,
      sales,
      customers,
      shifts,
      settings,
      movements,
      creditPayments,
      cashMovements,
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

export async function importDatabaseBackup(backupData: BackupDataStructure): Promise<{ success: boolean; message: string }> {
  try {
    if (!backupData || !Array.isArray(backupData.products)) {
      return { success: false, message: 'Formato de archivo de respaldo inválido o corrupto.' };
    }

    await db.transaction('rw', [
      db.products,
      db.sales,
      db.customers,
      db.cashShifts,
      db.settings,
      db.inventoryMovements,
      db.customerCreditPayments,
      db.cashMovements,
    ], async () => {
      if (backupData.products?.length) await db.products.bulkPut(backupData.products);
      if (backupData.sales?.length) await db.sales.bulkPut(backupData.sales);
      if (backupData.customers?.length) await db.customers.bulkPut(backupData.customers);
      if (backupData.shifts?.length) await db.cashShifts.bulkPut(backupData.shifts);
      if (backupData.settings?.length) await db.settings.bulkPut(backupData.settings);
      if (backupData.movements?.length) await db.inventoryMovements.bulkPut(backupData.movements);
      if (backupData.creditPayments?.length) await db.customerCreditPayments.bulkPut(backupData.creditPayments);
      if (backupData.cashMovements?.length) await db.cashMovements.bulkPut(backupData.cashMovements);
    });

    return { success: true, message: 'Respaldo restaurado exitosamente.' };
  } catch (error: any) {
    console.error('Error importando backup:', error);
    return { success: false, message: error?.message || 'Error durante la restauración del respaldo.' };
  }
}
