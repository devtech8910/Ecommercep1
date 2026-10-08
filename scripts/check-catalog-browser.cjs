const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.CATALOG_PLAYWRIGHT_MODULE || 'playwright');
const { buildCatalog } = require('../js/catalog-seed-data.js');

async function main() {
  const base = process.env.CATALOG_PREVIEW_URL || 'http://127.0.0.1:8080';
  const output = process.env.CATALOG_QA_OUTPUT;
  assert(output, 'Set CATALOG_QA_OUTPUT for screenshots');
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [];
  const consoleErrors = [];
  const watch = (page, name) => {
    page.on('pageerror', error => errors.push(name + ': ' + error.message));
    page.on('console', message => {
      const source = message.location().url || '';
      const expectedMissingProduct = source.includes('/.netlify/functions/products?id=missing-product');
      if (message.type() === 'error' && !page.url().includes('/cart') && !expectedMissingProduct) consoleErrors.push(name + ': ' + message.text() + ' (' + source + ')');
    });
  };
  try {
    const data = await (await fetch(base + '/.netlify/functions/products')).json();
    assert(data.success);
    const products = data.products.filter(p => p.catalog_revision);
    assert.equal(products.length, 200);
    for (const product of products) {
      const response = await fetch(base + product.image_url);
      assert.equal(response.status, 200, product.id);
      assert(response.headers.get('content-type').includes('image/webp'));
    }
    for (const [name, width, height] of [['desktop', 1440, 1000], ['laptop', 1280, 800], ['tablet', 768, 1024], ['mobile', 390, 844], ['small-mobile', 320, 740]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      watch(page, name);
      await page.goto(base + '/pages/shop.html');
      await page.waitForFunction(() => document.querySelectorAll('#accessories-row .shop-carousel-card').length >= 50);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), name + ' shop overflow');
      await page.screenshot({ path: path.join(output, 'shop-' + name + '.png'), fullPage: false });
      await page.goto(base + '/pages/product-details.html?id=seed_accessories_001');
      await page.waitForFunction(() => document.querySelector('#product-title').textContent.includes('Tote'));
      const product = buildCatalog().find(p => p.id === 'seed_accessories_001');
      assert.equal(await page.locator('#product-title').textContent(), product.title);
      assert.equal(await page.locator('#product-description-text').textContent(), product.description);
      assert.equal(await page.locator('#spec-fabric').textContent(), product.fabric);
      assert.equal(await page.locator('#spec-fit').textContent(), product.fit);
      assert((await page.locator('#product-price').textContent()).includes(product.price.toLocaleString('en-IN')));
      assert.equal(await page.locator('.size-btn.active').textContent(), 'One Size');
      assert.equal(await page.locator('#product-rating-summary').textContent(), 'No reviews yet');
      assert.equal(await page.locator('#product-colors button').getAttribute('aria-label'), 'Tan');
      await page.waitForFunction(() => { const image = document.querySelector('.gallery-slide img'); return image && image.complete && image.naturalWidth > 0; });
      assert.equal(await page.locator('.gallery-slide img').first().evaluate(image => getComputedStyle(image).objectFit), 'contain');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), name + ' details overflow');
      await page.screenshot({ path: path.join(output, 'details-' + name + '.png'), fullPage: false });
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    watch(page, 'actions');
    await page.goto(base + '/pages/mens-wear.html');
    await page.waitForFunction(() => document.querySelectorAll('#category-products-grid article').length >= 50);
    await page.locator('#nav-search-input').fill('Fashion Company Oxford');
    await page.waitForFunction(() => document.querySelectorAll('#category-products-grid article').length > 0 && document.querySelectorAll('#category-products-grid article').length < 15);
    assert(await page.locator('#category-products-grid').innerText().then(text => text.includes('Oxford')));
    await page.locator('#nav-search-input').fill('no-match-catalog-check');
    await page.waitForFunction(() => document.querySelectorAll('#category-products-grid article').length === 0);
    assert.equal(await page.locator('#category-products-grid article').count(), 0);
    await page.locator('#nav-search-input').fill('');
    await page.locator('#open-filter-btn').click();
    const material = page.locator('.fabric-cb[value="Cotton Oxford"]');
    await page.locator('.filter-accordion-btn').filter({ hasText: 'FABRIC' }).click();
    await material.check();
    await page.locator('#apply-drawer-filters-btn').click();
    await page.waitForFunction(() => document.querySelectorAll('#category-products-grid article').length === 5);
    assert((await page.locator('#category-products-grid').innerText()).includes('Oxford Shirt'));
    await page.locator('#open-filter-btn').click();
    await page.locator('#reset-drawer-filters-btn').click();
    await page.locator('.filter-accordion-btn').filter({ hasText: 'PRICE RANGE' }).click();
    await page.locator('#price-max-input').fill('1400');
    await page.locator('.filter-accordion-btn').filter({ hasText: 'SIZE' }).click();
    await page.locator('.size-cb[value="M"]').check();
    await page.locator('#apply-drawer-filters-btn').click();
    const expectedPriceSize = data.products.filter(product => product.active !== false && product.category === 'mens' && product.price <= 1400 && String(product.sizes).split(',').map(size => size.trim()).includes('M'));
    await page.waitForFunction(count => document.querySelectorAll('#category-products-grid article').length === count, expectedPriceSize.length);
    assert((await page.locator('#category-products-grid').innerText()).includes('T-Shirt'));
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [category, file] of [['womens', 'womens-wear'], ['kids', 'kids-wear']]) {
      await page.goto(base + '/pages/' + file + '.html');
      await page.waitForFunction(() => document.querySelectorAll('#category-products-grid article').length >= 50);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), category + ' overflow');
      const product = buildCatalog().find(product => product.id === 'seed_' + category + '_001');
      const link = page.locator('#category-products-grid a[href*="id=' + product.id + '"]').first();
      await link.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => {
        const images = Array.from(document.querySelectorAll('#category-products-grid .product-card-img')).filter(image => {
          const rectangle = image.getBoundingClientRect(); return rectangle.top < innerHeight && rectangle.bottom > 0;
        });
        return images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0);
      });
      await page.screenshot({ path: path.join(output, category + '-mobile.png'), fullPage: false });
      await link.click();
      await page.waitForFunction(title => document.querySelector('#product-title').textContent === title, product.title);
      assert.equal(await page.locator('#product-description-text').textContent(), product.description);
      assert.equal(await page.locator('#product-category-pill').textContent(), category === 'kids' ? "Kid's Wear" : "Women's Wear");
      assert.equal(await page.locator('.size-btn.active').textContent(), product.sizes.split(',')[0]);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(base + '/pages/shop.html');
    await page.waitForFunction(() => document.querySelectorAll('#accessories-row article').length >= 50);
    await page.evaluate(() => localStorage.setItem('dtf_user', JSON.stringify({ email: 'catalog-browser-check@example.test' })));
    const card = page.locator('#accessories-row article').filter({ hasText: 'Verona Tote' }).first();
    await card.locator('.btn-add-cart').click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem(window.getUserStorageKey('dtf_cart')))[0].size), 'One Size');
    await card.locator('a').first().click();
    await page.waitForFunction(() => document.querySelector('#product-title').textContent.includes('Tote'));
    await page.locator('#add-to-cart-cta').click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('dtf_cart_catalog-browser-check@example.test'))[0].quantity), 2);
    await page.locator('#buy-now-cta').click();
    await page.waitForURL(/cart\.html\?checkout=buy-now/);
    const checkout = await page.evaluate(() => JSON.parse(localStorage.getItem('dtf_buy_now_checkout_catalog-browser-check@example.test')));
    assert.equal(checkout.length, 1); assert.equal(checkout[0].quantity, 1); assert.equal(checkout[0].pid, 'seed_accessories_001');
    await page.goto(base + '/pages/product-details.html?id=missing-product&title=Verona%20Tote');
    await page.waitForFunction(() => document.querySelector('#product-title').textContent === 'Product Not Found');
    assert(await page.locator('#add-to-cart-cta').isDisabled());
    const admin = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await admin.addInitScript(() => localStorage.setItem('dtf_user', JSON.stringify({ role: 'admin', token: 'isolated-browser-fixture', email: 'admin-fixture@example.test' })));
    await admin.route('http://localhost:5000/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, products: [], orders: [], banners: [], data: [], overview: { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 }, sales: [], categoryTrend: [] }) }));
    for (const resource of ['orders', 'banners']) await admin.route('**/.netlify/functions/' + resource + '**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, [resource]: [] }) }));
    await admin.route('**/.netlify/functions/products**', route => {
      assert.equal(route.request().method(), 'GET', 'Admin preview test must never write products');
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(data) });
    });
    await admin.goto(base + '/pages/admin.html');
    await admin.locator('.admin-nav-tab[data-section="catalog-section"]').click();
    await admin.waitForFunction(() => document.querySelectorAll('#product-table-body tr').length >= 200);
    for (const category of ['accessories', 'kids']) {
      await admin.locator('.catalog-tab[data-cat="' + category + '"]').click();
      const product = buildCatalog().find(product => product.id === 'seed_' + category + '_001');
      await admin.locator('#product-table-body tr').filter({ hasText: product.id }).locator('.edit-btn').click();
      assert.equal(await admin.locator('#product-title-input').inputValue(), product.title);
      assert.equal(await admin.locator('#product-colors-input').inputValue(), product.colors[0]);
      const sizes = await admin.locator('#product-size-options .size-cb:checked').evaluateAll(inputs => inputs.map(input => input.dataset.size));
      assert.deepEqual(sizes, product.sizes.split(',').map(size => size.trim()));
      await admin.locator('#preview-product-btn').click();
      assert.equal(await admin.locator('#preview-title').textContent(), product.title);
      assert.equal(await admin.locator('#preview-snippets li').count(), 3);
      await admin.waitForFunction(() => {
        const image = document.querySelector('#preview-carousel-track img'); return image && image.complete && image.naturalWidth > 0;
      });
      await admin.screenshot({ path: path.join(output, 'admin-preview-' + category + '.png') });
      await admin.locator('#close-preview-btn').click();
      await admin.locator('#close-modal-btn').click();
    }
    await admin.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(consoleErrors, []);
    console.log(JSON.stringify({ imageURLs: 200, viewports: 5, detailsAndColors: 'passed', searchAndFilters: 'passed', mobileCategories: 'passed', adminSizeColorPreview: 'passed', addToCart: 'passed', buyNow: 'passed', exactRouting: 'passed', pageErrors: errors, consoleErrors, screenshots: output }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
