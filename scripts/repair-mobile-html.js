const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const outHtmlPath = path.join(root, 'venematic-desktop', 'out', 'index.html');
const androidAssetPath = path.join(root, 'venematic-desktop', 'android', 'app', 'src', 'main', 'assets', 'public', 'index.html');

console.log('=== INICIANDO REPARACIÓN INTEGRAL DE KLIKPOS MÓVIL (HTML / UI / JS) ===');

let html = fs.readFileSync(outHtmlPath, 'utf8');

// 1. REPARAR BLOQUE 5: sendMobileReceiptWhatsApp & printMobileReceipt
const block5BadStart = html.indexOf('function sendMobileReceiptWhatsApp()');
const block5EndMarker = 'function updateHeaderClock() {';
const block5BadEnd = html.indexOf(block5EndMarker);

if (block5BadStart !== -1 && block5BadEnd !== -1) {
  const cleanBlock5Code = `function sendMobileReceiptWhatsApp() {
      if (!currentReceiptSale) {
        showToast('No hay venta activa para compartir', false);
        return;
      }
      try {
        const s = currentReceiptSale;
        const rate = (typeof bcvRate !== 'undefined' && bcvRate > 0) ? bcvRate : 857.01;
        const totalUSD = s.totalUSD || 0;
        const totalVES = s.totalVES || (totalUSD * rate);
        const itemsList = (s.items || []).map(it => '• ' + it.qty + 'x ' + it.name + ' - $' + (it.priceUSD * it.qty).toFixed(2)).join('%0A');
        const msg = '*COMPROBANTE DE PAGO - KLIKPOS*%0A' +
          '*Ticket:* %23' + (s.receiptNumber || 'VTA-' + Date.now().toString().slice(-4)) + '%0A' +
          '*Fecha:* ' + encodeURIComponent(new Date(s.timestamp || Date.now()).toLocaleString('es-VE')) + '%0A' +
          '--------------------------------%0A' +
          (itemsList ? itemsList + '%0A--------------------------------%0A' : '') +
          '*Total USD:* $' + totalUSD.toFixed(2) + '%0A' +
          '*Total Bolívares:* Bs. ' + totalVES.toFixed(2) + '%0A' +
          '*Tasa Oficial BCV:* Bs. ' + rate.toFixed(2) + '%0A' +
          '*Forma de Pago:* ' + encodeURIComponent(s.paymentMethod || 'Contado') + '%0A' +
          (s.reference ? '*Referencia:* ' + encodeURIComponent(s.reference) + '%0A' : '') +
          '%0A¡Muchas gracias por su preferencia! ✨';
        const waUrl = 'https://wa.me/?text=' + msg;
        window.open(waUrl, '_blank');
      } catch (err) {
        console.error('Error enviando recibo WhatsApp:', err);
      }
    }

    function printMobileReceipt() {
      window.print();
    }

    `;

  html = html.substring(0, block5BadStart) + cleanBlock5Code + html.substring(block5BadEnd);
  console.log('✓ Bloque 5 reparado (WhatsApp y Print)');
}

// 2. REPARAR BLOQUE 7: quickJsLogic & openPaymentModal
const block7BadStart = html.indexOf('let quickSaleCurrency =');
const block7EndMarker = 'function closePaymentModal() {';
const block7BadEnd = html.indexOf(block7EndMarker);

