// ============================================================
// FASHIONCOMPANY FASHION - NETLIFY SERVERLESS CLOUD PRODUCTS CATALOG
// Single source of truth for cross-device product synchronisation
// ============================================================

import { getStore } from '@netlify/blobs';

const PRODUCTS_STORE_NAME = 'fashioncompany-products';
const PRODUCTS_BLOB_KEY = 'catalog.json';

// Optional legacy import URL. If this points to a removed JSONBlob/resource and
// returns 404, writes must still work through Netlify Blobs.
const CLOUD_PRODUCTS_URL = process.env.CLOUD_PRODUCTS_URL;
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
    name: PRODUCTS_STORE_NAME,
    siteID,
    token,
    consistency: 'strong'
  };
}

function getProductsStore() {
  try {
    return getStore({ name: PRODUCTS_STORE_NAME, consistency: 'strong' });
  } catch (err) {
    const manualOptions = getManualBlobsOptions();
    if (manualOptions) {
      try {
        return getStore(manualOptions);
      } catch (manualErr) {
        throw new Error(`Netlify Blobs product store is unavailable with manual configuration: ${manualErr.message}`);
      }
    }

    throw new Error(
      'Netlify Blobs product store is unavailable. The function runtime did not provide Blobs configuration, ' +
      'and NETLIFY_BLOBS_SITE_ID/NETLIFY_BLOBS_TOKEN are not set in Netlify environment variables.'
    );
  }
}

function parseProductList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.products)) return data.products;
  return [];
}

function normaliseCategory(category) {
  const cat = String(category || '').trim().toLowerCase();
  if (cat.includes('women')) return 'womens';
  if (cat.includes('men')) return 'mens';
  if (cat.includes('kid')) return 'kids';
  if (cat.includes('access')) return 'accessories';
  return cat;
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
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
    console.error('[Products Auth] Admin token verification failed:', err.message);
    return false;
  }
}

