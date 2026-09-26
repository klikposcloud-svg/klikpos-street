import { NextRequest, NextResponse } from 'next/server';
import { cloudBackupService } from '@/lib/backup/cloud-backup-service';

export async function GET() {
  try {
    const backups = cloudBackupService.getBackups();
    return NextResponse.json({ success: true, backups });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al consultar respaldos';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = cloudBackupService.executeCloudSync(body);
    return NextResponse.json(result, { status: result.success ? 200 : 403 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error al ejecutar sincronización cloud';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
