#!/usr/bin/env node
/**
 * seed-master-catalog.js
 * Script CLI automatizado para poblar el Catálogo Maestro (+130 productos)
 * directamente en Firebase Firestore (Proyecto: klikpos-cloud)
 * 
 * Uso:
 *   node scripts/seed-master-catalog.js               # Carga todos los 132 productos
 *   node scripts/seed-master-catalog.js --rubro=farmacia # Carga solo farmacia
 *   node scripts/seed-master-catalog.js --dry-run     # Simula sin escribir
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PROJECT_ID = 'klikpos-cloud';
const CATALOG_PATH = path.join(__dirname, '..', 'src', 'lib', 'data', 'master-catalog.json');

// Cargar catálogo JSON
if (!fs.existsSync(CATALOG_PATH)) {
  console.error('❌ Error: No se encontró el archivo master-catalog.json en:', CATALOG_PATH);
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

// Parsear argumentos CLI
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const rubroArg = args.find((a) => a.startsWith('--rubro='));
const targetRubro = rubroArg ? rubroArg.split('=')[1].toLowerCase() : null;

const filteredProducts = targetRubro
  ? products.filter((p) => p.rubroId.toLowerCase() === targetRubro)
  : products;

console.log('====================================================');
console.log('🚀 KLIKPOS CLOUD - INYECTOR DE CATÁLOGO MAESTRO');
console.log(`📦 Proyecto Firebase: ${PROJECT_ID}`);
console.log(`📊 Productos a procesar: ${filteredProducts.length} de ${products.length}`);
if (targetRubro) console.log(`🏷️  Filtro de Rubro: ${targetRubro}`);
if (isDryRun) console.log('⚠️  MODO SIMULACIÓN (Dry Run) - No se escribirán datos');
console.log('====================================================\n');

/**
 * Convierte un objeto de JavaScript a la estructura de Firestore REST API
 */
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: value.toString() };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((v) => ({ stringValue: String(v) })),
        },
      };
    }
  }
  return fields;
}

/**
 * Escribe un documento en Firestore vía REST API
 */
function writeFirestoreDoc(collection, docId, data) {
  return new Promise((resolve, reject) => {
    const firestoreData = JSON.stringify({
      fields: toFirestoreFields({
        ...data,
        updatedAt: new Date().toISOString(),
        cloudSynced: true,
      }),
    });

    const options = {
      hostname: 'firestore.googleapis.com',
      port: 443,
      path: `/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${encodeURIComponent(docId)}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(firestoreData),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(firestoreData);
    req.end();
  });
}

// Bucle secuencial de inyección
async function main() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < filteredProducts.length; i++) {
    const prod = filteredProducts[i];
    const prefix = `[${i + 1}/${filteredProducts.length}]`;

    if (isDryRun) {
      console.log(`${prefix} [DRY-RUN] ${prod.barcode} - ${prod.name} ($${prod.priceUSD.toFixed(2)})`);
      successCount++;
      continue;
    }

    try {
      // Escribir en la colección "products" con el ID del código de barras
      await writeFirestoreDoc('products', prod.barcode, prod);
      console.log(`✅ ${prefix} ${prod.barcode} | ${prod.name.padEnd(45).substring(0, 45)} | $${prod.priceUSD.toFixed(2)} [${prod.category}]`);
      successCount++;
      // Pequeña pausa para evitar rate-limits
      await new Promise((r) => setTimeout(r, 60));
    } catch (err) {
      console.error(`❌ ${prefix} Error al subir ${prod.name} (${prod.barcode}):`, err.message);
      errorCount++;
    }
  }

  console.log('\n====================================================');
  console.log(`✨ Proceso completado.`);
  console.log(`   Exitosos: ${successCount}`);
  console.log(`   Errores:   ${errorCount}`);
  console.log(`   Nube:      https://console.firebase.google.com/u/3/project/${PROJECT_ID}/firestore/databases/-default-/data`);
  console.log('====================================================');
}

main();
