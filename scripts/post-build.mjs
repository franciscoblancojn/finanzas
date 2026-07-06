import { readFileSync, writeFileSync, readdirSync, existsSync, unlinkSync, rmdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const htmlPath = join(distDir, 'index.html');

if (!existsSync(htmlPath)) {
  console.error('dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

let html = readFileSync(htmlPath, 'utf-8');

const scriptRegex = /<script[^>]*src\s*=\s*"([^"]+)"[^>]*><\/script>/g;
let match;
const filesToDelete = [];

while ((match = scriptRegex.exec(html)) !== null) {
  const fullTag = match[0];
  const srcPath = match[1];

  let jsPath;
  if (srcPath.startsWith('/')) {
    jsPath = join(distDir, srcPath);
  } else {
    jsPath = join(distDir, srcPath);
  }

  if (existsSync(jsPath)) {
    console.log(`Inlining: ${srcPath}`);
    const jsContent = readFileSync(jsPath, 'utf-8');
    // Use a replacement function to avoid $ patterns being interpreted
    html = html.replace(fullTag, () => `<script type="module">${jsContent}</script>`);
    filesToDelete.push(jsPath);
  } else {
    console.warn(`Warning: JS file not found: ${jsPath}`);
  }
}

writeFileSync(htmlPath, html, 'utf-8');
console.log('Inlined JS into index.html');

// Delete external files
filesToDelete.forEach(p => {
  try { unlinkSync(p); } catch {}
});

// Clean up empty _astro directory
const astroDir = join(distDir, '_astro');
if (existsSync(astroDir)) {
  const remaining = readdirSync(astroDir);
  if (remaining.length === 0) {
    try { rmdirSync(astroDir); } catch {}
    console.log('Cleaned up empty _astro directory');
  }
}

console.log('Done! Single HTML file is ready.');
