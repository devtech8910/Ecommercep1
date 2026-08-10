// ============================================================
// DEVTECH FASHION — IMAGE UPLOAD PROXY
// Proxies image uploads from client to Catbox.moe (server-side)
// Eliminates CORS issues that block direct browser uploads
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

    // --- Try Catbox.moe ---
    try {
      const url = await uploadToCatbox(buffer, fname, mimeType);
      if (url) {
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, url }) };
      }
    } catch (e) {
      console.warn('[Upload] Catbox failed:', e.message);
    }

    // --- Fallback: Try 0x0.st ---
    try {
      const url = await uploadTo0x0(buffer, fname, mimeType);
      if (url) {
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, url }) };
      }
    } catch (e) {
      console.warn('[Upload] 0x0.st failed:', e.message);
    }

    // --- Fallback: Try file.coffee ---
    try {
      const url = await uploadToFileCoffee(buffer, fname, mimeType);
      if (url) {
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, url }) };
      }
    } catch (e) {
      console.warn('[Upload] file.coffee failed:', e.message);
    }

    throw new Error('All image hosting services failed. Please try again later.');
  } catch (err) {
    console.error('[Upload] Error:', err.message);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: err.message }) };
  }
};

// --- Catbox.moe upload (permanent, free, no API key) ---
async function uploadToCatbox(buffer, filename, mimeType) {
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  
  const parts = [];
  
  // reqtype field
  parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload`);
  
  // file field - we need to build this carefully with binary data
  const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="fileToUpload"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`;
  const fileFooter = `\r\n--${boundary}--\r\n`;

  const headerBuf = Buffer.from(fileHeader, 'utf-8');
  const footerBuf = Buffer.from(fileFooter, 'utf-8');
  const reqtypePart = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reqtype"\r\n\r\nfileupload\r\n`, 'utf-8');
  
  const body = Buffer.concat([reqtypePart, headerBuf, buffer, footerBuf]);

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: body
  });

  const text = await res.text();
  if (res.ok && text.startsWith('https://')) {
    console.log('[Upload] Catbox success:', text.trim());
    return text.trim();
  }
  throw new Error(`Catbox returned: ${res.status} - ${text.substring(0, 200)}`);
}

// --- 0x0.st upload (free, no API key) ---
async function uploadTo0x0(buffer, filename, mimeType) {
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  
  const headerBuf = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`, 'utf-8'
  );
  const footerBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const body = Buffer.concat([headerBuf, buffer, footerBuf]);

  const res = await fetch('https://0x0.st', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: body
  });

  const text = await res.text();
  if (res.ok && text.startsWith('http')) {
    console.log('[Upload] 0x0.st success:', text.trim());
    return text.trim();
  }
  throw new Error(`0x0.st returned: ${res.status} - ${text.substring(0, 200)}`);
}

// --- file.coffee upload (free, no API key) ---
async function uploadToFileCoffee(buffer, filename, mimeType) {
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  
  const headerBuf = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`, 'utf-8'
  );
  const footerBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const body = Buffer.concat([headerBuf, buffer, footerBuf]);

  const res = await fetch('https://file.coffee/api/file/upload', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body: body
  });

  if (res.ok) {
    const json = await res.json();
    if (json.url) {
      console.log('[Upload] file.coffee success:', json.url);
      return json.url;
    }
  }
  const text = await res.text();
  throw new Error(`file.coffee returned: ${res.status} - ${text.substring(0, 200)}`);
}
