import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';
import locationRouter from './modules/location/routes/location.routes.js';
import addressRouter from './modules/address/routes/address.routes.js';
import authRouter from './modules/auth/routes/auth.routes.js';
import adminRouter from './modules/admin/routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'devtech_fashion_secret_key';

// Enable CORS for frontend requests
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins in local development (handles custom localhost ports, file://, etc.)
    callback(null, true);
  },
  credentials: true
}));

// Parse application/json bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// JWT Authentication middleware with fallback for backward compatibility
app.use(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // Validate that decoded userId exists in database
      const userCheck = await query('SELECT id FROM users WHERE id = $1;', [decoded.userId]);
      if (userCheck.rows.length > 0) {
        req.userId = decoded.userId;
      } else {
        const result = await query('SELECT id FROM users ORDER BY id LIMIT 1;');
        req.userId = result.rows[0] ? result.rows[0].id : 1;
      }
    } catch (err) {
      console.warn('JWT verify failed, falling back to mock user:', err.message);
      const result = await query('SELECT id FROM users ORDER BY id LIMIT 1;');
      req.userId = result.rows[0] ? result.rows[0].id : 1;
    }
  } else {
    // Default fallback to first user in database (if exists), otherwise default to 1
    try {
      const result = await query('SELECT id FROM users ORDER BY id LIMIT 1;');
      req.userId = result.rows[0] ? result.rows[0].id : 1;
    } catch (e) {
      req.userId = 1;
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

// Admin product image upload endpoint
app.post('/admin/upload', async (req, res) => {
  const { base64Data, filename } = req.body;
  if (!base64Data) {
    return res.status(400).json({ success: false, error: 'No image data provided.' });
  }

  try {
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const ext = filename ? path.extname(filename) : '.jpg';
    const newFilename = `prod_${Date.now()}${ext}`;
    
    // Uploads folder is in Ecom root
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, newFilename);
    fs.writeFileSync(filePath, base64Image, { encoding: 'base64' });

    const url = `/uploads/${newFilename}`;
    console.log('[Upload] Saved image to:', filePath, 'URL:', url);
    res.status(200).json({ success: true, url });
  } catch (err) {
    console.error('[Upload] Failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});



// Place a new order with real-time stock deduction & movement audit logging
app.post('/orders', async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }
  const { items, totalAmount, deliveryAddress } = req.body;
  if (!items || !totalAmount) {
    return res.status(400).json({ success: false, error: 'Items and total amount are required.' });
  }

  try {
    const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;

    // Insert order into orders table
    const result = await query(
      'INSERT INTO orders (user_id, total_amount, status, items, delivery_address, payment_status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING placed_at AS created_at, *;',
      [req.userId, totalAmount, 'Order Placed', JSON.stringify(itemsArray), deliveryAddress || '', 'paid']
    );
    const order = result.rows[0];

    // Real-time stock deduction & movement audit logging
    if (Array.isArray(itemsArray)) {
      for (const item of itemsArray) {
        const pid = parseInt(item.pid || item.id, 10);
        const qtySold = parseInt(item.quantity, 10) || 1;
        const targetSize = (item.size || 'M').trim().toUpperCase();

        if (pid) {
          const prodRes = await query('SELECT size_stock FROM products WHERE pid = $1;', [pid]);
          if (prodRes.rows.length > 0) {
            const stockStr = prodRes.rows[0].size_stock || '';
            const stockObj = {};
            stockStr.split(',').forEach(pair => {
              const [sz, q] = pair.trim().split(':');
              if (sz && q !== undefined) stockObj[sz.trim()] = parseInt(q.trim(), 10) || 0;
            });

            const qtyBefore = stockObj[targetSize] !== undefined ? stockObj[targetSize] : (stockObj['M'] || 10);
            const qtyAfter = Math.max(0, qtyBefore - qtySold);
            stockObj[targetSize] = qtyAfter;

            const newStockStr = Object.entries(stockObj).map(([s, q]) => `${s}:${q}`).join(', ');
            await query('UPDATE products SET size_stock = $1, updated_at = NOW() WHERE pid = $2;', [newStockStr, pid]);

            // Audit log stock movement
            await query(
              'INSERT INTO stock_movements (product_id, changed_by, action, size, quantity_changed, quantity_before, quantity_after, reason, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW());',
              [pid, req.userId, 'sale', targetSize, -qtySold, qtyBefore, qtyAfter, `Customer online order #${order.id}`]
            );
          }
        }
      }
    }

    // Generate real-time invoice metadata
    const grandTotal = parseFloat(totalAmount) || 0;
    const taxableVal = Math.round(grandTotal / 1.18);
    const totalGst = grandTotal - taxableVal;
    const cgst = Math.round(totalGst / 2);
    const sgst = totalGst - cgst;

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
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get user orders
app.get('/orders', async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized.' });
  }
  try {
    const result = await query('SELECT placed_at AS created_at, * FROM orders WHERE user_id = $1 ORDER BY placed_at DESC;', [req.userId]);
    res.status(200).json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Welcome endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the DevTech Fashion E-Commerce API',
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
