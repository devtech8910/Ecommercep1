const ACCOUNT_STORE_NAME = 'fashion-company-accounts';
const ACCOUNT_USERS_KEY = 'users.json';
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_REQUEST_BYTES = 6 * 1024 * 1024;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

function response(statusCode, payload) {
  return { statusCode, headers: CORS_HEADERS, body: payload ? JSON.stringify(payload) : '' };
}

function getImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

async function requireAdmin(event) {
  const authorization = event.headers?.authorization || event.headers?.Authorization || '';
  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;

  const { getStore } = await import('@netlify/blobs');
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const blobToken = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
  const store = siteID && blobToken
    ? getStore({ name: ACCOUNT_STORE_NAME, siteID, token: blobToken, consistency: 'strong' })
    : getStore({ name: ACCOUNT_STORE_NAME, consistency: 'strong' });
  const users = await store.get(ACCOUNT_USERS_KEY, { type: 'json', consistency: 'strong' });
  return Array.isArray(users) && users.some(user => user?.token === token && user?.role === 'admin' && !user?.deletionScheduled);
}

exports.handler = async event => {
  if (event.httpMethod === 'OPTIONS') return response(204);
  if (event.httpMethod !== 'POST') return response(405, { success: false, error: 'Method not allowed.' });

  const bodyText = event.body || '';
  if (Buffer.byteLength(bodyText, 'utf8') > MAX_REQUEST_BYTES) {
    return response(413, { success: false, error: 'Image exceeds the 4 MB limit.' });
  }

  try {
    if (!await requireAdmin(event)) return response(401, { success: false, error: 'Administrator sign-in is required.' });
  } catch (error) {
    console.error('[Upload] Could not validate administrator session:', error.message);
    return response(503, { success: false, error: 'Upload authorization is temporarily unavailable.' });
  }

  let base64Data;
  let filename;
  try {
    ({ base64Data, filename } = JSON.parse(bodyText || '{}'));
  } catch {
    return response(400, { success: false, error: 'Request must contain valid JSON.' });
  }
  if (typeof base64Data !== 'string' || !base64Data) {
    return response(400, { success: false, error: 'base64Data is required.' });
  }

  const match = base64Data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match) return response(415, { success: false, error: 'Only JPEG, PNG, and WebP images are accepted.' });
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
    return response(413, { success: false, error: 'Image must be smaller than 4 MB.' });
  }
  const mimeType = getImageType(buffer);
  if (!mimeType || mimeType !== match[1].toLowerCase()) {
    return response(415, { success: false, error: 'Image content does not match its declared type.' });
  }

  const safeFilename = typeof filename === 'string'
    ? filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
    : 'product-image';
  const base64Clean = buffer.toString('base64');

  try {
    const url = await uploadToFreeImageHost(base64Clean);
    if (url && url.startsWith('https://')) return response(200, { success: true, url });
  } catch (error) {
    console.warn('[Upload] FreeImage.host failed:', error.message);
  }

  try {
    const url = await uploadToCatbox(buffer, mimeType, safeFilename);
    if (url && url.startsWith('https://')) return response(200, { success: true, url });
  } catch (error) {
    console.warn('[Upload] Catbox failed:', error.message);
  }

  return response(502, { success: false, error: 'Image hosting is temporarily unavailable. Please try again.' });
};

async function uploadToFreeImageHost(base64String) {
  const apiKey = process.env.FREEIMAGE_API_KEY;
  if (!apiKey) throw new Error('Image host is not configured.');
  const body = `key=${encodeURIComponent(apiKey)}&action=upload&format=json&source=${encodeURIComponent(base64String)}`;
  const res = await fetch('https://freeimage.host/api/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(12000)
  });
  if (!res.ok) throw new Error(`Image host returned ${res.status}.`);
  const data = await res.json();
  return data?.image?.url || data?.image?.display_url || null;
}

async function uploadToCatbox(buffer, mimeType, filename) {
  const extension = mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/png' ? '.png' : '.webp';
  const safeName = filename.replace(/\.(?:jpe?g|png|webp)$/i, '') + extension;
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([buffer], { type: mimeType }), safeName);
  const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form, signal: AbortSignal.timeout(12000) });
  const url = (await res.text()).trim();
  if (!res.ok || !url.startsWith('https://')) throw new Error(`Image host returned ${res.status}.`);
  return url;
}
