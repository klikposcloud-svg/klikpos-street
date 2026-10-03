const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'src/app/tablet-pos/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Root element: añadir id="klikpos-street-root" y clases street-pos-dark-canvas
content = content.replace(
  '<div\n      className="h-screen flex flex-col font-sans select-none overflow-hidden relative bg-[#090d16] text-slate-100"',
  '<div\n      id="klikpos-street-root"\n      className="h-screen flex flex-col font-sans select-none overflow-hidden relative bg-[#070a12] text-slate-100 street-pos-dark-canvas"'
);

// Si tiene backgroundColor: '#090d16', cambiar a #070a12
content = content.replace(
  "backgroundColor: '#090d16',",
  "backgroundColor: '#070a12',"
);

// 2. Main element: asegurar fondo #070a12 y clase street-pos-dark-canvas
content = content.replace(
  '<main className="flex-1 min-h-0 overflow-hidden flex flex-col p-2 sm:p-3 max-w-6xl mx-auto w-full">',
  '<main className="flex-1 min-h-0 overflow-hidden flex flex-col p-2 sm:p-3 max-w-6xl mx-auto w-full street-pos-dark-canvas" style={{ backgroundColor: "#070a12" }}>'
);

// 3. activeTab === 'menu' container: asegurar fondo #070a12
content = content.replace(
  "{activeTab === 'menu' && (\n          <div className=\"flex-1 min-h-0 flex flex-col space-y-2\">",
  "{activeTab === 'menu' && (\n          <div className=\"flex-1 min-h-0 flex flex-col space-y-2 street-pos-dark-canvas\" style={{ backgroundColor: '#070a12' }}>"
);

// 4. Area de scroll de las cards: clase catalog-scroll-area y estilo #070a12
content = content.replace(
  '<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1 pb-24 scrollbar-none">',
  '<div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1 pb-24 scrollbar-none catalog-scroll-area bg-[#070a12]" style={{ backgroundColor: "#070a12" }}>'
);

// 5. Inyectar script de inicialización inmediata dentro del JSX
const scriptTag = `<script
        dangerouslySetInnerHTML={{
          __html: \`
            (function() {
              document.documentElement.classList.add('dark');
              document.documentElement.classList.remove('light');
              document.documentElement.setAttribute('data-theme', 'dark');
              document.documentElement.style.backgroundColor = '#070a12';
              document.body.style.backgroundColor = '#070a12';
              try { localStorage.setItem('venematic_theme', 'dark'); } catch(e) {}
            })();
          \`
        }}
      />`;

if (!content.includes('id="klikpos-street-root"')) {
  console.log('Replacing return root...');
  content = content.replace(
    'return (\n    <div',
    'return (\n    <div id="klikpos-street-root"'
  );
}

if (!content.includes('localStorage.setItem(\'venematic_theme\', \'dark\')')) {
  // Añadir al inicio del return
  content = content.replace(
    '<style jsx global>{`',
    `${scriptTag}\n      <style jsx global>{\``
  );
  console.log('Injected pre-render dark script into JSX');
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('Updated tablet-pos/page.tsx with bulletproof dark shield!');
