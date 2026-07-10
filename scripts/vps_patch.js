// Runs on VPS: downloads component from GitHub and patches all city pages
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOKASI_DIR = '/home/ubuntu/nuswalab/src/app/lokasi';
const COMPONENTS_DIR = '/home/ubuntu/nuswalab/src/components/sections';
const GITHUB_RAW = 'https://raw.githubusercontent.com/rikoconstantine10-ops/webnuswa/claude/affectionate-goldberg-34ukqx/src/components/sections/AIAutomationSection.tsx';

// 1. Download component from GitHub
if (!fs.existsSync(COMPONENTS_DIR)) {
  fs.mkdirSync(COMPONENTS_DIR, { recursive: true });
}
execSync(`curl -sL "${GITHUB_RAW}" -o "${COMPONENTS_DIR}/AIAutomationSection.tsx"`);
const stat = fs.statSync(`${COMPONENTS_DIR}/AIAutomationSection.tsx`);
console.log(`component downloaded: ${stat.size} bytes`);

// 2. Patch city pages
const cityMap = {
  jakarta:'Jakarta',bandung:'Bandung',surabaya:'Surabaya',medan:'Medan',
  semarang:'Semarang',makassar:'Makassar',palembang:'Palembang',tangerang:'Tangerang',
  depok:'Depok',bekasi:'Bekasi',bogor:'Bogor',yogyakarta:'Yogyakarta',
  malang:'Malang',batam:'Batam',pekanbaru:'Pekanbaru',banjarmasin:'Banjarmasin',
  balikpapan:'Balikpapan',samarinda:'Samarinda',manado:'Manado',denpasar:'Denpasar',
  mataram:'Mataram',kupang:'Kupang',ambon:'Ambon',jayapura:'Jayapura',
  pontianak:'Pontianak',padang:'Padang',palu:'Palu',kendari:'Kendari',
  bengkulu:'Bengkulu',jambi:'Jambi',lampung:'Bandar Lampung',serang:'Serang',
  cirebon:'Cirebon',solo:'Solo',
};

function patchFile(filePath, kotaName) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('AIAutomationSection')) {
    console.log(`  SKIP (already patched): ${path.basename(path.dirname(filePath))}`);
    return false;
  }
  // Add import after last import line
  const lastImportMatch = [...content.matchAll(/^import .+;$/gm)];
  if (!lastImportMatch.length) { console.log(`  SKIP (no imports): ${filePath}`); return false; }
  const lastImport = lastImportMatch[lastImportMatch.length - 1];
  const insertAt = lastImport.index + lastImport[0].length;
  const importLine = '\nimport { AIAutomationSection } from "@/components/sections/AIAutomationSection";';
  content = content.slice(0, insertAt) + importLine + content.slice(insertAt);

  // Insert component
  const kotaProp = kotaName ? ` kota="${kotaName}"` : '';
  const tag = `\n      <AIAutomationSection${kotaProp} />\n`;
  if (content.includes('<FAQSection')) {
    content = content.replace(/(\s*)<FAQSection/, tag + '      <FAQSection');
  } else if (content.includes('</main>')) {
    content = content.replace('</main>', tag + '</main>');
  } else {
    const lastSection = content.lastIndexOf('</section>');
    if (lastSection === -1) { console.log(`  SKIP (no insertion point): ${filePath}`); return false; }
    content = content.slice(0, lastSection) + tag + content.slice(lastSection);
  }

  fs.writeFileSync(filePath, content);
  console.log(`  patched: ${path.basename(path.dirname(filePath))}`);
  return true;
}

// Dynamic [kota] template
const dynamicPage = path.join(LOKASI_DIR, '[kota]', 'page.tsx');
if (fs.existsSync(dynamicPage)) {
  patchFile(dynamicPage, null);
  let c = fs.readFileSync(dynamicPage, 'utf8');
  if (c.includes('<AIAutomationSection />')) {
    c = c.replace('<AIAutomationSection />', '<AIAutomationSection kota={data.nama} />');
    fs.writeFileSync(dynamicPage, c);
    console.log('  dynamic kota prop set');
  }
}

// Static city pages
let count = 0;
const entries = fs.readdirSync(LOKASI_DIR, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isDirectory() && entry.name !== '[kota]') {
    const p = path.join(LOKASI_DIR, entry.name, 'page.tsx');
    if (fs.existsSync(p)) {
      const kotaName = cityMap[entry.name] || (entry.name.charAt(0).toUpperCase() + entry.name.slice(1));
      if (patchFile(p, kotaName)) count++;
    }
  }
}
console.log(`\nDone! ${count} static pages patched.`);
