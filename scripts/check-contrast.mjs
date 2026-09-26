#!/usr/bin/env node
/**
 * Verificación de contraste WCAG 2.1 AA para los tokens de color de Venematic POS.
 * Ejecutar: node scripts/check-contrast.mjs  (o: npm run test:contrast)
 * Falla (exit 1) si algún par de texto/fondo relevante queda bajo 4.5:1
 * (o bajo 3:1 para texto grande / indicadores gráficos, según corresponda).
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function srgb(c) {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const h = hex.replace('#', '').trim();
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Color inválido: ${hex}`);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = '#ffffff';
const failures = [];
const passes = [];

function check(label, fg, bg, min = 4.5) {
  const ratio = contrast(fg, bg);
  const ok = ratio >= min;
  const line = `${ok ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2)}:1 (min ${min}) — ${label} [${fg} sobre ${bg}]`;
  (ok ? passes : failures).push(line);
}

/* 1. Tokens semánticos pos.* de tailwind.config.js (ambas apps) */
for (const rel of ['tailwind.config.js', 'venematic-desktop/tailwind.config.js']) {
  const cfg = require(join(root, rel));
  const pos = cfg?.theme?.extend?.colors?.pos;
  if (!pos) {
    failures.push(`FAIL  tokens pos.* ausentes en ${rel}`);
    continue;
  }
  const scope = rel.startsWith('venematic-desktop') ? 'desktop' : 'root';
  check(`[${scope}] texto principal / superficie`, pos.text, pos.surface);
  check(`[${scope}] texto principal / fondo sutil`, pos.text, pos.subtle);
  check(`[${scope}] texto secundario / superficie`, pos['text-muted'], pos.surface);
  check(`[${scope}] texto secundario / fondo sutil`, pos['text-muted'], pos.subtle);
  check(`[${scope}] blanco / marca`, WHITE, pos.brand);
  check(`[${scope}] blanco / marca hover`, WHITE, pos['brand-hover']);
  check(`[${scope}] blanco / éxito`, WHITE, pos.success);
  check(`[${scope}] blanco / éxito hover`, WHITE, pos['success-hover']);
  check(`[${scope}] blanco / peligro`, WHITE, pos.danger);
  check(`[${scope}] blanco / peligro hover`, WHITE, pos['danger-hover']);
  check(`[${scope}] blanco / advertencia`, WHITE, pos.warning);
}

/* 2. Paletas de marca de src/lib/theme.ts (primary y hover con texto blanco) */
const themeSrc = readFileSync(join(root, 'src/lib/theme.ts'), 'utf8');
const paletteRe = /id:\s*'(\w+)'[\s\S]*?primary:\s*'(#[0-9a-fA-F]{6})'[\s\S]*?primaryHover:\s*'(#[0-9a-fA-F]{6})'/g;
let m;
let paletteCount = 0;
while ((m = paletteRe.exec(themeSrc)) !== null) {
  paletteCount += 1;
  const [, name, primary, hover] = m;
  check(`[paleta ${name}] blanco / primary`, WHITE, primary);
  check(`[paleta ${name}] blanco / primaryHover`, WHITE, hover);
}
if (paletteCount === 0) {
  failures.push('FAIL  no se encontraron paletas en src/lib/theme.ts');
}

/* 3. Pares semánticos fijos de la interfaz (botones de cobro/anulación) */
check('botón finalizar venta', WHITE, '#15803d');
check('botón cancelar/anular', WHITE, '#dc2626');
check('readout oscuro de totales', '#ffffff', '#0f172a', 7); // texto grande AAA
check('acento de marca sobre readout oscuro', '#7dd3fc', '#0f172a', 4.5);

for (const line of passes) console.log(line);
for (const line of failures) console.error(line);

console.log(`\n${passes.length} pares correctos, ${failures.length} con fallos.`);
if (failures.length > 0) {
  console.error('ERROR: contraste WCAG AA no cumplido.');
  process.exit(1);
}
console.log('OK: todos los pares cumplen WCAG 2.1 AA.');
