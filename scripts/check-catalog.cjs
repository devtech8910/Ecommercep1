const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const catalog = require('../js/catalog-seed-data.js');
const root = path.resolve(__dirname, '..');

async function main() {
  const products = catalog.buildCatalog();
  assert.equal(products.length, 200);
  for (const category of ['mens', 'womens', 'kids', 'accessories']) assert.equal(products.filter(p => p.category === category).length, 50);
  for (const key of ['id', 'title', 'image_url']) assert.equal(new Set(products.map(p => p[key])).size, 200, `Duplicate ${key}`);
  const imageHashes = new Set();
  let totalBytes = 0;
  for (const product of products) {
    assert(product.price > 0 && product.mrp >= product.price);
    assert.equal(product.discount, Math.round((product.mrp - product.price) / product.mrp * 100));
    assert.equal(product.reviewCount, 0);
    const sizes = product.sizes.split(',').map(size => size.trim());
    const stock = Object.fromEntries(product.size_stock.split(',').map(pair => pair.trim().split(':')));
    assert(sizes.every(size => Number(stock[size]) > 0));
    const image = fs.readFileSync(path.join(root, product.image_url));
    const thumbnail = fs.readFileSync(path.join(root, product.image_url.replace('.webp', '-thumb.webp')));
    imageHashes.add(crypto.createHash('sha256').update(image).digest('hex'));
    totalBytes += image.length + thumbnail.length;
    assert(image.length < 300000, `Oversized image: ${product.id}`);
  }
  assert.equal(imageHashes.size, 200, 'Photographs must be unique');

  for (const file of ['index.html', 'pages/admin.html', 'pages/shop.html', 'pages/mens-wear.html', 'pages/womens-wear.html', 'pages/kids-wear.html', 'pages/product-details.html']) {
    for (const script of fs.readFileSync(path.join(root, file), 'utf8').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(script[1], { filename: file });
  }

  // Exercise the real handler with isolated shared storage, never production writes.
  const values = new Map([['catalog.json', [{ id: 'seed_mens_001', title: 'Legacy seed', price: 100 }, { id: 'custom_admin_product', title: 'Admin original', category: 'womens', price: 2900 }]]]);
  global.__catalogTestStore = { get: async key => values.get(key), setJSON: async (key, value) => values.set(key, structuredClone(value)) };
  global.__catalogTestDefinitions = catalog;
  let source = fs.readFileSync(path.join(root, 'netlify/functions/products.mjs'), 'utf8');
  source = source.replace("import { getStore } from '@netlify/blobs';", 'const getStore = () => global.__catalogTestStore;');
  source = source.replace("import catalog from '../../js/catalog-seed-data.js';", 'const catalog = global.__catalogTestDefinitions;');
  source = source.replace("import { resolveAccountUser } from './lib/account-session.mjs';", "const resolveAccountUser = async request => request.headers.get('authorization') === 'Bearer unit-admin' ? { role: 'admin' } : null;");
  const { default: handler } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const call = async (method, body, query = '') => {
    const response = await handler(new Request('https://catalog.test/products' + query, { method, headers: { Authorization: 'Bearer unit-admin', 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }));
    return { status: response.status, data: await response.json() };
  };
  const migrated = await call('GET');
  assert.equal(migrated.data.products[0].catalog_revision, catalog.revision);
  assert.equal(migrated.data.products[1].title, 'Admin original');
  assert(values.has('catalog-before-' + catalog.revision + '.json'));
  const seed = { ...products[150] }; delete seed.imagePrompt;
  assert.equal((await call('POST', { action: 'bulk-upsert', products: [seed] })).status, 200);
  const updated = await call('PUT', { id: seed.id, title: 'Admin edited tote', price: 3299, colors: ['Tan'], sizeStock: 'One Size:3' });
  assert.equal(updated.status, 200);
  const fetched = await call('GET', null, '?id=' + seed.id);
  assert.equal(fetched.data.product.title, 'Admin edited tote');
  assert.equal(fetched.data.product.price, 3299);
  assert.deepEqual(fetched.data.product.colors, ['Tan']);
  assert.equal(fetched.data.product.size_stock, 'One Size:3');
  assert.equal(fetched.data.product.stock, 3);
  assert.equal(fetched.data.product.discount, Math.round((fetched.data.product.mrp - 3299) / fetched.data.product.mrp * 100));
  assert.equal(fetched.data.product.image_url, seed.image_url);
  const newImage = '/assets/catalog/seed_accessories_002.webp';
  await call('PUT', { id: seed.id, imageUrl: newImage, sizeStock: 'One Size:0' });
  const changed = await call('GET', null, '?id=' + seed.id);
  assert.deepEqual(changed.data.product.images, [newImage]);
  assert.equal(changed.data.product.stockStatus, 'out-of-stock');
  const embeddedImage = 'data:image/png;base64,aGVsbG8=';
  await call('PUT', { id: seed.id, imageUrl: newImage + ', ' + embeddedImage });
  assert.deepEqual((await call('GET', null, '?id=' + seed.id)).data.product.images, [newImage, embeddedImage]);
  assert.equal((await call('GET', null, '?category=kids')).data.products.length, 0);
  assert.equal((await call('DELETE', { id: seed.id })).status, 200);
  assert.equal((await call('GET', null, '?id=' + seed.id)).status, 404);
  delete global.__catalogTestStore; delete global.__catalogTestDefinitions;
  console.log(JSON.stringify({ products: 200, uniquePhotographs: imageHashes.size, optimizedAssetsMB: +(totalBytes / 1024 / 1024).toFixed(2), migrationAndCRUD: 'passed', inlineScripts: 'passed' }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
