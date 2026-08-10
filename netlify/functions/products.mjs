// ============================================================
// DEVTECH FASHION — NETLIFY SERVERLESS CLOUD PRODUCTS CATALOG
// Single source of truth for cross-device product synchronisation
// Uses Netlify Blobs — permanent, built-in Netlify storage
// Netlify Functions v2 format (ESM with Request/Response API)
// ============================================================

import { getStore } from "@netlify/blobs";

const STORE_NAME = 'devtech-products';
const CATALOG_KEY = 'catalog';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Read all products from Netlify Blobs
async function getCloudProducts() {
  try {
    const store = getStore(STORE_NAME);
    const data = await store.get(CATALOG_KEY, { type: 'json' });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[Products] Blob read error:', err.message);
    return [];
  }
}

// Write the full product array to Netlify Blobs
async function saveCloudProducts(products) {
  const store = getStore(STORE_NAME);
  await store.setJSON(CATALOG_KEY, products);
  console.log(`[Products] Saved ${products.length} products to Netlify Blobs.`);
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
    category: payload.category || base.category || '',
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

// Helper to create JSON responses
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

export default async (req, context) => {
  const method = req.method;

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response('', { status: 204, headers: CORS_HEADERS });
  }

  // ── GET — Return all products (or filter by id/category) ─────────────────
  if (method === 'GET') {
    try {
      const url = new URL(req.url);
      const productId = url.searchParams.get('id');
      const category = url.searchParams.get('category');

      const products = await getCloudProducts();

      if (productId) {
        const product = products.find(p => String(p.id || p.pid) === String(productId));
        if (product) {
          return jsonResponse({ success: true, product });
        }
        return jsonResponse({ success: false, error: 'Product not found.' }, 404);
      }

      const filtered = category
        ? products.filter(p => (p.category || '').toLowerCase() === category.toLowerCase())
        : products;

      return jsonResponse({ success: true, products: filtered });
    } catch (err) {
      console.error('[Products GET] Error:', err.message);
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }

  // ── POST — Add a new product ──────────────────────────────────────────────
  if (method === 'POST') {
    try {
      const payload = await req.json();
      const { title, price, category } = payload;
      const imgUrl = payload.imageUrl || payload.image_url || payload.image;

      if (!title || price === undefined || !imgUrl || !category) {
        return jsonResponse({ success: false, error: 'Required fields missing: title, price, imageUrl, category.' }, 400);
      }

      const products = await getCloudProducts();

      // Generate an authoritative cloud ID
      const newId = 'cloud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
      const newProduct = normaliseProduct(payload, { id: newId, pid: newId });
      newProduct.id = newId;
      newProduct.pid = newId;
      newProduct.created_at = new Date().toISOString();
      delete newProduct.updated_at;

      products.unshift(newProduct);
      await saveCloudProducts(products);

      console.log(`[Products POST] Added "${newProduct.title}" (ID: ${newId})`);
      return jsonResponse({ success: true, product: newProduct }, 201);
    } catch (err) {
      console.error('[Products POST] Error:', err.message);
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }

  // ── PUT — Update an existing product ─────────────────────────────────────
  if (method === 'PUT') {
    try {
      const payload = await req.json();
      const productId = payload.id || payload.pid;

      if (!productId) {
        return jsonResponse({ success: false, error: 'Product ID is required for update.' }, 400);
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
      return jsonResponse({ success: true, product: updatedProduct });
    } catch (err) {
      console.error('[Products PUT] Error:', err.message);
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }

  // ── DELETE — Remove a product ─────────────────────────────────────────────
  if (method === 'DELETE') {
    try {
      const payload = await req.json();
      const productId = payload.id || payload.pid;

      if (!productId) {
        return jsonResponse({ success: false, error: 'Product ID is required.' }, 400);
      }

      const products = await getCloudProducts();
      const before = products.length;
      const remaining = products.filter(p => String(p.id || p.pid) !== String(productId));

      if (remaining.length === before) {
        return jsonResponse({ success: false, error: 'Product not found.' }, 404);
      }

      await saveCloudProducts(remaining);
      console.log(`[Products DELETE] Deleted ID ${productId}. Remaining: ${remaining.length}`);
      return jsonResponse({ success: true, message: 'Product deleted.' });
    } catch (err) {
      console.error('[Products DELETE] Error:', err.message);
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }

  return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);
};

export const config = {
  path: "/.netlify/functions/products"
};
