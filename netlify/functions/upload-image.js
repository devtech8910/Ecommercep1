// ============================================================
// DEVTECH FASHION — IMAGE UPLOAD PROXY
// Uploads product images to permanent free image cloud hosting (FreeImage.host CDN & Catbox)
// Eliminates CORS issues and returns clean, permanent image URLs
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

    // Strip data URL prefix to get raw base64 string
    const base64Clean = base64Data.replace(/^data:[^;]+;base64,/, '');

    // --- Primary: FreeImage.host (Fast global CDN, permanent URLs) ---
    try {
      const url = await uploadToFreeImageHost(base64Clean);
      if (url && url.startsWith('http')) {
        console.log('[Upload] FreeImage.host success:', url);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, url }) };
      }
    } catch (e) {
      console.warn('[Upload] FreeImage.host failed:', e.message);
    }

    // --- Secondary: Catbox.moe ---
    try {
      const url = await uploadToCatbox(base64Clean, filename || 'product.jpg');
      if (url && url.startsWith('http')) {
        console.log('[Upload] Catbox success:', url);
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, url }) };
      }
    } catch (e) {
      console.warn('[Upload] Catbox failed:', e.message);
    }

    // Fallback: Return clean data URL if small enough
    if (base64Data.length < 500000) {
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, url: base64Data }) };
    }

    throw new Error('Image upload failed. Please try a smaller image file.');
  } catch (err) {
    console.error('[Upload] Error:', err.message);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: err.message }) };
  }
};

// --- FreeImage.host API Upload (with encodeURIComponent base64 preservation) ---
async function uploadToFreeImageHost(base64String) {
  const body = `key=6d207e02198a847aa98d0a2a901485a5&action=upload&format=json&source=${encodeURIComponent(base64String)}`;

  const res = await fetch('https://freeimage.host/api/1/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
  });

  if (res.ok) {
    const data = await res.json();
    const directUrl = data?.image?.url || data?.image?.display_url;
    if (directUrl) return directUrl;
  }
  throw new Error(`FreeImage.host status ${res.status}`);
}

// --- Catbox.moe Fallback Upload ---
async function uploadToCatbox(base64String, filename) {
  const buffer = Buffer.from(base64String, 'base64');
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', new Blob([buffer], { type: 'image/jpeg' }), filename);

  const res = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form
  });

  const text = await res.text();
  if (res.ok && text.trim().startsWith('https://')) {
    return text.trim();
  }
  throw new Error(`Catbox status ${res.status}`);
}
