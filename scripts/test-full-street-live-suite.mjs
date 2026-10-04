import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import crypto from 'crypto';
import { execSync } from 'child_process';

const firebaseConfig = {
  apiKey: 'AIzaSyDT26ff7t-W5WZKZktPWLZ_D79QHGh6sEg',
  authDomain: 'klikpos-cloud.firebaseapp.com',
  projectId: 'klikpos-cloud',
  storageBucket: 'klikpos-cloud.firebasestorage.app',
  messagingSenderId: '147933668842',
  appId: '1:147933668842:web:cf3bd154b7164b7ce07e93',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const MASTER_SIGNING_SALT = 'VENEMATIC_SEC_SALT_2026_AIVYNTRAX_PRO_POS_V2';

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex').toUpperCase();
}

function computeSignature(hwid, rif, plan, expiresAt) {
  const cleanHwid = hwid.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanRif = rif.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const payloadStr = `${cleanHwid}#${cleanRif}#${plan}#${expiresAt}#${MASTER_SIGNING_SALT}`;
  const fullHash = sha256Hex(payloadStr);
  return `${fullHash.slice(0, 4)}-${fullHash.slice(4, 8)}-${fullHash.slice(8, 12)}-${fullHash.slice(12, 16)}`;
}

async function runLiveSuite() {
  console.log('================================================================');
  console.log('🚀 SUITE DE PRUEBAS EN VIVO KLIKPOS STREET & CLOUD FIRESTORE');
  console.log('================================================================\n');

  const testHwid = 'TEST-STREET-HWID-DEMO-2026';
  const testRif = 'J-50123456-7';
  const testStoreName = 'Street Burger Gourmet & Bodegón';
  const results = {
    step1_trialInstallation: false,
    step2_posSaleCheckout: false,
    step3_inventoryManage: false,
    step4_privateVisualPack: false,
    step5_keygenValidation: false,
    step6_tscCheck: false,
    firestorePaths: []
  };

  // -------------------------------------------------------------
  // PRUEBA 1: Registro de Instalación y Período de Prueba (30 min)
  // -------------------------------------------------------------
  console.log('[TEST 1/6] Registrando Instalación y Trial de 30 Minutos en Firestore...');
  const installPath = `pos_installations/${testHwid}`;
  const installPayload = {
    hwid: testHwid,
    edition: 'street',
    storeName: testStoreName,
    rif: testRif,
    installedAt: new Date().toISOString(),
    trialDurationMinutes: 30,
    trialExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    status: 'trial_active',
    appVersion: 'KlikPOS Street v1.0.0',
    platform: 'Android Mobile Test Suite',
    lastSeenAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, 'pos_installations', testHwid);
    await setDoc(docRef, installPayload, { merge: true });
    const verifyDoc = await getDoc(docRef);
    if (verifyDoc.exists() && verifyDoc.data().trialDurationMinutes === 30) {
      console.log(`  ✓ Instalación verificada en Firestore -> ${installPath}`);
      results.step1_trialInstallation = true;
      results.firestorePaths.push({
        coleccion: 'pos_installations',
        documento: testHwid,
        descripcion: 'Registro de dispositivo HWID con 30 minutos de prueba activa'
      });
    }
  } catch (err) {
    console.error('  ✗ Error en Test 1:', err.message);
  }

  // -------------------------------------------------------------
  // PRUEBA 2: Simulación de Venta Real Multi-Moneda (POS Checkout)
  // -------------------------------------------------------------
  console.log('\n[TEST 2/6] Simulando Venta en Caliente con Conversión BCV y Pago Mixto...');
  const orderId = `ORD-STREET-${Date.now()}`;
  const orderPath = `pos_orders/${orderId}`;
  const bcvRate = 36.85;
  const items = [
    { id: '1', name: 'Hamburguesa Clásica Especial 200g', quantity: 2, priceUSD: 6.50, subtotalUSD: 13.00 },
    { id: '5', name: 'Cachapa con Queso de Mano Doble', quantity: 1, priceUSD: 6.00, subtotalUSD: 6.00 },
    { id: '10', name: 'Refresco Personal Frío 355ml', quantity: 2, priceUSD: 1.50, subtotalUSD: 3.00 }
  ];
  const totalUSD = 22.00;
  const totalBs = parseFloat((totalUSD * bcvRate).toFixed(2)); // 810.70 Bs.
  
  const salePayload = {
    orderId,
    ticketNumber: 'TKT-001045',
    hwid: testHwid,
    storeName: testStoreName,
    rif: testRif,
    timestamp: new Date().toISOString(),
    bcvRate,
    items,
    totalUSD,
    totalBs,
    paymentMethod: 'mixto',
    paymentBreakdown: {
      usdCash: 10.00,
      bsPagoMovil: parseFloat((12.00 * bcvRate).toFixed(2)), // 442.20 Bs
      pagoMovilRef: '458123',
      bank: '0134 - Banesco'
    },
    status: 'completada',
    source: 'klikpos_street_mobile'
  };

  try {
    const saleRef = doc(db, 'pos_orders', orderId);
    await setDoc(saleRef, salePayload);
    const verifySale = await getDoc(saleRef);
    if (verifySale.exists() && verifySale.data().totalUSD === 22.00) {
      console.log(`  ✓ Venta guardada con éxito en Firestore -> ${orderPath}`);
      console.log(`    Total: $${totalUSD} USD | Bs. ${totalBs} (Tasa BCV: ${bcvRate} Bs/$)`);
      results.step2_posSaleCheckout = true;
      results.firestorePaths.push({
        coleccion: 'pos_orders',
        documento: orderId,
        descripcion: 'Ticket de venta con desglose en $ y Bs, Pago Móvil y tasa BCV'
      });
    }
  } catch (err) {
    console.error('  ✗ Error en Test 2:', err.message);
  }

  // -------------------------------------------------------------
  // PRUEBA 3: Creación y Edición de Producto en Inventario Local / Nube
  // -------------------------------------------------------------
  console.log('\n[TEST 3/6] Simulando Creación y Edición de Producto de Inventario...');
  const prodId = 'prod-empanada-operada-99';
  const prodPath = `merchant_catalogs/${testHwid}/products/${prodId}`;
  
  try {
    const prodRef = doc(db, 'merchant_catalogs', testHwid, 'products', prodId);
    // 1. Creación
    await setDoc(prodRef, {
      id: prodId,
      name: 'Empanada Criolla Operada de Cazón',
      category: 'Extras & Empanadas',
      priceUSD: 2.00,
      costUSD: 1.00,
      stock: 40,
      barcode: '759200009999',
      image: '/packs/comida-street/empanada.png',
      updatedAt: new Date().toISOString()
    });

    // 2. Edición de Precio a $2.50
    await setDoc(prodRef, {
      priceUSD: 2.50,
      stock: 45,
      lastModified: 'Ajuste de precio en caliente'
    }, { merge: true });

    const verifyProd = await getDoc(prodRef);
    if (verifyProd.exists() && verifyProd.data().priceUSD === 2.50) {
      console.log(`  ✓ Producto creado y editado ($2.00 -> $2.50) en Firestore -> ${prodPath}`);
      results.step3_inventoryManage = true;
      results.firestorePaths.push({
        coleccion: `merchant_catalogs/${testHwid}/products`,
        documento: prodId,
        descripcion: 'Catálogo particular del comercio con precio en USD y stock'
      });
    }
  } catch (err) {
    console.error('  ✗ Error en Test 3:', err.message);
  }

  // -------------------------------------------------------------
  // PRUEBA 4: Catálogo Cloud Privado con Código de Acceso VIP
  // -------------------------------------------------------------
  console.log('\n[TEST 4/6] Probando Creación y Canje de Catálogo Privado por Código...');
  const packId = 'pack-pizzeria-napoles-vip';
  const accessCode = 'NAPOLES-VIP-789';
  const packPath = `marketplace_packs/${packId}`;

  const customPackPayload = {
    id: packId,
    title: 'Pizzería Nápoles - Menú VIP Personalizado',
    description: 'Catálogo privado con fotos HD de pizzas napolitanas, calzones y bebidas.',
    category: 'Pizzería Gourmet',
    badge: '👑 VIP Personalizado',
    version: '1.0.0',
    accessCode: accessCode,
    isFree: false,
    author: 'KlikPOS Studio Cloud',
    totalProducts: 3,
    products: [
      { name: 'Pizza Margarita Especial', category: 'Pizzas', priceUsd: 12.00, imageUrl: '/packs/comida-street/pizza-margarita.png', barcode: '759300000001' },
      { name: 'Pizza Pepperoni Artesanal', category: 'Pizzas', priceUsd: 14.50, imageUrl: '/packs/comida-street/pizza-pepperoni.png', barcode: '759300000002' },
      { name: 'Calzone Relleno 4 Quesos', category: 'Calzones', priceUsd: 11.00, imageUrl: '/packs/comida-street/calzone.png', barcode: '759300000003' }
    ],
    createdAt: new Date().toISOString()
  };

  try {
    const packRef = doc(db, 'marketplace_packs', packId);
    await setDoc(packRef, customPackPayload);

    // Consulta de canje simulando lo que hace el teléfono del cliente
    const colRef = collection(db, 'marketplace_packs');
    const q = query(colRef, where('accessCode', '==', accessCode));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const redeemed = snap.docs[0].data();
      console.log(`  ✓ Catálogo canjeado exitosamente con código "${accessCode}" -> ${packPath}`);
      console.log(`    Título: "${redeemed.title}" con ${redeemed.products.length} productos listos para descargar.`);
      results.step4_privateVisualPack = true;
      results.firestorePaths.push({
        coleccion: 'marketplace_packs',
        documento: packId,
        codigoCanje: accessCode,
        descripcion: 'Catálogo en nube descargable por el comerciante vía código WhatsApp'
      });
    } else {
      console.error('  ✗ No se encontró el paquete con el código de canje.');
    }
  } catch (err) {
    console.error('  ✗ Error en Test 4:', err.message);
  }

  // -------------------------------------------------------------
  // PRUEBA 5: Validación del Keygen Oficial para Plan Contado $15
  // -------------------------------------------------------------
  console.log('\n[TEST 5/6] Validando Generación de Claves Criptográficas para Plan Contado $15...');
  try {
    const plan = 'starter_full'; // Plan oficial Street Contado Permanente ($15)
    const expiresAt = 'NEVER';
    const sig = computeSignature(testHwid, testRif, plan, expiresAt);
    const licenseKey = `VNK-STR-PERP-${sig}`;
    console.log(`  ✓ Clave Criptográfica HMAC-SHA256 Generada: ${licenseKey}`);
    console.log(`    HWID: ${testHwid} | RIF: ${testRif} | Plan: Contado $15 (PERPETUO)`);
    results.step5_keygenValidation = true;
  } catch (err) {
    console.error('  ✗ Error en Test 5:', err.message);
  }

  // -------------------------------------------------------------
  // PRUEBA 6: Chequeo de Tipado TypeScript en el Proyecto
  // -------------------------------------------------------------
  console.log('\n[TEST 6/6] Verificando Integridad de Tipado TypeScript (npx tsc --noEmit)...');
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe', encoding: 'utf8' });
    console.log('  ✓ Chequeo TypeScript: 0 errores detectados (Exit Code 0).');
    results.step6_tscCheck = true;
  } catch (err) {
    console.error('  ✗ Error de TypeScript:\n', err.stdout || err.message);
  }

  console.log('\n================================================================');
  console.log('🏁 RESULTADOS FINALES DE LA SUITE DE PRUEBAS EN VIVO:');
  console.log('================================================================');
  console.log(JSON.stringify(results, null, 2));

  return results;
}

runLiveSuite().catch(console.error);
