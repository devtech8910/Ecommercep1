// ============================================================
// DEVTECH FASHION — NETLIFY SERVERLESS CLOUD PRODUCTS CATALOG
// Single source of truth for cross-device product synchronisation
// ============================================================

const { getStore } = require('@netlify/blobs');

const PRODUCTS_STORE_NAME = 'devtech-products';
const PRODUCTS_BLOB_KEY = 'catalog.json';

// Optional legacy import URL. If this points to a removed JSONBlob/resource and
// returns 404, writes must still work through Netlify Blobs.
const CLOUD_PRODUCTS_URL = process.env.CLOUD_PRODUCTS_URL;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

function getProductsStore() {
  try {
    return getStore(PRODUCTS_STORE_NAME);
  } catch (err) {
    throw new Error(`Netlify Blobs product store is unavailable: ${err.message}`);
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

async function fetchLegacyProducts() {
  if (!CLOUD_PRODUCTS_URL) return [];

  try {
    const res = await fetch(CLOUD_PRODUCTS_URL, {
      headers: { 'Accept': 'application/json' }
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

// Normalise a raw product payload into a consistent storage shape
function normaliseProduct(payload, existing) {
  const base = existing || {};
  const imgUrl = payload.imageUrl || payload.image_url || payload.image || base.imageUrl || base.image_url || '';
  const sizeStock = payload.sizeStock || payload.size_stock || base.sizeStock || base.size_stock || 'S:10, M:10, L:10';
  return {
    id: base.id || payload.id || payload.pid,
    pid: base.pid || payload.pid || payload.id,
    title: payload.title || base.title || '',
    brand: payload.brand || base.brand || 'DevTech Collection',
    category: normaliseCategory(payload.category || base.category || ''),
    title_description: payload.titleDescription || payload.title_description || base.title_description || '',
    titleDescription: payload.titleDescription || payload.title_description || base.titleDescription || '',
    mrp: parseFloat(payload.mrp != null ? payload.mrp : (base.mrp != null ? base.mrp : 0)),
    price: parseFloat(payload.price != null ? payload.price : (base.price != null ? base.price : 0)),
    image_url: imgUrl,
    imageUrl: imgUrl,
    sizes: payload.sizes || base.sizes || 'S, M, L',
    replacement_allowed: payload.replacementAllowed != null ? payload.replacementAllowed : (base.replacement_allowed != null ? base.replacement_allowed : true),
    replacementAllowed: payload.replacementAllowed != null ? payload.replacementAllowed : (base.replacementAllowed != null ? base.replacementAllowed : true),
    replacement_days: payload.replacementDays || payload.replacement_days || base.replacement_days || 7,
    replacementDays: payload.replacementDays || payload.replacement_days || base.replacementDays || 7,
    cod_available: payload.codAvailable != null ? payload.codAvailable : (base.cod_available != null ? base.cod_available : true),
    codAvailable: payload.codAvailable != null ? payload.codAvailable : (base.codAvailable != null ? base.codAvailable : true),
    coupon_applicable: payload.couponApplicable != null ? payload.couponApplicable : (base.coupon_applicable != null ? base.coupon_applicable : true),
    couponApplicable: payload.couponApplicable != null ? payload.couponApplicable : (base.couponApplicable != null ? base.couponApplicable : true),
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

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // ── GET — Return all products (or filter by id/category) ─────────────────
  if (event.httpMethod === 'GET') {
    try {
      const params = event.queryStringParameters || {};
      const productId = params.id;
      const category = params.category;

      const products = await getCloudProducts();

      if (productId) {
        const product = products.find(p => String(p.id || p.pid) === String(productId));
        if (product) {
          return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, product }) };
        }
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'Product not found.' }) };
      }

      const requestedCategory = normaliseCategory(category);
      const filtered = requestedCategory
        ? products.filter(p => normaliseCategory(p.category) === requestedCategory)
        : products;

      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, products: filtered }) };
    } catch (err) {
      console.error('[Products GET] Error:', err.message);
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: err.message }) };
    }
  }

  // ── POST — Add a new product ──────────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const { title, price, category } = payload;
      const imgUrl = payload.imageUrl || payload.image_url || payload.image;

      if (!title || price === undefined || !imgUrl || !category) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'Required fields missing: title, price, imageUrl, category.' })
        };
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
      return { statusCode: 201, headers: CORS_HEADERS, body: JSON.stringify({ success: true, product: newProduct }) };
    } catch (err) {
      console.error('[Products POST] Error:', err.message);
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: err.message }) };
    }
  }

  // ── PUT — Update an existing product ─────────────────────────────────────
  if (event.httpMethod === 'PUT') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const productId = payload.id || payload.pid;

      if (!productId) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'Product ID is required for update.' }) };
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
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, product: updatedProduct }) };
    } catch (err) {
      console.error('[Products PUT] Error:', err.message);
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: err.message }) };
    }
  }

  // ── DELETE — Remove a product ─────────────────────────────────────────────
  if (event.httpMethod === 'DELETE') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const productId = payload.id || payload.pid;

      if (!productId) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'Product ID is required.' }) };
      }

      const products = await getCloudProducts();
      const before = products.length;
      const remaining = products.filter(p => String(p.id || p.pid) !== String(productId));

      if (remaining.length === before) {
        return { statusCode: 404, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: 'Product not found.' }) };
      }

      await saveCloudProducts(remaining);
      console.log(`[Products DELETE] Deleted ID ${productId}. Remaining: ${remaining.length}`);
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, message: 'Product deleted.' }) };
    } catch (err) {
      console.error('[Products DELETE] Error:', err.message);
      return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success: false, error: err.message }) };
    }
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: 'Method not allowed.' })
  };
};
