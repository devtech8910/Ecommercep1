// ============================================================
// DEVTECH FASHION — IMAGE UPLOAD PROXY
// Proxies image uploads from client to Catbox.moe (server-side)
// Eliminates CORS issues that block direct browser uploads
// Uses native Node 18+ FormData & Blob for clean uploads
// ============================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'Method not allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const { base64Data, filename } = payload;

    if (!base64Data) {
      return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'base64Data is required' }) };
    }

    // Strip the data:image/...;base64, prefix if present
    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');

    const fname = filename || `product_${Date.now()}.jpg`;

    // Determine MIME type from base64 prefix or fallback
    let mimeType = 'image/jpeg';
    if (base64Data.startsWith('data:image/png')) mimeType = 'image/png';
    else if (base64Data.startsWith('data:image/webp')) mimeType = 'image/webp';

    // --- Try Catbox.moe (Primary) ---
    try {
      const url = await uploadToCatbox(buffer, fname, mimeType);
      if (url && url.startsWith('https://')) {
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, url }) };
      }
    } catch (e) {
      console.warn('[Upload] Catbox failed:', e.message);
    }

    // --- Fallback: Try 0x0.st ---
    try {
      const url = await uploadTo0x0(buffer, fname, mimeType);
      if (url && url.startsWith('http')) {
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, url }) };
      }
    } catch (e) {
      console.warn('[Upload] 0x0.st failed:', e.message);
    }

    throw new Error('All image hosting services failed. Please try again later.');
  } catch (err) {
    console.error('[Upload] Error:', err.message);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: err.message }) };
  }
};

// --- Catbox.moe upload via native FormData & Blob ---
async function uploadToCatbox(buffer, filename, mimeType) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([buffer], { type: mimeType }), filename);

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form
  });

  const text = await res.text();
  if (res.ok && text.trim().startsWith('https://')) {
    console.log('[Upload] Catbox success:', text.trim());
    return text.trim();
  }
  throw new Error(`Catbox returned status ${res.status}: ${text.substring(0, 100)}`);
}

// --- 0x0.st upload via native FormData & Blob ---
async function uploadTo0x0(buffer, filename, mimeType) {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType }), filename);

  const res = await fetch('https://0x0.st', {
    method: 'POST',
    body: form
  });

  const text = await res.text();
  if (res.ok && text.trim().startsWith('http')) {
    console.log('[Upload] 0x0.st success:', text.trim());
    return text.trim();
  }
  throw new Error(`0x0.st returned status ${res.status}: ${text.substring(0, 100)}`);
}
