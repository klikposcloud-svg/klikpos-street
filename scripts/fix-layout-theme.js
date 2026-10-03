const fs = require('fs');
const path = require('path');

const layoutPath = path.join(__dirname, '..', 'src/app/layout.tsx');
let layout = fs.readFileSync(layoutPath, 'utf8');

const targetStr = "var t = localStorage.getItem('venematic_theme');";
const replacementStr = `var isTabletPos = typeof window !== 'undefined' && (window.location.pathname.indexOf('/tablet-pos') !== -1 || window.location.hash.indexOf('tablet-pos') !== -1);
                  var t = isTabletPos ? 'dark' : localStorage.getItem('venematic_theme');`;

if (layout.includes(targetStr)) {
  layout = layout.replace(targetStr, replacementStr);
  
  // Tambien asegurar que si es tablet-pos no aplique fondo blanco en ind
  const bgThemesStr = "var ind = bgThemes[bgPreset] || bgThemes.white;";
  const bgThemesRep = `var ind = bgThemes[bgPreset] || bgThemes.white;
                  if (isTabletPos) {
                    isDark = true;
                    ind = { bg: '#070a12', card: '#0c1220', text: '#ffffff', muted: '#94a3b8', border: '#1e293b', secBg: '#090d16', secBorder: '#1e293b', secText: '#ffffff' };
                  }`;
  
  if (layout.includes(bgThemesStr)) {
    layout = layout.replace(bgThemesStr, bgThemesRep);
  }
  
  fs.writeFileSync(layoutPath, layout, 'utf8');
  console.log('Successfully updated layout.tsx for Street POS dark mode!');
} else {
  console.log('Target string already replaced or not found in layout.tsx');
}
