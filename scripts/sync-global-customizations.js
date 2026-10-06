const fs = require('fs');
const path = require('path');

const globalSkillsDir = 'C:\\Users\\pcpro\\.gemini\\config\\skills';
const globalAgentsDir = 'C:\\Users\\pcpro\\.gemini\\config\\agents';

if (!fs.existsSync(globalSkillsDir)) fs.mkdirSync(globalSkillsDir, { recursive: true });
if (!fs.existsSync(globalAgentsDir)) fs.mkdirSync(globalAgentsDir, { recursive: true });

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 1. Copiar Skills locales (.agents/skills) a Global
const localSkills1 = 'C:\\Users\\pcpro\\OneDrive\\Documents\\venematic-master\\.agents\\skills';
const localSkills2 = 'C:\\Users\\pcpro\\OneDrive\\Documents\\venematic-master\\venematic-master\\.agents\\skills';

if (fs.existsSync(localSkills1)) {
  for (const s of fs.readdirSync(localSkills1)) {
    copyDirRecursive(path.join(localSkills1, s), path.join(globalSkillsDir, s));
  }
}
if (fs.existsSync(localSkills2)) {
  for (const s of fs.readdirSync(localSkills2)) {
    copyDirRecursive(path.join(localSkills2, s), path.join(globalSkillsDir, s));
  }
}

// 2. Copiar Agentes locales (.agents/agents) a Global
const localAgents = 'C:\\Users\\pcpro\\OneDrive\\Documents\\venematic-master\\venematic-master\\.agents\\agents';
if (fs.existsSync(localAgents)) {
  for (const a of fs.readdirSync(localAgents)) {
    const src = path.join(localAgents, a);
    const dest = path.join(globalAgentsDir, a);
    if (fs.statSync(src).isDirectory()) {
      copyDirRecursive(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

console.log('✓ Skills globales actualizados en:', globalSkillsDir);
console.log('  Total Skills disponibles:', fs.readdirSync(globalSkillsDir).length);
console.log('✓ Agentes globales actualizados en:', globalAgentsDir);
console.log('  Total Agentes disponibles:', fs.readdirSync(globalAgentsDir).length);
