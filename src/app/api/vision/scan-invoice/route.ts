import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { image, apiKey, bcvRate } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No se recibió ninguna imagen de factura' }, { status: 400 });
    }

    const resolvedApiKey = (apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

    if (!resolvedApiKey) {
      return NextResponse.json({
        error: 'No se ha configurado la API Key de Google Gemini. Puedes ingresarla en los ajustes del sistema o variable de entorno.',
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

    const currentBcv = Number(bcvRate) || 40.0;

    const prompt = `Eres un auditor experto en digitalización de facturas y notas de entrega de proveedores para supermercados, bodegas y comercios en Venezuela.
Analiza la imagen adjunta (factura impresa o manuscrita de proveedor) y extrae todos los productos / renglones detectados.

Tasa de cambio de referencia: Bs. ${currentBcv.toFixed(2)} por USD.

Devuelve EXCLUSIVAMENTE un JSON válido (sin formato markdown, sin comillas invertidas triple backtick) con esta estructura exacta:
{
  "providerName": "Nombre de la empresa o proveedor si es visible, de lo contrario null",
  "invoiceNumber": "Número de factura o control si es visible, de lo contrario null",
  "currency": "USD o VES según la moneda principal de la factura",
  "items": [
    {
      "name": "Nombre descriptivo del producto (Ej: Harina PAN 1kg, Arroz Mary Tradicional 1kg, Coca Cola 1.5L)",
      "category": "Víveres, Bebidas, Charcutería, Limpieza, Cuidado Personal, Panadería, Snacks, o General",
      "quantity": 10,
      "costUSD": 1.20,
      "costVES": 48.00,
      "suggestedPriceUSD": 1.60,
      "barcode": "Código de barras si aparece en el renglón o null"
    }
  ],
  "totalAmount": 120.50
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
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ]
        });

        let text = response.text || '';
        // Limpiar backticks si los incluye
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        const parsed = JSON.parse(text);
        return NextResponse.json({
          success: true,
          data: parsed,
          model: modelName
        });
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error('No se pudo procesar la imagen de la factura.');

  } catch (error: any) {
    console.error('Error en scan-invoice:', error);
    return NextResponse.json({
      error: error?.message || 'Error procesando la imagen de la factura con IA'
    }, { status: 500 });
  }
}
