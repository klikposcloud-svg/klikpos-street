const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateCommercialFlyers() {
  console.log('>>> [GENERADOR DE FLYERS] Creando Fichas para Repartidores y Comida Rápida...');

  const edgePaths = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  ];
  const executablePath = edgePaths.find(p => fs.existsSync(p));

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // =========================================================================
  // FLYER 1: PLAN ALIADO DESPACHADOR / PREVENTISTA ($5 COMISIÓN)
  // =========================================================================
  const flyerRepartidorHtml = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
      body { background: #0f172a; color: #ffffff; padding: 25px; }
      .card { background: #1e293b; border: 2px solid #3b82f6; border-radius: 20px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
      .badge { background: #22c55e; color: #052e16; font-weight: 800; font-size: 11pt; padding: 6px 14px; border-radius: 9999px; display: inline-block; text-transform: uppercase; margin-bottom: 12px; }
      h1 { font-size: 22pt; font-weight: 800; line-height: 1.2; margin-bottom: 10px; color: #60a5fa; }
      .highlight { color: #facc15; font-weight: 800; }
      p { font-size: 11pt; color: #cbd5e1; margin-bottom: 15px; line-height: 1.5; }
      .steps-box { background: #0f172a; border-radius: 14px; padding: 16px; margin: 15px 0; border: 1px solid #334155; }
      .step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
      .step:last-child { margin-bottom: 0; }
      .step-num { background: #3b82f6; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 10pt; shrink-0; }
      .step-text { font-size: 10.5pt; color: #e2e8f0; }
      .profit-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
      .profit-table th, .profit-table td { padding: 10px; border: 1px solid #334155; text-align: center; }
      .profit-table th { background: #334155; color: #93c5fd; }
      .profit-table td { background: #0f172a; font-weight: 700; color: #4ade80; font-size: 12pt; }
      .footer-cta { background: linear-gradient(135deg, #2563eb, #1d4ed8); border-radius: 14px; padding: 14px; text-align: center; font-weight: 800; font-size: 12pt; color: white; margin-top: 15px; }
    </style>
  </head>
  <body>
    <div class="card">
      <span class="badge">🚚 Plan Aliado Despachador & Preventista</span>
      <h1>¡GANA <span class="highlight">$5 USD AL INSTANTE</span> POR CADA BODEGA DE TU RUTA!</h1>
      <p>Genera un ingreso extra en dólares todas las semanas simplemente recomendando <strong>KlikPOS</strong> en los abastos y bodegas que visitas.</p>

      <div class="steps-box">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text"><strong>Recomiendas la app GRATIS:</strong> El bodeguero descarga e instala KlikPOS en su teléfono o PC sin pagar nada.</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text"><strong>Activa el Escáner por solo $20:</strong> Cuando el bodeguero quiera pistolear con el celular o escanear facturas de tus pedidos con IA, paga solo $20 USD.</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text"><strong>Cobras tus $5 al instante:</strong> Ingresan tu código de despachador y recibes tus $5 en Pago Móvil de inmediato.</div>
        </div>
      </div>

      <table class="profit-table">
        <thead>
          <tr>
            <th>Bodegas Activadas en tu Ruta</th>
            <th>Tu Ganancia Extra en Pago Móvil</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>10 bodegas / mes</td>
            <td>+$50 USD Extra</td>
          </tr>
          <tr>
            <td>20 bodegas / mes</td>
            <td>+$100 USD Extra</td>
          </tr>
          <tr>
            <td>40 bodegas / mes</td>
            <td>+$200 USD Extra</td>
          </tr>
        </tbody>
      </table>

      <div class="footer-cta">
        📲 Solicita tu Código de Despachador Oficial por WhatsApp
      </div>
    </div>
  </body>
  </html>
  `;

  // =========================================================================
  // FLYER 2: COMIDA RÁPIDA, PERROCALENTEROS Y AMBULANTES
  // =========================================================================
  const flyerStreetHtml = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
      body { background: #090d16; color: #ffffff; padding: 25px; }
      .card { background: #131c2e; border: 2px solid #f59e0b; border-radius: 20px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
      .badge { background: #f59e0b; color: #451a03; font-weight: 800; font-size: 11pt; padding: 6px 14px; border-radius: 9999px; display: inline-block; text-transform: uppercase; margin-bottom: 12px; }
      h1 { font-size: 21pt; font-weight: 800; line-height: 1.2; margin-bottom: 10px; color: #fbbf24; }
      .highlight { color: #38bdf8; font-weight: 800; }
      p { font-size: 10.5pt; color: #cbd5e1; margin-bottom: 15px; line-height: 1.5; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; }
      .feature { background: #0b1120; border: 1px solid #334155; border-radius: 12px; padding: 12px; }
      .feature h3 { font-size: 11pt; color: #f59e0b; margin-bottom: 4px; }
      .feature p { font-size: 9pt; color: #94a3b8; margin: 0; }
      .promo-box { background: linear-gradient(135deg, #1e1b4b, #312e81); border: 1.5px solid #818cf8; border-radius: 14px; padding: 14px; text-align: center; margin-top: 15px; }
      .promo-box h2 { font-size: 13pt; color: #e0e7ff; margin-bottom: 6px; }
      .promo-box p { font-size: 9.5pt; color: #c7d2fe; margin-bottom: 0; }
      .footer-cta { background: linear-gradient(135deg, #d97706, #b45309); border-radius: 14px; padding: 14px; text-align: center; font-weight: 800; font-size: 12pt; color: white; margin-top: 15px; }
    </style>
  </head>
  <body>
    <div class="card">
      <span class="badge">🌭 KlikPOS Street - Comida Rápida & Puestos</span>
      <h1>EL PUNTO DE VENTA EN TU CELULAR <span class="highlight">CON EL NOMBRE DE TU NEGOCIO</span></h1>
      <p>Diseñado para puestos de perros calientes, hamburguesas, pepitos, comida rápida y ambulantes. <strong>100% en tu teléfono Android, sin necesidad de computadoras.</strong></p>

      <div class="grid">
        <div class="feature">
          <h3>⚡ Botonera Rápida</h3>
          <p>Cobra perros, hamburguesas y combos en 2 toques, incluso con grasa en los dedos.</p>
        </div>
        <div class="feature">
          <h3>🔔 Detector de Pago Móvil</h3>
          <p>Tu teléfono timbra al caer el SMS real del banco. Cero capturas viejas o estafas.</p>
        </div>
        <div class="feature">
          <h3>💵 Doble Moneda al Instante</h3>
          <p>Calcula automáticamente la cuenta y el vuelto exacto en Bolívares (BCV) y Dólares.</p>
        </div>
        <div class="feature">
          <h3>🖨️ Ticket con tu Instagram</h3>
          <p>Imprime tickets por Bluetooth desde la cintura con tu logo y redes sociales.</p>
        </div>
      </div>

      <div class="promo-box">
        <h2>🎁 ¡PROMOCIÓN EMBAJADOR: MARCA PROPIA GRATIS!</h2>
        <p>Recomienda KlikPOS a <strong>5 puestos amigos de tu zona o Calle del Hambre</strong> y te personalizamos la app con el <strong>Logo y Nombre oficial de tu negocio</strong> 100% Gratis.</p>
      </div>

      <div class="footer-cta">
        📲 ¡Descárgalo Gratis Hoy y Pruébalo en tu Teléfono!
      </div>
    </div>
  </body>
  </html>
  `;

  const page = await browser.newPage();

  // Generar PDF Repartidor
  await page.setContent(flyerRepartidorHtml, { waitUntil: 'domcontentloaded' });
  const pdfRepartidor = path.resolve('DISTRIBUCION_KLIKPOS/Ficha_Promocional_Despachadores_Gana5.pdf');
  await page.pdf({ path: pdfRepartidor, format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });

  // Generar PDF Comida Rápida
  await page.setContent(flyerStreetHtml, { waitUntil: 'domcontentloaded' });
  const pdfStreet = path.resolve('DISTRIBUCION_KLIKPOS/Ficha_Promocional_Comida_Rapida_MarcaPropia.pdf');
  await page.pdf({ path: pdfStreet, format: 'A4', printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' } });

  // Copiar a KlikPOS Release
  fs.copyFileSync(pdfRepartidor, path.resolve('KlikPOS Release/Ficha_Promocional_Despachadores_Gana5.pdf'));
  fs.copyFileSync(pdfStreet, path.resolve('KlikPOS Release/Ficha_Promocional_Comida_Rapida_MarcaPropia.pdf'));

  await browser.close();

  console.log(' [✓] Fichas generadas exitosamente:');
  console.log('     - DISTRIBUCION_KLIKPOS/Ficha_Promocional_Despachadores_Gana5.pdf');
  console.log('     - DISTRIBUCION_KLIKPOS/Ficha_Promocional_Comida_Rapida_MarcaPropia.pdf');
}

generateCommercialFlyers().catch(err => {
  console.error('Error generando flyers:', err);
  process.exit(1);
});
