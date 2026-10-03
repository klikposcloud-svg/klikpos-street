const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'src/app/tablet-pos/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Desactivar splash inicial: carga instantanea 0ms
content = content.replace(
  'const [showSplash, setShowSplash] = useState(true);',
  'const [showSplash, setShowSplash] = useState(false);'
);

// 2. Eliminar timer innecesario de splash
const splashTimerPattern = `  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1000);
    return () => clearTimeout(splashTimer);
  }, []);`;

if (content.includes(splashTimerPattern)) {
  content = content.replace(splashTimerPattern, '  // Splash desactivado para carga instantánea 0ms');
  console.log('Removed artificial splash timer');
}

// 3. Asegurar que el header sea siempre dark
content = content.replace(
  /className="h-14 px-3 flex items-center justify-between border-b shrink-0 z-20 shadow-xs bg-\[#090d16\] border-slate-800\/90"/g,
  'className="h-14 px-3 flex items-center justify-between border-b shrink-0 z-20 shadow-xs bg-[#090d16] border-slate-800/90 text-white"'
);

// 4. Asegurar que activeTab === 'cobro' tenga altura y scroll correcto con padding generoso al fondo
const oldCobroBlock = `        {activeTab === 'cobro' && (
          <div className="max-w-xl mx-auto space-y-4 pb-6">`;

const newCobroBlock = `        {activeTab === 'cobro' && (
          <div className="max-w-xl mx-auto w-full space-y-4 flex-1 min-h-0 overflow-y-auto pb-48 px-2 scrollbar-none">`;

if (content.includes(oldCobroBlock)) {
  content = content.replace(oldCobroBlock, newCobroBlock);
  console.log('Updated cobro view container to scrollable with pb-48');
} else if (content.includes("activeTab === 'cobro'")) {
  console.log('Cobro container already updated or modified');
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('Successfully updated tablet-pos/page.tsx!');
