const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outHtmlPath = path.join(root, 'venematic-desktop', 'out', 'index.html');
const adminHtmlPath = path.join(root, 'public', 'admin-mobile.html');
const androidAssetPath = path.join(root, 'venematic-desktop', 'android', 'app', 'src', 'main', 'assets', 'public', 'index.html');

console.log('=== ACTUALIZANDO Y BLINDANDO KLIKPOS MÓVIL FULL ===');

let html = fs.readFileSync(outHtmlPath, 'utf8');

// 1. TÍTULO Y METADATOS
html = html.replace(/<title>Venematic POS Móvil<\/title>/g, '<title>KlikPOS Móvil Enterprise</title>');
html = html.replace(/<title>Venematic.*?<\/title>/g, '<title>KlikPOS Móvil Enterprise</title>');

// 2. REEMPLAZO DE MARCA EN HEADER
html = html.replace(
  /<span class="text-xs font-black tracking-tight text-white leading-none">VENEMATIC<\/span>/g,
  '<span class="text-xs font-black tracking-tight text-white leading-none">KLIKPOS</span>'
);
html = html.replace(
  /<div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 flex items-center justify-center font-black text-slate-950 text-base shadow-sm shadow-cyan-500\/30 shrink-0">\s*V\s*<\/div>/g,
  '<div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 via-teal-400 to-emerald-400 flex items-center justify-center font-black text-slate-950 text-base shadow-sm shadow-sky-500/30 shrink-0">K</div>'
);

// 3. REEMPLAZO EN EL MENÚ DEL SISTEMA
html = html.replace(/<span>VENEMATIC POS MÓVIL<\/span>/g, '<span>KLIKPOS MÓVIL ENTERPRISE</span>');
html = html.replace(/<span class="text-\[8px\] bg-sky-500\/20 text-sky-300 px-1\.5 py-0\.2 rounded border border-sky-400\/30">v2\.0<\/span>/g, '<span class="text-[8px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded border border-sky-400/30 font-bold">v2.4.0</span>');
html = html.replace(/pagos@venematic\.com/g, 'pagos@klikposcloud.com');
html = html.replace(/venematic\.com/g, 'klikposcloud.com');

// 4. INYECTAR BOTÓN DE WHATSAPP EN EL MODAL DE RECIBOS
if (!html.includes('sendMobileReceiptWhatsApp')) {
  const receiptBtnTarget = `<button onclick="saveMobileReceiptPdf()"`;
  const whatsappBtnHtml = `
        <button type="button" onclick="sendMobileReceiptWhatsApp()" class="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]">
          <span>📲 Enviar Recibo por WhatsApp</span>
        </button>
  `;
  html = html.replace(receiptBtnTarget, whatsappBtnHtml + '\n        ' + receiptBtnTarget);

  // Inyectar la función sendMobileReceiptWhatsApp en el script
  const waFunc = `
    function sendMobileReceiptWhatsApp() {
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
  `;
  html = html.replace('function printMobileReceipt() {', waFunc + '\n    function printMobileReceipt() {');
  console.log('✓ Inyectado botón y lógica de WhatsApp en Recibos');
}

// 5. INYECTAR BOTONES: VENTA RÁPIDA POR MONTO Y VERIFICADOR SMS
if (!html.includes('id="quick-vendor-bar"')) {
  const quickVendorBarHtml = `
      <!-- ACCIONES RÁPIDAS PARA AMBULANTES Y VENDEDORES CALLEJEROS -->
      <div id="quick-vendor-bar" class="grid grid-cols-2 gap-2 shrink-0">
        <button type="button" onclick="openQuickAmountModal()" class="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-600/20 border-2 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 flex items-center justify-center gap-1.5 text-xs font-black shadow-sm active:scale-95 transition-all">
          <span class="text-sm">⚡</span>
          <span>Venta Rápida (Monto)</span>
        </button>
        <button type="button" onclick="openSmsValidatorModal()" class="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-indigo-500/20 border-2 border-sky-400/40 text-sky-300 hover:bg-sky-500/30 flex items-center justify-center gap-1.5 text-xs font-black shadow-sm active:scale-95 transition-all">
          <span class="text-sm">📩</span>
          <span>Verificar Pago Móvil</span>
        </button>
      </div>
  `;
  const itemsTarget = '<div id="pos-register-items"';
  html = html.replace(itemsTarget, quickVendorBarHtml + '\n      ' + itemsTarget);
  console.log('✓ Inyectada barra de Venta Rápida y Verificador SMS');
}

