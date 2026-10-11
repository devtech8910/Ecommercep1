const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require(process.env.CATALOG_PLAYWRIGHT_MODULE || 'playwright');
const { createLocalFlowFixture } = require('./local-flow-fixture.cjs');

async function main() {
  const output = process.env.CATALOG_QA_OUTPUT;
  assert(output, 'Set CATALOG_QA_OUTPUT');
  await fs.mkdir(output, { recursive: true });
  const password = crypto.randomBytes(24).toString('base64url');
  const fixture = await createLocalFlowFixture(password, [
    { name: 'Settings QA', email: 'settings@example.test', role: 'customer' },
    { name: 'Other QA', email: 'other@example.test', role: 'customer' }
  ]);
  const account = fixture.users[0];
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(account => {
      localStorage.setItem('dtf_user', JSON.stringify(account));
      localStorage.setItem('dtf_token', account.token);
      localStorage.setItem('token', account.token);
    }, { name: account.name, email: account.email, role: account.role, token: account.token });
    let unavailable = true;
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname === '/.netlify/functions/auth') {
        if (unavailable) return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, errors: ['Please try again shortly.'] }) });
        const response = await fixture.auth({ httpMethod: request.method(), headers: request.headers(), queryStringParameters: Object.fromEntries(url.searchParams), body: request.postData() });
        return route.fulfill({ status: response.statusCode, headers: response.headers, body: response.body });
      }
      if (url.origin !== 'http://127.0.0.1:8081' && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) throw new Error('External writes blocked');
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8081/pages/settings.html');
    await page.locator('#delete-account-btn').click();
    await page.locator('#delete-terms-checkbox').check();
    await page.locator('#proceed-delete-btn').click();
    assert(await page.locator('#delete-current-password').isVisible());
    assert.equal(await page.locator('#delete-phone-otp').count(), 0);
    await page.locator('#delete-current-password').fill(password);
    await page.locator('#confirm-permanent-delete-btn').click();
    await page.locator('#delete-modal-error').waitFor({ state: 'visible' });
    assert(!(await page.locator('#delete-step-3').isVisible()), 'Server failures must not show successful deletion');
    assert(await page.evaluate(() => !!localStorage.getItem('dtf_user')), 'A failed deletion preserves the session');
    unavailable = false;
    await page.locator('#delete-current-password').fill('wrong-password');
    await page.locator('#confirm-permanent-delete-btn').click();
    await page.waitForFunction(() => document.querySelector('#delete-modal-error').textContent.includes('current password'));
    assert(!fixture.users.some(user => user.deletionScheduled));
    await page.screenshot({ path: path.join(output, 'account-deletion-verification.png') });
    await page.locator('#delete-current-password').fill(password);
    await page.locator('#confirm-permanent-delete-btn').click();
    await page.locator('#delete-step-3').waitFor({ state: 'visible' });
    assert(fixture.users[0].deletionScheduled);
    assert(!fixture.users[1].deletionScheduled);
    assert.equal(await page.evaluate(() => ['dtf_user', 'dtf_token', 'token'].every(key => !localStorage.getItem(key))), true);
    assert.deepEqual(errors, []);
    console.log('Account settings browser checks passed: server failure, wrong password, authenticated deletion, own-account isolation, and session cleanup.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
