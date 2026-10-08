const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.CATALOG_SHARP_MODULE || 'sharp');
const { buildCatalog } = require('../js/catalog-seed-data.js');

async function main() {
  const manifest = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
  const byId = new Map(manifest.map(item => [item.id, item.path]));
  const destination = path.resolve(__dirname, '../assets/catalog');
  await fs.mkdir(destination, { recursive: true });
  for (const product of buildCatalog()) {
    const source = byId.get(product.id);
    if (!source) {
      if (process.argv.includes('--partial')) continue;
      throw new Error(`Missing original photograph: ${product.id}`);
    }
    await sharp(source).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(destination, product.id + '.webp'));
    await sharp(source).resize(400, 400, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(destination, product.id + '-thumb.webp'));
  }
  console.log(`Prepared ${byId.size} original product photographs and card thumbnails.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
