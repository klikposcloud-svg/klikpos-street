import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: 'AIzaSyDT26ff7t-W5WZKZktPWLZ_D79QHGh6sEg',
  authDomain: 'klikpos-cloud.firebaseapp.com',
  projectId: 'klikpos-cloud',
  storageBucket: 'klikpos-cloud.firebasestorage.app',
  messagingSenderId: '147933668842',
  appId: '1:147933668842:web:cf3bd154b7164b7ce07e93',
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const productsDir = 'c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/public/packs/snacks';

const productsDef = [
  { file: 'Bolibomba.png', name: 'Chicle Bolibomba Clásico Fresa', category: 'Golosinas', priceUsd: 0.25, costUsd: 0.12, barcode: '759101000001', stock: 100, description: 'Chicle bomba tradicional sabor a fresa intensa para hacer bombas gigantes.' },
  { file: 'Carre.png', name: 'Chocolate Savoy Carré con Avellanas 25g', category: 'Chocolates', priceUsd: 1.20, costUsd: 0.75, barcode: '759101000002', stock: 50, description: 'Fino chocolate de leche Savoy relleno con trozos crocantes de avellana seleccionada.' },
  { file: 'Cheese Tris.png', name: 'Cheese Tris Tradicional Frito-Lay 45g', category: 'Snacks', priceUsd: 0.90, costUsd: 0.55, barcode: '759101000003', stock: 80, description: 'Snack crujiente horneado con el inconfundible y adictivo sabor a queso venezolano.' },
  { file: 'Cheetos Mega Queso.png', name: 'Cheetos Mega Queso Frito-Lay 40g', category: 'Snacks', priceUsd: 0.90, costUsd: 0.55, barcode: '759101000004', stock: 75, description: 'Crujientes palitos de maíz inflado con abundante sabor a mega queso.' },
  { file: 'Chiclets.png', name: 'Chiclets Adams Clásico Menta 2 Pastillas', category: 'Golosinas', priceUsd: 0.35, costUsd: 0.18, barcode: '759101000005', stock: 120, description: 'Pastillas de goma de mascar sabor a menta refrescante tradicional.' },
  { file: 'Cocosete.png', name: 'Galleta Cocosete Sándwich Nestlé 50g', category: 'Galletas', priceUsd: 1.00, costUsd: 0.60, barcode: '759101000006', stock: 90, description: 'Crujiente barquillo relleno de deliciosa crema de coco caribeño auténtico.' },
  { file: 'De Todito Mix.png', name: 'De Todito Frito-Lay Familiar 110g', category: 'Snacks', priceUsd: 1.80, costUsd: 1.15, barcode: '759101000007', stock: 45, description: 'Mezcla perfecta de Doritos, Cheese Tris, Platanitos y Fritos crujientes.' },
  { file: 'Doritos Mega Queso.png', name: 'Doritos Mega Queso Frito-Lay 42g', category: 'Snacks', priceUsd: 1.00, costUsd: 0.65, barcode: '759101000008', stock: 80, description: 'Totopos triangulares de maíz crujiente bañados con intenso sabor a queso cheddar.' },
  { file: 'Galak.png', name: 'Chocolate Blanco Galak Nestlé 30g', category: 'Chocolates', priceUsd: 1.10, costUsd: 0.70, barcode: '759101000009', stock: 60, description: 'Cremoso chocolate blanco elaborado con leche pura de alta calidad Nestlé.' },
  { file: 'Pepitos.png', name: 'Pepito Queso Frito-Lay 40g', category: 'Snacks', priceUsd: 0.85, costUsd: 0.50, barcode: '759101000010', stock: 90, description: 'Aros y cilindros de maíz inflado suaves con sabor a queso tradicional.' },
  { file: 'Pinguino.png', name: 'Pastelito Pingüino Marinela Pack Doble', category: 'Galletas', priceUsd: 1.50, costUsd: 0.95, barcode: '759101000011', stock: 40, description: 'Esponjoso pastelito de chocolate relleno de rica crema con firma blanca decorativa.' },
  { file: 'Platanitos.png', name: 'Platanitos Ondulados Salados 45g', category: 'Snacks', priceUsd: 0.80, costUsd: 0.48, barcode: '759101000012', stock: 85, description: 'Rebanadas crocantes de plátano verde fritas al punto exacto con sal marina.' },
  { file: 'Rufles Mega Queso.png', name: 'Ruffles Mega Queso Frito-Lay 40g', category: 'Snacks', priceUsd: 1.00, costUsd: 0.65, barcode: '759101000013', stock: 70, description: 'Papas onduladas ultra crujientes condimentadas con queso cheddar intenso.' },
  { file: 'Rufles Original.png', name: 'Ruffles Papas Saladas Original 40g', category: 'Snacks', priceUsd: 1.00, costUsd: 0.65, barcode: '759101000014', stock: 70, description: 'Papas onduladas naturales con corte grueso y el toque justo de sal.' },
  { file: 'Sparkies.png', name: 'Caramelos Masticables Frutales Sparkies', category: 'Golosinas', priceUsd: 0.50, costUsd: 0.28, barcode: '759101000015', stock: 110, description: 'Caramelos confitados masticables surtidos en ricos sabores a frutas tropicales.' },
  { file: 'Susy.png', name: 'Galleta Susy Savoy Chocolate 50g', category: 'Galletas', priceUsd: 1.00, costUsd: 0.60, barcode: '759101000016', stock: 90, description: 'Capas crujientes de oblea rellenas de auténtico chocolate Savoy de primera.' },
  { file: 'Toronto.png', name: 'Bombón Toronto Savoy Avellana Original', category: 'Chocolates', priceUsd: 0.40, costUsd: 0.22, barcode: '759101000017', stock: 150, description: 'Emblemático bombón venezolano de chocolate con leche y centro de avellana entera.' }
];

