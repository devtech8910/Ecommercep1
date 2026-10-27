const assert = require('node:assert/strict');
const { createLocalFlowFixture } = require('./local-flow-fixture.cjs');
const upload = require('../netlify/functions/upload-image.js');

async function main() {
  const fixture = await createLocalFlowFixture('SecurityQA!2026', [
    { id: 'qa-customer', email: 'customer@example.test', role: 'customer' },
    { id: 'qa-admin', email: 'admin@example.test', role: 'admin' }
  ]);
  const [customer, admin] = fixture.users;
  const requestDeletion = (headers, email) => fixture.auth({
    httpMethod: 'POST',
    headers,
    body: JSON.stringify({ action: 'delete-account', email })
  });

  assert.equal((await requestDeletion({}, admin.email)).statusCode, 401, 'Email alone must not authorize deletion');
  assert.equal((await requestDeletion({ authorization: 'Bearer invalid' }, admin.email)).statusCode, 401);
  const scheduled = await requestDeletion({ authorization: `Bearer ${customer.token}` }, admin.email);
  assert.equal(scheduled.statusCode, 200);
  const storedUsers = fixture.values.get('fashion-company-accounts/users.json');
  assert.equal(storedUsers.find(user => user.id === 'qa-customer').deletionScheduled, true);
  assert.equal(storedUsers.find(user => user.id === 'qa-admin').deletionScheduled, undefined, 'A supplied email must not select another account');

  const anonymousUpload = await upload.handler({ httpMethod: 'POST', headers: {}, body: '{}' });
  assert.equal(anonymousUpload.statusCode, 401, 'Anonymous image uploads must be rejected');
  assert.equal((await upload.handler({ httpMethod: 'GET', headers: {} })).statusCode, 405);
  console.log('Security regression checks passed.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
