import { NextRequest, NextResponse } from 'next/server';
import { 
  registerWebhookPayment, 
  parseBankNotificationText, 
  webhookPaymentsBuffer, 
  findMatchingPayment,
  markPaymentAsUsed,
  getWebhookSecret,
  normalizeAmountVES
} from '@/lib/payments/pago-movil-webhook-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // 1. Simulación de pago de prueba (ideal para configuración del comerciante)
  if (action === 'test') {
    const testAmount = parseFloat(searchParams.get('monto') || '150.00');
    const testBank = searchParams.get('banco') || 'Banco de Venezuela';
    const testRef = searchParams.get('ref') || Math.floor(100000 + Math.random() * 900000).toString();

    const payment = registerWebhookPayment({
      referencia: testRef,
      monto: testAmount,
      banco: testBank,
      telefono: '04141234567',
      pagador: 'PRUEBA DUEÑO REMOTO',
      rawText: `PRUEBA: PagoClave recibido por Bs. ${testAmount.toFixed(2)} del 04141234567 Ref ${testRef}`
    });

    return NextResponse.json({
      success: true,
      message: 'Pago de prueba emitido con éxito a todas las cajas',
      payment
    });
  }

  // 2. Consulta de pago que coincida con un monto específico
  const targetVES = searchParams.get('match_ves');
  if (targetVES) {
    const match = findMatchingPayment(parseFloat(targetVES), parseFloat(searchParams.get('tolerance') || '2'));
    return NextResponse.json({
      success: true,
      match: match || null
    });
  }

  // 3. Marcar pago como usado
  const markUsedRef = searchParams.get('mark_used');
  if (markUsedRef) {
    markPaymentAsUsed(markUsedRef);
    return NextResponse.json({ success: true, message: `Referencia ${markUsedRef} marcada como usada` });
  }

  // 4. Retornar los pagos recientes
  return NextResponse.json({
    success: true,
    total: webhookPaymentsBuffer.length,
    payments: webhookPaymentsBuffer.slice(0, 30)
  });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const configuredSecret = getWebhookSecret();

    // Verificación de clave secreta (opcional si el comercio configuró una clave)
    const tokenHeader = req.headers.get('authorization')?.replace(/bearer\s+/i, '') ||
                        req.headers.get('x-venematic-secret') ||
                        searchParams.get('secret');

    if (configuredSecret && configuredSecret !== 'venematic-pm-2026-sec' && tokenHeader !== configuredSecret) {
      return NextResponse.json({ error: 'No autorizado. Token de webhook inválido.' }, { status: 401 });
    }

    let bodyData: any = {};
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      bodyData = await req.json().catch(() => ({}));
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        formData.forEach((value, key) => {
          bodyData[key] = value.toString();
        });
      }
    } else {
      // Texto plano (ej. SMS crudo)
      const rawText = await req.text().catch(() => '');
      bodyData = { message: rawText, text: rawText };
    }

    let parsedPayment: any = {};

    // Caso A: Mensaje en bruto de SMS o Notificación Push
    const rawMessage = bodyData.message || bodyData.text || bodyData.body || bodyData.sms || bodyData.notification;
    if (rawMessage && typeof rawMessage === 'string') {
      parsedPayment = parseBankNotificationText(rawMessage);
    }

    // Caso B: Campos explícitos en JSON (sobreescriben o complementan)
    if (bodyData.monto || bodyData.amount) {
      parsedPayment.monto = normalizeAmountVES(bodyData.monto || bodyData.amount);
    }
    if (bodyData.referencia || bodyData.ref || bodyData.reference) {
      parsedPayment.referencia = String(bodyData.referencia || bodyData.ref || bodyData.reference).trim();
    }
    if (bodyData.banco || bodyData.bank) {
      parsedPayment.banco = String(bodyData.banco || bodyData.bank);
    }
    if (bodyData.telefono || bodyData.phone) {
      parsedPayment.telefono = String(bodyData.telefono || bodyData.phone);
    }
    if (bodyData.pagador || bodyData.payer || bodyData.name) {
      parsedPayment.pagador = String(bodyData.pagador || bodyData.payer || bodyData.name);
    }

    // Validar datos mínimos indispensables
    if (!parsedPayment.referencia && !parsedPayment.monto) {
      return NextResponse.json({
        error: 'No se pudo extraer una referencia ni un monto válido del mensaje recibido.',
        received: bodyData
      }, { status: 400 });
    }

    // Si no se detectó referencia pero sí monto, generar una referencia basada en timestamp
    if (!parsedPayment.referencia) {
      parsedPayment.referencia = `PM-${Date.now().toString().slice(-6)}`;
    }

    const registered = registerWebhookPayment({
      referencia: parsedPayment.referencia,
      monto: parsedPayment.monto || 0,
      banco: parsedPayment.banco || 'Pago Móvil',
      telefono: parsedPayment.telefono,
      pagador: parsedPayment.pagador,
      rawText: rawMessage || JSON.stringify(bodyData)
    });

    console.log(`[Webhook PagoMóvil] Pago registrado con éxito: Ref ${registered.referencia} - Bs. ${registered.monto} (${registered.banco})`);

    return NextResponse.json({
      success: true,
      message: 'Pago Móvil procesado y notificado en tiempo real a las cajas',
      payment: registered
    });
  } catch (err: any) {
    console.error('[Webhook PagoMóvil] Error procesando webhook:', err);
    return NextResponse.json({ error: err.message || 'Error interno procesando webhook' }, { status: 500 });
  }
}
