const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'src/styles/globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

const streetRule = `
/* ========================================================================= */
/* BLINDAJE INMUTABLE KLIKPOS STREET: 100% DARK PERMANENTE                    */
/* ANULA CUALQUIER REGLA INDUSTRIAL/WHITE DEL CANVAS                          */
/* ========================================================================= */
body:has(#klikpos-street-root),
body:has(.street-pos-dark-canvas),
#klikpos-street-root,
.street-pos-dark-canvas,
#klikpos-street-root main,
.street-pos-dark-canvas main,
#klikpos-street-root main > div,
.street-pos-dark-canvas main > div,
#klikpos-street-root .catalog-scroll-area,
.street-pos-dark-canvas .catalog-scroll-area,
html[data-theme="light"] #klikpos-street-root,
html[data-theme="light"] .street-pos-dark-canvas,
html[data-theme="light"] #klikpos-street-root main,
html[data-theme="light"] .street-pos-dark-canvas main,
html[data-theme="light"] #klikpos-street-root main > div.flex-1,
html[data-theme="light"] .street-pos-dark-canvas main > div.flex-1,
html:not(.dark) #klikpos-street-root,
html:not(.dark) .street-pos-dark-canvas,
html:not(.dark) #klikpos-street-root main,
html:not(.dark) .street-pos-dark-canvas main,
html:not(.dark) #klikpos-street-root main > div.flex-1,
html:not(.dark) .street-pos-dark-canvas main > div.flex-1 {
  background-color: #070a12 !important;
  background-image: none !important;
  color: #f8fafc !important;
  color-scheme: dark !important;
}

#klikpos-street-root header,
.street-pos-dark-canvas header {
  background-color: #090d16 !important;
  border-color: #1e293b !important;
  color: #ffffff !important;
}
`;

if (!css.includes('BLINDAJE INMUTABLE KLIKPOS STREET')) {
  css = css + '\n' + streetRule;
  fs.writeFileSync(cssPath, css, 'utf8');
  console.log('Appended Street Dark Shield to globals.css successfully!');
} else {
  console.log('Street Dark Shield already exists in globals.css');
}
