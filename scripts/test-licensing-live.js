const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function testLicensing() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  console.log('1. Abriendo /tablet-pos directamente...');
  await page.goto('http://localhost:3000/tablet-pos', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await new Promise(r => setTimeout(r, 4000));

  // Abrir el Docker con click real
  console.log('Haciendo click en botón Docker...');
  await page.click('button[data-tab="docker"]');
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot con Docker abierto (verificar ícono de Ventas)
  const shotDocker = 'C:\\Users\\pcpro\\.gemini\\antigravity-ide\\brain\\8a831fb4-2143-4be1-99c4-afe4be2b6d80\\live_docker_with_sales.png';
  await page.screenshot({ path: shotDocker });
  console.log('Screenshot Docker guardado:', shotDocker);

  // Tocar el botón de Ventas en el Docker
  console.log('Haciendo click en botón Ventas & Respaldo en Docker...');
  await page.click('button[title*="Ventas"]');
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot con Módulo de Ventas & Respaldo abierto
  const shotSalesModal = 'C:\\Users\\pcpro\\.gemini\\antigravity-ide\\brain\\8a831fb4-2143-4be1-99c4-afe4be2b6d80\\live_sales_backup_modal.png';
  await page.screenshot({ path: shotSalesModal });
  console.log('Screenshot Módulo Ventas & Respaldo guardado:', shotSalesModal);

  // Cerrar modal de ventas
  console.log('Cerrando modal de ventas...');
  await page.click('button[title="Cerrar ventana"]');
  await new Promise(r => setTimeout(r, 800));

  // Abrir modal de licencia desde el menú lateral (burger menu ☰)
  console.log('Abriendo menú lateral para ver Licencia...');
  await page.click('button:has(svg.lucide-menu), header button:first-child');
  await new Promise(r => setTimeout(r, 1000));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const lic = btns.find(b => b.textContent && (b.textContent.includes('Licencia') || b.textContent.includes('Embajador')));
    if (lic) lic.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const shotLicModal = 'C:\\Users\\pcpro\\.gemini\\antigravity-ide\\brain\\8a831fb4-2143-4be1-99c4-afe4be2b6d80\\live_license_modal_contrast.png';
  await page.screenshot({ path: shotLicModal });
  console.log('Screenshot Modal Licencia guardado:', shotLicModal);

  await browser.close();
  console.log('--- AUDITORÍA EN VIVO FINALIZADA CON ÉXITO ---');
}

testLicensing().catch(err => {
  console.error('Error en prueba en vivo:', err);
  process.exit(1);
});
