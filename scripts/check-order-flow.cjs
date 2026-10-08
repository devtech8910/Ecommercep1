const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { createLocalFlowFixture } = require('./local-flow-fixture.cjs');
const { chromium } = require(process.env.CATALOG_PLAYWRIGHT_MODULE || 'playwright');
const { buildBill } = require('../js/billing.js');

async function main() {
  const base = process.env.CATALOG_PREVIEW_URL || 'http://127.0.0.1:8080';
  const output = process.env.CATALOG_QA_OUTPUT;
  assert(output, 'Set CATALOG_QA_OUTPUT for screenshots');
  await fs.mkdir(output, { recursive: true });
  const zeroTax = buildBill({ subtotal: 100, tax_amount: 0, delivery_charge: 0, total_amount: 100 }, [{ price: 100, quantity: 1 }]);
  assert.equal(zeroTax.tax, 0); assert.equal(zeroTax.delivery, 0); assert.equal(zeroTax.total, 100);
  const password = 'QA_' + crypto.randomBytes(12).toString('hex');
  const fixture = await createLocalFlowFixture(password, [
    { id: 'qa-customer', name: 'Flow QA Customer', email: 'flow.customer@example.test', phone: '9000000000', role: 'customer' },
    { id: 'qa-admin', name: 'Flow QA Admin', email: 'flow.admin@example.test', role: 'admin' }
  ]);
  const { auth, orders, products, values } = fixture;
  const users = fixture.users;
  const requests = [];
  const pageErrors = [];
  const storedOrders = () => values.get('fashion-company-orders/orders.json') || [];
  const orderCall = (method, body, user, query = '') => orders(new Request('https://flow.test/orders' + query, {
    method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: 'Bearer ' + user.token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {})
  }));
  assert.equal((await orderCall('GET')).status, 401);
  assert.equal((await orderCall('GET', null, users[0], '?admin=true')).status, 403);
  const signup = await auth({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ action: 'register', name: 'QA Other', email: 'qa.other@example.test', phone: '9000000001', password, role: 'admin' }) });
  assert.equal(JSON.parse(signup.body).user.role, 'customer', 'Public registration cannot create administrators');

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  async function context(viewport) {
    const ctx = await browser.newContext({ viewport });
    await ctx.addInitScript(() => {
      window.print = () => { window.__qaPrintCalls = (window.__qaPrintCalls || 0) + 1; };
      localStorage.setItem('dtf_saved_addresses', JSON.stringify([{
        id: 'qa-address',
        label: 'HOME',
        personName: 'Flow QA Customer',
        fullAddress: '10 Test Street, Test City, Test State 560001',
        name: 'Test City',
        pin: '560001'
      }]));
    });
    await ctx.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const headers = request.headers();
      const body = request.postData();
      const api = url.pathname.startsWith('/.netlify/functions/');
      if (api && url.pathname.endsWith('/auth')) {
        const response = await auth({ httpMethod: request.method(), headers, path: url.pathname, queryStringParameters: Object.fromEntries(url.searchParams), body });
        return route.fulfill({ status: response.statusCode, headers: response.headers, body: response.body });
      }
      if (api && (url.pathname.endsWith('/orders') || url.pathname.endsWith('/products'))) {
        if (body && url.pathname.endsWith('/orders')) requests.push(JSON.parse(body));
        const handler = url.pathname.endsWith('/orders') ? orders : products;
        const response = await handler(new Request(request.url(), { method: request.method(), headers, ...(body ? { body } : {}) }));
        return route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
      }
      if (url.hostname === 'localhost' && url.port === '5000') {
        if (url.pathname === '/address') {
          assert(headers.authorization, 'Address lookup must carry authentication');
          return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data: [{ id: 'qa-address', address_type: 'HOME', full_name: 'Flow QA Customer', mobile: '9000000000', house_number: '10', street: 'Test Street', city: 'Test City', state: 'Test State', pincode: '560001' }] }) });
        }
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, products: [], orders: [], data: [], inventory: [] }) });
      }
      if (api && url.pathname.endsWith('/banners')) return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, banners: [] }) });
      assert.equal(request.method(), 'GET', 'Unexpected external write: ' + url.origin + url.pathname);
      return route.continue();
    });
    return ctx;
  }
  async function login(ctx, email) {
    const page = await ctx.newPage();
    page.on('pageerror', error => pageErrors.push(error.message));
    page.on('dialog', async dialog => { console.log('UI notice: ' + dialog.message()); await dialog.accept(); });
    await page.goto(base + '/pages/login.html');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('Wrong_password_123');
    await page.locator('#login-submit-btn').click();
    await page.waitForFunction(() => document.querySelector('#password-error').textContent.includes('Invalid'));
    await page.locator('#password').fill(password);
    await page.locator('#login-submit-btn').click();
    await page.waitForURL(email.includes('admin') ? /admin\.html/ : /index\.html/);
    return page;
  }
  async function detail(page, id) {
    await page.goto(base + '/pages/product-details.html?id=' + id);
    await page.waitForFunction(() => document.querySelector('#product-title').textContent !== 'Loading product...' && document.querySelector('.size-btn.active'));
    await page.waitForFunction(() => document.querySelectorAll('#thumbnail-strip img').length > 0);
  }
  async function finishOrder(page, label) {
    if (page.url().includes('checkout=buy-now')) await page.waitForFunction(() => document.querySelector('#checkout-modal-overlay').classList.contains('active'));
    else await page.locator('#checkout-btn').click();
    await page.waitForFunction(() => document.querySelectorAll('#checkout-addresses-list .addr-card').length > 0);
    await page.locator('#checkout-next-btn').click();
    assert(await page.locator('[data-method="cod"]').isVisible());
    await page.locator('#checkout-step-2').evaluate(async element => { await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))); });
    await page.screenshot({ path: path.join(output, label + '-checkout.png') });
    await page.locator('#checkout-final-btn').click();
    await page.waitForFunction(() => document.querySelector('#order-confirmed-modal').style.display === 'flex');
    assert(!await page.locator('#order-confirmed-title').textContent().then(text => text.includes('Local Preview')));
  }
  try {
    const customerCtx = await context({ width: 1440, height: 1000 });
    const customer = await login(customerCtx, users[0].email);
    await detail(customer, 'seed_mens_001');
    await customer.locator('#add-to-cart-cta').click();
    await detail(customer, 'seed_accessories_001');
    await customer.locator('#add-to-cart-cta').click();
    await customer.goto(base + '/pages/cart.html');
    await customer.locator('.inc-btn').first().click();
    await customer.locator('#checkout-btn').click();
    await customer.waitForFunction(() => document.querySelectorAll('#checkout-addresses-list .addr-card').length > 0);
    await customer.locator('#checkout-next-btn').click();
    fixture.state.failWrites = true;
    await customer.locator('#checkout-final-btn').click();
    await customer.waitForFunction(() => !document.querySelector('#checkout-final-btn').disabled);
    assert.equal(storedOrders().length, 0);
    assert.equal(await customer.locator('#order-confirmed-modal').isVisible(), false);
    fixture.state.failWrites = false;
    await customer.locator('#checkout-final-btn').click();
    await customer.waitForFunction(() => document.querySelector('#order-confirmed-modal').style.display === 'flex');
    assert.equal(storedOrders().length, 1);
    const first = structuredClone(storedOrders()[0]);
    assert.equal(first.items.length, 2); assert.equal(first.items[0].quantity, 2);
    assert.equal(first.items[1].color, 'Tan'); assert.equal(first.email, users[0].email);
    assert.equal(first.subtotal, 1799 * 2 + 3499);
    assert.equal(first.total_amount, first.subtotal + Math.round(first.subtotal * 0.18) + 150);
    assert.equal(await customer.evaluate(() => localStorage.getItem(window.getUserStorageKey('dtf_cart'))), null);
    await customer.goto(base + '/pages/orders.html');
    await customer.waitForFunction(id => document.querySelector('#orders-list')?.textContent.includes(id), first.id);
    await customer.screenshot({ path: path.join(output, 'customer-orders-desktop.png') });

    const adminCtx = await context({ width: 1440, height: 1000 });
    const admin = await login(adminCtx, users[1].email);
    await admin.locator('.admin-nav-tab[data-section="orders-section"]').click();
    await admin.waitForFunction(id => document.querySelector('#order-table-body').textContent.includes(id), first.id);
    let row = admin.locator('#order-table-body tr').filter({ hasText: first.id });
    await row.locator('.print-label-btn').click();
    await admin.waitForFunction(() => document.querySelector('#printable-invoice-content').textContent.includes('Verona'));
    assert((await admin.locator('#printable-invoice-content').innerText()).includes(first.total_amount.toLocaleString('en-IN')));
    await admin.waitForFunction(() => { const frame = document.getElementById('invoice-print-frame'); return frame?.contentWindow?.__qaPrintCalls > 0; });
    const printedHTML = await admin.evaluate(() => document.getElementById('invoice-print-frame').contentDocument.documentElement.outerHTML);
    const bill = await browser.newPage({ viewport: { width: 850, height: 1100 } });
    await bill.setContent(printedHTML);
    assert(await bill.locator('svg rect').count() > 10);
    const billRows = await bill.locator('tr').evaluateAll(rows => rows.filter(row => row.querySelectorAll('td').length === 8).map(row => {
      const cells = row.querySelectorAll('td');
      return { tax: Number(cells[6].textContent.replace(/[^\d.-]/g, '')), total: Number(cells[7].textContent.replace(/[^\d.-]/g, '')) };
    }));
    assert.equal(billRows.reduce((sum, row) => sum + row.tax, 0), first.tax_amount);
    assert.equal(billRows.reduce((sum, row) => sum + row.total, 0) + first.delivery_charge, first.total_amount);
    await bill.screenshot({ path: path.join(output, 'admin-order-bill.png'), fullPage: true });
    await bill.pdf({ path: path.join(output, 'admin-order-bill.pdf'), format: 'A4', printBackground: true });
    await bill.close();
    if (await admin.locator('#close-invoice-modal').isVisible()) await admin.locator('#close-invoice-modal').click();
    await row.locator('.confirm-order-btn').click();
    fixture.state.failWrites = true;
    await admin.locator('#proceed-confirm-btn').click();
    await admin.waitForFunction(() => !document.querySelector('#proceed-confirm-btn').disabled);
    assert.equal(storedOrders()[0].status, 'Order Placed');
    fixture.state.failWrites = false;
    await admin.locator('#proceed-confirm-btn').click();
    await admin.waitForFunction(() => /shipped/i.test(document.querySelector('#order-table-body').textContent));
    assert.equal(storedOrders()[0].status, 'Shipped');
    assert.equal(storedOrders()[0].total_amount, first.total_amount);

    await customer.reload();
    await customer.waitForFunction(() => /shipped/i.test(document.querySelector('#orders-list')?.textContent || ''));
    await customer.locator('.print-invoice-btn').first().click();
    await customer.waitForFunction(() => document.querySelector('#printable-invoice-content').textContent.includes('Verona'));
    assert((await customer.locator('#printable-invoice-content').innerText()).includes(first.total_amount.toLocaleString('en-IN')));
    await customer.locator('#trigger-print-btn').click();
    await customer.waitForFunction(() => document.getElementById('customer-invoice-print-frame')?.contentWindow?.__qaPrintCalls > 0);
    if (await customer.locator('#close-invoice-modal').isVisible()) await customer.locator('#close-invoice-modal').click();
    const downloadEvent = customer.waitForEvent('download');
    await customer.locator('.download-invoice-btn').first().click();
    const download = await downloadEvent;
    await download.saveAs(path.join(output, 'customer-order-bill.html'));
    assert((await fs.readFile(path.join(output, 'customer-order-bill.html'), 'utf8')).includes(first.id));
    const mobileCtx = await context({ width: 390, height: 844 });
    const mobile = await login(mobileCtx, users[0].email);
    await mobile.goto(base + '/pages/orders.html');
    await mobile.waitForFunction(() => document.querySelector('#orders-list')?.textContent.includes('Shipped'));
    await detail(mobile, 'seed_mens_001');
    await mobile.locator('#add-to-cart-cta').click();
    await detail(mobile, 'seed_accessories_001');
    await mobile.locator('#buy-now-cta').click();
    await mobile.waitForURL(/checkout=buy-now/);
    const checkout = await mobile.evaluate(() => JSON.parse(localStorage.getItem(window.getUserStorageKey('dtf_buy_now_checkout'))));
    assert.equal(checkout.length, 1); assert.equal(checkout[0].quantity, 1);
    await finishOrder(mobile, 'mobile-buy-now');
    assert.equal(storedOrders().length, 2);
    assert.equal(storedOrders()[0].items.length, 1);
    assert.equal(storedOrders()[0].total_amount, 3499 + Math.round(3499 * 0.18) + 150);
    const retained = await mobile.evaluate(() => JSON.parse(localStorage.getItem(window.getUserStorageKey('dtf_cart'))));
    assert.equal(retained.length, 1); assert.equal(retained[0].pid, 'seed_mens_001');
    await admin.reload();
    await admin.waitForFunction(() => document.querySelector('#stat-orders').textContent === '2');
    const total = storedOrders().reduce((sum, order) => sum + order.total_amount, 0);
    assert((await admin.locator('#stat-revenue').textContent()).includes(total.toLocaleString('en-IN')));
    await admin.screenshot({ path: path.join(output, 'dashboard-order-totals.png') });
    await admin.locator('.admin-nav-tab[data-section="performance-section"]').click();
    await admin.waitForFunction(() => document.querySelectorAll('#performance-cards-grid > div').length > 0);
    await admin.screenshot({ path: path.join(output, 'dashboard-performance.png') });

    const tampered = structuredClone(requests.find(request => request.items?.length === 2));
    delete tampered.checkoutKey;
    tampered.items[0].price = 1;
    assert.equal((await orderCall('POST', tampered, users[0])).status, 409);
    assert.equal((await orderCall('GET', null, users[0], '?userEmail=someone-else@example.test')).status, 403);
    assert.equal((await orderCall('PUT', { id: first.id, status: 'Shipped' }, users[0])).status, 403);
    const replay = await orderCall('POST', requests.find(request => request.items?.length === 2), users[0]);
    assert.equal(replay.status, 200);
    assert.equal((await replay.json()).order.id, first.id);
    assert.equal(storedOrders().length, 2);
    assert.deepEqual(pageErrors, []);
    console.log(JSON.stringify({ login: 'real password verification passed', cartCheckout: 'passed', buyNowIsolation: 'passed', orderPersistence: 'actual handler with isolated shared storage passed', crossBrowserSync: 'passed', dashboardTotals: 'passed', adminConfirmation: 'passed', printBill: 'passed', failedSaveProtection: 'passed', retryIdempotency: 'passed', authorizationAndPrices: 'passed', liveOrdersCreated: 0, screenshots: output }, null, 2));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