// 6. INYECTAR MODALES DE VENTA RÁPIDA Y VERIFICADOR SMS
if (!html.includes('id="quick-amount-modal"')) {
  const quickModalsHtml = `
  <!-- ========================================================================= -->
  <!-- MODAL: VENTA RÁPIDA POR MONTO DIRECTO (AMBULANTES / COMIDA / ROPA)        -->
  <!-- ========================================================================= -->
  <div id="quick-amount-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-3">
    <div class="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-4 w-full max-w-sm flex flex-col space-y-3 shadow-2xl">
      <div class="flex items-center justify-between pb-2 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-base">⚡</div>
          <div>
            <h3 class="text-xs font-black text-white uppercase">Venta Rápida Directa</h3>
            <p class="text-[10px] text-slate-400">Ingresa el monto sin buscar código de barras</p>
          </div>
        </div>
        <button onclick="closeQuickAmountModal()" class="text-slate-400 hover:text-white font-bold text-lg p-1">&times;</button>
      </div>

      <div class="space-y-2">
        <label class="text-[10px] font-bold text-slate-400 uppercase block">Concepto o Rubro:</label>
        <div class="grid grid-cols-3 gap-1.5 text-xs font-bold">
          <button type="button" onclick="setQuickConcept('Comida Rápida')" class="py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-400 active:scale-95">🍔 Comida</button>
          <button type="button" onclick="setQuickConcept('Ropa & Moda')" class="py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-400 active:scale-95">👕 Ropa</button>
          <button type="button" onclick="setQuickConcept('Bebidas & Dulces')" class="py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-400 active:scale-95">🥤 Bebidas</button>
          <button type="button" onclick="setQuickConcept('Frutas & Verduras')" class="py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-400 active:scale-95">🍎 Frutas</button>
          <button type="button" onclick="setQuickConcept('Servicio Técnico')" class="py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 hover:border-amber-400 active:scale-95">🔧 Servicio</button>
          <button type="button" onclick="setQuickConcept('Venta General')" class="py-1.5 rounded-xl bg-amber-600 text-white border border-amber-500 shadow-xs active:scale-95">✨ Varios</button>
        </div>
        <input id="quick-concept-input" type="text" value="Venta General" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-400" />

        <div class="pt-1">
          <div class="flex justify-between items-center mb-1">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Monto a Cobrar:</span>
            <div class="flex gap-1 text-[10px] font-bold">
              <button type="button" id="btn-quick-curr-usd" onclick="setQuickCurrency('USD')" class="px-2 py-0.5 rounded-lg bg-emerald-600 text-white">USD ($)</button>
              <button type="button" id="btn-quick-curr-ves" onclick="setQuickCurrency('VES')" class="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400">Bs.</button>
            </div>
          </div>
          <div class="relative">
            <span id="quick-curr-symbol" class="absolute left-3 top-2.5 text-base font-black text-amber-400">$</span>
            <input id="quick-amount-input" type="number" step="0.01" placeholder="0.00" class="w-full bg-slate-950 border-2 border-amber-500/40 text-white text-xl font-black rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-amber-400 font-mono" />
          </div>
          <p id="quick-converted-preview" class="text-[11px] text-slate-400 font-mono mt-1 text-right">≈ Bs. 0.00</p>
        </div>
      </div>

      <div class="pt-2 flex gap-2">
        <button type="button" onclick="closeQuickAmountModal()" class="px-3 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800">Cancelar</button>
        <button type="button" onclick="applyQuickAmountSale()" class="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1 active:scale-95 transition-all">
          <span>⚡ Agregar al Ticket</span>
        </button>
      </div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: VALIDADOR DE SMS DE PAGO MÓVIL Y TRANSFERENCIAS                    -->
  <!-- ========================================================================= -->
  <div id="sms-validator-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-3">
    <div class="bg-slate-900 border-2 border-sky-500/50 rounded-3xl p-4 w-full max-w-sm flex flex-col space-y-3 shadow-2xl">
      <div class="flex items-center justify-between pb-2 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-base">📩</div>
          <div>
            <h3 class="text-xs font-black text-white uppercase">Validador Pago Móvil</h3>
            <p class="text-[10px] text-slate-400">Pega el SMS de tu banco para auditar el pago</p>
          </div>
        </div>
        <button onclick="closeSmsValidatorModal()" class="text-slate-400 hover:text-white font-bold text-lg p-1">&times;</button>
      </div>

      <div class="space-y-2">
        <textarea id="sms-raw-input" rows="3" placeholder="Pega aquí el mensaje de texto (SMS) recibido de tu banco (BDV, Banesco, Mercantil, Provincial, Bancamiga...)" class="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-sky-400 custom-scrollbar"></textarea>
        
        <button type="button" onclick="analyzeSmsText()" class="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95">
          🔍 Auditar y Extraer Datos del SMS
        </button>

        <div id="sms-analysis-result" class="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5 text-xs hidden">
          <div class="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold">
            <span>Banco Detectado:</span>
            <span id="sms-res-bank" class="text-sky-300 font-black">---</span>
          </div>
          <div class="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold">
            <span>Referencia:</span>
            <span id="sms-res-ref" class="text-amber-300 font-mono font-black">---</span>
          </div>
          <div class="flex justify-between items-baseline text-slate-300 font-bold border-t border-slate-800/80 pt-1">
            <span>Monto Recibido:</span>
            <span id="sms-res-amount" class="text-emerald-400 font-mono font-black text-sm">Bs. 0.00</span>
          </div>
        </div>
      </div>

      <div class="pt-2 flex gap-2">
        <button type="button" onclick="closeSmsValidatorModal()" class="px-3 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold text-xs hover:bg-slate-800">Cerrar</button>
        <button type="button" onclick="confirmSmsPaymentToSale()" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center justify-center gap-1 active:scale-95 transition-all">
          <span>✓ Aplicar al Cobro</span>
        </button>
      </div>
    </div>
  </div>
  `;

  html = html.replace('<!-- ========================================================================= -->\n  <!-- MODAL: DRAWER DE CARRITO DE VENTA', quickModalsHtml + '\n  <!-- ========================================================================= -->\n  <!-- MODAL: DRAWER DE CARRITO DE VENTA');

  // Inyectar funciones JS para Venta Rápida y SMS
  const quickJsLogic = `
    let quickSaleCurrency = 'USD';
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

      // Regex para detectar montos en Bs.
      const amountMatch = txt.match(/(?:Bs\.?|VES|Monto:?)\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2})?)/i) || txt.match(/([0-9]+[.,][0-9]{2})/);
      // Regex para referencia (4 a 8 dígitos)
      const refMatch = txt.match(/(?:ref(?:erencia)?|nro|operaci[oó]n|aprobaci[oó]n)[:.\s#]*([0-9]{4,10})/i) || txt.match(/\b([0-9]{6,8})\b/);
      
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
  `;

  html = html.replace('function openPaymentModal() {', quickJsLogic + '\n    function openPaymentModal() {');
  console.log('✓ Inyectada lógica y modales de Venta Rápida y Auditor SMS');
}

