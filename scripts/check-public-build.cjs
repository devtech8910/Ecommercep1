const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');

async function main() {
  const output = path.resolve(__dirname, '../dist');
  for (const file of ['index.html', '404.html', 'pages/login.html', 'pages/signup.html', 'pages/cart.html',
    'pages/admin.html', 'js/catalog-ui.js', 'js/vendor/pdf.min.js', 'css/style.css',
    'config/customer-care.json', 'assets/banners/signature.webp', 'assets/pdf/shipping_policy.pdf']) {
    assert((await fs.stat(path.join(output, file))).isFile(), file);
  }
  for (const file of ['backend', 'netlify', 'scripts', 'frontend', 'node_modules', '.git', '.env',
    'package.json', 'package-lock.json', 'netlify.toml', 'schema.sql']) {
    await assert.rejects(fs.access(path.join(output, file)), { code: 'ENOENT' });
  }
  const signup = await fs.readFile(path.join(output, 'pages/signup.html'), 'utf8');
  const developmentModule = signup.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
  for (const hostname of ['fashion-company.netlify.app', 'preview--fashion-company.netlify.app']) {
    let requests = 0;
    vm.runInNewContext(developmentModule, { location: { hostname }, fetch: () => { requests++; } });
    assert.equal(requests, 0, 'Public signup must not contact a visitor\'s localhost');
  }
  let requests = 0;
  vm.runInNewContext(developmentModule, {
    location: { hostname: 'localhost' },
    fetch: () => { requests++; return Promise.reject(new Error('No dev server')); },
    console: { info() {} }
  });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests, 1, 'Local development integration stays available');
  console.log('Public build checks passed: storefront assets present, private files excluded, development requests local-only.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
