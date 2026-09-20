import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { image, apiKey } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'No se recibió ninguna imagen' }, { status: 400 });
    }

    // Usar API key enviada por el cliente o variable de entorno del sistema
    const resolvedApiKey = (apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

    if (!resolvedApiKey) {
      return NextResponse.json({
        hasApiKey: false,
        error: 'No se ha configurado la API Key de Google Gemini/Vision. Ingrésala en Ajustes o configúrala en el sistema.',
      }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: resolvedApiKey });

    // Extraer base64 limpio y mime type
    let mimeType = 'image/jpeg';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const prompt = `Analiza detenidamente la fotografía de este producto para un sistema de punto de venta (POS) de supermercado/bodega.
Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown, sin comillas invertidas, sin explicaciones) con la siguiente estructura:
{
  "name": "Nombre comercial claro con marca y presentación si es visible (Ej: Harina PAN 1kg, Coca Cola 1.5L, Detergente Ace 1kg)",
  "category": "Una de estas opciones: Víveres, Bebidas, Charcutería, Limpieza, Cuidado Personal, Panadería, Snacks, Otros",
  "barcode": "Código de barras detectado en el empaque o null si no es legible",
  "suggestedPriceUSD": "Precio o número sugerido en formato decimal numérico (ej: 1.50) si se detecta alguna etiqueta de precio, de lo contrario null",
  "brand": "Marca identificada",
  "description": "Breve descripción de una línea del producto"
}`;

    let responseText = '';
    const modelsToTry = ['gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-2.5-flash'];

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
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        });
        responseText = (response.text || '').trim();
        if (responseText) break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Error probando modelo ${modelName}:`, err?.message);
      }
    }

    if (!responseText && lastError) {
      throw lastError;
    }

    const rawText = responseText;
    // Limpiar posibles bloques ```json ... ```
    const cleanedJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(cleanedJson);
      return NextResponse.json({
        success: true,
        data: parsed,
      });
    } catch (parseErr) {
      return NextResponse.json({
        success: true,
        rawText,
        data: {
          name: rawText.slice(0, 50),
          category: 'Víveres',
        },
      });
    }
  } catch (error: any) {
    console.error('Error en /api/vision/analyze-product:', error);
    return NextResponse.json(
      { error: error?.message || 'Error analizando producto con IA' },
      { status: 500 }
    );
  }
}
