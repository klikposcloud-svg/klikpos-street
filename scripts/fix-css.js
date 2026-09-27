const fs = require('fs');

const files = [
  'src/styles/globals.css',
  'venematic-desktop/src/styles/globals.css'
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    const beforeCount = (content.match(/\[class\*="text-white"\]/g) || []).length;
    content = content.replace(/\[class\*="text-white"\]/g, '[class~="text-white"]');
    fs.writeFileSync(f, content, 'utf8');
    console.log(`Replaced ${beforeCount} occurrences in ${f}`);
  }
});
