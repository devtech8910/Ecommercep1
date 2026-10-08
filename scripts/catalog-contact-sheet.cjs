const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require(process.env.CATALOG_SHARP_MODULE || 'sharp');
const { buildCatalog } = require('../js/catalog-seed-data.js');

async function main() {
  const output = process.env.CATALOG_QA_OUTPUT;
  if (!output) throw new Error('Set CATALOG_QA_OUTPUT for contact sheets');
  await fs.mkdir(output, { recursive: true });
  for (const category of ['mens', 'womens', 'kids', 'accessories']) {
    const products = buildCatalog().filter(product => product.category === category);
    for (let offset = 0; offset < products.length; offset += 25) {
      const layers = [];
      for (const [index, product] of products.slice(offset, offset + 25).entries()) {
        const file = path.resolve(__dirname, '..', '.' + product.image_url);
        let image;
        try { image = await sharp(file).resize(220, 220, { fit: 'contain' }).toBuffer(); }
        catch (error) { if (error.message.includes('missing') || error.message.includes('Input file')) continue; throw error; }
        const left = (index % 5) * 240 + 10;
        const top = Math.floor(index / 5) * 260;
        layers.push({ input: image, left, top });
        const label = `<svg width="220" height="35"><text x="3" y="15" font-size="13" fill="#222">${product.id}</text><text x="3" y="31" font-size="12" fill="#222">${product.productType} / ${product.colors[0]}</text></svg>`;
        layers.push({ input: Buffer.from(label), left, top: top + 220 });
      }
      if (!layers.length) continue;
      await sharp({ create: { width: 1200, height: 1300, channels: 3, background: '#fff' } }).composite(layers).png().toFile(path.join(output, `contact-${category}-${offset + 1}.png`));
    }
  }
  console.log('Contact sheets saved to ' + output);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
