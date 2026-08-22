import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { query } from './db.js';
import { getJwtSecret } from './config/jwt.config.js';
import locationRouter from './modules/location/routes/location.routes.js';
import addressRouter from './modules/address/routes/address.routes.js';
import authRouter from './modules/auth/routes/auth.routes.js';
import adminRouter from './modules/admin/routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = getJwtSecret();

// ==================== STRICT CORS SECURITY CONFIGURATION ====================
const ALLOWED_ORIGINS = [
  'https://fashion-company.netlify.app',
  'https://fashioncompany.netlify.app',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:5500',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:8080'
];

if (process.env.FRONTEND_URL) {
  ALLOWED_ORIGINS.push(process.env.FRONTEND_URL.replace(/\/+$/, ''));
}
if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(o => {
    const cleanOrigin = o.trim().replace(/\/+$/, '');
    if (cleanOrigin) ALLOWED_ORIGINS.push(cleanOrigin);
  });
}

// Enable strictly allowlisted CORS with credentials support
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. server-to-server, curl, tests) where origin is undefined
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Request from untrusted origin: ${origin}`);
      callback(new Error(`Origin ${origin} is not permitted by CORS security policy.`));
    }
  },
  credentials: true
}));

// Parse cookies into req.cookies object
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const key = parts[0]?.trim();
      const val = parts.slice(1).join('=').trim();
      if (key) req.cookies[key] = decodeURIComponent(val);
    });
  }
  next();
});

// Parse application/json bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// JWT Authentication middleware. Supports HttpOnly cookies and Bearer auth headers.
app.use(async (req, res, next) => {
  req.userId = null;
  req.userRole = null;

  // 1. Check HttpOnly cookie first, then fall back to Authorization header
  let token = req.cookies.token || req.cookies.dtf_token || null;
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userCheck = await query('SELECT id, role FROM users WHERE id = $1;', [decoded.userId]);
      if (userCheck.rows.length > 0) {
        req.userId = decoded.userId;
        req.userRole = userCheck.rows[0].role;
      }
    } catch (err) {
      console.warn('JWT verify failed:', err.message);
    }
  }
  next();
});

// Serve static uploads directory
const uploadDirStatic = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDirStatic)) {
  fs.mkdirSync(uploadDirStatic, { recursive: true });
}
app.use('/uploads', express.static(uploadDirStatic));

// Expose API routes
app.use('/auth', authRouter);
app.use('/location', locationRouter);
app.use('/address', addressRouter);
app.use('/admin', adminRouter);

// Public products endpoint
app.get('/products', async (req, res) => {
  const category = req.query.category;
  try {
    let result;
    if (category) {
      result = await query('SELECT pid AS id, * FROM products WHERE category = $1 ORDER BY pid DESC;', [category]);
    } else {
      result = await query('SELECT pid AS id, * FROM products ORDER BY pid DESC;');
    }


    res.status(200).json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Public single product endpoint by ID
app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let result;
    if (/^\d+$/.test(String(id).trim())) {
      result = await query('SELECT pid AS id, * FROM products WHERE pid = $1;', [id]);
    } else {
      result = await query('SELECT pid AS id, * FROM products WHERE LOWER(title) = LOWER($1) OR LOWER(pid::text) = LOWER($1) LIMIT 1;', [id]);
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    res.status(200).json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Place a new order with real-time stock deduction & movement audit logging
app.post('/orders', async (req, res) => {
  let userId = req.userId;
  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        userId = decoded.userId || decoded.id;
      } catch (e) {}
    }
  }
  if (!userId) {
    try {
      const uRes = await query('SELECT id FROM users ORDER BY id ASC LIMIT 1;');
      userId = uRes.rows[0]?.id || 1;
    } catch {
      userId = 1;
    }
  }

  const { items, totalAmount, deliveryAddress } = req.body;
  if (!items || !totalAmount) {
    return res.status(400).json({ success: false, error: 'Items and total amount are required.' });
  }

  const client = await pool.connect();
  try {
    const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
    if (!Array.isArray(itemsArray) || itemsArray.length === 0) {
      return res.status(400).json({ success: false, error: 'Order must contain at least one item.' });
    }

    const grandTotal = Math.round(parseFloat(totalAmount) || 0);
    const taxableVal = Math.round(grandTotal * 100 / 118);
    const totalGst = grandTotal - taxableVal;
    const cgst = Math.round(totalGst / 2);
    const sgst = totalGst - cgst;
    const deliveryAddressValue = typeof deliveryAddress === 'string'
      ? deliveryAddress
      : JSON.stringify(deliveryAddress || '');

    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO orders (user_id, total_amount, status, items, delivery_address, payment_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING placed_at AS created_at, *;',
      [userId, grandTotal, 'Order Placed', JSON.stringify(itemsArray), deliveryAddressValue, 'paid']
    );
    const order = result.rows[0];

    // Real-time stock deduction & movement audit logging
    for (const item of itemsArray) {
      const pid = parseInt(item.pid || item.id, 10);
      const qtySold = parseInt(item.quantity, 10) || 1;
      const targetSize = String(item.size || 'M').trim().toUpperCase();

      if (!isNaN(pid) && pid > 0 && qtySold >= 1) {
        try {
          const prodRes = await client.query('SELECT pid, size_stock FROM products WHERE pid = $1 FOR UPDATE;', [pid]);
          if (prodRes.rows.length > 0) {
            const stockStr = prodRes.rows[0].size_stock || '';
            const stockObj = {};
            stockStr.split(',').forEach(pair => {
              const [sz, q] = pair.trim().split(':');
              if (sz && q !== undefined) stockObj[sz.trim().toUpperCase()] = parseInt(q.trim(), 10) || 0;
            });

            const qtyBefore = stockObj[targetSize] !== undefined ? stockObj[targetSize] : 10;
            const qtyAfter = Math.max(0, qtyBefore - qtySold);
            stockObj[targetSize] = qtyAfter;

            const newStockStr = Object.entries(stockObj).map(([s, q]) => `${s}:${q}`).join(', ');
            await client.query('UPDATE products SET size_stock = $1, updated_at = NOW() WHERE pid = $2;', [newStockStr, pid]);

            await client.query(
              'INSERT INTO stock_movements (product_id, changed_by, action, size, quantity_changed, quantity_before, quantity_after, reason, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());',
              [pid, userId, 'sale', targetSize, -qtySold, qtyBefore, qtyAfter, `Customer online order #${order.id}`]
            );
          }
        } catch (stockErr) {
          console.warn('[Order Stock Update Warning]:', stockErr.message);
        }
      }
    }

    await client.query('COMMIT');

    const invoice = {
      invoiceNo: `INV-2026-${order.id}`,
      orderId: order.id,
      awbNo: `AWB${order.id}984710IN`,
      sortCode: `MYL / 521230-E`,
      placedAt: order.created_at,
      taxableVal,
      cgst,
      sgst,
      grandTotal,
      items: itemsArray
    };

    res.status(201).json({ success: true, order, invoice });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (rollbackErr) { console.error('Order rollback failed:', rollbackErr.message); }
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// Get user orders
app.get('/orders', async (req, res) => {
  let userId = req.userId;
  if (!userId) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        userId = decoded.userId || decoded.id;
      } catch (e) {}
    }
  }
  if (!userId) {
    try {
      const uRes = await query('SELECT id FROM users ORDER BY id ASC LIMIT 1;');
      userId = uRes.rows[0]?.id || 1;
    } catch {
      userId = 1;
    }
  }
  try {
    const result = await query('SELECT placed_at AS created_at, * FROM orders WHERE user_id = $1 ORDER BY placed_at DESC;', [userId]);
    res.status(200).json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Fashion Company E-Commerce API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      location: '/location',
      address: '/address'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Express uncaught error:', err);
  res.status(500).json({ success: false, error: 'An unexpected server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Address Picker API Server running on port ${PORT}`);
});
