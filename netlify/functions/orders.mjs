// ============================================================
// FASHION COMPANY - NETLIFY SERVERLESS CLOUD ORDERS
// Shared order source for customer orders, admin order management, and bills.
// ============================================================

import { getStore } from '@netlify/blobs';
import { resolveAccountUser } from './lib/account-session.mjs';

const ORDERS_STORE_NAME = 'fashion-company-orders';
const ORDERS_BLOB_KEY = 'orders.json';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

function getManualBlobsOptions(name = ORDERS_STORE_NAME) {
  const siteID = process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
  if (!siteID || !token) return null;
  return { name, siteID, token, consistency: 'strong' };
}

function getOrdersStore(name = ORDERS_STORE_NAME) {
  try {
    return getStore({ name, consistency: 'strong' });
  } catch (err) {
    const manualOptions = getManualBlobsOptions(name);
    if (manualOptions) return getStore(manualOptions);
    throw new Error('Netlify Blobs order store is unavailable.');
  }
}

async function parseJsonBody(request) {
  try {
    return await request.json();
  } catch {
    try {
      const text = await request.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return {};
    }
  }
}

function parseOrderList(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.orders)) return data.orders;
  return [];
}

async function getCloudOrders() {
  const store = getOrdersStore();
  const data = await store.get(ORDERS_BLOB_KEY, { type: 'json', consistency: 'strong' });
  return parseOrderList(data);
}

async function saveCloudOrders(orders) {
  const store = getOrdersStore();
  await store.setJSON(ORDERS_BLOB_KEY, Array.isArray(orders) ? orders : []);
}

function cleanEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeItems(rawItems) {
  const items = typeof rawItems === 'string' ? JSON.parse(rawItems || '[]') : rawItems;
  if (!Array.isArray(items)) return [];
  return items.map(item => ({
    id: item.id || item.pid || '',
    pid: item.pid || item.id || '',
    title: item.title || 'Product',
    brand: item.brand || '',
    hsn: item.hsn || '',
    price: Math.round(parseFloat(item.price || 0)),
    quantity: parseInt(item.quantity || 1, 10) || 1,
    size: item.size || '',
    color: item.color || '',
    image: item.image || ''
  }));
}

function normalizeAddress(rawAddress) {
  if (!rawAddress) return {};
  if (typeof rawAddress === 'string') return { fullAddress: rawAddress };
  return {
    label: rawAddress.label || rawAddress.address_type || rawAddress.type || 'ADDRESS',
    personName: rawAddress.personName || rawAddress.name || '',
    mobile: rawAddress.mobile || rawAddress.phone || rawAddress.addr_mobile || '',
    name: rawAddress.name || '',
    fullAddress: rawAddress.fullAddress || rawAddress.formattedAddress || '',
    house: rawAddress.house || rawAddress.addr_house || '',
    building: rawAddress.building || rawAddress.addr_building || '',
    street: rawAddress.street || rawAddress.addr_street || '',
    area: rawAddress.area || rawAddress.addr_area || '',
    city: rawAddress.city || rawAddress.district || rawAddress.addr_city || '',
    state: rawAddress.state || rawAddress.addr_state || '',
    pin: rawAddress.pin || rawAddress.pincode || rawAddress.addr_pincode || '',
    landmark: rawAddress.landmark || rawAddress.addr_landmark || ''
  };
}

function addressToText(address) {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return [
    address.fullAddress, address.house, address.building, address.street, address.area,
    address.landmark ? `Near ${address.landmark}` : '',
    [address.city, address.state].filter(Boolean).join(', '),
    address.pin ? `PIN ${address.pin}` : ''
  ].filter(Boolean).join(', ');
}