async function publishSnacksPack() {
  console.log('Subiendo paquete Snacks & Golosinas Venezuela a Firebase...');
  const uploadedProducts = [];

  for (const item of productsDef) {
    const filePath = path.join(productsDir, item.file);
    let imageUrl = `/packs/snacks/${encodeURIComponent(item.file)}`;

    if (fs.existsSync(filePath)) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const storageRef = ref(storage, `packs/snacks/${item.file}`);
        await uploadBytes(storageRef, fileBuffer, { contentType: 'image/png' });
        const downloadUrl = await getDownloadURL(storageRef);
        console.log(`✓ Subido a Firebase Storage: ${item.file} -> ${downloadUrl.slice(0, 60)}...`);
        imageUrl = downloadUrl;
      } catch (storageErr) {
        console.warn(`Aviso: No se pudo subir a Storage ${item.file}:`, storageErr.message);
        imageUrl = `/packs/snacks/${encodeURIComponent(item.file)}`;
      }
    } else {
      console.warn(`Archivo no encontrado: ${filePath}`);
    }

    uploadedProducts.push({
      name: item.name,
      category: item.category,
      priceUsd: item.priceUsd,
      costUsd: item.costUsd,
      barcode: item.barcode,
      imageUrl,
      stock: item.stock,
      isStockManaged: true,
      taxRate: 0,
      description: item.description
    });
  }

  const packData = {
    id: 'pack-snacks-venezuela',
    title: 'Snacks, Chocolates & Chucherías Venezuela (17 Productos HD)',
    description: 'Catálogo de alta rotación para bodegas y quioscos: Cheese Tris, Doritos, Pepitos, Ruffles, Cocosete, Susy, Toronto, Carré, Galak y más en PNG transparente.',
    category: 'Snacks & Golosinas',
    badge: '🔥 Bodega & Kiosco',
    version: '1.0.0',
    totalProducts: uploadedProducts.length,
    coverImage: uploadedProducts[2]?.imageUrl || '/packs/snacks/Cheese%20Tris.png',
    isFree: true,
    priceUsd: 0,
    tags: ['snacks', 'chucherias', 'galletas', 'chocolates', 'savoy', 'frito-lay', 'nestle', 'bodega', 'venezuela'],
    products: uploadedProducts,
    author: 'KlikPOS Cloud Enterprise',
    createdAt: new Date().toISOString()
  };

  try {
    const packRef = doc(db, 'marketplace_packs', 'pack-snacks-venezuela');
    await setDoc(packRef, packData);
    console.log(`\n🎉 ¡PAQUETE DE SNACKS PUBLICADO CON ÉXITO EN FIRESTORE! ID: pack-snacks-venezuela`);
    console.log(`Total de productos cargados: ${uploadedProducts.length}`);
  } catch (firestoreErr) {
    console.error('Error publicando documento en Firestore:', firestoreErr);
  }
}

publishSnacksPack();
