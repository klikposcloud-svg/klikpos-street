/**
 * GEMINI GEMS BACKUP & EXPORTER TOOL
 * Permite extraer y respaldar tus Gems de Google Gemini (Nombre, Descripción, Instrucciones / System Prompt).
 * 
 * MODO DE USO:
 * 1. Entra a https://gemini.google.com en Google Chrome con tu cuenta.
 * 2. Ve a tus Gems (https://gemini.google.com/gems o abre el Gem Manager).
 * 3. Presiona F12 (o Clic derecho -> Inspeccionar) y ve a la pestaña "Consola" (Console).
 * 4. Pega todo este código y presiona ENTER.
 * 5. Aparecerá un panel flotante en la esquina inferior derecha para exportar en 1 clic.
 */

(function () {
  if (window.__GEMS_EXPORTER_LOADED__) {
    alert('El exportador ya está activo en pantalla.');
    return;
  }
  window.__GEMS_EXPORTER_LOADED__ = true;

  const exportedGems = [];

  // Crear widget flotante
  const panel = document.createElement('div');
  panel.id = 'gems-exporter-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 360px;
    background: #1e1e2f;
    color: #ffffff;
    border: 2px solid #6366f1;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.6);
    z-index: 999999999;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    line-height: 1.5;
  `;

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h3 style="margin: 0; font-size: 15px; font-weight: 800; color: #818cf8; display: flex; align-items: center; gap: 6px;">
        💎 Respaldo de Gems
      </h3>
      <button id="close-exporter-btn" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;">✕</button>
    </div>
    
    <p style="margin: 0 0 14px 0; color: #cbd5e1; font-size: 12px;">
      Abre un Gem en modo edición o haz clic en el botón para capturar automáticamente sus datos.
    </p>

    <div style="background: #0f172a; padding: 12px; border-radius: 8px; margin-bottom: 14px; border: 1px solid #334155;">
      <div style="font-weight: bold; color: #38bdf8; margin-bottom: 4px;">Gems Respaldadas: <span id="gems-count" style="color: #4ade80;">0</span></div>
      <div id="gems-list" style="max-height: 120px; overflow-y: auto; color: #94a3b8; font-size: 11px;">
        <em>Ningún Gem capturado aún.</em>
      </div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button id="capture-current-btn" style="background: #6366f1; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
        ⚡ Capturar Gem Abierto
      </button>
      
      <button id="download-backup-btn" style="background: #10b981; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
        💾 Descargar Respaldo (.JSON y .MD)
      </button>
    </div>
  `;

  document.body.appendChild(panel);

  const countEl = document.getElementById('gems-count');
  const listEl = document.getElementById('gems-list');

  // Función para capturar el Gem actualmente en pantalla
  function captureCurrentGem() {
    let name = '';
    let instructions = '';
    let description = '';

    // Buscar campos comunes en la interfaz de Gemini
    const inputs = Array.from(document.querySelectorAll('input, textarea, div[contenteditable="true"]'));

    // Intentar buscar por aria-label o placeholder
    for (const el of inputs) {
      const label = (el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').toLowerCase();
      const val = el.value || el.innerText || '';

      if (label.includes('nombre') || label.includes('name')) {
        if (!name && val.trim()) name = val.trim();
      } else if (label.includes('instrucc') || label.includes('instruct') || label.includes('prompt')) {
        if (!instructions && val.trim()) instructions = val.trim();
      } else if (label.includes('descrip')) {
        if (!description && val.trim()) description = val.trim();
      }
    }

    // Si no encontró por etiqueta, buscar por longitud y tipo
    if (!instructions) {
      const textareas = document.querySelectorAll('textarea');
      for (const t of textareas) {
        if (t.value && t.value.length > 20) {
          instructions = t.value;
          break;
        }
      }
    }

    if (!name) {
      const h1 = document.querySelector('h1, h2, [role="heading"]');
      if (h1) name = h1.innerText.trim();
    }

    // Si aún no encuentra, pedir al usuario confirmación rápida
    if (!name || !instructions) {
      name = prompt('Nombre del Gem:', name || 'Mi Gem') || '';
      instructions = prompt('Pega aquí las instrucciones del Gem:', instructions || '') || '';
    }

    if (!name && !instructions) {
      alert('⚠️ No se pudo detectar ningún contenido. Abre el Gem en el editor de Gemini.');
      return;
    }

    const gemData = {
      id: 'gem_' + Date.now(),
      name: name || 'Gem Sin Nombre',
      description: description || 'Sin descripción',
      instructions: instructions || 'Sin instrucciones',
      capturedAt: new Date().toISOString()
    };

    exportedGems.push(gemData);
    countEl.innerText = exportedGems.length;
    
    listEl.innerHTML = exportedGems.map((g, i) => `
      <div style="padding: 4px 0; border-bottom: 1px solid #1e293b;">
        <strong>${i + 1}. ${g.name}</strong> (${g.instructions.length} caracteres)
      </div>
    `).join('');

    alert(`✅ Gem "${gemData.name}" capturado exitosamente.`);
  }

  // Descargar archivo de respaldo
  function downloadBackup() {
    if (exportedGems.length === 0) {
      alert('⚠️ Primero debes capturar al menos 1 Gem.');
      return;
    }

    // 1. Descargar JSON Completo
    const jsonStr = JSON.stringify(exportedGems, null, 2);
    const jsonBlob = new Blob([jsonStr], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const aJson = document.createElement('a');
    aJson.href = jsonUrl;
    aJson.download = `gemini_gems_backup_${new Date().toISOString().split('T')[0]}.json`;
    aJson.click();

    // 2. Descargar cada Gem como archivo Markdown para Antigravity/Skills
    exportedGems.forEach((gem) => {
      const mdContent = `---
name: ${gem.name}
description: ${gem.description}
captured_at: ${gem.capturedAt}
---

# ${gem.name}

## Descripción
${gem.description}

## Instrucciones del Sistema (System Prompt)
\`\`\`markdown
${gem.instructions}
\`\`\`
`;
      const mdBlob = new Blob([mdContent], { type: 'text/markdown' });
      const mdUrl = URL.createObjectURL(mdBlob);
      const aMd = document.createElement('a');
      aMd.href = mdUrl;
      const cleanName = gem.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      aMd.download = `GEM_${cleanName}.md`;
      setTimeout(() => aMd.click(), 300);
    });

    alert(`🎉 ¡Respaldo completado!\nSe descargaron el JSON maestro y los archivos Markdown individuales.`);
  }

  // Listeners
  document.getElementById('capture-current-btn').onclick = captureCurrentGem;
  document.getElementById('download-backup-btn').onclick = downloadBackup;
  document.getElementById('close-exporter-btn').onclick = () => {
    panel.remove();
    window.__GEMS_EXPORTER_LOADED__ = false;
  };

  console.log('✅ Gemini Gems Backup Tool cargado exitosamente.');
})();
