import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import catalog from '../js/catalog-seed-data.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 8080);
const production = 'https://fashion-company.netlify.app';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === '/favicon.ico') {
      response.writeHead(204); response.end(); return;
    }
    if (['/.netlify/functions/auth', '/.netlify/functions/orders'].includes(url.pathname)) {
      let body = '';
      for await (const part of request) body += part;
      const action = url.searchParams.get('action') || (body ? JSON.parse(body).action : '');
      const allowed = request.method === 'GET' || (url.pathname.endsWith('/auth') && action === 'login');
      if (!allowed) {
        response.writeHead(409, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: false, error: 'This catalog preview is read-only. Deploy before saving orders or changing account data.' }));
        return;
      }
      const upstream = await fetch(production + url.pathname + url.search, {
        method: request.method,
        headers: { 'Content-Type': 'application/json', Authorization: request.headers.authorization || '' },
        ...(body && request.method !== 'GET' ? { body } : {}),
        signal: AbortSignal.timeout(20000)
      });
      response.writeHead(upstream.status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(await upstream.text());
      return;
    }
    if (url.pathname === '/.netlify/functions/products') {
      // Preview the migration against the shared catalog without changing live data.
      if (request.method !== 'GET') {
        response.writeHead(409, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ success: false, error: 'This catalog preview is read-only. Deploy the catalog and its images before saving products.' }));
        return;
      }
      const upstream = await fetch(`${production}/.netlify/functions/products`, { signal: AbortSignal.timeout(20000) });
      const data = await upstream.json();
      if (!upstream.ok || !data.success) throw new Error(data.error || `Catalog request failed (${upstream.status})`);
      let products = catalog.upgradeSeedCatalog(data.products || []);
      const category = url.searchParams.get('category');
      if (category) products = products.filter(product => product.category === category);
      const id = url.searchParams.get('id');
      const product = id ? products.find(item => String(item.id || item.pid) === id) : null;
      response.writeHead(id && !product ? 404 : 200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      response.end(JSON.stringify(id ? { success: !!product, product } : { success: true, products, preview: true }));
      return;
    }
    let pathname = decodeURIComponent(url.pathname);
    if (pathname.split('/').some(part => part.startsWith('.') || ['backend', 'node_modules', 'netlify', 'scripts'].includes(part))) {
      response.writeHead(403); response.end('Forbidden'); return;
    }
    if (pathname === '/') pathname = '/index.html';
    if (!path.extname(pathname)) pathname += '.html';
    const file = path.resolve(root, '.' + pathname);
    if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    let content = await readFile(file);
    const extension = path.extname(file);
    if (extension === '.html') content = Buffer.from(content.toString().replace('<head>', '<head><script>window.__dtfCatalogPreview=true;</script>'));
    response.writeHead(200, { 'Content-Type': types[extension] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(content);
  } catch (error) {
    const missing = error.code === 'ENOENT';
    response.writeHead(missing ? 404 : 502, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ success: false, error: missing ? 'File not found' : error.message }));
  }
});
server.listen(port, '0.0.0.0', () => console.log(`Catalog preview: http://127.0.0.1:${port}/pages/shop.html`));
