import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { message, context, apiKey } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mensaje requerido' }, { status: 400 });
    }

    const resolvedApiKey = (apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

    // Contexto de datos de la tienda (ventas de hoy, stock bajo, caja, etc.)
    const storeData = context || {};
    const todaySales = storeData.todaySales || 0;
    const todaySalesVES = storeData.todaySalesVES || 0;
    const todayOrders = storeData.todayOrders || 0;
    const bcvRate = storeData.bcvRate || 1;
    const lowStockCount = storeData.lowStockCount || 0;
    const topProducts = Array.isArray(storeData.topProducts) ? storeData.topProducts.slice(0, 5) : [];
    const paymentMethods = storeData.paymentMethods || {};

    const systemPrompt = `Eres "KlikAI", el Asistente Ejecutivo e Inteligencia Artificial de negocios de KlikPOS Enterprise en Venezuela.
Tu función es ayudar al dueño o administrador de la tienda con respuestas claras, ejecutivas, precisas y accionables.

DATOS EN VIVO DEL NEGOCIO (Contexto actual):
- Ventas totales hoy: $${Number(todaySales).toFixed(2)} USD (Bs. ${Number(todaySalesVES).toFixed(2)})
- Transacciones completadas hoy: ${todayOrders}
- Tasa oficial BCV: Bs. ${Number(bcvRate).toFixed(4)} por USD
- Productos con stock bajo/crítico: ${lowStockCount}
- Top productos más vendidos: ${JSON.stringify(topProducts)}
- Desglose métodos de pago: ${JSON.stringify(paymentMethods)}

INSTRUCCIONES DE RESPUESTA:
1. Responde en español con tono profesional, amable y conciso (máximo 3 párrafos cortos o puntos clave con emojis).
2. Si el usuario te pregunta por ventas, ganancias, productos o métodos de pago, utiliza los datos en vivo provistos.
3. Si el usuario pide recomendaciones de compras o reposición de inventario, enfócate en la rotación y el stock mínimo.
4. Resalta montos en $ USD y en Bs. según corresponda.
5. Sé directo, sin rodeos teóricos.`;

    // Si no hay API key de Gemini configurada, generamos una respuesta inteligente local basada en reglas/estadísticas
    if (!resolvedApiKey) {
      const lower = message.toLowerCase();
      let localAnswer = '';

      if (lower.includes('venta') || lower.includes('vendí') || lower.includes('hoy') || lower.includes('caja')) {
        localAnswer = `📊 **Resumen de Ventas de Hoy:**\n- **Total Facturado:** $${Number(todaySales).toFixed(2)} USD (~Bs. ${Number(todaySalesVES).toFixed(2)})\n- **Tickets/Operaciones:** ${todayOrders}\n- **Tasa BCV aplicable:** Bs. ${Number(bcvRate).toFixed(2)}`;
      } else if (lower.includes('stock') || lower.includes('inventario') || lower.includes('agotado') || lower.includes('comprar')) {
        localAnswer = `📦 **Estado de Inventario:**\n- Hay **${lowStockCount} producto(s)** en nivel crítico o por agotarse.\n💡 *Recomendación:* Revisa la pestaña de inventario para generar la orden de reposición con tus proveedores.`;
      } else if (lower.includes('pago') || lower.includes('pago movil') || lower.includes('dolar') || lower.includes('zelle')) {
        localAnswer = `💳 **Métodos de Pago Registrados:**\n${Object.entries(paymentMethods).map(([m, val]) => `• **${m}:** $${Number(val).toFixed(2)}`).join('\n') || '• No hay transacciones registradas aún hoy.'}`;
      } else {
        localAnswer = `👋 ¡Hola! Soy **KlikAI**, tu asistente ejecutivo. Hoy llevas **$${Number(todaySales).toFixed(2)} USD** en **${todayOrders} ventas**. ¿Deseas consultar productos más vendidos, alertas de stock o métodos de pago?`;
      }

      return NextResponse.json({
        reply: localAnswer,
        model: 'KlikAI Local Engine (Reglas Estadísticas)',
        isOfflineRule: true
      });
    }

    // Usar Gemini Flash API
    const ai = new GoogleGenAI({ apiKey: resolvedApiKey });
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    let replyText = '';
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${systemPrompt}\n\nPregunta del dueño: "${message}"` }
              ]
            }
          ]
        });

        replyText = response.text || '';
        if (replyText) {
          return NextResponse.json({
            reply: replyText,
            model: modelName,
            isOfflineRule: false
          });
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    throw lastError || new Error('No se pudo obtener respuesta de la IA.');

  } catch (error: any) {
    console.error('Error en KlikAI Assistant:', error);
    return NextResponse.json({
      error: error?.message || 'Error procesando consulta con KlikAI',
      reply: 'No se pudo conectar con el motor de IA en la nube. Puedes revisar tus ventas locales directamente en el panel superior.'
    }, { status: 500 });
  }
}
