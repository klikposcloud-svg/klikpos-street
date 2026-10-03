const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'src/app/tablet-pos/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

const oldTarget = `{cardViewMode === 'lista' && (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1 pb-24 scrollbar-none">`;

const newTarget = `{cardViewMode === 'lista' && (
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y p-1 pb-24 scrollbar-none catalog-scroll-area bg-[#070a12]" style={{ backgroundColor: "#070a12" }}>`;

if (content.includes(oldTarget)) {
  content = content.replace(oldTarget, newTarget);
  fs.writeFileSync(pagePath, content, 'utf8');
  console.log('Successfully updated lista container with catalog-scroll-area');
} else {
  console.log('Target string already updated or not found');
}