if (block7BadStart !== -1 && block7BadEnd !== -1) {
  const cleanBlock7Code = `let quickSaleCurrency = 'USD';
    let currentSmsDetectedData = null;

    function openQuickAmountModal() {
      document.getElementById('quick-amount-input').value = '';
      document.getElementById('quick-converted-preview').innerText = '≈ Bs. 0.00';
      document.getElementById('quick-amount-modal').classList.remove('hidden');
      setTimeout(() => document.getElementById('quick-amount-input').focus(), 150);
    }

    function closeQuickAmountModal() {
      document.getElementById('quick-amount-modal').classList.add('hidden');
    }

    function setQuickConcept(name) {
      document.getElementById('quick-concept-input').value = name;
    }

    function setQuickCurrency(curr) {
      quickSaleCurrency = curr;
      document.getElementById('quick-curr-symbol').innerText = curr === 'USD' ? '$' : 'Bs';
      document.getElementById('btn-quick-curr-usd').className = curr === 'USD' ? 'px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold' : 'px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400';
      document.getElementById('btn-quick-curr-ves').className = curr === 'VES' ? 'px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold' : 'px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400';
      updateQuickConvertedPreview();
    }

    function updateQuickConvertedPreview() {
      const val = parseFloat(document.getElementById('quick-amount-input').value) || 0;
      const rate = (typeof bcvRate !== 'undefined' && bcvRate > 0) ? bcvRate : 857.01;
      const prevEl = document.getElementById('quick-converted-preview');
      if (quickSaleCurrency === 'USD') {
        prevEl.innerText = '≈ Bs. ' + (val * rate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else {
        prevEl.innerText = '≈ $' + (val / rate).toFixed(2) + ' USD';
      }
    }

    document.addEventListener('input', (e) => {
      if (e.target && e.target.id === 'quick-amount-input') {
        updateQuickConvertedPreview();
      }
    });

    function applyQuickAmountSale() {
      const amountVal = parseFloat(document.getElementById('quick-amount-input').value);
      if (!amountVal || amountVal <= 0) {
        showToast('Ingresa un monto válido mayor a 0', false);
        return;
      }
      const rate = (typeof bcvRate !== 'undefined' && bcvRate > 0) ? bcvRate : 857.01;
      const priceUSD = quickSaleCurrency === 'USD' ? amountVal : (amountVal / rate);
      const concept = document.getElementById('quick-concept-input').value.trim() || 'Venta Rápida';

      const quickItem = {
        barcode: 'RAPIDO-' + Date.now().toString().slice(-4),
        name: '⚡ ' + concept,
        category: 'Venta Rápida',
        priceUSD: priceUSD,
        qty: 1,
        image: ''
      };

      cart.push(quickItem);
      updateCartDisplay();
      closeQuickAmountModal();
      showToast('✓ ' + concept + ' ($' + priceUSD.toFixed(2) + ') agregado al ticket', true);
    }

    function openSmsValidatorModal() {
      document.getElementById('sms-raw-input').value = '';
      document.getElementById('sms-analysis-result').classList.add('hidden');
      document.getElementById('sms-validator-modal').classList.remove('hidden');
    }

    function closeSmsValidatorModal() {
      document.getElementById('sms-validator-modal').classList.add('hidden');
    }

    function analyzeSmsText() {
      const txt = document.getElementById('sms-raw-input').value;
      if (!txt.trim()) {
        showToast('Pega el texto del SMS bancario primero', false);
        return;
      }

      const amountMatch = txt.match(/(?:Bs\\.?|VES|Monto:?)\\s*([0-9]{1,3}(?:\\.[0-9]{3})*(?:,[0-9]{1,2})|[0-9]+(?:\\.[0-9]{1,2})?)/i) || txt.match(/([0-9]+[.,][0-9]{2})/);
      const refMatch = txt.match(/(?:ref(?:erencia)?|nro|operaci[oó]n|aprobaci[oó]n)[:.\\s#]*([0-9]{4,10})/i) || txt.match(/\\b([0-9]{6,8})\\b/);
      
      let bank = 'Banco Nacional';
      if (/banesco/i.test(txt)) bank = 'Banesco';
      else if (/mercantil/i.test(txt)) bank = 'Mercantil';
      else if (/venezuela|bdv/i.test(txt)) bank = 'Banco de Venezuela';
      else if (/provincial|bbva/i.test(txt)) bank = 'BBVA Provincial';
      else if (/bancamiga/i.test(txt)) bank = 'Bancamiga';
      else if (/bnc/i.test(txt)) bank = 'BNC';

      let amountVES = 0;
      if (amountMatch) {
        let clean = amountMatch[1].replace(/\\./g, '').replace(',', '.');
        amountVES = parseFloat(clean) || 0;
      }
      const refNum = refMatch ? refMatch[1] : Date.now().toString().slice(-6);

      currentSmsDetectedData = {
        bank,
        reference: refNum,
        amountVES
      };

      document.getElementById('sms-res-bank').innerText = bank;
      document.getElementById('sms-res-ref').innerText = refNum;
      document.getElementById('sms-res-amount').innerText = 'Bs. ' + amountVES.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      document.getElementById('sms-analysis-result').classList.remove('hidden');
      showToast('✓ SMS auditado con éxito (' + bank + ')', true);
    }

    function confirmSmsPaymentToSale() {
      if (!currentSmsDetectedData) {
        showToast('Audita un SMS primero', false);
        return;
      }
      closeSmsValidatorModal();
      openPaymentModal();
      selectPayMethod('pago_movil');
      const refInput = document.getElementById('pm-reference-input');
      if (refInput) {
        refInput.value = currentSmsDetectedData.reference;
      }
      showToast('✓ Referencia #' + currentSmsDetectedData.reference + ' cargada en Pago Móvil', true);
    }

    function openPaymentModal() {
      if (cart.length === 0) {
        showToast('El ticket está vacío', false);
        return;
      }
      closeCartDrawer();
      document.getElementById('payment-modal').classList.remove('hidden');
      updatePaymentModalTotals();
      if (paymentPrimaryCurrency === 'VES') {
        selectPayMethod('pago_movil');
      } else {
        selectPayMethod('cash_usd');
      }
      calculateCashUsdChange();
      calculateCashVesChange();
    }

    `;

  html = html.substring(0, block7BadStart) + cleanBlock7Code + html.substring(block7BadEnd);
  console.log('✓ Bloque 7 reparado (Venta Rápida, SMS y Modal Cobro)');
}

