export type BusinessType =
  | 'supermarket'
  | 'bookstore'
  | 'accessories'
  | 'pharmacy'
  | 'hardware'
  | 'tech'
  | 'bakery_cafe'
  | 'petshop'
  | 'general';

export interface BusinessRubroInfo {
  type: BusinessType;
  label: string;
  icon: string;
  description: string;
  categories: Array<{ key: string; label: string; color: string; icon: string }>;
  sampleProducts: Array<{
    name: string;
    description: string;
    category: string;
    priceUSD: number;
    costUSD: number;
    stock: number;
    minStock: number;
    unit: 'unit' | 'kg' | 'lb' | 'liter' | 'pack';
    image?: string;
  }>;
}

export const BUSINESS_RUBROS: Record<BusinessType, BusinessRubroInfo> = {
  supermarket: {
    type: 'supermarket',
    label: 'Supermercado / Bodega',
    icon: '🛒',
    description: 'Víveres, alimentos frescos, bebidas, lácteos y artículos de consumo diario',
    categories: [
      { key: 'all', label: 'Todos', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200', icon: '📦' },
      { key: 'Produce', label: 'Frutas y Verduras', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', icon: '🥗' },
      { key: 'Bakery', label: 'Panadería', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800', icon: '🍞' },
      { key: 'Dairy', label: 'Lácteos', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800', icon: '🥛' },
      { key: 'Meat', label: 'Carnicería', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800', icon: '🥩' },
      { key: 'Snacks', label: 'Snacks y Dulces', color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800', icon: '🍿' },
      { key: 'Beverages', label: 'Bebidas', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800', icon: '🥤' },
      { key: 'Cleaning', label: 'Limpieza', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800', icon: '🧴' },
    ],
    sampleProducts: [
      { name: 'Harina PAN Maíz Blanco 1kg', description: 'Harina de maíz precocida tradicional', category: 'Produce', priceUSD: 1.30, costUSD: 0.90, stock: 45, minStock: 10, unit: 'unit', image: '🌽' },
      { name: 'Arroz Blanco Premium 1kg', description: 'Grano entero seleccionado', category: 'Produce', priceUSD: 1.25, costUSD: 0.85, stock: 40, minStock: 10, unit: 'unit', image: '🍚' },
      { name: 'Leche Entera Larga Vida 1L', description: 'Leche pasteurizada enriquecida', category: 'Dairy', priceUSD: 2.10, costUSD: 1.40, stock: 24, minStock: 6, unit: 'unit', image: '🥛' },
      { name: 'Queso Blanco Llanero', description: 'Queso blanco duro rallar', category: 'Dairy', priceUSD: 5.50, costUSD: 3.80, stock: 15, minStock: 4, unit: 'kg', image: '🧀' },
      { name: 'Pan de Sandwich Tradicional', description: 'Pan rebanado suave', category: 'Bakery', priceUSD: 2.80, costUSD: 1.60, stock: 20, minStock: 5, unit: 'unit', image: '🍞' },
      { name: 'Café Molido Fama 250g', description: 'Café tostado y molido gourmet', category: 'Beverages', priceUSD: 2.50, costUSD: 1.50, stock: 30, minStock: 8, unit: 'unit', image: '☕' },
      { name: 'Refresco Cola 1.5L', description: 'Bebida gaseosa refrescante', category: 'Beverages', priceUSD: 1.80, costUSD: 1.10, stock: 35, minStock: 8, unit: 'unit', image: '🥤' },
      { name: 'Detergente Multiuso 1kg', description: 'Jabón en polvo con fragancia', category: 'Cleaning', priceUSD: 2.20, costUSD: 1.30, stock: 18, minStock: 5, unit: 'unit', image: '🧴' },
    ],
  },
  bookstore: {
    type: 'bookstore',
    label: 'Librería y Papelería',
    icon: '📚',
    description: 'Cuadernos, papelería, útiles escolares, libros, arte y artículos de oficina',
    categories: [
      { key: 'all', label: 'Todos', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200', icon: '📦' },
      { key: 'Cuadernos', label: 'Cuadernos y Libretas', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200', icon: '📓' },
      { key: 'Utiles', label: 'Útiles Escolares', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200', icon: '✏️' },
      { key: 'Papeleria', label: 'Papelería y Hojas', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200', icon: '📄' },
      { key: 'Arte', label: 'Arte y Dibujo', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200', icon: '🎨' },
      { key: 'Oficina', label: 'Oficina y Archivo', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200', icon: '📎' },
      { key: 'Libros', label: 'Libros y Lectura', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200', icon: '📖' },
    ],
    sampleProducts: [
      { name: 'Cuaderno Doble Línea 100 Hojas', description: 'Cuaderno cosido pasta dura escolar', category: 'Cuadernos', priceUSD: 1.80, costUSD: 0.90, stock: 50, minStock: 10, unit: 'unit', image: '📓' },
      { name: 'Cuaderno Cuadriculado 100 Hojas', description: 'Para matemáticas y dibujo técnico', category: 'Cuadernos', priceUSD: 1.80, costUSD: 0.90, stock: 45, minStock: 10, unit: 'unit', image: '📒' },
      { name: 'Caja de Lápices Grafito HB (12 uds)', description: 'Lápices de madera de alta calidad', category: 'Utiles', priceUSD: 2.50, costUSD: 1.20, stock: 30, minStock: 5, unit: 'pack', image: '✏️' },
      { name: 'Resma Papel Bond Carta 500 Hojas', description: 'Papel blanco 75gr para impresión', category: 'Papeleria', priceUSD: 5.50, costUSD: 3.80, stock: 25, minStock: 5, unit: 'unit', image: '📄' },
      { name: 'Set de Marcadores Punta Fina (24 colores)', description: 'Tinta lavable no tóxica', category: 'Arte', priceUSD: 4.50, costUSD: 2.20, stock: 18, minStock: 4, unit: 'pack', image: '🖍️' },
      { name: 'Juego de Geometría Escolar 4 Piezas', description: 'Regla 30cm, escuadras y transportador', category: 'Utiles', priceUSD: 2.20, costUSD: 1.10, stock: 35, minStock: 8, unit: 'pack', image: '📐' },
      { name: 'Carpeta de Archivo Palanca Oficio', description: 'Lomo ancho cartón plastificado', category: 'Oficina', priceUSD: 3.20, costUSD: 1.90, stock: 20, minStock: 5, unit: 'unit', image: '📁' },
      { name: 'Pega Líquida Escolar 250ml', description: 'Adhesivo blanco lavable', category: 'Utiles', priceUSD: 1.50, costUSD: 0.70, stock: 40, minStock: 10, unit: 'unit', image: '🧴' },
    ],
  },
  accessories: {
    type: 'accessories',
    label: 'Tienda de Accesorios y Moda',
    icon: '💍',
    description: 'Joyería, relojes, carteras, bolsos, lentes, maquillaje y accesorios de vestir',
    categories: [
      { key: 'all', label: 'Todos', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200', icon: '📦' },
      { key: 'Joyeria', label: 'Joyería y Acero', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200', icon: '💍' },
      { key: 'Relojes', label: 'Relojes', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200', icon: '⌚' },
      { key: 'Bolsos', label: 'Bolsos y Carteras', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200', icon: '👜' },
      { key: 'Lentes', label: 'Lentes y Gafas', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200', icon: '🕶️' },
      { key: 'Belleza', label: 'Maquillaje y Belleza', color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200', icon: '💄' },
      { key: 'Móvil', label: 'Fundas y Móvil', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200', icon: '📱' },
    ],
    sampleProducts: [
      { name: 'Cadena de Acero Inoxidable Quirúrgico', description: 'Acabado dorado hipoalergénico 50cm', category: 'Joyeria', priceUSD: 8.50, costUSD: 3.50, stock: 25, minStock: 5, unit: 'unit', image: '📿' },
      { name: 'Zarcillos de Acero Argolla Dorada', description: 'Par de zarcillos resistentes al agua', category: 'Joyeria', priceUSD: 4.00, costUSD: 1.50, stock: 30, minStock: 6, unit: 'unit', image: '✨' },
      { name: 'Reloj Deportivo Digital Resistente al Agua', description: 'Cronómetro, alarma y luz nocturna', category: 'Relojes', priceUSD: 12.00, costUSD: 5.50, stock: 15, minStock: 3, unit: 'unit', image: '⌚' },
      { name: 'Cartera Cruzada Crossbody Eco-Cuero', description: 'Con correa ajustable y cierre seguro', category: 'Bolsos', priceUSD: 15.00, costUSD: 7.50, stock: 10, minStock: 2, unit: 'unit', image: '👜' },
      { name: 'Lentes de Sol Polarizados UV400', description: 'Montura ligera estilo aviador', category: 'Lentes', priceUSD: 9.50, costUSD: 4.00, stock: 20, minStock: 4, unit: 'unit', image: '🕶️' },
      { name: 'Paleta de Sombras Nude 18 Tonos', description: 'Alta pigmentación mates y satinados', category: 'Belleza', priceUSD: 7.50, costUSD: 3.20, stock: 18, minStock: 4, unit: 'unit', image: '💄' },
      { name: 'Funda Protectora Transparente Antigolpes', description: 'Silicona TPU con esquinas reforzadas', category: 'Móvil', priceUSD: 3.50, costUSD: 1.00, stock: 40, minStock: 8, unit: 'unit', image: '📱' },
    ],
  },
  pharmacy: {
    type: 'pharmacy',
    label: 'Farmacia y Cuidado Personal',
    icon: '💊',
    description: 'Medicamentos OTC, primeros auxilios, vitaminas, aseo personal e infantil',
    categories: [
      { key: 'all', label: 'Todos', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200', icon: '📦' },
      { key: 'Medicamentos', label: 'Medicamentos', color: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200', icon: '💊' },
      { key: 'PrimerosAuxilios', label: 'Primeros Auxilios', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200', icon: '🩹' },
      { key: 'CuidadoPersonal', label: 'Cuidado Personal', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200', icon: '🧼' },
      { key: 'Vitaminas', label: 'Vitaminas y Suplementos', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200', icon: '🍊' },
      { key: 'Infantil', label: 'Bebé e Infantil', color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200', icon: '🍼' },
    ],
    sampleProducts: [
      { name: 'Acetaminofén / Paracetamol 500mg (10 tabs)', description: 'Analgésico y antipirético', category: 'Medicamentos', priceUSD: 1.50, costUSD: 0.70, stock: 60, minStock: 15, unit: 'pack', image: '💊' },
      { name: 'Ibuprofeno 400mg (10 tabs)', description: 'Antiinflamatorio y analgésico', category: 'Medicamentos', priceUSD: 1.80, costUSD: 0.90, stock: 50, minStock: 10, unit: 'pack', image: '💊' },
      { name: 'Alcohol Antiséptico 70% 500ml', description: 'Para desinfección de heridas y piel', category: 'PrimerosAuxilios', priceUSD: 2.00, costUSD: 1.10, stock: 35, minStock: 8, unit: 'unit', image: '🧴' },
      { name: 'Caja Curitas Adhesivas (30 uds)', description: 'Protección para cortes y rozaduras', category: 'PrimerosAuxilios', priceUSD: 1.20, costUSD: 0.50, stock: 40, minStock: 10, unit: 'pack', image: '🩹' },
      { name: 'Vitamina C 500mg Masticable (30 tabs)', description: 'Refuerzo del sistema inmune', category: 'Vitaminas', priceUSD: 3.50, costUSD: 1.80, stock: 25, minStock: 5, unit: 'unit', image: '🍊' },
      { name: 'Protector Solar Facial FPS 50+', description: 'Toque seco resistente al agua 50ml', category: 'CuidadoPersonal', priceUSD: 8.00, costUSD: 4.50, stock: 15, minStock: 3, unit: 'unit', image: '☀️' },
      { name: 'Pañales Desechables Talla G (20 uds)', description: 'Absorción prolongada día y noche', category: 'Infantil', priceUSD: 6.50, costUSD: 4.20, stock: 20, minStock: 4, unit: 'pack', image: '👶' },
    ],
  },
  hardware: {
    type: 'hardware',
    label: 'Ferretería y Herramientas',
    icon: '🔧',
    description: 'Herramientas, electricidad, plomería, tornillería, pinturas y construcción',
    categories: [
      { key: 'all', label: 'Todos', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200', icon: '📦' },
      { key: 'Herramientas', label: 'Herramientas', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200', icon: '🔨' },
      { key: 'Electricidad', label: 'Electricidad', color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200', icon: '💡' },
      { key: 'Plomeria', label: 'Plomería y Tuberías', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200', icon: '🚰' },
      { key: 'Tornilleria', label: 'Tornillos y Fijaciones', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-slate-300', icon: '🔩' },
      { key: 'Pinturas', label: 'Pinturas y Brochas', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200', icon: '🖌️' },
    ],
    sampleProducts: [
      { name: 'Martillo de Uña Mango Fibra de Vidrio 16oz', description: 'Cabeza de acero forjado ergonómico', category: 'Herramientas', priceUSD: 5.50, costUSD: 3.00, stock: 20, minStock: 4, unit: 'unit', image: '🔨' },
      { name: 'Cinta Métrica Profesional 5 Metros', description: 'Carcasa antishock con seguro', category: 'Herramientas', priceUSD: 3.20, costUSD: 1.50, stock: 30, minStock: 5, unit: 'unit', image: '📏' },
      { name: 'Bombillo LED 12W Rosca E27 Luz Blanca', description: 'Ahorro de energía 85% larga duración', category: 'Electricidad', priceUSD: 1.50, costUSD: 0.80, stock: 60, minStock: 15, unit: 'unit', image: '💡' },
      { name: 'Cinta Aislante Negra 20m 3M', description: 'Aislamiento eléctrico resistente a fuego', category: 'Electricidad', priceUSD: 1.20, costUSD: 0.60, stock: 45, minStock: 10, unit: 'unit', image: '⬛' },
      { name: 'Cinta Teflón para Plomería 12mm x 10m', description: 'Sellado hermético para tuberías', category: 'Plomeria', priceUSD: 0.80, costUSD: 0.35, stock: 50, minStock: 10, unit: 'unit', image: '🚰' },
      { name: 'Llave Ajustable Perico 8 Pulgadas', description: 'Acero cromo vanadio forjado', category: 'Herramientas', priceUSD: 6.00, costUSD: 3.40, stock: 15, minStock: 3, unit: 'unit', image: '🔧' },
      { name: 'Brocha para Pintar 2 Pulgadas', description: 'Cerdas sintéticas suaves para esmalte', category: 'Pinturas', priceUSD: 1.80, costUSD: 0.90, stock: 35, minStock: 6, unit: 'unit', image: '🖌️' },
    ],
  },
  tech: {
    type: 'tech',
    label: 'Tecnología y Celulares',
    icon: '💻',
    description: 'Cables, cargadores, audífonos, periféricos, memorias y accesorios de computación',
    categories: [
      { key: 'all', label: 'Todos', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200', icon: '📦' },
      { key: 'Cables', label: 'Cables y Cargadores', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200', icon: '🔌' },
      { key: 'Audio', label: 'Audífonos y Audio', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200', icon: '🎧' },
      { key: 'Computacion', label: 'Computación y PC', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200', icon: '🖥️' },
      { key: 'Memorias', label: 'Memorias y Pendrives', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200', icon: '💾' },
      { key: 'Accesorios', label: 'Soportes y Gadgets', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200', icon: '📱' },
    ],
    sampleProducts: [
      { name: 'Cable USB-C a USB-C Carga Rápida 60W 1m', description: 'Trenzado de nylon ultra resistente', category: 'Cables', priceUSD: 3.50, costUSD: 1.40, stock: 40, minStock: 8, unit: 'unit', image: '🔌' },
      { name: 'Cargador Rápido 20W USB-C PD', description: 'Compatible con iPhone y Android', category: 'Cables', priceUSD: 6.50, costUSD: 2.80, stock: 30, minStock: 5, unit: 'unit', image: '🔋' },
      { name: 'Audífonos Bluetooth Inalámbricos TWS', description: 'Cancelación de ruido pasiva y estuche de carga', category: 'Audio', priceUSD: 14.00, costUSD: 6.50, stock: 20, minStock: 4, unit: 'unit', image: '🎧' },
      { name: 'Memoria MicroSD 64GB Clase 10', description: 'Alta velocidad para celulares y cámaras', category: 'Memorias', priceUSD: 7.00, costUSD: 3.50, stock: 25, minStock: 5, unit: 'unit', image: '💾' },
      { name: 'Mouse Inalámbrico Óptico 2.4GHz', description: 'Diseño ergonómico con receptor USB', category: 'Computacion', priceUSD: 5.50, costUSD: 2.50, stock: 25, minStock: 4, unit: 'unit', image: '🖱️' },
      { name: 'Power Bank Batería Portátil 10.000mAh', description: 'Doble salida USB con indicador LED', category: 'Cables', priceUSD: 15.00, costUSD: 8.00, stock: 15, minStock: 3, unit: 'unit', image: '⚡' },
    ],
  },
  bakery_cafe: {
    type: 'bakery_cafe',
    label: 'Cafetería y Panadería',
    icon: '☕',
    description: 'Cafés gourmet, bebidas, bollería, panes horneados, desayunos y postres',
    categories: [
      { key: 'all', label: 'Todos', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200', icon: '📦' },
      { key: 'Cafes', label: 'Cafés y Bebidas', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200', icon: '☕' },
      { key: 'Panaderia', label: 'Panadería', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200', icon: '🥐' },
      { key: 'Postres', label: 'Postres y Tortas', color: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200', icon: '🍰' },
      { key: 'Desayunos', label: 'Desayunos y Salados', color: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200', icon: '🥪' },
    ],
    sampleProducts: [
      { name: 'Café Espresso Doble', description: 'Café de especialidad recién molido', category: 'Cafes', priceUSD: 1.50, costUSD: 0.40, stock: 100, minStock: 10, unit: 'unit', image: '☕' },
      { name: 'Capuchino Vainilla 12oz', description: 'Espresso con leche espumada y vainilla', category: 'Cafes', priceUSD: 2.50, costUSD: 0.80, stock: 80, minStock: 10, unit: 'unit', image: '☕' },
      { name: 'Croissant Francés de Mantequilla', description: 'Masa hojaldrada crujiente horneada hoy', category: 'Panaderia', priceUSD: 2.00, costUSD: 0.70, stock: 25, minStock: 5, unit: 'unit', image: '🥐' },
      { name: 'Cachito de Jamón Tradicional', description: 'Relleno de jamón ahumado de primera', category: 'Desayunos', priceUSD: 2.20, costUSD: 0.90, stock: 30, minStock: 5, unit: 'unit', image: '🥖' },
      { name: 'Porción Torta Selva Negra', description: 'Bizcocho de chocolate con crema y cerezas', category: 'Postres', priceUSD: 3.50, costUSD: 1.20, stock: 12, minStock: 3, unit: 'unit', image: '🍰' },
      { name: 'Jugo Natural de Naranja 400ml', description: '100% exprimido sin azúcar añadida', category: 'Cafes', priceUSD: 2.00, costUSD: 0.70, stock: 20, minStock: 4, unit: 'unit', image: '🍊' },
    ],
  },
  petshop: {
    type: 'petshop',
    label: 'Mascotas y Pet Shop',
    icon: '🐾',
    description: 'Alimento, snacks, juguetes, higiene, correas y accesorios para perros y gatos',
    categories: [
      { key: 'all', label: 'Todos', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200', icon: '📦' },
      { key: 'Perros', label: 'Alimento Perros', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200', icon: '🐕' },
      { key: 'Gatos', label: 'Alimento Gatos', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200', icon: '🐈' },
      { key: 'Juguetes', label: 'Juguetes y Correas', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200', icon: '🎾' },
      { key: 'Higiene', label: 'Higiene y Salud', color: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200', icon: '🛁' },
    ],
    sampleProducts: [
      { name: 'Alimento Perro Adulto Carne y Arroz 2kg', description: 'Nutrición balanceada con omega 3 y 6', category: 'Perros', priceUSD: 6.50, costUSD: 4.20, stock: 20, minStock: 4, unit: 'unit', image: '🐕' },
      { name: 'Snack Premios Dentales para Perros (7 uds)', description: 'Reduce el sarro y refresca el aliento', category: 'Perros', priceUSD: 2.80, costUSD: 1.30, stock: 30, minStock: 6, unit: 'pack', image: '🦴' },
      { name: 'Alimento Gato Salmón y Atún 1.5kg', description: 'Control de bolas de pelo y salud urinaria', category: 'Gatos', priceUSD: 5.80, costUSD: 3.70, stock: 22, minStock: 4, unit: 'unit', image: '🐈' },
      { name: 'Arena Sanitaria Aglomerante Gatos 4kg', description: 'Control de olores con aroma a lavanda', category: 'Higiene', priceUSD: 4.50, costUSD: 2.60, stock: 25, minStock: 5, unit: 'unit', image: '📦' },
      { name: 'Shampoo Antipulgas para Mascotas 350ml', description: 'Elimina pulgas y garrapatas con extractos naturales', category: 'Higiene', priceUSD: 3.80, costUSD: 1.90, stock: 18, minStock: 3, unit: 'unit', image: '🧴' },
      { name: 'Pelota de Goma Resistente con Sonido', description: 'Juguete interactivo para morder y buscar', category: 'Juguetes', priceUSD: 2.50, costUSD: 1.00, stock: 35, minStock: 6, unit: 'unit', image: '🎾' },
    ],
  },
  general: {
    type: 'general',
    label: 'Comercio General / Mixto',
    icon: '🏬',
    description: 'Catálogo versátil y personalizable para cualquier tipo de negocio o tienda',
    categories: [
      { key: 'all', label: 'Todos', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200', icon: '📦' },
      { key: 'Principal', label: 'Productos Principales', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200', icon: '⭐' },
      { key: 'Secundario', label: 'Accesorios y Varios', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200', icon: '🏷️' },
      { key: 'Promociones', label: 'Promociones', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200', icon: '🔥' },
    ],
    sampleProducts: [
      { name: 'Producto Destacado A', description: 'Artículo principal del negocio', category: 'Principal', priceUSD: 5.00, costUSD: 2.50, stock: 30, minStock: 5, unit: 'unit', image: '⭐' },
      { name: 'Producto Básico B', description: 'Artículo complementario', category: 'Secundario', priceUSD: 2.50, costUSD: 1.20, stock: 40, minStock: 8, unit: 'unit', image: '🏷️' },
      { name: 'Combo Especial Promoción', description: 'Paquete con descuento', category: 'Promociones', priceUSD: 9.99, costUSD: 5.50, stock: 15, minStock: 3, unit: 'unit', image: '🔥' },
    ],
  },
};


import { db, LocalProduct } from '@/lib/db';
import { BrandingConfig, applyBrandingToDOM, IndustrialBgPreset } from '@/lib/theme';

export type StandardRubroId = 'bodega' | 'market' | 'pharmacy' | 'bakery' | 'liquor' | 'bookstore';

export interface RubroCategory {
  name: string;
  badgeColor: string;
}

export interface RubroStandardDefinition {
  id: StandardRubroId;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  defaultStoreName: string;
  recommendedPaletteId: string;
  recommendedBgPreset: IndustrialBgPreset;
  categories: string[];
  sampleProducts: Array<{
    barcode: string;
    name: string;
    category: string;
    priceUSD: number;
    costUSD: number;
    stock: number;
    minStock: number;
    unit: string;
    image?: string;
  }>;
}

export const STANDARD_RUBROS: Record<StandardRubroId, RubroStandardDefinition> = {
  bodega: {
    id: 'bodega',
    name: 'Bodega Tradicional',
    icon: '🏪',
    tagline: 'Víveres esenciales, charcutería al corte, abarrotes y golosinas',
    description: 'Ideal para abastos de barrio, bodegas familiares y comercio vecinal con alta rotación diaria.',
    defaultStoreName: 'Bodega & Víveres La Fe',
    recommendedPaletteId: 'amber',
    recommendedBgPreset: 'white',
    categories: ['Víveres', 'Charcutería', 'Bebidas', 'Snacks', 'Limpieza', 'Cuidado Personal'],
    sampleProducts: [
      {
        barcode: '759100100101',
        name: 'Harina PAN Maíz Blanco 1kg',
        category: 'Víveres',
        priceUSD: 1.25,
        costUSD: 0.95,
        stock: 50,
        minStock: 10,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      },
      {
        barcode: '759100100102',
        name: 'Arroz Primor Tradicional 1kg',
        category: 'Víveres',
        priceUSD: 1.35,
        costUSD: 1.00,
        stock: 40,
        minStock: 8,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80',
      },
      {
        barcode: '759100100103',
        name: 'Pasta Capri Larga 1kg',
        category: 'Víveres',
        priceUSD: 1.60,
        costUSD: 1.15,
        stock: 35,
        minStock: 8,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80',
      },
      {
        barcode: '759100100104',
        name: 'Aceite Mazeite Comestible 1L',
        category: 'Víveres',
        priceUSD: 2.75,
        costUSD: 2.15,
        stock: 25,
        minStock: 5,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
      },
      {
        barcode: '759100100105',
        name: 'Azúcar Montalbán 1kg',
        category: 'Víveres',
        priceUSD: 1.30,
        costUSD: 0.95,
        stock: 30,
        minStock: 6,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?w=400&q=80',
      },
      {
        barcode: '759100100106',
        name: 'Café Fama de América 250g',
        category: 'Víveres',
        priceUSD: 2.50,
        costUSD: 1.85,
        stock: 28,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
      },
      {
        barcode: '759100100107',
        name: 'Queso Blanco Llanero Duro (kg)',
        category: 'Charcutería',
        priceUSD: 5.20,
        costUSD: 3.90,
        stock: 18,
        minStock: 4,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
      },
      {
        barcode: '759100100108',
        name: 'Huevos Frescos Granja (Cartón 30 uds)',
        category: 'Víveres',
        priceUSD: 4.80,
        costUSD: 3.80,
        stock: 20,
        minStock: 5,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80',
      },
      {
        barcode: '759100100109',
        name: 'Mayonesa Mavesa 445g',
        category: 'Víveres',
        priceUSD: 2.40,
        costUSD: 1.75,
        stock: 22,
        minStock: 5,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400&q=80',
      },
      {
        barcode: '759100100110',
        name: 'Refresco Coca-Cola 1.5L',
        category: 'Bebidas',
        priceUSD: 2.00,
        costUSD: 1.45,
        stock: 30,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
      },
      {
        barcode: '759100100111',
        name: 'Galletas María Puig 150g',
        category: 'Snacks',
        priceUSD: 0.95,
        costUSD: 0.65,
        stock: 45,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
      },
      {
        barcode: '759100100112',
        name: 'Detergente Las Llaves Limón 1kg',
        category: 'Limpieza',
        priceUSD: 2.30,
        costUSD: 1.70,
        stock: 25,
        minStock: 5,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=400&q=80',
      },
    ],
  },

  market: {
    id: 'market',
    name: 'Supermercado & Minimarket',
    icon: '🛒',
    tagline: 'Alimentos frescos, frutas, verduras, carnes, lácteos y enlatados',
    description: 'Diseñado para supermercados, bodegones mixtos y tiendas de autoservicio con múltiples departamentos.',
    defaultStoreName: 'Venemarket Express C.A.',
    recommendedPaletteId: 'sky',
    recommendedBgPreset: 'blue',
    categories: ['Víveres', 'Carnes y Pollo', 'Frutas y Verduras', 'Charcutería', 'Lácteos', 'Bebidas', 'Limpieza'],
    sampleProducts: [
      {
        barcode: '759100200201',
        name: 'Pechuga de Pollo Fresca deshuesada (kg)',
        category: 'Carnes y Pollo',
        priceUSD: 4.80,
        costUSD: 3.50,
        stock: 25,
        minStock: 5,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80',
      },
      {
        barcode: '759100200202',
        name: 'Carne Molida de Primera (kg)',
        category: 'Carnes y Pollo',
        priceUSD: 6.20,
        costUSD: 4.60,
        stock: 20,
        minStock: 4,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=400&q=80',
      },
      {
        barcode: '759100200203',
        name: 'Jamón Superior Plumrose Rebanado 250g',
        category: 'Charcutería',
        priceUSD: 3.80,
        costUSD: 2.90,
        stock: 24,
        minStock: 6,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=400&q=80',
      },
      {
        barcode: '759100200204',
        name: 'Queso Amarillo Gouda Holandés (kg)',
        category: 'Charcutería',
        priceUSD: 7.90,
        costUSD: 5.80,
        stock: 14,
        minStock: 3,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80',
      },
      {
        barcode: '759100200205',
        name: 'Leche Completa Pasteurizada 1L',
        category: 'Lácteos',
        priceUSD: 2.10,
        costUSD: 1.45,
        stock: 32,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
      },
      {
        barcode: '759100200206',
        name: 'Mantequilla con Sal Mavesa 500g',
        category: 'Lácteos',
        priceUSD: 2.60,
        costUSD: 1.90,
        stock: 25,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80',
      },
      {
        barcode: '759100200207',
        name: 'Manzanas Rojas Importadas (kg)',
        category: 'Frutas y Verduras',
        priceUSD: 3.40,
        costUSD: 2.20,
        stock: 30,
        minStock: 5,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
      },
      {
        barcode: '759100200208',
        name: 'Papas Blancas Seleccionadas (kg)',
        category: 'Frutas y Verduras',
        priceUSD: 1.40,
        costUSD: 0.85,
        stock: 50,
        minStock: 10,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80',
      },
      {
        barcode: '759100200209',
        name: 'Atún Margarita en Aceite 140g',
        category: 'Víveres',
        priceUSD: 1.70,
        costUSD: 1.20,
        stock: 45,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1534483509719-3feaee7c30da?w=400&q=80',
      },
      {
        barcode: '759100200210',
        name: 'Papel Higiénico Rosal Plus (4 Rollos)',
        category: 'Limpieza',
        priceUSD: 2.20,
        costUSD: 1.50,
        stock: 30,
        minStock: 6,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?w=400&q=80',
      },
    ],
  },

  pharmacy: {
    id: 'pharmacy',
    name: 'Farmacia & Cuidado de la Salud',
    icon: '💊',
    tagline: 'Medicamentos, analgésicos, primeros auxilios, higiene y cuidado personal',
    description: 'Configuración para farmacias, droguerías, botiquerías y centros de atención médica ambulatoria.',
    defaultStoreName: 'Farmacia & Droguería San Rafael',
    recommendedPaletteId: 'teal',
    recommendedBgPreset: 'teal',
    categories: ['Medicamentos', 'Primeros Auxilios', 'Cuidado Personal', 'Vitaminas y Suplementos', 'Infantil y Bebé'],
    sampleProducts: [
      {
        barcode: '759100300301',
        name: 'Acetaminofén / Paracetamol 500mg (10 Tabs)',
        category: 'Medicamentos',
        priceUSD: 1.50,
        costUSD: 0.75,
        stock: 80,
        minStock: 15,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
      },
      {
        barcode: '759100300302',
        name: 'Ibuprofeno 400mg Antiinflamatorio (10 Tabs)',
        category: 'Medicamentos',
        priceUSD: 1.80,
        costUSD: 0.90,
        stock: 65,
        minStock: 12,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
      },
      {
        barcode: '759100300303',
        name: 'Omeprazol 20mg Cápsulas (14 Caps)',
        category: 'Medicamentos',
        priceUSD: 2.60,
        costUSD: 1.30,
        stock: 45,
        minStock: 8,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
      },
      {
        barcode: '759100300304',
        name: 'Alcohol Antiséptico 70% 500ml',
        category: 'Primeros Auxilios',
        priceUSD: 1.95,
        costUSD: 1.10,
        stock: 50,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&q=80',
      },
      {
        barcode: '759100300305',
        name: 'Curitas Adhesivas Flexibles (Caja 30 uds)',
        category: 'Primeros Auxilios',
        priceUSD: 1.20,
        costUSD: 0.55,
        stock: 60,
        minStock: 10,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=400&q=80',
      },
      {
        barcode: '759100300306',
        name: 'Vitamina C Masticable 500mg (30 Tabs)',
        category: 'Vitaminas y Suplementos',
        priceUSD: 3.50,
        costUSD: 1.80,
        stock: 35,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400&q=80',
      },
      {
        barcode: '759100300307',
        name: 'Protector Solar FPS 50+ Facial Toque Seco 50ml',
        category: 'Cuidado Personal',
        priceUSD: 8.50,
        costUSD: 4.80,
        stock: 20,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
      },
      {
        barcode: '759100300308',
        name: 'Suero Oral Rehidratante Electrolitos 500ml',
        category: 'Medicamentos',
        priceUSD: 2.20,
        costUSD: 1.25,
        stock: 40,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&q=80',
      },
      {
        barcode: '759100300309',
        name: 'Pañales Huggies Talla M (Pack 24 uds)',
        category: 'Infantil y Bebé',
        priceUSD: 7.20,
        costUSD: 5.20,
        stock: 25,
        minStock: 5,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&q=80',
      },
      {
        barcode: '759100300310',
        name: 'Jabón Líquido Antibacterial Protex 250ml',
        category: 'Cuidado Personal',
        priceUSD: 2.50,
        costUSD: 1.60,
        stock: 35,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1607006411601-775c8cc632dc?w=400&q=80',
      },
    ],
  },

  bakery: {
    id: 'bakery',
    name: 'Panadería, Cafetería & Pastelería',
    icon: '🥐',
    tagline: 'Panadería artesanal, café expreso, cachitos de jamón, bollería y dulces',
    description: 'Especializada en cafeterías, panaderías, delis, pastelerías y reposterías con servicio rápido.',
    defaultStoreName: 'Panadería & Pastelería La Mansión',
    recommendedPaletteId: 'coral',
    recommendedBgPreset: 'white',
    categories: ['Panadería', 'Cafetería y Bebidas', 'Desayunos y Salados', 'Pastelería y Repostería', 'Charcutería'],
    sampleProducts: [
      {
        barcode: '759100400401',
        name: 'Pan Canilla Tradicional Caliente',
        category: 'Panadería',
        priceUSD: 0.50,
        costUSD: 0.20,
        stock: 120,
        minStock: 20,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      },
      {
        barcode: '759100400402',
        name: 'Pan Campesino Rústico con Ajonjolí',
        category: 'Panadería',
        priceUSD: 1.50,
        costUSD: 0.60,
        stock: 45,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&q=80',
      },
      {
        barcode: '759100400403',
        name: 'Cachito de Jamón Ahumado',
        category: 'Desayunos y Salados',
        priceUSD: 2.20,
        costUSD: 0.90,
        stock: 50,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
      },
      {
        barcode: '759100400404',
        name: 'Croissant Francés de Mantequilla',
        category: 'Panadería',
        priceUSD: 1.80,
        costUSD: 0.70,
        stock: 35,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80',
      },
      {
        barcode: '759100400405',
        name: 'Café Expreso Doble Italiano',
        category: 'Cafetería y Bebidas',
        priceUSD: 1.40,
        costUSD: 0.35,
        stock: 200,
        minStock: 20,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80',
      },
      {
        barcode: '759100400406',
        name: 'Café con Leche Grande (12oz)',
        category: 'Cafetería y Bebidas',
        priceUSD: 2.20,
        costUSD: 0.70,
        stock: 150,
        minStock: 20,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&q=80',
      },
      {
        barcode: '759100400407',
        name: 'Pastelito de Hojaldre con Queso y Jamón',
        category: 'Desayunos y Salados',
        priceUSD: 1.60,
        costUSD: 0.65,
        stock: 40,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&q=80',
      },
      {
        barcode: '759100400408',
        name: 'Golfeado Tradicional con Queso de Mano',
        category: 'Panadería',
        priceUSD: 2.80,
        costUSD: 1.20,
        stock: 30,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
      },
      {
        barcode: '759100400409',
        name: 'Porción Torta Tres Leches Casera',
        category: 'Pastelería y Repostería',
        priceUSD: 3.50,
        costUSD: 1.30,
        stock: 16,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
      },
      {
        barcode: '759100400410',
        name: 'Jugo Natural de Naranja 400ml',
        category: 'Cafetería y Bebidas',
        priceUSD: 2.00,
        costUSD: 0.75,
        stock: 35,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&q=80',
      },
    ],
  },

  liquor: {
    id: 'liquor',
    name: 'Licorería & Bodegón',
    icon: '🍾',
    tagline: 'Cervezas bien frías, rones, whisky, vinos, hielo y snacks nocturnos',
    description: 'Perfecto para licorerías, distribuidoras de bebidas, bodegones premium y tiendas de conveniencia.',
    defaultStoreName: 'Bodegón & Licorería La Ronda',
    recommendedPaletteId: 'purple',
    recommendedBgPreset: 'gray',
    categories: ['Cervezas', 'Rones y Destilados', 'Whisky', 'Vinos y Sangrías', 'Hielo y Mezcladores', 'Snacks'],
    sampleProducts: [
      {
        barcode: '759100500501',
        name: 'Cerveza Polar Pilsen Tercio 330ml (Caja 24 uds)',
        category: 'Cervezas',
        priceUSD: 18.50,
        costUSD: 15.00,
        stock: 30,
        minStock: 5,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1608270118837-1c1097e33e9d?w=400&q=80',
      },
      {
        barcode: '759100500502',
        name: 'Cerveza Polar Light Lata 355ml',
        category: 'Cervezas',
        priceUSD: 1.00,
        costUSD: 0.75,
        stock: 120,
        minStock: 24,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1608270118837-1c1097e33e9d?w=400&q=80',
      },
      {
        barcode: '759100500503',
        name: 'Ron Santa Teresa Gran Reserva 0.75L',
        category: 'Rones y Destilados',
        priceUSD: 9.50,
        costUSD: 7.20,
        stock: 25,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80',
      },
      {
        barcode: '759100500504',
        name: 'Ron Cacique Añejo Superior 0.75L',
        category: 'Rones y Destilados',
        priceUSD: 8.80,
        costUSD: 6.80,
        stock: 25,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80',
      },
      {
        barcode: '759100500505',
        name: 'Whisky Buchanan\'s 12 Años De Luxe 0.75L',
        category: 'Whisky',
        priceUSD: 32.00,
        costUSD: 24.50,
        stock: 12,
        minStock: 2,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80',
      },
      {
        barcode: '759100500506',
        name: 'Vino Tinto Concha y Toro Cabernet 750ml',
        category: 'Vinos y Sangrías',
        priceUSD: 7.50,
        costUSD: 4.80,
        stock: 20,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80',
      },
      {
        barcode: '759100500507',
        name: 'Sangría Caroreña Tinto Verano 1.75L',
        category: 'Vinos y Sangrías',
        priceUSD: 5.50,
        costUSD: 3.80,
        stock: 28,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&q=80',
      },
      {
        barcode: '759100500508',
        name: 'Hielo Cristal en Bolsa 3kg',
        category: 'Hielo y Mezcladores',
        priceUSD: 1.50,
        costUSD: 0.70,
        stock: 40,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
      },
      {
        barcode: '759100500509',
        name: 'Refresco Coca-Cola 2L (Mezclador)',
        category: 'Hielo y Mezcladores',
        priceUSD: 2.50,
        costUSD: 1.80,
        stock: 35,
        minStock: 8,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80',
      },
      {
        barcode: '759100500510',
        name: 'Doritos Mega Queso Fiesta 145g',
        category: 'Snacks',
        priceUSD: 2.40,
        costUSD: 1.60,
        stock: 30,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
      },
    ],
  },

  bookstore: {
    id: 'bookstore',
    name: 'Librería & Papelería',
    icon: '📚',
    tagline: 'Útiles escolares, cuadernos, resmas de papel, dibujo, arte y oficina',
    description: 'Orientado a papelerías comerciales, librerías, copisterías y tiendas de artículos escolares.',
    defaultStoreName: 'Librería & Papelería El Estudiante',
    recommendedPaletteId: 'indigo',
    recommendedBgPreset: 'blue',
    categories: ['Cuadernos', 'Útiles Escolares', 'Papelería y Resmas', 'Arte y Dibujo', 'Oficina y Archivo'],
    sampleProducts: [
      {
        barcode: '759100600601',
        name: 'Cuaderno Cosido Doble Línea 100 Hojas',
        category: 'Cuadernos',
        priceUSD: 1.80,
        costUSD: 0.90,
        stock: 75,
        minStock: 15,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
      },
      {
        barcode: '759100600602',
        name: 'Cuaderno Cuadriculado 100 Hojas',
        category: 'Cuadernos',
        priceUSD: 1.80,
        costUSD: 0.90,
        stock: 65,
        minStock: 15,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80',
      },
      {
        barcode: '759100600603',
        name: 'Caja de Lápices Grafito Mongol HB (12 uds)',
        category: 'Útiles Escolares',
        priceUSD: 2.60,
        costUSD: 1.25,
        stock: 45,
        minStock: 8,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80',
      },
      {
        barcode: '759100600604',
        name: 'Resma de Papel Bond Carta 75g (500 Hojas)',
        category: 'Papelería y Resmas',
        priceUSD: 5.50,
        costUSD: 3.80,
        stock: 30,
        minStock: 6,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&q=80',
      },
      {
        barcode: '759100600605',
        name: 'Set de Marcadores Punta Fina (24 Colores)',
        category: 'Arte y Dibujo',
        priceUSD: 4.80,
        costUSD: 2.30,
        stock: 25,
        minStock: 5,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&q=80',
      },
      {
        barcode: '759100600606',
        name: 'Juego de Geometría Escolar 4 Piezas',
        category: 'Útiles Escolares',
        priceUSD: 2.20,
        costUSD: 1.05,
        stock: 40,
        minStock: 8,
        unit: 'pack',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80',
      },
      {
        barcode: '759100600607',
        name: 'Carpeta de Archivo de Palanca Oficio',
        category: 'Oficina y Archivo',
        priceUSD: 3.40,
        costUSD: 1.95,
        stock: 22,
        minStock: 4,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=400&q=80',
      },
      {
        barcode: '759100600608',
        name: 'Pega Blanca Líquida Escolar 250ml',
        category: 'Útiles Escolares',
        priceUSD: 1.40,
        costUSD: 0.65,
        stock: 40,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80',
      },
      {
        barcode: '759100600609',
        name: 'Borrador de Nata Escolar Suave',
        category: 'Útiles Escolares',
        priceUSD: 0.50,
        costUSD: 0.18,
        stock: 100,
        minStock: 20,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80',
      },
      {
        barcode: '759100600610',
        name: 'Tijera Escolar Punta Roma Acero',
        category: 'Útiles Escolares',
        priceUSD: 1.20,
        costUSD: 0.50,
        stock: 50,
        minStock: 10,
        unit: 'unidad',
        image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=400&q=80',
      },
    ],
  },
};

/**
 * Aplica el rubro seleccionado al sistema:
 * 1. Configura el tema de color recomendado y el preset de fondo.
 * 2. Carga los productos de muestra en Dexie (modo replace o merge).
 * 3. Actualiza el nombre de la tienda en settings.
 * 4. Envía broadcast a la app móvil.
 */
export async function applyRubroToSystem(
  rubroId: StandardRubroId,
  options: {
    loadProducts?: boolean;
    productMode?: 'replace' | 'merge';
    updateStoreName?: boolean;
  } = { loadProducts: true, productMode: 'replace', updateStoreName: true }
): Promise<{ success: boolean; productCount: number; message: string }> {
  const rubro = STANDARD_RUBROS[rubroId];
  if (!rubro) {
    return { success: false, productCount: 0, message: 'Rubro no encontrado' };
  }

  // 1. Aplicar Branding / Tema
  const brandingConfig: BrandingConfig = {
    paletteId: rubro.recommendedPaletteId,
    uiStyle: 'industrial',
    industrialBg: rubro.recommendedBgPreset,
  };
  applyBrandingToDOM(brandingConfig);

  try {
    localStorage.setItem('venematic_branding_palette', brandingConfig.paletteId);
    localStorage.setItem('venematic_ui_style', brandingConfig.uiStyle);
    localStorage.setItem('venematic_industrial_bg', brandingConfig.industrialBg || 'white');
    localStorage.setItem('venematic_active_rubro', rubroId);
    await db.settings.put({ key: 'branding_config', value: brandingConfig });
    await db.settings.put({ key: 'active_rubro', value: rubroId });
  } catch {}

  // 2. Actualizar nombre de tienda si se solicitó
  if (options.updateStoreName) {
    try {
      const existingInfo = await db.settings.get('store_info');
      const updatedInfo = {
        name: rubro.defaultStoreName,
        rif: existingInfo?.value?.rif || 'J-40123456-7',
        phone: existingInfo?.value?.phone || '0414-1234567',
        address: existingInfo?.value?.address || 'Av. Principal, Local 1',
        footerMessage: existingInfo?.value?.footerMessage || '¡Gracias por su compra!',
      };
      await db.settings.put({ key: 'store_info', value: updatedInfo });
    } catch {}
  }

  // 3. Cargar productos de muestra si se solicitó
  let insertedCount = 0;
  if (options.loadProducts) {
    await db.transaction('rw', db.products, async () => {
      if (options.productMode === 'replace') {
        await db.products.clear();
      }

      for (const p of rubro.sampleProducts) {
        const existing = await db.products.where('barcode').equals(p.barcode).first();
        if (existing) {
          await db.products.update(existing.id!, {
            ...p,
            updatedAt: new Date().toISOString(),
          });
        } else {
          await db.products.add({
            ...p,
            updatedAt: new Date().toISOString(),
          } as LocalProduct);
          insertedCount++;
        }
      }
    });

    // Sincronizar catálogo al celular automáticamente
    try {
      const allProducts = await db.products.toArray();
      const bcv = await db.settings.get('bcv_rate');
      await fetch('/api/scanner/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: allProducts,
          bcvRate: bcv?.value || 848.55,
        }),
      }).catch(() => {});
    } catch {}
  }

  // Notificar al sistema
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('venematic:rubro_changed', {
        detail: {
          rubroId,
          rubroName: rubro.name,
          storeName: rubro.defaultStoreName,
        },
      })
    );
  }

  return {
    success: true,
    productCount: rubro.sampleProducts.length,
    message: `¡Rubro "${rubro.name}" aplicado con éxito! Tema y catálogo configurados.`,
  };
}
