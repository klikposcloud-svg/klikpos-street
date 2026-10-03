const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'Productos Street');
const dstPublic = path.join(root, 'public', 'packs', 'comida-street');
const dstAndroid = path.join(root, 'venematic-desktop', 'android', 'app', 'src', 'main', 'assets', 'public', 'packs', 'comida-street');
const dstDesktop = path.join(root, 'venematic-desktop', 'public', 'packs', 'comida-street');

[dstPublic, dstAndroid, dstDesktop].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
});

const fileMap = [
  { src: 'HAmburguesa.png', dst: 'hamburguesa.png', name: 'Hamburguesa Clásica Especial 200g', cat: 'Hamburguesas', price: 6.50, cost: 3.80, prep: '8-10 min', tag: '🔥 Más Vendido', desc: 'Carne 200g a la plancha, queso cheddar fundido, lechuga romana, tomate y salsas de la casa.' },
  { src: 'Perro Caliente.png', dst: 'perro-caliente.png', name: 'Perro Caliente Tradicional Con Todo', cat: 'Perros', price: 2.50, cost: 1.20, prep: '3-5 min', tag: '⭐ Favorito', desc: 'Salchicha de primera, cebollita picada, repollo, lluvia de papitas crocantes, queso blanco y las 3 salsas.' },
  { src: 'Peprito.png', dst: 'pepito.png', name: 'Pepito Mixto Gratinado 30cm', cat: 'Hamburguesas', price: 8.50, cost: 5.20, prep: '10-12 min', tag: '🏆 Gigante', desc: 'Pan artesanal suave de 30cm, lomito jugoso, pollo grille, papitas crocantes y queso de mano gratinado.' },
  { src: 'Cachapa con cochino.png', dst: 'cachapa-con-cochino.png', name: 'Cachapa Tradicional con Cochino Frito', cat: 'Combos', price: 9.50, cost: 5.50, prep: '12-15 min', tag: '🥓 Típico Criollo', desc: 'Masa de maíz tierno recién molido, abundante queso de mano fresco, mantequilla llanera y porción de cochino frito crujiente.' },
  { src: 'Cachapa con queso.png', dst: 'cachapa-con-queso.png', name: 'Cachapa con Queso de Mano Doble', cat: 'Combos', price: 6.00, cost: 3.20, prep: '8-10 min', tag: '🧀 Queso Puro', desc: 'Cachapa dorada con doble rueda de queso de mano artesanal y mantequilla derretida.' },
  { src: 'Combo 5 Perros_.png', dst: 'combo-5-perros.png', name: 'Mega Promo 5 Perros Calientes', cat: 'Combos', price: 10.00, cost: 5.50, prep: '8-10 min', tag: '💥 Súper Ahorro', desc: '5 Perros calientes tradicionales completos con papitas, queso blanco y salsas variadas.' },
  { src: 'Combo Perro 4 mas fresco.png', dst: 'combo-4-perros-refresco.png', name: 'Combo Familiar 4 Perros + Refresco 1.5L', cat: 'Combos', price: 11.50, cost: 6.20, prep: '8-10 min', tag: '👥 Para Grupos', desc: '4 Perros calientes especiales con todo + 1 Refresco familiar de 1.5 litros bien frío.' },
  { src: 'Shawarma.png', dst: 'shawarma.png', name: 'Shawarma Mixto Libanés Especial', cat: 'Hamburguesas', price: 5.50, cost: 3.00, prep: '6-8 min', tag: '🥙 Especial', desc: 'Pan pita árabe tostado, carne marinada y pollo al trompo, lechuga, tomate, crema de ajo y salsa tártara.' },
  { src: 'Combo Shawarma.png', dst: 'combo-shawarma.png', name: 'Combo Shawarma + Papas + Refresco', cat: 'Combos', price: 8.50, cost: 4.80, prep: '8-10 min', tag: '🍟 Combo Full', desc: '1 Shawarma Mixto grande + 1 ración de papas fritas crocantes + 1 bebida personal fría.' },
  { src: 'Refresco.png', dst: 'refresco.png', name: 'Refresco Personal en Lata 355ml', cat: 'Bebidas', price: 1.50, cost: 0.85, prep: 'Inmediato', tag: '🥤 Bien Frío', desc: 'Refresco frío a elección (Coca-Cola, Pepsi, Chinotto, Kolita).' }
];

console.log('=== COPIANDO IMÁGENES PNG TRANSPARENTES A LOS PACKS ===');
fileMap.forEach(item => {
  const fileSrc = path.join(srcDir, item.src);
  if (fs.existsSync(fileSrc)) {
    const fileDstPub = path.join(dstPublic, item.dst);
    const fileDstAnd = path.join(dstAndroid, item.dst);
    const fileDstDsk = path.join(dstDesktop, item.dst);

    fs.copyFileSync(fileSrc, fileDstPub);
    fs.copyFileSync(fileSrc, fileDstAnd);
    fs.copyFileSync(fileSrc, fileDstDsk);
    console.log(`✓ Copiado: ${item.src} -> ${item.dst} (${(fs.statSync(fileSrc).size / 1024).toFixed(1)} KB)`);
  } else {
    console.warn(`! Archivo no encontrado: ${fileSrc}`);
  }
});

console.log('=== IMÁGENES SINCRONIZADAS EXITOSAMENTE ===');
