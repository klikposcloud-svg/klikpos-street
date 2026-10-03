const fs = require('fs');
const path = require('path');

const navPath = path.join(__dirname, '..', 'src/components/tablet-pos/TabletPosBottomNav.tsx');
const globalsPath = path.join(__dirname, '..', 'src/styles/globals.css');

const navContent = fs.readFileSync(navPath, 'utf8');
let globalsContent = fs.readFileSync(globalsPath, 'utf8');

// Extraer el contenido de <style jsx global>{` ... `}</style>
const startIdx = navContent.indexOf('<style jsx global>{`');
const endIdx = navContent.indexOf('`}</style>');

if (startIdx !== -1 && endIdx !== -1) {
  const cssExtracted = navContent.substring(startIdx + '<style jsx global>{`'.length, endIdx);
  
  if (!globalsContent.includes('/* POS-NAVBAR DIRECT GLOBAL STYLES */')) {
    globalsContent += '\n\n/* POS-NAVBAR DIRECT GLOBAL STYLES */\n' + cssExtracted;
    fs.writeFileSync(globalsPath, globalsContent, 'utf8');
    console.log('Appended TabletPosBottomNav CSS directly to globals.css!');
  } else {
    console.log('POS-NAVBAR DIRECT GLOBAL STYLES already present in globals.css');
  }
} else {
  console.error('Could not extract styled-jsx block from TabletPosBottomNav.tsx');
}
