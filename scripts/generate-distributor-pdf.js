const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateDistributorPdf() {
  console.log('>>> [GENERADOR DE PDF] Iniciando generación del Dossier para Distribuidores...');
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Dossier Comercial para Distribuidores - KlikPOS Enterprise</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    body {
      background-color: #ffffff;
      color: #1e293b;
      font-size: 10.5pt;
      line-height: 1.55;
    }

    .page {
      page-break-after: always;
      position: relative;
      height: 100%;
      min-height: 260mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Header & Footer */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 8px;
      margin-bottom: 20px;
    }

    .brand-logo {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }

    .brand-logo span {
      color: #2563eb;
    }

    .doc-badge {
      background: #eff6ff;
      color: #1d4ed8;
      font-size: 8pt;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 9999px;
      border: 1px solid #bfdbfe;
      text-transform: uppercase;
    }

    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-size: 8pt;
      color: #64748b;
      margin-top: 20px;
    }

    /* Typography */
    h1 {
      font-size: 22pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 8px;
    }

    h2 {
      font-size: 14pt;
      font-weight: 700;
      color: #1e3a8a;
      margin-top: 15px;
      margin-bottom: 10px;
      border-left: 4px solid #2563eb;
      padding-left: 8px;
    }

    h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 10px;
      margin-bottom: 4px;
    }

    p {
      margin-bottom: 10px;
      color: #334155;
    }

    .lead {
      font-size: 11.5pt;
      color: #475569;
      font-weight: 500;
      margin-bottom: 16px;
    }

    /* Cards & Grids */
    .card-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 15px;
    }

    .card-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }

    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }

    .card-primary {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
    }

    .card-accent {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
    }

    .card-warning {
      background: #fffbeb;
      border: 1px solid #fef3c7;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 9pt;
    }

    th, td {
      padding: 8px 10px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }

    th {
      background-color: #1e293b;
      color: #ffffff;
      font-weight: 600;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .table-highlight {
      background-color: #eff6ff !important;
      font-weight: 700;
      color: #1e40af;
    }

    .badge-win {
      background: #dcfce7;
      color: #15803d;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8pt;
      display: inline-block;
    }

    .badge-lose {
      background: #fee2e2;
      color: #b91c1c;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8pt;
      display: inline-block;
    }

    /* Highlights */
    .metric-box {
      text-align: center;
      padding: 10px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }

    .metric-value {
      font-size: 16pt;
      font-weight: 800;
      color: #2563eb;
    }

    .metric-label {
      font-size: 7.5pt;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
    }

    ul {
      margin-left: 18px;
      margin-bottom: 12px;
      font-size: 9.5pt;
    }

    li {
      margin-bottom: 4px;
    }

    .pitch-box {
      background: #f1f5f9;
      border-left: 4px solid #3b82f6;
      padding: 10px 12px;
      font-style: italic;
      color: #1e293b;
      font-size: 9.5pt;
      margin-bottom: 12px;
      border-radius: 0 6px 6px 0;
    }
  </style>
</head>
<body>

  <!-- ==================== PÁGINA 1 ==================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">KLIK<span>POS</span> ENTERPRISE</div>
        <div class="doc-badge">Dossier Comercial para Distribuidores</div>
      </div>

      <h1>Oportunidad de Negocio & Guía Estratégica para Distribuidores</h1>
      <p class="lead">Cómo dominar el mercado de comercios en Venezuela frente a soluciones SaaS en la nube como Fina y generar 100% de margen de ganancia.</p>

      <h2>1. El Panorama Actual: La Realidad del Comercio en Venezuela</h2>
      <p>
        El sector comercial venezolano (bodegas, supermercados, ferreterías, farmacias y restaurantes) atraviesa una digitalización obligatoria motivada por tres factores críticos:
      </p>

      <div class="card-grid-3">
        <div class="card card-warning">
          <h3>⚡ Inestabilidad Eléctrica y de Red</h3>
          <p style="font-size: 8.5pt; color: #64748b;">
            Cortes de luz frecuentes y caídas constantes de Cantv, fibra o datos móviles impiden operar sistemas 100% dependientes de la nube.
          </p>
        </div>
        <div class="card card-primary">
          <h3>💵 Economía Multimoneda</h3>
          <p style="font-size: 8.5pt; color: #64748b;">
            Operación diaria en Bolívares (Bs. BCV) y Dólares (USD), con necesidad de actualización automática de tasa y reportes bimoneda.
          </p>
        </div>
        <div class="card card-accent">
          <h3>🚫 Rechazo a Rentas Mensuales</h3>
          <p style="font-size: 8.5pt; color: #64748b;">
            Los dueños de comercios rechazan pagar $35 a $50 mensuales en dólares por un software que "les apaga la caja" si dejan de pagar.
          </p>
        </div>
      </div>

      <h2>2. Análisis Competitivo: Fina vs. KlikPOS Enterprise</h2>
      <p>
        Recientemente, la startup <strong>Fina</strong> levantó $1.000.000 USD de capital de riesgo para vender un software de gestión en la nube a $35/mes. A continuación, el contraste directo entre ambos modelos:
      </p>

      <table>
        <thead>
          <tr>
            <th>Criterio</th>
            <th>Fina (Cloud SaaS)</th>
            <th>KlikPOS Enterprise v3.0</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Operación sin Internet (Offline)</strong></td>
            <td><span class="badge-lose">No / Muy limitada</span><br>Depende de servidores AWS.</td>
            <td class="table-highlight"><span class="badge-win">100% Autónoma</span><br>Vende sin internet con SQLite/IndexedDB.</td>
          </tr>
          <tr>
            <td><strong>Costo Anual para el Comercio</strong></td>
            <td><span class="badge-lose">$420 USD / año</span><br>($35 mensual forzoso de por vida).</td>
            <td class="table-highlight"><span class="badge-win">Pago Único / Vitalicio</span><br>Retorno de inversión en menos de 3 meses.</td>
          </tr>
          <tr>
            <td><strong>Velocidad en Caja (Retail POS)</strong></td>
            <td>Lenta (enfoque administrativo/web).</td>
            <td class="table-highlight">Ultra-rápida (Atajos F1-F12, lector código de barra, tickets en 2 seg).</td>
          </tr>
          <tr>
            <td><strong>Privacidad de los Datos</strong></td>
            <td>Datos en la nube de Fina (pérdida de control).</td>
            <td class="table-highlight">100% Privado en el disco del cliente o en su propio Google Firestore.</td>
          </tr>
          <tr>
            <td><strong>Sincronización en la Nube</strong></td>
            <td>Obligatoria y centralizada.</td>
            <td class="table-highlight">Híbrida Opcional (Google Firebase Firestore a Costo $0).</td>
          </tr>
          <tr>
            <td><strong>Auditoría de Pago Móvil</strong></td>
            <td>Carga manual o conciliación externa.</td>
            <td class="table-highlight">Automática por SMS Bancario con App KlikAdmin en tiempo real.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer-bar">
      <span>KlikPOS Enterprise - Dossier para Distribuidores Autorizados</span>
      <span>Página 1 de 2</span>
    </div>
  </div>

  <!-- ==================== PÁGINA 2 ==================== -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="brand-logo">KLIK<span>POS</span> ENTERPRISE</div>
        <div class="doc-badge">Estrategia & Rentabilidad</div>
      </div>

      <h2>3. Modelo de Negocio para el Distribuidor: 100% de Ganancia</h2>
      <p>
        A diferencia de los modelos de comisión mínima de las apps en la nube (donde el distribuidor solo gana 10-15%), con **KlikPOS** tú tienes el control total mediante el **Keygen Maestro**:
      </p>

      <div class="card-grid-3">
        <div class="metric-box">
          <div class="metric-value">$80 - $180</div>
          <div class="metric-label">Precio de Venta Sugerido (Software)</div>
        </div>
        <div class="metric-box">
          <div class="metric-value">$250 - $450</div>
          <div class="metric-label">Combo con Hardware (MiniPC + Impresora)</div>
        </div>
        <div class="metric-box">
          <div class="metric-value">100%</div>
          <div class="metric-label">Margen de Ganancia del Distribuidor</div>
        </div>
      </div>

      <h2>4. El Ecosistema de 5 Apps: Una Solución para Cada Comercio</h2>
      <div class="card-grid-2">
        <div class="card">
          <h3>🖥️ 1. KlikPOS Desktop PC (Windows)</h3>
          <p style="font-size: 8.5pt; color: #475569;">
            El cerebro del negocio: Caja registradora principal, servidor de red local, soporte para balanzas electrónicas e impresoras térmicas ESC/POS de 58mm/80mm.
          </p>
        </div>
        <div class="card">
          <h3>📱 2. KlikPOS Móvil Autónomo (Android)</h3>
          <p style="font-size: 8.5pt; color: #475569;">
            Punto de venta completo para teléfonos y tablets. Cobra, imprime por Bluetooth y descuenta inventario sin necesidad de una computadora.
          </p>
        </div>
        <div class="card">
          <h3>📡 3. KlikPOS Satélite (Escáner & Balanza)</h3>
          <p style="font-size: 8.5pt; color: #475569;">
            Convierte cualquier smartphone en una pistola lectora inalámbrica o caja de contingencia que sincroniza con la PC principal.
          </p>
        </div>
        <div class="card">
          <h3>👑 4. KlikAdmin (Vigía del Dueño & SMS)</h3>
          <p style="font-size: 8.5pt; color: #475569;">
            El panel privado del dueño con PIN: Monitorea ventas en vivo, detecta fraudes y valida automáticamente los Pago Móvil leyendo los SMS de bancos (BDV, Banesco, etc.).
          </p>
        </div>
      </div>

      <h2>5. Guía de Cierre Comercial y Manejo de Objeciones</h2>
      
      <div class="pitch-box">
        <strong>Cliente dice:</strong> <em>"Me están ofreciendo Fina por $35 al mes en la nube..."</em><br>
        <strong>Tu respuesta:</strong> <em>"Amigo, $35 al mes son $420 al año y más de $1.200 en 3 años por un sistema que si se cae el internet o se va la luz, te para la caja. Con KlikPOS haces un solo pago, el sistema es tuyo para siempre, vendes a toda velocidad sin internet y además tienes la nube de Google Firestore incluida gratis."</em>
      </div>

      <div class="pitch-box">
        <strong>Cliente dice:</strong> <em>"¿Qué pasa si quiero ver las ventas desde mi casa?"</em><br>
        <strong>Tu respuesta:</strong> <em>"KlikPOS incluye sincronización en la nube con Firebase Firestore sin costo mensual. Podrás abrir KlikAdmin desde tu teléfono en cualquier lugar del mundo y ver tu facturación en tiempo real."</em>
      </div>

      <h2>6. Pasos para Empezar a Distribuir</h2>
      <ul>
        <li><strong>Paso 1:</strong> Instala el instalador oficial <code>KlikPOS_Desktop_Full_Setup.exe</code> en la laptop o PC de demostración.</li>
        <li><strong>Paso 2:</strong> Ten a la mano la APK <code>KlikAdmin.apk</code> y <code>KlikPOS_Movil.apk</code> para mostrar la auditoría de Pago Móvil en vivo.</li>
        <li><strong>Paso 3:</strong> Genera las claves de activación inmediatas para tus clientes usando <code>KlikPOS_Keygen.apk</code>.</li>
      </ul>
    </div>

    <div class="footer-bar">
      <span>KlikPOS Enterprise - Solución Líder en Automatización Comercial</span>
      <span>Página 2 de 2</span>
    </div>
  </div>

</body>
</html>
  `;

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

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const outputPdfPath = path.resolve('DISTRIBUCION_KLIKPOS/Dossier_Comercial_Distribuidores_KlikPOS.pdf');
  const releasePdfPath = path.resolve('KlikPOS Release/Dossier_Comercial_Distribuidores_KlikPOS.pdf');
  const docsPdfPath = path.resolve('docs/Dossier_Comercial_Distribuidores_KlikPOS.pdf');

  [outputPdfPath, releasePdfPath, docsPdfPath].forEach(p => {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  await page.pdf({
    path: outputPdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '12mm',
      bottom: '12mm',
      left: '12mm',
      right: '12mm'
    }
  });

  fs.copyFileSync(outputPdfPath, releasePdfPath);
  fs.copyFileSync(outputPdfPath, docsPdfPath);

  await browser.close();

  console.log(' [✓] PDF generado con éxito en:');
  console.log('     -', outputPdfPath);
  console.log('     -', releasePdfPath);
  console.log('     -', docsPdfPath);
}

generateDistributorPdf().catch(err => {
  console.error('Error generando PDF:', err);
  process.exit(1);
});