// 7. ASEGURAR TRUNCAMIENTO LIMPIO Y GUARDAR
html = html.replace(/venematic_theme/g, 'klikpos_theme');
html = html.replace(/Venematic/g, 'KlikPOS');
html = html.replace(/venematic/g, 'klikpos');

const htmlCloseIdx = html.indexOf('</html>');
if (htmlCloseIdx !== -1) {
  html = html.substring(0, htmlCloseIdx + 7);
}

fs.writeFileSync(outHtmlPath, html, 'utf8');
console.log('✓ Guardado out/index.html limpio con éxito (' + html.length + ' bytes)');

if (fs.existsSync(path.dirname(androidAssetPath))) {
  fs.writeFileSync(androidAssetPath, html, 'utf8');
  console.log('✓ Sincronizado a assets de Android (' + androidAssetPath + ')');
}

// 8. REBRANDING DE admin-mobile.html
if (fs.existsSync(adminHtmlPath)) {
  let adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');
  adminHtml = adminHtml.replace(/Venematic/g, 'KlikPOS');
  adminHtml = adminHtml.replace(/venematic/g, 'klikpos');
  fs.writeFileSync(adminHtmlPath, adminHtml, 'utf8');
  console.log('✓ Rebranding completado en public/admin-mobile.html');
}

console.log('=== ACTUALIZACIÓN MÓVIL FULL FINALIZADA CON ÉXITO ===');
