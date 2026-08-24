import { getStore } from '@netlify/blobs';

const BANNERS_STORE_NAME = 'fashioncompany-banners';
const BANNERS_BLOB_KEY = 'banners.json';
const CLOUD_AUTH_USERS_URL = process.env.CLOUD_DB_URL || 'https://jsonblob.com/api/jsonBlob/019f9cba-929a-7931-ad23-922a9b668aa9';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: CORS_HEADERS
  });
}

function getManualBlobsOptions() {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN;

  if (!siteID || !token) return null;

  return {
    name: BANNERS_STORE_NAME,
    siteID,
    token,
    consistency: 'strong'
  };
}

function getBannersStore() {
  try {
    return getStore({ name: BANNERS_STORE_NAME, consistency: 'strong' });
  } catch (err) {
    const manualOptions = getManualBlobsOptions();
    if (manualOptions) {
      try {
        return getStore(manualOptions);
      } catch (manualErr) {
        throw new Error(`Netlify Blobs banners store is unavailable with manual configuration: ${manualErr.message}`);
      }
    }

    throw new Error(
      'Netlify Blobs banners store is unavailable. The function runtime did not provide Blobs configuration, ' +
      'and NETLIFY_BLOBS_SITE_ID/NETLIFY_BLOBS_TOKEN are not set in Netlify environment variables.'
    );
  }
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function parseBannerList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.map(banner => normaliseBanner(banner, banner));
  if (Array.isArray(data.banners)) return data.banners.map(banner => normaliseBanner(banner, banner));
  return [];
}

async function getCloudBanners() {
  const store = getBannersStore();
  const data = await store.get(BANNERS_BLOB_KEY, { type: 'json', consistency: 'strong' });
  return parseBannerList(data);
}

async function saveCloudBanners(banners) {
  const store = getBannersStore();
  await store.setJSON(BANNERS_BLOB_KEY, Array.isArray(banners) ? banners : []);
  console.log(`[Banners] Saved ${Array.isArray(banners) ? banners.length : 0} banners to Netlify Blobs.`);
}

function normaliseBanner(payload, existing) {
  const base = existing || {};
  const imageUrl = payload.imageUrl || payload.image_url || base.imageUrl || base.image_url || '';
  const linkUrl = payload.linkUrl !== undefined
    ? payload.linkUrl
    : (payload.link_url !== undefined ? payload.link_url : (base.linkUrl || base.link_url || ''));
  const isActive = payload.isActive !== undefined
    ? payload.isActive
    : (payload.active !== undefined ? payload.active : (base.isActive !== undefined ? base.isActive : (base.active !== undefined ? base.active : true)));
  const rawOrder = payload.order !== undefined
    ? payload.order
    : (payload.display_order !== undefined ? payload.display_order : (base.order !== undefined ? base.order : base.display_order));
  const order = rawOrder !== undefined ? parseInt(rawOrder, 10) : 999;
  const createdAt = base.created_at || base.createdAt || new Date().toISOString();
  const updatedAt = new Date().toISOString();

  return {
    id: base.id || payload.id,
    title: payload.title || base.title || '',
    description: payload.description !== undefined ? payload.description : (base.description || ''),
    badge: payload.badge !== undefined ? payload.badge : (base.badge || ''),
    buttonText: payload.buttonText !== undefined ? payload.buttonText : (payload.button_text !== undefined ? payload.button_text : (base.buttonText || base.button_text || '')),
    button_text: payload.button_text !== undefined ? payload.button_text : (payload.buttonText !== undefined ? payload.buttonText : (base.button_text || base.buttonText || '')),
    buttonLink: payload.buttonLink !== undefined ? payload.buttonLink : (payload.button_link !== undefined ? payload.button_link : (base.buttonLink || base.button_link || '')),
    button_link: payload.button_link !== undefined ? payload.button_link : (payload.buttonLink !== undefined ? payload.buttonLink : (base.button_link || base.buttonLink || '')),
    imageUrl,
    image_url: imageUrl,
    linkUrl,
    link_url: linkUrl,
    isActive,
    active: isActive,
    order: isNaN(order) ? 999 : order,
    display_order: isNaN(order) ? 999 : order,
    created_at: createdAt,
    createdAt,
    updated_at: updatedAt,
    updatedAt
  };
}

