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

const productsDir = 'c:/Users/pcpro/OneDrive/Documents/venematic-master/venematic-master/public/packs/comida-street';

const productsDef = [
  { file: 'hamburguesa.png', name: 'Hamburguesa Clásica Especial 200g', category: 'Hamburguesas', priceUsd: 6.50, costUsd: 3.80, barcode: '759100000001', stock: 50, description: 'Carne 200g a la plancha, queso cheddar fundido, lechuga romana, tomate y salsas de la casa.' },
  { file: 'perro-caliente.png', name: 'Perro Caliente Tradicional Con Todo', category: 'Perros', priceUsd: 2.50, costUsd: 1.20, barcode: '759100000002', stock: 60, description: 'Salchicha de primera, cebollita picada, repollo, lluvia de papitas crocantes, queso blanco y las 3 salsas.' },
  { file: 'pepito.png', name: 'Pepito Mixto Gratinado 30cm', category: 'Hamburguesas', priceUsd: 8.50, costUsd: 5.20, barcode: '759100000003', stock: 35, description: 'Pan artesanal suave de 30cm, lomito jugoso, pollo grille, papitas crocantes y queso de mano gratinado.' },
  { file: 'cachapa-con-cochino.png', name: 'Cachapa con Cochino Frito', category: 'Combos', priceUsd: 9.50, costUsd: 5.50, barcode: '759100000004', stock: 30, description: 'Masa de maíz tierno recién molido, abundante queso de mano fresco, mantequilla llanera y porción de cochino frito crujiente.' },
  { file: 'cachapa-con-queso.png', name: 'Cachapa con Queso de Mano Doble', category: 'Combos', priceUsd: 6.00, costUsd: 3.20, barcode: '759100000005', stock: 40, description: 'Cachapa dorada con doble rueda de queso de mano artesanal y mantequilla derretida.' },
  { file: 'combo-5-perros.png', name: 'Mega Promo 5 Perros Calientes', category: 'Combos', priceUsd: 10.00, costUsd: 5.50, barcode: '759100000006', stock: 25, description: '5 Perros calientes tradicionales completos con papitas, queso blanco y salsas variadas.' },
  { file: 'combo-4-perros-refresco.png', name: 'Combo Familiar 4 Perros + Refresco 1.5L', category: 'Combos', priceUsd: 11.50, costUsd: 6.20, barcode: '759100000007', stock: 20, description: '4 Perros calientes especiales con todo + 1 Refresco familiar de 1.5 litros bien frío.' },
  { file: 'shawarma.png', name: 'Shawarma Mixto Libanés Especial', category: 'Hamburguesas', priceUsd: 5.50, costUsd: 3.00, barcode: '759100000008', stock: 45, description: 'Pan pita árabe tostado, carne marinada y pollo al trompo, lechuga, tomate, crema de ajo y salsa tártara.' },
  { file: 'combo-shawarma.png', name: 'Combo Shawarma + Papas + Refresco', category: 'Combos', priceUsd: 8.50, costUsd: 4.80, barcode: '759100000009', stock: 30, description: '1 Shawarma Mixto grande + 1 ración de papas fritas crocantes + 1 bebida personal fría.' },
  { file: 'refresco.png', name: 'Refresco Personal Frío 355ml', category: 'Bebidas', priceUsd: 1.50, costUsd: 0.85, barcode: '759100000010', stock: 100, description: 'Refresco frío a elección (Coca-Cola, Pepsi, Chinotto, Kolita).' },
  { file: 'chicha.png', name: 'Chicha Tradicional Criolla con Canela', category: 'Bebidas', priceUsd: 2.00, costUsd: 0.90, barcode: '759100000011', stock: 80, description: 'Chicha espesa de arroz con leche condensada generosa y toque de canela molida.' },
  { file: 'combo-burger-1.png', name: 'Combo Burger Especial + Papas + Bebida', category: 'Combos', priceUsd: 8.50, costUsd: 4.50, barcode: '759100000012', stock: 40, description: 'Hamburguesa 200g completa con queso cheddar, huevo, tocineta, papas rústicas y refresco.' },
  { file: 'combo-cachapa-01.png', name: 'Combo Cachapa Doble Queso y Cochino Frito', category: 'Combos', priceUsd: 10.50, costUsd: 5.80, barcode: '759100000013', stock: 35, description: 'Cachapa gigante con doble queso de mano tierno, ración de cochino frito crujiente y bebida.' },
  { file: 'combo-cachapa-02.png', name: 'Combo Cachapa Criolla Doble Queso Mano', category: 'Combos', priceUsd: 7.50, costUsd: 3.80, barcode: '759100000014', stock: 40, description: 'Cachapa dorada con abundante queso de mano fresco, mantequilla derretida y bebida fría.' },
  { file: 'combo-pepito-01.png', name: 'Combo Pepito Mixto 30cm + Papas + Bebida', category: 'Combos', priceUsd: 11.00, costUsd: 6.00, barcode: '759100000015', stock: 30, description: 'Pepito mixto lomito y pollo 30cm gratinado con queso de mano y maíz, papas fritas y refresco.' },
  { file: 'combo-shawarma-01.png', name: 'Combo Dúo Shawarma Mixto Especial', category: 'Combos', priceUsd: 12.00, costUsd: 6.50, barcode: '759100000016', stock: 25, description: '2 Shawarmas mixtos grandes con pan pita tostado, papas y salsas árabes.' }
];

async function publishStreetPack() {
  console.log('Subiendo paquete street food a Firebase...');
  const uploadedProducts = [];

  for (const item of productsDef) {
    const filePath = path.join(productsDir, item.file);
    let imageUrl = `/packs/comida-street/${item.file}`;

    if (fs.existsSync(filePath)) {
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const storageRef = ref(storage, `packs/comida-street/${item.file}`);
        await uploadBytes(storageRef, fileBuffer, { contentType: 'image/png' });
        const downloadUrl = await getDownloadURL(storageRef);
        console.log(`✓ Subido a Firebase Storage: ${item.file} -> ${downloadUrl.slice(0, 60)}...`);
        imageUrl = downloadUrl;
      } catch (storageErr) {
        console.warn(`Aviso: No se pudo subir a Storage ${item.file}:`, storageErr.message);
        // Fallback a ruta local
        imageUrl = `/packs/comida-street/${item.file}`;
      }
    }

    uploadedProducts.push({
      ...item,
      imageUrl,
      isStockManaged: true
    });
  }

  const packData = {
    id: 'pack-comida-street-venezuela',
    title: 'Comida Rápida & Street Food (PNG Transparente HD)',
    description: 'Hamburguesas, perros calientes, combos familiares, cachapas con queso de mano y cochino frito, pepitos 30cm, shawarmas y refrescos en PNG transparente.',
    category: 'Comida Rápida',
    badge: '⭐ Oficial Street',
    version: '1.0.0',
    totalProducts: uploadedProducts.length,
    coverImage: uploadedProducts[0].imageUrl,
    isFree: true,
    tags: ['hamburguesas', 'perros', 'cachapas', 'pepito', 'shawarma', 'street', 'venezuela'],
    products: uploadedProducts,
    updatedAt: new Date().toISOString()
  };

  const packDocRef = doc(db, 'marketplace_packs', 'pack-comida-street-venezuela');
  await setDoc(packDocRef, packData);
  console.log('🎉 ¡PAQUETE OFICIAL PUBLICADO EXITOSAMENTE EN FIRESTORE!');
  console.log('ID Documento:', packDocRef.id);
  process.exit(0);
}

publishStreetPack().catch(e => {
  console.error('Error publicando paquete:', e);
  process.exit(1);
});
