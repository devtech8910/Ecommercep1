const fs = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const publicDirectories = {
  pages: new Set(['.html']),
  css: new Set(['.css']),
  js: new Set(['.js', '.mjs', '.wasm', '.txt']),
  assets: new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico', '.pdf', '.woff', '.woff2', '.ttf', '.txt']),
  uploads: new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
};

async function copyPublicDirectory(relative, extensions) {
  const entries = await fs.readdir(path.join(root, relative), { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
    const target = path.join(relative, entry.name);
    if (entry.isDirectory()) await copyPublicDirectory(target, extensions);
    else if (extensions.has(path.extname(entry.name).toLowerCase())) await copyFile(target);
  }
}

async function copyFile(relative) {
  const target = path.join(output, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(path.join(root, relative), target);
}

async function main() {
  // Only this fixed generated directory is replaced. Repository sources stay private.
  if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw new Error('Invalid build output');
  await fs.rm(output, { recursive: true, force: true });
  await fs.mkdir(output, { recursive: true });
  for (const filename of ['index.html', '404.html', 'config/customer-care.json']) await copyFile(filename);
  for (const [directory, extensions] of Object.entries(publicDirectories)) {
    await copyPublicDirectory(directory, extensions);
  }
  console.log('Built storefront in dist; backend, functions source, scripts, and environment files excluded.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
