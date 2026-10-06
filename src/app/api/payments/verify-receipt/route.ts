import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { image, expectedVES, expectedBank, apiKey } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No se recibió la imagen del comprobante' }, { status: 400 });
    }

    const resolvedApiKey = (apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

    if (!resolvedApiKey) {
      return NextResponse.json({
        error: 'No se ha configurado la API Key de Google Gemini para validación por visión artificial.',
        hasApiKey: false
      }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: resolvedApiKey });

    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    if (base64Data.length > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen excede el límite máximo de memoria.' },
        { status: 413 }
      );
    }

    const prompt = `Eres un auditor experto antifraude de comprobantes bancarios y capturas de pantalla de Pago Móvil en Venezuela (Banco de Venezuela PagoClave, Banesco PagoMóvil, Mercantil Tpago, Bancamiga, BBVA Provincial Dinero Rápido, BNC, Bancaribe, etc.).
Analiza la captura de pantalla o foto del comprobante adjunto.
Extrae con estricta precisión y sin inventar datos:
- banco: Nombre del banco emisor o receptor (ej. "Banco de Venezuela", "Banesco", "Mercantil", "Bancamiga", "BBVA Provincial", etc.)
- referencia: Número de referencia u operación bancaria (sólo dígitos, típicamente de 4 a 8 caracteres). Si hay varios números, escoge el código de operación/referencia.
- montoVES: Monto exacto transferido en Bolívares (VES), representado como número decimal puro (ej: 1250.50).
- telefono: Teléfono origen o destino si es visible (ej: 04241234567).
- cedula: Cédula o RIF si es visible (ej: V-20123456).
- pagador: Nombre de la persona o titular que envió el pago si es visible.
- fechaHora: Fecha y hora de la transacción si aparece en el recibo.
- esComprobanteValido: true si parece una pantalla genuina de confirmación bancaria (éxito), false si es un error, imagen no bancaria o alteración evidente.
- confianza: "ALTA", "MEDIA" o "BAJA".

Devuelve EXCLUSIVAMENTE un objeto JSON sin formato markdown, sin etiquetas \`\`\`json:
{
  "banco": "Nombre del banco",
  "referencia": "123456",
  "montoVES": 150.00,
  "telefono": "04241234567",
  "cedula": "V-12345678",
  "pagador": "Nombre Apellido",
  "fechaHora": "06/10/2026 14:30",
  "esComprobanteValido": true,
  "confianza": "ALTA"
}`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data
                  }
                },
                {
                  text: prompt
                }
              ]
            }
          ]
        });

        const rawText = response.text?.trim() || '';
        const cleanedText = rawText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/, '')
          .trim();

        const parsed = JSON.parse(cleanedText);

        const montoDetectado = Number(parsed.montoVES) || 0;
        const targetAmount = Number(expectedVES) || 0;
        const diff = Math.abs(montoDetectado - targetAmount);
        const matchesExpectedAmount = targetAmount > 0 ? (diff <= Math.max(0.5, targetAmount * 0.02)) : true;

        return NextResponse.json({
          success: true,
          data: {
            banco: parsed.banco || 'Pago Móvil',
            referencia: String(parsed.referencia || '').replace(/[^A-Za-z0-9]/g, ''),
            montoVES: montoDetectado,
            telefono: parsed.telefono || '',
            cedula: parsed.cedula || '',
            pagador: parsed.pagador || '',
            fechaHora: parsed.fechaHora || '',
            esComprobanteValido: Boolean(parsed.esComprobanteValido),
            confianza: parsed.confianza || 'MEDIA',
            matchesExpectedAmount,
            diffAmount: diff
          }
        });
      } catch (err: any) {
        lastError = err;
        console.warn(`[VerifyReceipt] Falló con ${modelName}:`, err?.message || err);
      }
    }

    throw lastError || new Error('No se pudo procesar la imagen con los modelos de IA disponibles');
  } catch (error: any) {
    console.error('[VerifyReceipt Error]:', error);
    return NextResponse.json({
      error: error?.message || 'Error interno al analizar el comprobante bancario',
      details: error?.toString()
    }, { status: 500 });
  }
}
