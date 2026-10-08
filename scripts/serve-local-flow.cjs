const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { createLocalFlowFixture } = require('./local-flow-fixture.cjs');

async function main() {
  const root = path.resolve(__dirname, '..');
  const port = Number(process.env.LOCAL_FLOW_PORT || 8081);
  const password = 'TestDashboard!2026';
  const fixture = await createLocalFlowFixture(password, [
    { id: 'local-admin-1', email: 'admin1@local.test', name: 'Local Test Admin 1', role: 'admin' },
    { id: 'local-admin-2', email: 'admin2@local.test', name: 'Local Test Admin 2', role: 'admin' },
    { id: 'local-customer', email: 'customer@local.test', name: 'Local Test Customer', phone: '9000000000', role: 'customer' }
  ]);
  const addresses = new Map();
  if (process.env.LOCAL_FLOW_SNAPSHOT) {
    const snapshot = JSON.parse(await fs.readFile(process.env.LOCAL_FLOW_SNAPSHOT, 'utf8'));
    for (const [key, value] of snapshot) fixture.values.set(key, value);
  }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
  const bootstrap = `<script>
window.__dtfCatalogPreview=true;
window.__dtfLocalTest=true;
(function(){const nativeFetch=window.fetch.bind(window);window.fetch=function(resource,options){
 const method=String(options?.method||(resource instanceof Request?resource.method:'GET')).toUpperCase();
 if(typeof resource==='string'){
  const url=new URL(resource,location.href);
  if(url.origin==='https://fashion-company.netlify.app'&&url.pathname.startsWith('/.netlify/functions/'))resource=url.pathname+url.search;
  else if(url.port==='5000'&&['localhost','127.0.0.1',location.hostname].includes(url.hostname))resource='/_backend'+url.pathname+url.search;
  else if(url.origin!==location.origin&&!['GET','HEAD','OPTIONS'].includes(method))return Promise.reject(new Error('External writes are disabled on the local test site.'));
 }
 return nativeFetch(resource,options);
};})();
</script>`;
  const server = http.createServer(async (request, response) => {
    const send = (status, data) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); response.end(JSON.stringify(data)); };
    try {
      const url = new URL(request.url, `http://127.0.0.1:${port}`);
      let body = '';
      if (!['GET', 'HEAD'].includes(request.method)) {
        for await (const part of request) { body += part; if (body.length > 14000000) { send(413, { success: false, error: 'Request is too large.' }); return; } }
      }
      const apiRequest = new Request(url, { method: request.method, headers: request.headers, ...(body ? { body } : {}) });
      const functionName = url.pathname.startsWith('/.netlify/functions/') ? url.pathname.split('/').at(-1) : '';
      if (functionName === 'auth') {
        const result = await fixture.auth({ httpMethod: request.method, headers: request.headers, path: url.pathname, queryStringParameters: Object.fromEntries(url.searchParams), body });
        response.writeHead(result.statusCode, result.headers); response.end(result.body); return;
      }
      if (['products', 'orders', 'banners'].includes(functionName)) {
        const result = await fixture[functionName](apiRequest);
        response.writeHead(result.status, Object.fromEntries(result.headers)); response.end(await result.text()); return;
      }
      if (url.pathname.startsWith('/_backend/')) {
        const user = await fixture.resolveUser(apiRequest);
        if (!user) { send(401, { success: false, error: 'Please sign in.' }); return; }
        if (url.pathname === '/_backend/auth/logout') { send(200, { success: true }); return; }
        if (url.pathname.startsWith('/_backend/address')) {
          const list = addresses.get(user.email) || [];
          const id = url.pathname.split('/')[3];
          if (request.method === 'POST') {
            const data = JSON.parse(body);
            list.push({ id: 'address_' + Date.now(), address_type: data.addressType || 'HOME', full_name: data.fullName || user.name, mobile: data.mobile || '', house_number: data.houseNumber || '', street: data.street || '', area: data.area || '', city: data.city || '', state: data.state || '', pincode: data.pincode || '' });
            addresses.set(user.email, list);
          } else if (request.method === 'DELETE') addresses.set(user.email, list.filter(address => String(address.id) !== id));
          send(200, { success: true, data: addresses.get(user.email) || [] }); return;
        }
        if (request.method === 'GET') { send(200, { success: true, data: [], inventory: [], stockMovements: [] }); return; }
        send(501, { success: false, error: 'Use the shared catalog and order actions in this local test site.' }); return;
      }
      if (functionName) { send(501, { success: false, error: 'This function is not enabled in local testing.' }); return; }
      if (url.pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.split('/').some(part => part.startsWith('.') || ['backend', 'node_modules', 'netlify', 'scripts'].includes(part))) { send(403, { error: 'Forbidden' }); return; }
      if (pathname === '/') pathname = '/index.html';
      if (!path.extname(pathname)) pathname += '.html';
      const file = path.resolve(root, '.' + pathname);
      if (!file.startsWith(root + path.sep) || !(await fs.stat(file)).isFile()) { send(404, { error: 'Not found' }); return; }
      let content = await fs.readFile(file);
      if (path.extname(file) === '.html') content = Buffer.from(content.toString().replace('<head>', '<head>' + bootstrap));
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(content);
    } catch (error) { send(error.code === 'ENOENT' ? 404 : 500, { success: false, error: error.message }); }
  });
  server.listen(port, '127.0.0.1', () => console.log(`Local test login: http://127.0.0.1:${port}/pages/login.html`));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
