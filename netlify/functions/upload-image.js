const { getStore } = require('@netlify/blobs');
const { createHash, randomUUID } = require('node:crypto');

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_BODY = Math.ceil(MAX_BYTES / 3) * 4 + 1024;
const WINDOW_MS = 15 * 60 * 1000;
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff'
};
const reply = (statusCode, body) => ({ statusCode, headers: HEADERS, body: JSON.stringify(body) });

function getImagesStore() {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
  return getStore({ name: 'fashion-company-images', consistency: 'strong', ...(siteID && token ? { siteID, token } : {}) });
}

function detectImage(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) && buffer.toString('ascii', 12, 16) === 'IHDR') return ['image/png', 'png'];
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff && buffer.subarray(-2).equals(Buffer.from([0xff, 0xd9]))) return ['image/jpeg', 'jpg'];
  if (buffer.length >= 16 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP' && buffer.readUInt32LE(4) + 8 === buffer.length) return ['image/webp', 'webp'];
  return null;
}

exports.handler = async event => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (!['GET', 'POST'].includes(event.httpMethod)) return reply(405, { success: false, error: 'Method not allowed.' });
  try {
    if (event.httpMethod === 'GET') {
      const id = event.queryStringParameters?.id || '';
      if (!/^[0-9a-f-]{36}\.(png|jpg|webp)$/.test(id)) return reply(404, { success: false, error: 'Image not found.' });
      const image = await getImagesStore().getWithMetadata('images/' + id, { type: 'arrayBuffer' });
      if (!image || !['image/png', 'image/jpeg', 'image/webp'].includes(image.metadata?.contentType)) return reply(404, { success: false, error: 'Image not found.' });
      return {
        statusCode: 200, isBase64Encoded: true,
        headers: { ...HEADERS, 'Content-Type': image.metadata.contentType, 'Cache-Control': 'public, max-age=31536000, immutable' },
        body: Buffer.from(image.data).toString('base64')
      };
    }

    const { resolveAccountUser } = await import('./lib/account-session.mjs');
    const user = await resolveAccountUser(new Request('https://upload.internal', {
      headers: { authorization: event.headers?.authorization || event.headers?.Authorization || '' }
    }));
    if (!user) return reply(401, { success: false, error: 'Please sign in.' });
    if (user.role !== 'admin') return reply(403, { success: false, error: 'Administrator access is required.' });
    if (typeof event.body !== 'string' || event.body.length > MAX_BODY) return reply(413, { success: false, error: 'Choose an image smaller than 2 MB.' });
    let payload;
    try { payload = JSON.parse(event.body); } catch { return reply(400, { success: false, error: 'Invalid JSON.' }); }
    const match = typeof payload?.base64Data === 'string' && payload.base64Data.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!match) return reply(400, { success: false, error: 'Upload a PNG, JPEG, or WebP image.' });
    const image = Buffer.from(match[2], 'base64');
    if (image.length > MAX_BYTES) return reply(413, { success: false, error: 'Choose an image smaller than 2 MB.' });
    const detected = detectImage(image);
    if (image.toString('base64') !== match[2] || !detected || detected[0] !== match[1]) return reply(400, { success: false, error: 'The file does not match its image format.' });

    const store = getImagesStore();
    const rateKey = 'limits/' + createHash('sha256').update(String(user.email)).digest('hex');
    const now = Date.now();
    let rate = await store.get(rateKey, { type: 'json' });
    if (!rate || now >= rate.resetAt) rate = { count: 0, resetAt: now + WINDOW_MS };
    if (rate.count >= 30) return reply(429, { success: false, error: 'Upload limit reached. Try again in 15 minutes.' });
    rate.count += 1;
    await store.setJSON(rateKey, rate);
    const id = randomUUID() + '.' + detected[1];
    await store.set('images/' + id, new Blob([image], { type: detected[0] }), { metadata: { contentType: detected[0] } });
    return reply(200, { success: true, url: '/.netlify/functions/upload-image?id=' + id });
  } catch (error) {
    console.error('[Image upload] Storage is unavailable:', error.message);
    return reply(503, { success: false, error: 'Image storage is temporarily unavailable. Try again shortly.' });
  }
};