// 3. ASEGURAR QUE BODY ARRANCA EN MODO BLANCO POR DEFECTO
html = html.replace(/<body class="([^"]*)">/i, (match, classes) => {
  let cls = classes;
  if (!cls.includes('light-mode')) {
    cls = 'light-mode ' + cls;
  }
  return '<body class="' + cls + '">';
});

// 4. ACTUALIZAR initMobileTheme Y toggleMobileTheme PARA QUE EL DEFAULT SEA BLANCO
const initThemePattern = /function initMobileTheme\(\) \{[\s\S]*?document\.addEventListener\('DOMContentLoaded'/;
const newInitThemeCode = `function initMobileTheme() {
      try {
        const savedTheme = localStorage.getItem('klikpos_theme');
        if (savedTheme === 'dark') {
          document.body.classList.remove('light-mode');
          const btn = document.getElementById('btn-theme-toggle');
          if (btn) {
            btn.innerHTML = '☀️';
            btn.title = 'Cambiar a Modo Blanco';
          }
        } else {
          document.body.classList.add('light-mode');
          const btn = document.getElementById('btn-theme-toggle');
          if (btn) {
            btn.innerHTML = '🌙';
            btn.title = 'Cambiar a Modo Oscuro';
          }
        }
      } catch (e) {
        document.body.classList.add('light-mode');
      }
    }
    document.addEventListener('DOMContentLoaded'`;

html = html.replace(initThemePattern, () => newInitThemeCode);

const toggleThemePattern = /function toggleMobileTheme\(\) \{[\s\S]*?if \(typeof renderPosCatalog === 'function'\) renderPosCatalog\(\);\s*\}/;
const newToggleThemeCode = `function toggleMobileTheme() {
      const isLight = document.body.classList.toggle('light-mode');
      try {
        localStorage.setItem('klikpos_theme', isLight ? 'light' : 'dark');
      } catch (e) {}
      const btn = document.getElementById('btn-theme-toggle');
      if (btn) {
        btn.innerHTML = isLight ? '🌙' : '☀️';
        btn.title = isLight ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Blanco';
      }
      if (typeof renderPosCatalog === 'function') renderPosCatalog();
    }`;

html = html.replace(toggleThemePattern, () => newToggleThemeCode);

// 5. INYECTAR REGLAS DE CONTRASTE ESTRICTAS DE UI DESIGNER EN EL CSS
const customContrastCss = `
    /* ========================================================================= */
    /* REGLAS ESTRICTAS DE CONTRASTE UI/UX (KLIKPOS ENTERPRISE DESIGN SYSTEM)     */
    /* Regla de oro: Texto negro en fondo claro / Texto blanco en fondo oscuro   */
    /* ========================================================================= */

    /* MODO BLANCO: TODOS LOS TEXTOS EN FONDOS CLAROS DEBEN SER NEGROS / SLATE-900 */
    body.light-mode {
      background-color: #f8fafc !important;
      color: #0f172a !important;
    }
    body.light-mode main,
    body.light-mode section {
      background-color: #f8fafc !important;
    }

    body.light-mode h1,
    body.light-mode h2,
    body.light-mode h3,
    body.light-mode h4,
    body.light-mode h5,
    body.light-mode h6 {
      color: #0f172a !important;
    }

    /* Total facturado en el POS y en Drawer: NEGRO SÓLIDO (#0f172a) */
    body.light-mode #pos-reg-total-usd,
    body.light-mode #drawer-total-usd,
    body.light-mode #pos-reg-subtotal {
      color: #0f172a !important;
    }

    body.light-mode #pos-reg-total-ves,
    body.light-mode #drawer-total-ves {
      color: #b45309 !important;
    }

    body.light-mode [class*="text-indigo-200"],
    body.light-mode [class*="text-indigo-300"],
    body.light-mode [class*="text-sky-200"] {
      color: #334155 !important;
    }

    /* Encabezados y títulos dentro de tarjetas en Modo Blanco */
    body.light-mode .bg-slate-900,
    body.light-mode .bg-slate-950 {
      background-color: #ffffff !important;
      border-color: #e2e8f0 !important;
      color: #0f172a !important;
    }

    body.light-mode .bg-slate-900 h2,
    body.light-mode .bg-slate-900 h3,
    body.light-mode .bg-slate-900 span.text-white,
    body.light-mode .bg-slate-950 span.text-white {
      color: #0f172a !important;
    }

    /* Botones de acción rápida en modo blanco */
    body.light-mode #quick-vendor-bar button {
      background-color: #ffffff !important;
      color: #0f172a !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
    }

    /* Modal de Cobro en Modo Blanco */
    body.light-mode #payment-modal .bg-slate-900 {
      background-color: #ffffff !important;
      color: #0f172a !important;
    }
    body.light-mode #payment-modal h3 {
      color: #0f172a !important;
    }
    body.light-mode #payment-modal .text-slate-400 {
      color: #475569 !important;
    }

    /* TEXTO BLANCO EXCLUSIVAMENTE EN BOTONES PRIMARIOS Y DISPLAY OSCURO */
    button.bg-emerald-600,
    button.bg-emerald-600 *,
    button.bg-emerald-500,
    button.bg-emerald-500 *,
    button.bg-sky-600,
    button.bg-sky-600 *,
    button[class*="bg-emerald"],
    button[class*="bg-emerald"] *,
    .scale-box-display,
    .scale-box-display *,
    .hero-banner-dark,
    .hero-banner-dark * {
      color: #ffffff !important;
    }
`;

if (!html.includes('REGLAS ESTRICTAS DE CONTRASTE UI/UX')) {
  html = html.replace('</style>', customContrastCss + '\n  </style>');
  console.log('✓ Inyectadas reglas de contraste de UI Designer en style');
}

// 6. VALIDACIÓN ESTRICTA CON NODE VM
console.log('>>> Validando sintaxis de todos los bloques de script...');
const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
let match;
let sIdx = 0;
let hasSyntaxError = false;

while ((match = scriptRegex.exec(html)) !== null) {
  sIdx++;
  const code = match[1];
  if (!code.trim()) continue;
  try {
    new vm.Script(code);
    console.log('  Bloque ' + sIdx + ': VÁLIDO (0 errores de sintaxis)');
  } catch (err) {
    hasSyntaxError = true;
    console.error('  ERROR CRÍTICO EN BLOQUE ' + sIdx + ':', err.message);
  }
}

if (hasSyntaxError) {
  throw new Error('La validación de scripts falló. Abortando guardado.');
}

// 7. GUARDAR ARCHIVOS
fs.writeFileSync(outHtmlPath, html, 'utf8');
console.log('✓ venematic-desktop/out/index.html guardado (' + html.length + ' bytes)');

if (fs.existsSync(path.dirname(androidAssetPath))) {
  fs.writeFileSync(androidAssetPath, html, 'utf8');
  console.log('✓ venematic-desktop/android/.../public/index.html actualizado y sincronizado (' + html.length + ' bytes)');
}

console.log('=== REPARACIÓN COMPLETADA CON ÉXITO ===');