async function requireAdmin(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return false;

  try {
    const res = await fetch(CLOUD_AUTH_USERS_URL, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) return false;

    const users = await res.json();
    if (!Array.isArray(users)) return false;

    return users.some(user =>
      user &&
      user.role === 'admin' &&
      user.token &&
      String(user.token) === String(token)
    );
  } catch (err) {
    console.error('[Banners Auth] Admin token verification failed:', err.message);
    return false;
  }
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS_HEADERS });
  }

  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const activeParam = url.searchParams.get('active');
      
      let banners = await getCloudBanners();

      if (activeParam === 'true') {
        banners = banners.filter(b => b.isActive === true || b.active === true);
      }

      banners.sort((a, b) => {
        const orderA = typeof a.order === 'number' ? a.order : (typeof a.display_order === 'number' ? a.display_order : 999);
        const orderB = typeof b.order === 'number' ? b.order : (typeof b.display_order === 'number' ? b.display_order : 999);
        return orderA - orderB;
      });

      return jsonResponse(200, { success: true, banners });
    } catch (err) {
      console.error('[Banners GET] Error:', err.message);
      return jsonResponse(500, { success: false, error: err.message });
    }
  }

  if (!(await requireAdmin(request))) {
    return jsonResponse(401, {
      success: false,
      error: 'Unauthorized. Admin access required.'
    });
  }

  if (request.method === 'POST') {
    try {
      const payload = await parseJsonBody(request);
      const title = payload.title;
      const imageUrl = payload.imageUrl || payload.image_url;

      if (!title || !imageUrl) {
        return jsonResponse(400, {
          success: false,
          error: 'Required fields missing: title, imageUrl.'
        });
      }

      const banners = await getCloudBanners();
      const newId = 'banner_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
      const newBanner = normaliseBanner(payload, { id: newId });
      newBanner.created_at = new Date().toISOString();
      newBanner.createdAt = newBanner.created_at;

      banners.push(newBanner);
      await saveCloudBanners(banners);

      console.log(`[Banners POST] Added "${newBanner.title}" (ID: ${newId})`);
      return jsonResponse(201, { success: true, banner: newBanner });
    } catch (err) {
      console.error('[Banners POST] Error:', err.message);
      return jsonResponse(500, { success: false, error: err.message });
    }
  }

  if (request.method === 'PUT') {
    try {
      const url = new URL(request.url);
      const payload = await parseJsonBody(request);
      const bannerId = payload.id || url.searchParams.get('id');

      if (!bannerId) {
        return jsonResponse(400, { success: false, error: 'Banner ID is required for update.' });
      }

      const banners = await getCloudBanners();
      const idx = banners.findIndex(b => String(b.id) === String(bannerId));

      let updatedBanner;
      if (idx === -1) {
        updatedBanner = normaliseBanner(payload, { id: bannerId });
        banners.push(updatedBanner);
        console.log(`[Banners PUT] Inserted (was not in cloud) "${updatedBanner.title}" (ID: ${bannerId})`);
      } else {
        updatedBanner = normaliseBanner(payload, banners[idx]);
        banners[idx] = updatedBanner;
        console.log(`[Banners PUT] Updated "${updatedBanner.title}" (ID: ${bannerId})`);
      }

      await saveCloudBanners(banners);
      return jsonResponse(200, { success: true, banner: updatedBanner });
    } catch (err) {
      console.error('[Banners PUT] Error:', err.message);
      return jsonResponse(500, { success: false, error: err.message });
    }
  }

  if (request.method === 'DELETE') {
    try {
      const url = new URL(request.url);
      const payload = await parseJsonBody(request);
      const bannerId = payload.id || url.searchParams.get('id');

      if (!bannerId) {
        return jsonResponse(400, { success: false, error: 'Banner ID is required.' });
      }

      const banners = await getCloudBanners();
      const before = banners.length;
      const remaining = banners.filter(b => String(b.id) !== String(bannerId));

      if (remaining.length === before) {
        return jsonResponse(404, { success: false, error: 'Banner not found.' });
      }

      await saveCloudBanners(remaining);
      console.log(`[Banners DELETE] Deleted ID ${bannerId}. Remaining: ${remaining.length}`);
      return jsonResponse(200, { success: true, message: 'Banner deleted.' });
    } catch (err) {
      console.error('[Banners DELETE] Error:', err.message);
      return jsonResponse(500, { success: false, error: err.message });
    }
  }

  return jsonResponse(405, { success: false, error: 'Method not allowed.' });
}
