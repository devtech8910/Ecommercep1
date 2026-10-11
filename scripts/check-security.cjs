const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { createLocalFlowFixture } = require('./local-flow-fixture.cjs');

async function main() {
  const password = crypto.randomBytes(24).toString('base64url');
  const fixture = await createLocalFlowFixture(password, [
    { name: 'Security Customer', email: 'customer@example.test', role: 'customer' },
    { name: 'Other Customer', email: 'other@example.test', role: 'customer' },
    { name: 'Security Admin', email: 'admin@example.test', role: 'admin' }
  ]);
  const [customer, other, admin] = fixture.users;
  const call = (action, data = {}, token = '', method = 'POST') => fixture.auth({
    httpMethod: method, headers: { authorization: token ? 'Bearer ' + token : '' },
    queryStringParameters: { action }, body: JSON.stringify({ action, ...data })
  });
  assert.equal((await call('delete-account', { email: customer.email })).statusCode, 401);
  assert.equal((await call('delete-account', { email: other.email, password }, customer.token)).statusCode, 403);
  assert.equal((await call('delete-account', { email: customer.email }, customer.token)).statusCode, 401);
  assert.equal((await call('delete-account', { password }, 'invalid-token')).statusCode, 401);
  assert.equal((await call('delete-account', { password }, customer.token, 'GET')).statusCode, 405);
  assert(!fixture.users.some(user => user.deletionScheduled), 'Rejected requests cannot schedule deletion');
  const login = await call('login', { email: customer.email, password });
  assert.equal(login.statusCode, 200);
  assert.match(login.headers['Set-Cookie'], /; Secure;/);
  assert.equal(login.headers['Cache-Control'], 'no-store');
  const deletion = await call('delete-account', { password }, customer.token);
  assert.equal(deletion.statusCode, 200);
  assert(fixture.users.find(user => user.email === customer.email).deletionScheduled);
  assert(!fixture.users.find(user => user.email === other.email).deletionScheduled);
  assert.equal(await fixture.resolveUser(new Request('https://test.invalid', { headers: { authorization: 'Bearer ' + customer.token } })), null);
  const restored = await call('login', { email: customer.email, password });
  assert.equal(restored.statusCode, 200);
  assert.equal(JSON.parse(restored.body).deletionCancelled, true);
  assert.notEqual(JSON.parse(restored.body).user.token, customer.token, 'Deletion revokes the previous token');
  const enumeration = await fixture.auth({ httpMethod: 'GET', headers: {}, queryStringParameters: { email: other.email } });
  assert.equal(enumeration.statusCode, 200, 'Signup email check remains available');

  for (let index = 0; index < 5; index++) assert.equal((await call('delete-account', { password: 'incorrect' }, other.token)).statusCode, 401);
  assert.equal((await call('delete-account', { password }, other.token)).statusCode, 429, 'Deletion password attempts are bounded');
  let users = fixture.users;
  const resetUser = users.find(user => user.email === admin.email);
  resetUser.resetOtpHash = await bcrypt.hash('123456', 4);
  resetUser.resetOtpExpiresAt = new Date(Date.now() + 60000).toISOString();
  fixture.values.set('fashion-company-accounts/users.json', users);
  for (let index = 0; index < 5; index++) assert.equal((await call('reset-password', { email: admin.email, otp: '000000', newPassword: password })).statusCode, 401);
  assert.equal((await call('reset-password', { email: admin.email, otp: '123456', newPassword: password })).statusCode, 429, 'Reset codes cannot be guessed indefinitely');

  // Load the actual upload handler with isolated storage and account lookup.
  let source = fs.readFileSync(path.join(__dirname, '../netlify/functions/upload-image.js'), 'utf8');
  source = source.replace("await import('./lib/account-session.mjs')", '({ resolveAccountUser: global.__localFlowResolve })');
  const sandbox = {
    exports: {}, Buffer, Blob, Request, console, process: { env: {} }, global,
    require: name => name === '@netlify/blobs' ? { getStore: global.__localFlowStore } : require(name)
  };
  new vm.Script(source).runInNewContext(sandbox);
  const upload = sandbox.exports.handler;
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
  const image = 'data:image/png;base64,' + png.toString('base64');
  const uploadCall = (data, token) => upload({ httpMethod: 'POST', headers: { authorization: token ? 'Bearer ' + token : '' }, body: typeof data === 'string' ? data : JSON.stringify(data) });
  assert.equal((await uploadCall({ base64Data: image })).statusCode, 401);
  assert.equal((await uploadCall({ base64Data: image }, other.token)).statusCode, 403);
  assert.equal((await uploadCall('not json', admin.token)).statusCode, 400);
  assert.equal((await uploadCall({ base64Data: 'data:image/svg+xml;base64,' + Buffer.from('<svg onload="alert(1)"></svg>').toString('base64') }, admin.token)).statusCode, 400);
  assert.equal((await uploadCall({ base64Data: 'data:image/png;base64,' + Buffer.from('<html>not an image</html>').toString('base64') }, admin.token)).statusCode, 400);
  assert.equal((await uploadCall({ base64Data: image.replace('image/png', 'image/jpeg') }, admin.token)).statusCode, 400);
  assert.equal((await uploadCall({ base64Data: 'x'.repeat(3 * 1024 * 1024) }, admin.token)).statusCode, 413);
  const saved = await uploadCall({ base64Data: image, filename: '../../evil.html' }, admin.token);
  assert.equal(saved.statusCode, 200);
  const imageUrl = new URL(JSON.parse(saved.body).url, 'https://store.invalid');
  assert.equal(imageUrl.origin, 'https://store.invalid');
  assert.match(imageUrl.searchParams.get('id'), /^[0-9a-f-]{36}\.png$/);
  const served = await upload({ httpMethod: 'GET', queryStringParameters: { id: imageUrl.searchParams.get('id') } });
  assert.equal(served.statusCode, 200);
  assert.equal(served.headers['Content-Type'], 'image/png');
  assert.equal(served.headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(served.body, png.toString('base64'));
  assert.equal((await upload({ httpMethod: 'GET', queryStringParameters: { id: '../limits/account' } })).statusCode, 404);
  for (let index = 1; index < 30; index++) assert.equal((await uploadCall({ base64Data: image }, admin.token)).statusCode, 200);
  assert.equal((await uploadCall({ base64Data: image }, admin.token)).statusCode, 429);

  const root = path.resolve(__dirname, '..');
  const dist = path.join(root, 'dist');
  for (const name of ['backend', 'netlify', 'scripts', 'package.json', 'schema.sql', '.env', '.git']) assert(!fs.existsSync(path.join(dist, name)), 'Private file in build: ' + name);
  for (const name of ['index.html', '404.html', 'pages/login.html', 'pages/signup.html', 'pages/admin.html', 'pages/settings.html', 'config/customer-care.json', 'assets/pdf/privacy_policy.pdf']) assert(fs.existsSync(path.join(dist, name)), 'Missing storefront file: ' + name);
  for (const file of ['pages/settings.html', 'pages/admin.html']) {
    for (const script of fs.readFileSync(path.join(root, file), 'utf8').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(script[1], { filename: file });
  }
  assert(!fs.readFileSync(path.join(root, 'pages/settings.html'), 'utf8').includes('generatedPhoneOtp'));
  console.log('Security checks passed: authenticated deletion, reauthentication and lockout, OTP attempt limit, admin-only raster uploads, private storage, upload limit, safe public build, and page scripts.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