async function fetchLegacyProducts() {
  if (!CLOUD_PRODUCTS_URL) return [];

  try {
    const res = await fetch(CLOUD_PRODUCTS_URL, {
      headers: { Accept: 'application/json' }
    });

    if (!res.ok) {
      console.warn(`[Products Legacy Import] Ignored legacy CLOUD_PRODUCTS_URL: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    return parseProductList(data);
  } catch (err) {
    console.warn('[Products Legacy Import] Ignored legacy CLOUD_PRODUCTS_URL error:', err.message);
    return [];
  }
}

// Fetch the current product list from Netlify Blob storage.
async function getCloudProducts() {
  const store = getProductsStore();
  const data = await store.get(PRODUCTS_BLOB_KEY, { type: 'json', consistency: 'strong' });
  if (data) return parseProductList(data);

  const legacyProducts = await fetchLegacyProducts();
  await saveCloudProducts(legacyProducts);
  return legacyProducts;
}

// Persist the full product list to Netlify Blob storage.
async function saveCloudProducts(products) {
  const store = getProductsStore();
  await store.setJSON(PRODUCTS_BLOB_KEY, Array.isArray(products) ? products : []);
  console.log(`[Products] Saved ${Array.isArray(products) ? products.length : 0} products to Netlify Blobs.`);
}

// Normalise a raw product payload into a consistent storage shape.
function normaliseProduct(payload, existing) {
  const base = existing || {};
  const imgUrl = payload.imageUrl || payload.image_url || payload.image || base.imageUrl || base.image_url || '';
  const sizeStock = payload.sizeStock || payload.size_stock || base.sizeStock || base.size_stock || 'S:10, M:10, L:10';
  const replacementAllowed = payload.replacementAllowed != null
    ? payload.replacementAllowed
    : (base.replacement_allowed != null ? base.replacement_allowed : (base.replacementAllowed != null ? base.replacementAllowed : true));
  const codAvailable = payload.codAvailable != null
    ? payload.codAvailable
    : (base.cod_available != null ? base.cod_available : (base.codAvailable != null ? base.codAvailable : true));
  const couponApplicable = payload.couponApplicable != null
    ? payload.couponApplicable
    : (base.coupon_applicable != null ? base.coupon_applicable : (base.couponApplicable != null ? base.couponApplicable : true));

  return {
    id: base.id || payload.id || payload.pid,
    pid: base.pid || payload.pid || payload.id,
    title: payload.title || base.title || '',
    brand: payload.brand || base.brand || 'Fashion Company Collection',
    category: normaliseCategory(payload.category || base.category || ''),
    title_description: payload.titleDescription || payload.title_description || base.title_description || '',
    titleDescription: payload.titleDescription || payload.title_description || base.titleDescription || '',
    mrp: parseFloat(payload.mrp != null ? payload.mrp : (base.mrp != null ? base.mrp : 0)),
    price: parseFloat(payload.price != null ? payload.price : (base.price != null ? base.price : 0)),
    image_url: imgUrl,
    imageUrl: imgUrl,
    sizes: payload.sizes || base.sizes || 'S, M, L',
    replacement_allowed: replacementAllowed,
    replacementAllowed,
    replacement_days: payload.replacementDays || payload.replacement_days || base.replacement_days || 7,
    replacementDays: payload.replacementDays || payload.replacement_days || base.replacementDays || 7,
    cod_available: codAvailable,
    codAvailable,
    coupon_applicable: couponApplicable,
    couponApplicable,
    fabric: payload.fabric || base.fabric || '',
    pattern: payload.pattern || base.pattern || '',
    fit: payload.fit || base.fit || '',
    suitable_for: payload.suitableFor || payload.suitable_for || base.suitable_for || '',
    suitableFor: payload.suitableFor || payload.suitable_for || base.suitableFor || '',
    description: payload.description || base.description || '',
    size_stock: sizeStock,
    sizeStock: sizeStock,
    created_at: base.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers: CORS_HEADERS });
  }

  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const productId = url.searchParams.get('id');
      const category = url.searchParams.get('category');

      const products = await getCloudProducts();

      if (productId) {
        const product = products.find(p => String(p.id || p.pid) === String(productId));
        if (product) {
          return jsonResponse(200, { success: true, product });
        }
        return jsonResponse(404, { success: false, error: 'Product not found.' });
      }

      const requestedCategory = normaliseCategory(category);
      const filtered = requestedCategory
        ? products.filter(p => normaliseCategory(p.category) === requestedCategory)
        : products;

      return jsonResponse(200, { success: true, products: filtered });
    } catch (err) {
      console.error('[Products GET] Error:', err.message);
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
      const { title, price, category } = payload;
      const imgUrl = payload.imageUrl || payload.image_url || payload.image;

      if (!title || price === undefined || !imgUrl || !category) {
        return jsonResponse(400, {
          success: false,
          error: 'Required fields missing: title, price, imageUrl, category.'
        });
      }

      const products = await getCloudProducts();
      const newId = 'cloud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
      const newProduct = normaliseProduct(payload, { id: newId, pid: newId });
      newProduct.id = newId;
      newProduct.pid = newId;
      newProduct.created_at = new Date().toISOString();
      delete newProduct.updated_at;

      products.unshift(newProduct);
      await saveCloudProducts(products);

      console.log(`[Products POST] Added "${newProduct.title}" (ID: ${newId})`);
      return jsonResponse(201, { success: true, product: newProduct });
    } catch (err) {
      console.error('[Products POST] Error:', err.message);
      return jsonResponse(500, { success: false, error: err.message });
    }
  }

  if (request.method === 'PUT') {
    try {
      const payload = await parseJsonBody(request);
      const productId = payload.id || payload.pid;

      if (!productId) {
        return jsonResponse(400, { success: false, error: 'Product ID is required for update.' });
      }

      const products = await getCloudProducts();
      const idx = products.findIndex(p => String(p.id || p.pid) === String(productId));

      let updatedProduct;
      if (idx === -1) {
        updatedProduct = normaliseProduct(payload, { id: productId, pid: productId });
        updatedProduct.id = productId;
        updatedProduct.pid = productId;
        products.unshift(updatedProduct);
        console.log(`[Products PUT] Inserted (was not in cloud) "${updatedProduct.title}" (ID: ${productId})`);
      } else {
        updatedProduct = normaliseProduct(payload, products[idx]);
        updatedProduct.id = productId;
        updatedProduct.pid = productId;
        products[idx] = updatedProduct;
        console.log(`[Products PUT] Updated "${updatedProduct.title}" (ID: ${productId})`);
      }

      await saveCloudProducts(products);
      return jsonResponse(200, { success: true, product: updatedProduct });
    } catch (err) {
      console.error('[Products PUT] Error:', err.message);
      return jsonResponse(500, { success: false, error: err.message });
    }
  }

  if (request.method === 'DELETE') {
    try {
      const payload = await parseJsonBody(request);
      const productId = payload.id || payload.pid;

      if (!productId) {
        return jsonResponse(400, { success: false, error: 'Product ID is required.' });
      }

      const products = await getCloudProducts();
      const before = products.length;
      const remaining = products.filter(p => String(p.id || p.pid) !== String(productId));

      if (remaining.length === before) {
        return jsonResponse(404, { success: false, error: 'Product not found.' });
      }

      await saveCloudProducts(remaining);
      console.log(`[Products DELETE] Deleted ID ${productId}. Remaining: ${remaining.length}`);
      return jsonResponse(200, { success: true, message: 'Product deleted.' });
    } catch (err) {
      console.error('[Products DELETE] Error:', err.message);
      return jsonResponse(500, { success: false, error: err.message });
    }
  }

  return jsonResponse(405, { success: false, error: 'Method not allowed.' });
}