function buildOrder(payload, existing = {}) {
  const items = normalizeItems(payload.items || existing.items || []);
  const subtotal = payload.subtotal != null || existing.subtotal != null
    ? Math.round(parseFloat(payload.subtotal ?? existing.subtotal) || 0)
    : items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = payload.taxAmount != null || payload.tax_amount != null || existing.tax_amount != null
    ? Math.round(parseFloat(payload.taxAmount ?? payload.tax_amount ?? existing.tax_amount) || 0)
    : Math.round(subtotal * 18 / 100);
  const deliveryCharge = payload.deliveryCharge != null || payload.delivery_charge != null || existing.delivery_charge != null
    ? Math.round(parseFloat(payload.deliveryCharge ?? payload.delivery_charge ?? existing.delivery_charge) || 0)
    : (subtotal > 0 ? 150 : 0);
  const totalAmount = payload.totalAmount != null || payload.total_amount != null || existing.total_amount != null
    ? Math.round(parseFloat(payload.totalAmount ?? payload.total_amount ?? existing.total_amount) || 0)
    : subtotal + taxAmount + deliveryCharge;
  const deliveryAddress = normalizeAddress(payload.deliveryAddress || payload.delivery_address || existing.deliveryAddress || existing.delivery_address);
  const orderId = existing.id || payload.id || payload.order_id || `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    ...existing,
    id: orderId,
    order_id: orderId,
    user_id: payload.userId || payload.user_id || existing.user_id || '',
    customer_name: payload.customerName || payload.customer_name || existing.customer_name || '',
    email: cleanEmail(payload.email || existing.email),
    phone: payload.phone || existing.phone || '',
    status: payload.status || existing.status || 'Order Placed',
    payment_method: payload.paymentMethod || payload.payment_method || existing.payment_method || 'cod',
    payment_status: payload.paymentStatus || payload.payment_status || existing.payment_status || 'COD Pending',
    items,
    subtotal,
    tax_amount: taxAmount,
    delivery_charge: deliveryCharge,
    total_amount: totalAmount,
    deliveryAddress,
    delivery_address: addressToText(deliveryAddress),
    addr_name: deliveryAddress.personName || payload.customerName || payload.customer_name || existing.addr_name || '',
    addr_mobile: deliveryAddress.mobile || payload.phone || existing.addr_mobile || '',
    addr_house: deliveryAddress.house || existing.addr_house || '',
    addr_building: deliveryAddress.building || existing.addr_building || '',
    addr_street: deliveryAddress.street || existing.addr_street || '',
    addr_area: deliveryAddress.area || existing.addr_area || '',
    addr_city: deliveryAddress.city || existing.addr_city || '',
    addr_state: deliveryAddress.state || existing.addr_state || '',
    addr_pincode: deliveryAddress.pin || existing.addr_pincode || '',
    addr_landmark: deliveryAddress.landmark || existing.addr_landmark || '',
    created_at: existing.created_at || payload.created_at || new Date().toISOString(),
    placed_at: existing.placed_at || payload.placed_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

export default async function handler(request) {
  if (request.method === 'OPTIONS') return new Response('', { status: 200, headers: CORS_HEADERS });
  let user;
  try { user = await resolveAccountUser(request); }
  catch (error) { return jsonResponse(503, { success: false, error: error.message }); }
  if (!user) return jsonResponse(401, { success: false, error: 'Please sign in to access orders.' });
  const isAdmin = user.role === 'admin';
  if (request.method === 'PUT' && !isAdmin) return jsonResponse(403, { success: false, error: 'Administrator access is required.' });

  if (request.method === 'GET') {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get('id');
      const userEmail = cleanEmail(url.searchParams.get('userEmail') || url.searchParams.get('email'));
      const admin = url.searchParams.get('admin') === 'true';
      if (admin && !isAdmin) return jsonResponse(403, { success: false, error: 'Administrator access is required.' });
      if (userEmail && userEmail !== cleanEmail(user.email) && !isAdmin) return jsonResponse(403, { success: false, error: 'You can only view your own orders.' });
      const orders = await getCloudOrders();
      if (id) {
        const order = orders.find(item => String(item.id || item.order_id) === String(id));
        if (!order) return jsonResponse(404, { success: false, error: 'Order not found.' });
        if (!isAdmin && cleanEmail(order.email) !== cleanEmail(user.email)) return jsonResponse(403, { success: false, error: 'You can only view your own orders.' });
        return jsonResponse(200, { success: true, order });
      }
      const filtered = isAdmin && !userEmail ? orders : orders.filter(order => cleanEmail(order.email) === (userEmail || cleanEmail(user.email)));
      return jsonResponse(200, { success: true, orders: filtered.sort((a, b) => new Date(b.created_at || b.placed_at || 0) - new Date(a.created_at || a.placed_at || 0)) });
    } catch (error) {
      console.error('[Orders GET] Error:', error.message);
      return jsonResponse(500, { success: false, error: error.message });
    }
  }

  if (request.method === 'POST') {
    try {
      const payload = await parseJsonBody(request);
      const rawItems = typeof payload.items === 'string' ? JSON.parse(payload.items) : payload.items;
      if (Array.isArray(rawItems) && rawItems.some(item => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) return jsonResponse(400, { success: false, error: 'Select a valid quantity.' });
      const items = normalizeItems(payload.items || []);
      if (!items.length) return jsonResponse(400, { success: false, error: 'Order must contain at least one item.' });
      const orders = await getCloudOrders();
      const checkoutKey = String(payload.checkoutKey || '').slice(0, 100);
      const previous = checkoutKey ? orders.find(order => order.checkout_key === checkoutKey && cleanEmail(order.email) === cleanEmail(user.email)) : null;
      if (previous) return jsonResponse(200, { success: true, order: previous });
      const productStore = getOrdersStore('devtech-products');
      const rawCatalog = await productStore.get('catalog.json', { type: 'json', consistency: 'strong' });
      const products = Array.isArray(rawCatalog) ? rawCatalog : rawCatalog?.products || [];
      for (const item of items) {
        const product = products.find(candidate => String(candidate.id || candidate.pid) === String(item.id || item.pid));
        if (!product || product.active === false) return jsonResponse(400, { success: false, error: 'A selected product is no longer available.' });
        const sizes = Array.isArray(product.sizes) ? product.sizes : String(product.sizes || '').split(',').map(size => size.trim());
        const stockValue = product.size_stock ?? product.sizeStock ?? {};
        const stocks = typeof stockValue === 'object' ? stockValue : Object.fromEntries(String(stockValue).split(',').map(entry => {
          const separator = entry.lastIndexOf(':'); return [entry.slice(0, separator).trim(), Number(entry.slice(separator + 1))];
        }));
        if (!Number.isInteger(item.quantity) || item.quantity < 1 || !sizes.includes(item.size)) return jsonResponse(400, { success: false, error: 'Select a valid size and quantity.' });
        if (stocks[item.size] != null && item.quantity > Number(stocks[item.size])) return jsonResponse(409, { success: false, error: 'The selected quantity is not in stock.' });
        if (product.cod_available === false || product.codAvailable === false) return jsonResponse(400, { success: false, error: 'Cash on delivery is unavailable for a selected product.' });
        if (Number(item.price) !== Number(product.price)) return jsonResponse(409, { success: false, error: 'A product price has changed. Refresh your cart before ordering.' });
        item.title = product.title;
        item.brand = product.brand || '';
        item.price = Number(product.price);
        item.hsn = product.hsn || '';
        const imageValue = String(product.image_url || product.imageUrl || '');
        const imageParts = imageValue.split(',');
        item.image = Array.isArray(product.images) && product.images.length ? product.images[0]
          : imageValue.startsWith('data:image/') ? imageParts.slice(0, 2).join(',')
          : imageParts[0].trim();
        if (Array.isArray(product.colors) && product.colors.length && !product.colors.includes(item.color)) return jsonResponse(400, { success: false, error: 'Select an available product color.' });
      }
      if (!payload.deliveryAddress && !payload.delivery_address) return jsonResponse(400, { success: false, error: 'A delivery address is required.' });
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const taxAmount = Math.round(subtotal * 18 / 100);
      const deliveryCharge = subtotal > 0 ? 150 : 0;
      const order = buildOrder({ ...payload, id: undefined, order_id: undefined, created_at: new Date().toISOString(), placed_at: new Date().toISOString(), items, email: user.email, userId: user.id || '', customerName: user.name || payload.customerName || '', subtotal, taxAmount, deliveryCharge, totalAmount: subtotal + taxAmount + deliveryCharge, status: 'Order Placed', paymentMethod: 'cod', paymentStatus: 'COD Pending' });
      order.checkout_key = checkoutKey;
      orders.unshift(order);
      await saveCloudOrders(orders);
      return jsonResponse(201, { success: true, order });
    } catch (error) {
      console.error('[Orders POST] Error:', error.message);
      return jsonResponse(500, { success: false, error: error.message });
    }
  }

  if (request.method === 'PUT') {
    try {
      const payload = await parseJsonBody(request);
      const orderId = payload.id || payload.order_id;
      if (!orderId) return jsonResponse(400, { success: false, error: 'Order ID is required.' });
      const orders = await getCloudOrders();
      const index = orders.findIndex(order => String(order.id || order.order_id) === String(orderId));
      if (index === -1) return jsonResponse(404, { success: false, error: 'Order not found.' });
      orders[index] = buildOrder(payload, orders[index]);
      if (payload.status) orders[index].status = payload.status;
      orders[index].updated_at = new Date().toISOString();
      await saveCloudOrders(orders);
      return jsonResponse(200, { success: true, order: orders[index] });
    } catch (error) {
      console.error('[Orders PUT] Error:', error.message);
      return jsonResponse(500, { success: false, error: error.message });
    }
  }
  return jsonResponse(405, { success: false, error: 'Method not allowed.' });
}
