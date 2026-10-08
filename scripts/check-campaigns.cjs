const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.CATALOG_PLAYWRIGHT_MODULE || 'playwright');
const { createLocalFlowFixture } = require('./local-flow-fixture.cjs');

async function main() {
  const output = process.env.CATALOG_QA_OUTPUT;
  assert(output); await fs.mkdir(output, { recursive: true });
  const fixture = await createLocalFlowFixture('CampaignTest!2026', [{ email: 'campaign-admin@example.test', role: 'admin' }]);
  const call = async (method, body) => {
    const response = await fixture.banners(new Request('https://test.local/banners', { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + fixture.users[0].token }, ...(body ? { body: JSON.stringify(body) } : {}) }));
    return { status: response.status, data: await response.json() };
  };
  const first = await call('GET'); assert.equal(first.data.banners.length, 3);
  assert(fixture.values.has('fashioncompany-banners/banners-before-luxury-2026-10-08.json'));
  const banner = first.data.banners[0];
  assert.equal((await call('PUT', { id: banner.id, title: 'Admin campaign edit', imageUrl: '/assets/catalog/seed_mens_001.webp' })).status, 200);
  const edited = (await call('GET')).data.banners.find(item => item.id === banner.id);
  assert.equal(edited.title, 'Admin campaign edit'); assert.equal(edited.mobileImageUrl, '');
  for (const item of first.data.banners) await call('DELETE', { id: item.id });
  assert.equal((await call('GET')).data.banners.length, 0, 'Deleted defaults must not reappear');

  const base = 'http://127.0.0.1:8081';
  for (const file of ['signature', 'tailored', 'womens', 'signature-mobile', 'tailored-mobile', 'womens-mobile', 'editorial-womens', 'editorial-accessories', 'editorial-kids']) {
    const result = await fetch(base + '/assets/banners/' + file + '.webp'); assert.equal(result.status, 200, file);
  }
  const documents = { 'Shipping Policy': 'shipping_policy.pdf', 'Returns & Exchanges': 'returns_exchanges.pdf', 'Size Guide': 'size_guide.pdf', 'Track My Order': 'track_my_order.pdf', 'Contact Us': 'contact_us.pdf' };
  for (const file of Object.values(documents)) {
    const response = await fetch(base + '/assets/pdf/' + file); assert(response.headers.get('content-type').includes('application/pdf'));
    assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 4).toString(), '%PDF');
  }
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [];
  try {
    for (const [name, width, height] of [['desktop', 1440, 1000], ['laptop', 1280, 800], ['tablet', 768, 1024], ['mobile', 390, 844], ['small-mobile', 320, 740]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      page.on('pageerror', error => errors.push(name + ': ' + error.message));
      await page.goto(base + '/index.html');
      await page.waitForFunction(() => document.querySelectorAll('.ad-slide--default').length === 3);
      await page.waitForFunction(() => Array.from(document.querySelectorAll('.ad-slide-img')).every(image => image.complete && image.naturalWidth > 0));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), name + ' overflow');
      const source = await page.locator('.ad-slide-img').first().evaluate(image => image.currentSrc);
      assert.equal(source.includes('-mobile.webp'), width < 768);
      await page.locator('.ad-dot').first().click();
      await page.waitForFunction(() => Math.abs(new DOMMatrixReadOnly(getComputedStyle(document.querySelector('#ad-carousel-track')).transform).m41) < .1);
      await page.screenshot({ path: path.join(output, 'banner-' + name + '.png') });
      for (const selector of ['#editorial-main', '#editorial-small-1', '#editorial-small-2']) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.waitForFunction(selector => {
          const panel = document.querySelector(selector); const image = panel.querySelector('img');
          return panel.classList.contains('is-visible') && image.complete && image.naturalWidth > 0 && getComputedStyle(panel).opacity === '1';
        }, selector);
        const bounds = await page.locator(selector).boundingBox(); assert(bounds.width <= width);
      }
      if (width > 640) {
        const heights = await page.evaluate(() => [document.querySelector('#editorial-main').getBoundingClientRect().height, document.querySelector('.editorial-side').getBoundingClientRect().height]);
        assert(Math.abs(heights[0] - heights[1]) < 2, name + ' uneven collection columns');
      }
      await page.locator('#editorial').screenshot({ path: path.join(output, 'collections-' + name + '.png') });
      for (const [label, file] of Object.entries(documents)) {
        await page.locator('a.footer-link').filter({ hasText: new RegExp('^' + label.replace('&', '&') + '$') }).first().click();
        assert.equal(await page.locator('#legal-pdf-title').textContent(), label);
        assert((await page.locator('#legal-pdf-document').getAttribute('data-pdf-url')).includes(file));
        await page.waitForFunction(() => document.querySelector('#legal-pdf-document').dataset.ready === 'true');
        assert(await page.locator('#legal-pdf-document canvas').count() > 0);
        assert((await page.locator('#legal-pdf-open').getAttribute('href')).endsWith(file));
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.querySelector('#legal-pdf-modal').style.visibility === 'hidden');
      }
      await page.close();
    }
    const reduced = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await reduced.goto(base + '/index.html');
    assert.equal(await reduced.locator('#editorial').evaluate(element => element.classList.contains('motion-ready')), false);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ banners: 3, images: 9, pdfLinks: 5, viewports: 5, bannerEditingAndDeletion: 'passed', scrollTransitions: 'passed', reducedMotion: 'passed', pageErrors: errors, screenshots: output }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
