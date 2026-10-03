const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

(async () => {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1024,768']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 768 });

  // 1. Simular caso crítico: el usuario tenía previamente 'light' en localStorage
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('venematic_theme', 'light');
    localStorage.setItem('venematic_ui_style', 'industrial');
  });

  console.log('Navigating to http://localhost:3000/tablet-pos with pre-existing light theme in localStorage...');
  await page.goto('http://localhost:3000/tablet-pos', { waitUntil: 'networkidle2', timeout: 25000 });
  await new Promise(r => setTimeout(r, 1200));

  const outDir = path.join(__dirname, '..', 'scratch');
  const screenshotPath = path.join(outDir, 'live_audit_with_forced_light_storage.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);

  // 2. Verificar estilos computados del fondo detrás de las cards
  const bgStyles = await page.evaluate(() => {
    const root = document.getElementById('klikpos-street-root');
    const main = document.querySelector('main');
    const catalog = document.querySelector('.catalog-scroll-area');
    const updater = document.querySelector('aside[aria-label="Aviso de actualización disponible"]');
    return {
      rootBg: root ? window.getComputedStyle(root).backgroundColor : null,
      mainBg: main ? window.getComputedStyle(main).backgroundColor : null,
      catalogBg: catalog ? window.getComputedStyle(catalog).backgroundColor : null,
      htmlTheme: document.documentElement.getAttribute('data-theme'),
      htmlDarkClass: document.documentElement.classList.contains('dark'),
      hasUpdaterModal: !!updater
    };
  });

  console.log('Audit Results:', JSON.stringify(bgStyles, null, 2));

  await browser.close();
})();
