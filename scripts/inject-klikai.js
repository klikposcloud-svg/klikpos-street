const fs = require('fs');
const path = require('path');

function updateAdminHtml() {
  const filePath = path.resolve('public/admin-mobile.html');
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Agregar el botón de la pestaña KlikAI en la barra de navegación
  if (!content.includes('id="tab-btn-ai"')) {
    const oldTabBar = `<button onclick="switchAdminSection('sms')" id="tab-btn-sms"`;
    const newTabBar = `<button onclick="switchAdminSection('ai')" id="tab-btn-ai" class="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-1.5 transition-all">
      <span>🤖</span> <span>KlikAI & Visión</span>
      <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
    </button>
    <button onclick="switchAdminSection('sms')" id="tab-btn-sms"`;
    content = content.replace(oldTabBar, newTabBar);
  }

  // 2. Agregar la sección HTML de #section-ai antes de </main>
  if (!content.includes('id="section-ai"')) {
    const sectionAiHtml = `
    <!-- --------------------------------------------------------------------- -->
    <!-- SECCIÓN 6: KLIKAI & VISIÓN DE FACTURAS                                -->
    <!-- --------------------------------------------------------------------- -->
    <div id="section-ai" class="space-y-3.5 hidden">
      <!-- Selector de Modo: Chat Ejecutivo / Visión Facturas -->
      <div class="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-1.5 shadow-inner">
        <button id="ai-tab-chat" onclick="switchAiTab('chat')" class="flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md flex items-center justify-center gap-1.5">
          <span>💬</span> <span>Asistente Ejecutivo</span>
        </button>
        <button id="ai-tab-vision" onclick="switchAiTab('vision')" class="flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center gap-1.5">
          <span>📸</span> <span>Visión Facturas</span>
        </button>
      </div>

      <!-- VISTA 1: CHAT EJECUTIVO KLIKAI -->
      <div id="ai-view-chat" class="space-y-3">
        <!-- Tarjeta de Presentación Asistente -->
        <div class="bg-gradient-to-r from-[#07132c] via-[#0d214a] to-[#07132c] p-3.5 rounded-2xl border border-indigo-500/30 shadow-lg flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-xl shadow-inner">
              🤖
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h3 class="text-xs font-black text-white uppercase tracking-wider">KlikAI Business Assistant</h3>
                <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">En Línea</span>
              </div>
              <p class="text-[10px] text-slate-300">Asistente inteligente para análisis de ventas y stock</p>
            </div>
          </div>
        </div>

        <!-- Preguntas Rápidas de un Toque -->
        <div>
          <span class="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block mb-1.5">Consultas Frecuentes:</span>
          <div class="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            <button onclick="askQuickAiQuestion('¿Cuánto se ha vendido hoy en total y en cada método de pago?')" class="whitespace-nowrap px-3 py-1.5 bg-slate-900 hover:bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-[11px] font-bold rounded-xl transition-all active:scale-95">
              📊 Ventas de Hoy
            </button>
            <button onclick="askQuickAiQuestion('¿Cuáles productos tienen stock crítico o están por agotarse?')" class="whitespace-nowrap px-3 py-1.5 bg-slate-900 hover:bg-rose-950/60 border border-rose-500/30 text-rose-200 text-[11px] font-bold rounded-xl transition-all active:scale-95">
              ⚠️ Stock Crítico
            </button>
            <button onclick="askQuickAiQuestion('¿Cuáles son los 5 productos más vendidos del negocio?')" class="whitespace-nowrap px-3 py-1.5 bg-slate-900 hover:bg-amber-950/60 border border-amber-500/30 text-amber-200 text-[11px] font-bold rounded-xl transition-all active:scale-95">
              🏆 Top Productos
            </button>
            <button onclick="askQuickAiQuestion('¿Cuál es la recomendación de compras para reponer inventario?')" class="whitespace-nowrap px-3 py-1.5 bg-slate-900 hover:bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-[11px] font-bold rounded-xl transition-all active:scale-95">
              💡 Sugerencia Compras
            </button>
          </div>
        </div>

        <!-- Feed de Conversación -->
        <div id="ai-chat-messages" class="bg-slate-950 border border-slate-800 rounded-2xl p-3 h-[280px] overflow-y-auto space-y-3 custom-scrollbar">
          <div class="flex items-start gap-2 max-w-[90%]">
            <div class="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-xs text-white shrink-0 mt-0.5">🤖</div>
            <div class="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl rounded-tl-sm text-xs text-slate-200 shadow-sm leading-relaxed">
              👋 ¡Hola! Soy <strong>KlikAI</strong>. Pregúntame sobre tus ventas, métodos de pago, productos con stock bajo o consejos de reposición.
            </div>
          </div>
        </div>

        <!-- Barra de Entrada de Chat -->
        <div class="flex gap-2">
          <input id="ai-chat-input" type="text" placeholder="Pregunta lo que desees a la IA..." class="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 shadow-inner" onkeydown="if(event.key==='Enter') sendAiChatMessage()" />
          <button onclick="sendAiChatMessage()" id="btn-send-ai-msg" class="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0">
            <span class="text-xs">Preguntar</span>
            <span class="text-xs">🚀</span>
          </button>
        </div>
      </div>

      <!-- VISTA 2: VISIÓN FACTURAS Y NOTAS DE ENTREGA -->
      <div id="ai-view-vision" class="space-y-3 hidden">
        <div class="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl space-y-2">
          <div class="flex items-center gap-2">
            <span class="text-xl">📸</span>
            <div>
              <h4 class="text-xs font-black text-white uppercase">Digitalización de Facturas con Visión IA</h4>
              <p class="text-[10px] text-slate-400">Toma una foto a la factura física de tu proveedor para extraer todos los productos automáticamente.</p>
            </div>
          </div>

          <input type="file" id="invoice-file-input" accept="image/*" capture="environment" class="hidden" onchange="handleInvoiceImageSelected(event)" />

          <div class="pt-1 flex gap-2">
            <button onclick="document.getElementById('invoice-file-input').click()" class="flex-1 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
              <span>📷</span> <span>Tomar Foto / Seleccionar Factura</span>
            </button>
          </div>
        </div>

        <div id="invoice-preview-card" class="bg-slate-950 border border-slate-800 rounded-2xl p-3 hidden space-y-3">
          <div class="relative max-h-48 rounded-xl overflow-hidden border border-slate-800 flex justify-center bg-black">
            <img id="invoice-preview-img" src="" alt="Factura" class="max-h-48 object-contain" />
            <div id="invoice-scanning-loader" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 hidden">
              <div class="w-7 h-7 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              <span class="text-xs font-bold text-indigo-300 animate-pulse">Escaneando renglones con Gemini Vision...</span>
            </div>
          </div>

          <div class="flex gap-2">
            <button onclick="processInvoiceWithVision()" id="btn-process-invoice" class="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5">
              <span>⚡</span> <span>Extraer Renglones con IA</span>
            </button>
            <button onclick="clearInvoiceSelection()" class="px-3 py-2.5 border border-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all">
              Descartar
            </button>
          </div>
        </div>

        <div id="invoice-results-card" class="bg-slate-900 border border-slate-800 rounded-2xl p-3 hidden space-y-3">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <h4 class="text-xs font-black text-white uppercase">Renglones Detectados</h4>
            </div>
            <span id="invoice-items-count" class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">0 renglones</span>
          </div>

          <div id="invoice-items-list" class="space-y-2 max-h-[260px] overflow-y-auto custom-scrollbar">
          </div>

          <button onclick="saveInvoiceItemsToInventory()" id="btn-save-invoice-items" class="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all">
            <span>✅</span> <span>Guardar e Incorporar al Inventario</span>
          </button>
        </div>
      </div>
    </div>
`;
    content = content.replace('  </main>', sectionAiHtml + '\n  </main>');
  }

  // 3. Limpiar modal para ocultar los campos técnicos de Firestore
  const oldFirestoreRegex = /<!-- Configuración de Google Cloud Firestore -->[\s\S]*?<\/div>\s*<div class="flex gap-2 pt-2 border-t border-slate-800">/i;
  if (oldFirestoreRegex.test(content)) {
    const newModalConfig = `<!-- Configuración Opcional de Gemini AI Key -->
      <div class="pt-2 border-t border-slate-800 space-y-2">
        <label class="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-1">
          <span>🤖</span> <span>3. Clave de Inteligencia Artificial (Opcional):</span>
        </label>
        <input id="gemini-api-key-input" type="password" placeholder="AIzaSy... (Dejar vacío para usar clave del sistema)" class="w-full bg-slate-950 border border-slate-700 text-indigo-300 rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500" />
        <p class="text-[9px] text-slate-400">Permite activar las funciones avanzadas de KlikAI y escaneo de facturas con visión artificial.</p>
      </div>

      <div class="flex gap-2 pt-2 border-t border-slate-800">`;
    content = content.replace(oldFirestoreRegex, newModalConfig);
  }

  // 4. Actualizar switchAdminSection
  content = content.replace(
    `['resumen', 'ventas', 'arqueo', 'stock', 'sms'].forEach(s => {`,
    `['resumen', 'ventas', 'arqueo', 'stock', 'sms', 'ai'].forEach(s => {`
  );

  // 5. Agregar funciones JS si no existen
  if (!content.includes('function switchAiTab')) {
    const klikAiJs = `
    // =========================================================================
    // LÓGICA KLIKAI: ASISTENTE EJECUTIVO Y VISIÓN DE FACTURAS
    // =========================================================================
    let currentInvoiceBase64 = '';
    let detectedInvoiceItems = [];

    function switchAiTab(tab) {
      const chatView = document.getElementById('ai-view-chat');
      const visionView = document.getElementById('ai-view-vision');
      const chatTab = document.getElementById('ai-tab-chat');
      const visionTab = document.getElementById('ai-tab-vision');

      if (tab === 'chat') {
        if (chatView) chatView.classList.remove('hidden');
        if (visionView) visionView.classList.add('hidden');
        if (chatTab) chatTab.className = "flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md flex items-center justify-center gap-1.5";
        if (visionTab) visionTab.className = "flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center gap-1.5";
      } else {
        if (chatView) chatView.classList.add('hidden');
        if (visionView) visionView.classList.remove('hidden');
        if (visionTab) visionTab.className = "flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md flex items-center justify-center gap-1.5";
        if (chatTab) chatTab.className = "flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center gap-1.5";
      }
    }

    function askQuickAiQuestion(question) {
      const input = document.getElementById('ai-chat-input');
      if (input) {
        input.value = question;
        sendAiChatMessage();
      }
    }

    function appendChatMessage(sender, text, isAi = false) {
      const container = document.getElementById('ai-chat-messages');
      if (!container) return;

      const msgDiv = document.createElement('div');
      msgDiv.className = isAi ? "flex items-start gap-2 max-w-[90%]" : "flex items-start gap-2 max-w-[90%] ml-auto justify-end";

      if (isAi) {
        msgDiv.innerHTML = \`
          <div class="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-xs text-white shrink-0 mt-0.5">🤖</div>
          <div class="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl rounded-tl-sm text-xs text-slate-200 shadow-sm leading-relaxed whitespace-pre-wrap">\${text}</div>
        \`;
      } else {
        msgDiv.innerHTML = \`
          <div class="bg-indigo-600 text-white p-2.5 rounded-2xl rounded-tr-sm text-xs shadow-sm leading-relaxed whitespace-pre-wrap">\${text}</div>
          <div class="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-300 shrink-0 mt-0.5">👤</div>
        \`;
      }

      container.appendChild(msgDiv);
      container.scrollTop = container.scrollHeight;
    }

    async function sendAiChatMessage() {
      const input = document.getElementById('ai-chat-input');
      if (!input) return;
      const message = input.value.trim();
      if (!message) return;

      appendChatMessage('user', message, false);
      input.value = '';

      const sendBtn = document.getElementById('btn-send-ai-msg');
      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span>⏳</span>';
      }

      // Preparar contexto del negocio en vivo
      const totals = calculateTotals();
      const lowStock = catalog.filter(p => Number(p.stock || 0) <= Number(p.minStock || 5)).length;
      
      const context = {
        todaySales: totals.totalUSD,
        todaySalesVES: totals.totalUSD * bcvRate,
        todayOrders: allSales.length,
        bcvRate: bcvRate,
        lowStockCount: lowStock,
        paymentMethods: totals.paymentMethods || {},
        topProducts: catalog.slice(0, 5).map(p => ({ name: p.name, price: p.priceUSD, stock: p.stock }))
      };

      const customApiKey = localStorage.getItem('klikpos_gemini_api_key') || '';

      try {
        const endpoint = (serverUrl ? serverUrl : '') + '/api/ai/assistant';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, context, apiKey: customApiKey })
        });

        if (!res.ok) throw new Error('Error al contactar con KlikAI');
        const data = await res.json();
        appendChatMessage('ai', data.reply || 'Sin respuesta', true);
      } catch (err) {
        // Fallback estadístico local
        const lower = message.toLowerCase();
        let fallback = '';
        if (lower.includes('venta') || lower.includes('hoy') || lower.includes('caja')) {
          fallback = \`📊 **Resumen Local de Hoy:**\\n• **Total:** $\${totals.totalUSD.toFixed(2)} USD (~Bs. \${(totals.totalUSD * bcvRate).toFixed(2)})\\n• **Tickets:** \${allSales.length}\\n• **Tasa BCV:** Bs. \${bcvRate.toFixed(2)}\`;
        } else if (lower.includes('stock') || lower.includes('agotado') || lower.includes('inventario')) {
          fallback = \`📦 **Inventario Local:**\\nHay **\${lowStock} producto(s)** en nivel crítico o stock bajo.\`;
        } else {
          fallback = \`🤖 Hoy llevas **$\${totals.totalUSD.toFixed(2)} USD** en **\${allSales.length} ventas**. Puedes consultar inventario, arqueo o métodos de pago.\`;
        }
        appendChatMessage('ai', fallback, true);
      } finally {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.innerHTML = '<span class="text-xs">Preguntar</span><span class="text-xs">🚀</span>';
        }
      }
    }

    function handleInvoiceImageSelected(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(evt) {
        currentInvoiceBase64 = evt.target.result;
        const previewCard = document.getElementById('invoice-preview-card');
        const previewImg = document.getElementById('invoice-preview-img');
        const resultsCard = document.getElementById('invoice-results-card');

        if (previewImg) previewImg.src = currentInvoiceBase64;
        if (previewCard) previewCard.classList.remove('hidden');
        if (resultsCard) resultsCard.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    }

    function clearInvoiceSelection() {
      currentInvoiceBase64 = '';
      detectedInvoiceItems = [];
      const previewCard = document.getElementById('invoice-preview-card');
      const resultsCard = document.getElementById('invoice-results-card');
      const fileInput = document.getElementById('invoice-file-input');
      if (previewCard) previewCard.classList.add('hidden');
      if (resultsCard) resultsCard.classList.add('hidden');
      if (fileInput) fileInput.value = '';
    }

    async function processInvoiceWithVision() {
      if (!currentInvoiceBase64) {
        showToast('Selecciona primero una imagen de la factura', false);
        return;
      }

      const loader = document.getElementById('invoice-scanning-loader');
      const procBtn = document.getElementById('btn-process-invoice');
      if (loader) loader.classList.remove('hidden');
      if (procBtn) procBtn.disabled = true;

      const customApiKey = localStorage.getItem('klikpos_gemini_api_key') || '';

      try {
        const endpoint = (serverUrl ? serverUrl : '') + '/api/vision/scan-invoice';
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: currentInvoiceBase64,
            apiKey: customApiKey,
            bcvRate: bcvRate
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Error al procesar la factura con IA');
        }

        const json = await res.json();
        detectedInvoiceItems = (json.data && json.data.items) || [];

        renderDetectedInvoiceItems();
        showToast(\`✅ \${detectedInvoiceItems.length} renglones detectados\`, true);
      } catch (err) {
        alert('Error con Visión IA: ' + err.message);
      } finally {
        if (loader) loader.classList.add('hidden');
        if (procBtn) procBtn.disabled = false;
      }
    }

    function renderDetectedInvoiceItems() {
      const resultsCard = document.getElementById('invoice-results-card');
      const list = document.getElementById('invoice-items-list');
      const countEl = document.getElementById('invoice-items-count');

      if (!resultsCard || !list) return;

      list.innerHTML = '';
      if (countEl) countEl.innerText = \`\${detectedInvoiceItems.length} renglones\`;

      if (detectedInvoiceItems.length === 0) {
        list.innerHTML = '<div class="py-4 text-center text-slate-500 text-xs">No se detectaron renglones legibles en la imagen.</div>';
      } else {
        detectedInvoiceItems.forEach((item, idx) => {
          const row = document.createElement('div');
          row.className = "bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-2";
          row.innerHTML = \`
            <div class="min-w-0 flex-1">
              <div class="font-bold text-xs text-white truncate">\${item.name || 'Producto sin nombre'}</div>
              <div class="text-[10px] text-slate-400">\${item.category || 'General'} • Cantidad: <span class="text-amber-400 font-bold">\${item.quantity || 1}</span></div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-xs font-bold text-emerald-400 font-mono">$\${Number(item.costUSD || 0).toFixed(2)}</div>
              <div class="text-[10px] text-slate-400 font-mono">Bs. \${Number(item.costVES || (item.costUSD * bcvRate) || 0).toFixed(2)}</div>
            </div>
          \`;
          list.appendChild(row);
        });
      }

      resultsCard.classList.remove('hidden');
    }

    async function saveInvoiceItemsToInventory() {
      if (detectedInvoiceItems.length === 0) return;

      const saveBtn = document.getElementById('btn-save-invoice-items');
      if (saveBtn) saveBtn.disabled = true;

      let addedCount = 0;
      detectedInvoiceItems.forEach(item => {
        const existing = catalog.find(p => p.name.toLowerCase() === (item.name || '').toLowerCase());
        if (existing) {
          existing.stock = Number(existing.stock || 0) + Number(item.quantity || 1);
          existing.costUSD = Number(item.costUSD || existing.costUSD);
        } else {
          catalog.push({
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            name: item.name || 'Nuevo Producto',
            category: item.category || 'General',
            priceUSD: Number(item.suggestedPriceUSD || (item.costUSD * 1.3) || 1.0),
            costUSD: Number(item.costUSD || 0.8),
            stock: Number(item.quantity || 1),
            minStock: 5,
            barcode: item.barcode || ''
          });
        }
        addedCount++;
      });

      localStorage.setItem('klikpos_catalog_cache', JSON.stringify(catalog));
      renderCatalogTable();
      showToast(\`🎉 \${addedCount} productos incorporados al inventario\`, true);
      clearInvoiceSelection();
      if (saveBtn) saveBtn.disabled = false;
    }
`;
    content = content.replace('  </script>', klikAiJs + '\n  </script>');
  }

  fs.writeFileSync('public/admin-mobile.html', content, 'utf8');
  fs.writeFileSync('venematic-desktop/public/admin-mobile.html', content, 'utf8');
  console.log('[✓] Archivos admin-mobile.html actualizados con éxito.');
}

updateAdminHtml();
