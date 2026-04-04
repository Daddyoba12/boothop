/**
 * Runs before every `next build`.
 * Replaces the CACHE_NAME in public/sw.js with a timestamp
 * so every Vercel deploy gets a unique version, forcing all
 * installed PWAs to flush their old cache automatically.
 */
const fs   = require('fs');
const path = require('path');

const swPath  = path.join(__dirname, '..', 'public', 'sw.js');
const version = Date.now();

let content = fs.readFileSync(swPath, 'utf8');
content = content.replace(
  /const CACHE_NAME = 'boothop-v[\w-]+'/,
  `const CACHE_NAME = 'boothop-v${version}'`
);
fs.writeFileSync(swPath, content);

console.log(`✓ SW cache version → boothop-v${version}`);
