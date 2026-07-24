import express from 'express';
import { query } from '../../../db.js';

const router = express.Router();

// Middleware to verify admin privileges
async function requireAdmin(req, res, next) {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized user session.' });
    }
    const userCheck = await query('SELECT role FROM users WHERE id = $1;', [req.userId]);
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin access required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, error: 'Admin check failed: ' + err.message });
  }
}

// Apply admin check to all admin routes
router.use(requireAdmin);

// Helper: Parse size_stock string like 'S:10, M:10, L:10' into object {S: 10, M: 10, L: 10}
function parseSizeStock(sizeStockStr) {
  const result = {};
  if (!sizeStockStr) return result;
  sizeStockStr.split(',').forEach(pair => {
    const [size, qty] = pair.trim().split(':');
    if (size && qty !== undefined) result[size.trim()] = parseInt(qty.trim(), 10) || 0;
  });
  return result;
}

// Helper: Convert size_stock object back to string
function sizeStockToString(obj) {
  return Object.entries(obj).map(([size, qty]) => `${size}:${qty}`).join(', ');
}

// ============================================================
// ANALYTICS ENDPOINT
// ============================================================
router.get('/analytics', async (req, res) => {
  const period = req.query.period || 'month'; // 'day', 'week', 'month', 'year'

  try {
    let salesQuery = '';
    let timeframeWhere = "status != 'Cancelled'";

    if (period === 'day') {
      salesQuery = `
        SELECT TO_CHAR(placed_at, 'YYYY-MM-DD') as label, SUM(total_amount) as sales, COUNT(*) as orders
        FROM orders
        WHERE status != 'Cancelled' AND placed_at >= NOW() - INTERVAL '7 days'
        GROUP BY label
        ORDER BY label ASC;
      `;
      timeframeWhere += " AND placed_at >= NOW() - INTERVAL '7 days'";
    } else if (period === 'week') {
      salesQuery = `
        SELECT 'Week ' || TO_CHAR(placed_at, 'WW') as label, SUM(total_amount) as sales, COUNT(*) as orders
        FROM orders
        WHERE status != 'Cancelled' AND placed_at >= NOW() - INTERVAL '4 weeks'
        GROUP BY label
        ORDER BY label ASC;
      `;
      timeframeWhere += " AND placed_at >= NOW() - INTERVAL '4 weeks'";
    } else if (period === 'year') {
      salesQuery = `
        SELECT TO_CHAR(placed_at, 'YYYY') as label, SUM(total_amount) as sales, COUNT(*) as orders
        FROM orders
        WHERE status != 'Cancelled' AND placed_at >= NOW() - INTERVAL '3 years'
        GROUP BY label
        ORDER BY label ASC;
      `;
      timeframeWhere += " AND placed_at >= NOW() - INTERVAL '3 years'";
    } else {
      salesQuery = `
        SELECT TO_CHAR(placed_at, 'YYYY-MM') as label, SUM(total_amount) as sales, COUNT(*) as orders
        FROM orders
        WHERE status != 'Cancelled' AND placed_at >= NOW() - INTERVAL '12 months'
        GROUP BY label
        ORDER BY label ASC;
      `;
      timeframeWhere += " AND placed_at >= NOW() - INTERVAL '12 months'";
    }

    const salesRes = await query(salesQuery);

    // Period-filtered stats for active non-cancelled orders
    const statsRes = await query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as total_orders,
        COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders
      WHERE ${timeframeWhere};
    `);

    // Calculate real category distribution from orders JSONB items
    const categoryRes = await query(`
      SELECT p.category, SUM((item->>'price')::numeric * (item->>'quantity')::int) as revenue
      FROM orders, jsonb_array_elements(items) as item
      JOIN products p ON (item->>'pid')::int = p.pid
      WHERE orders.status != 'Cancelled'
      GROUP BY p.category;
    `);

    const categoryColors = { "mens": '#6366f1', "womens": '#ec4899', "kids": '#f59e0b' };
    const categoryLabels = { "mens": "Men's Wear", "womens": "Women's Wear", "kids": "Kids Wear" };
    
    let totalCatRev = 0;
    categoryRes.rows.forEach(r => totalCatRev += parseFloat(r.revenue) || 0);

    const categoryTrend = categoryRes.rows.map(r => {
      const catKey = r.category || 'mens';
      const rev = parseFloat(r.revenue) || 0;
      const share = totalCatRev > 0 ? Math.round((rev / totalCatRev) * 100) : 0;
      return {
        category: categoryLabels[catKey] || catKey,
        share,
        color: categoryColors[catKey] || '#6366f1'
      };
    });

    res.status(200).json({
      success: true,
      period,
      sales: salesRes.rows,
      overview: {
        totalRevenue: Math.round(parseFloat(statsRes.rows[0].total_revenue)),
        totalOrders: parseInt(statsRes.rows[0].total_orders, 10),
        avgOrderValue: Math.round(parseFloat(statsRes.rows[0].avg_order_value))
      },
      categoryTrend: categoryTrend.length > 0 ? categoryTrend : [
        { category: "Men's Wear", share: 45, color: '#6366f1' },
        { category: "Women's Wear", share: 38, color: '#ec4899' },
        { category: "Kids Wear", share: 17, color: '#f59e0b' }
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// PRODUCTS CRUD ENDPOINTS
// ============================================================

// GET all products
router.get('/products', async (req, res) => {
  try {
    const productsRes = await query('SELECT pid AS id, * FROM products ORDER BY pid DESC;');
    res.status(200).json({ success: true, products: productsRes.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create product
router.post('/products', async (req, res) => {
  const { 
    title, price, imageUrl, category, description,
    brand, titleDescription, mrp, sizes, 
    replacementAllowed, replacementDays, codAvailable, 
    fabric, pattern, fit, suitableFor,
    sizeStock, couponApplicable
  } = req.body;

  if (!title || !price || !imageUrl || !category) {
    return res.status(400).json({ success: false, error: 'Please provide title, price, imageUrl, and category.' });
  }

  try {
    const result = await query(
      `INSERT INTO products (
        title, price, image_url, category, description,
        brand, title_description, mrp, sizes,
        replacement_allowed, replacement_days, cod_available,
        fabric, pattern, fit, suitable_for,
        size_stock, coupon_applicable
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING pid AS id, *;`,
      [
        title, price, imageUrl, category, description,
        brand || 'DevTech', titleDescription, mrp || 0, sizes || 'S, M, L',
        replacementAllowed !== false, replacementDays || 7, codAvailable !== false,
        fabric || 'Cotton', pattern || 'Solid', fit || 'Regular Fit', suitableFor || 'Casual',
        sizeStock || 'S:10, M:10, L:10', couponApplicable !== false
      ]
    );

    // Log stock movement
    const stockObj = parseSizeStock(sizeStock || 'S:10, M:10, L:10');
    for (const [size, qty] of Object.entries(stockObj)) {
      await query(
        `INSERT INTO stock_movements (product_id, action, size, quantity_changed, quantity_before, quantity_after, reason, changed_by)
         VALUES ($1, 'product_added', $2, $3, 0, $3, 'New product added', $4)`,
        [result.rows[0].id, size, qty, req.userId]
      );
    }

    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET export products
router.get('/products/export', async (req, res) => {
  try {
    const productsRes = await query('SELECT * FROM products ORDER BY pid DESC;');
    const products = productsRes.rows;
    const headers = 'pid,title,brand,category,price,mrp,sizes,size_stock,fabric,pattern,fit,suitable_for,created_at\n';
    const csv = products.map(p => {
      const escape = str => `"${(str || '').toString().replace(/"/g, '""')}"`;
      return [
        p.pid, escape(p.title), escape(p.brand), escape(p.category),
        p.price, p.mrp, escape(p.sizes), escape(p.size_stock),
        escape(p.fabric), escape(p.pattern), escape(p.fit), escape(p.suitable_for),
        p.created_at
      ].join(',');
    }).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    res.status(200).send(headers + csv);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT bulk restock
router.put('/products/bulk-restock', async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates)) {
    return res.status(400).json({ success: false, error: 'Updates array required.' });
  }

  try {
    for (let u of updates) {
      const { pid, size, quantity, reason } = u;
      if (!pid || !size || quantity === undefined) continue;

      const checkProduct = await query('SELECT size_stock FROM products WHERE pid = $1;', [pid]);
      if (checkProduct.rows.length === 0) continue;
      
      const stockObj = parseSizeStock(checkProduct.rows[0].size_stock);
      const oldQty = stockObj[size] || 0;
      const newQty = oldQty + parseInt(quantity);
      stockObj[size] = newQty;

      const newStockStr = sizeStockToString(stockObj);
      await query('UPDATE products SET size_stock = $1 WHERE pid = $2', [newStockStr, pid]);

      await query(
        `INSERT INTO stock_movements (product_id, action, size, quantity_changed, quantity_before, quantity_after, reason, changed_by)
         VALUES ($1, 'stock_increased', $2, $3, $4, $5, $6, $7)`,
        [pid, size, parseInt(quantity), oldQty, newQty, reason || 'Bulk restock', req.userId]
      );
    }
    res.status(200).json({ success: true, message: 'Bulk restock completed.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update product
router.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    title, price, imageUrl, category, description,
    brand, titleDescription, mrp, sizes, 
    replacementAllowed, replacementDays, codAvailable, 
    fabric, pattern, fit, suitableFor,
    sizeStock, couponApplicable
  } = req.body;

  if (!title || !price || !imageUrl || !category) {
    return res.status(400).json({ success: false, error: 'Please provide title, price, imageUrl, and category.' });
  }

  try {
    const checkProduct = await query('SELECT pid, size_stock FROM products WHERE pid = $1;', [id]);
    if (checkProduct.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const oldStock = parseSizeStock(checkProduct.rows[0]?.size_stock);

    const result = await query(
      `UPDATE products SET 
        title = $1, price = $2, image_url = $3, category = $4, description = $5,
        brand = $6, title_description = $7, mrp = $8, sizes = $9,
        replacement_allowed = $10, replacement_days = $11, cod_available = $12,
        fabric = $13, pattern = $14, fit = $15, suitable_for = $16,
        size_stock = $17, coupon_applicable = $18,
        updated_at = CURRENT_TIMESTAMP 
      WHERE pid = $19 RETURNING pid AS id, *;`,
      [
        title, price, imageUrl, category, description,
        brand, titleDescription, mrp, sizes,
        replacementAllowed, replacementDays, codAvailable,
        fabric, pattern, fit, suitableFor,
        sizeStock, couponApplicable,
        id
      ]
    );

    const newStock = parseSizeStock(sizeStock);
    for (const size of new Set([...Object.keys(oldStock), ...Object.keys(newStock)])) {
      const before = oldStock[size] || 0;
      const after = newStock[size] || 0;
      if (before !== after) {
        await query(
          `INSERT INTO stock_movements (product_id, action, size, quantity_changed, quantity_before, quantity_after, reason, changed_by)
           VALUES ($1, 'product_edited', $2, $3, $4, $5, 'Product stock updated via edit', $6)`,
          [id, size, after - before, before, after, req.userId]
        );
      }
    }

    res.status(200).json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE product
router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const checkProduct = await query('SELECT pid FROM products WHERE pid = $1;', [id]);
    if (checkProduct.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    await query('DELETE FROM products WHERE pid = $1;', [id]);
    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// ORDERS ENDPOINTS
// ============================================================

// GET all orders for admin
router.get('/orders', async (req, res) => {
  try {
    const ordersRes = await query(`
      SELECT 
        o.placed_at AS created_at, 
        o.*, 
        u.first_name, 
        u.last_name, 
        u.email,
        ua.full_name as addr_name,
        ua.mobile as addr_mobile,
        ua.house_number as addr_house,
        ua.building as addr_building,
        ua.street as addr_street,
        ua.area as addr_area,
        ua.landmark as addr_landmark,
        ua.city as addr_city,
        ua.state as addr_state,
        ua.pincode as addr_pincode
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      LEFT JOIN LATERAL (
        SELECT * FROM user_addresses 
        WHERE user_id = o.user_id AND deleted_at IS NULL 
        ORDER BY is_default DESC, id DESC LIMIT 1
      ) ua ON true
      ORDER BY o.placed_at DESC;
    `);
    res.status(200).json({ success: true, orders: ordersRes.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update order status to Shipped
router.put('/orders/:id/ship', async (req, res) => {
  const { id } = req.params;
  try {
    const checkOrder = await query('SELECT id FROM orders WHERE id = $1;', [id]);
    if (checkOrder.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const result = await query(
      "UPDATE orders SET status = 'Shipped' WHERE id = $1 RETURNING *;",
      [id]
    );
    res.status(200).json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /admin/inventory-stats
router.get('/inventory-stats', async (req, res) => {
  try {
    const productsRes = await query('SELECT * FROM products');
    const products = productsRes.rows;

    let totalProducts = products.length;
    let totalVariants = 0;
    let totalUnitsInStock = 0;
    let totalInventoryCost = 0;
    let totalSellingValue = 0;

    let healthy = 0, lowStock = 0, outOfStock = 0, overstock = 0;
    let productsAddedToday = 0;

    const today = new Date();
    today.setHours(0,0,0,0);

    const alerts = [];

    products.forEach(p => {
      if (new Date(p.created_at) >= today) productsAddedToday++;
      
      const stockObj = parseSizeStock(p.size_stock);
      const sizes = Object.values(stockObj);
      totalVariants += sizes.length;
      
      const units = sizes.reduce((sum, q) => sum + q, 0);
      totalUnitsInStock += units;

      const cost = parseFloat(p.price) || 0;
      const mrp = parseFloat(p.mrp) || 0;
      
      totalInventoryCost += (units * cost);
      totalSellingValue += (units * mrp);

      let pHealthy = true;
      let pLow = false;
      let pOut = false;
      let pOver = false;

      for (let q of sizes) {
        if (q === 0) pOut = true;
        else if (q >= 1 && q <= 5) pLow = true;
        else if (q > 50) pOver = true;
      }

      let status = 'healthy';
      if (pOut) { status = 'out_of_stock'; outOfStock++; }
      else if (pLow) { status = 'low_stock'; lowStock++; }
      else if (pOver) { status = 'overstock'; overstock++; }
      else { healthy++; }

      if (status !== 'healthy') {
        alerts.push({
          pid: p.pid,
          title: p.title,
          status,
          stock: p.size_stock
        });
      }
    });

    const potentialProfit = totalSellingValue - totalInventoryCost;

    const statusOrder = { 'out_of_stock': 1, 'low_stock': 2, 'overstock': 3, 'healthy': 4 };
    alerts.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

    const todayOrdersRes = await query(`
      SELECT items FROM orders WHERE placed_at >= CURRENT_DATE AND status != 'Cancelled'
    `);
    let productsSoldToday = 0;
    todayOrdersRes.rows.forEach(r => {
      const items = typeof r.items === 'string' ? JSON.parse(r.items) : r.items;
      if(items && Array.isArray(items)) {
        productsSoldToday += items.reduce((sum, item) => sum + (parseInt(item.quantity)||0), 0);
      }
    });

    const last30Sales = await query(`
      SELECT item->>'pid' as pid, SUM((item->>'quantity')::int) as units_sold
      FROM orders, jsonb_array_elements(items) as item
      WHERE placed_at >= NOW() - INTERVAL '30 days' AND status != 'Cancelled'
      GROUP BY item->>'pid'
    `);
    
    const last7Sales = await query(`
      SELECT item->>'pid' as pid, SUM((item->>'quantity')::int) as units_sold
      FROM orders, jsonb_array_elements(items) as item
      WHERE placed_at >= NOW() - INTERVAL '7 days' AND status != 'Cancelled'
      GROUP BY item->>'pid'
    `);

    const sales30 = {};
    last30Sales.rows.forEach(r => { sales30[r.pid] = parseInt(r.units_sold); });
    const sales7 = {};
    last7Sales.rows.forEach(r => { sales7[r.pid] = parseInt(r.units_sold); });

    let deadStockVal = 0, fastMovingVal = 0, slowMovingVal = 0;

    products.forEach(p => {
      const s30 = sales30[p.pid] || 0;
      const s7 = sales7[p.pid] || 0;
      const stockObj = parseSizeStock(p.size_stock);
      const units = Object.values(stockObj).reduce((sum, q) => sum + q, 0);
      const val = units * (parseFloat(p.price) || 0);

      if (s30 === 0 && units > 0) deadStockVal += val;
      if (s7 > 5) fastMovingVal += val;
      if (s30 > 0 && s30 < 2) slowMovingVal += val;
    });

    res.status(200).json({
      success: true,
      stats: {
        totalProducts, totalVariants, totalUnitsInStock,
        totalInventoryCost, totalSellingValue, potentialProfit,
        productsInStock: healthy + lowStock + overstock,
        healthy,
        lowStockProducts: lowStock,
        outOfStockProducts: outOfStock,
        overstockedProducts: overstock,
        productsAddedToday,
        productsSoldToday,
        deadStockValue: deadStockVal,
        fastMovingValue: fastMovingVal,
        slowMovingValue: slowMovingVal
      },
      alerts
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /admin/stock-movements
router.get('/stock-movements', async (req, res) => {
  const { product_id, action, limit = 50, offset = 0 } = req.query;
  try {
    let q = `
      SELECT sm.*, p.title as product_title, u.first_name, u.last_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.pid
      LEFT JOIN users u ON sm.changed_by = u.id
      WHERE 1=1
    `;
    const params = [];
    if (product_id) {
      params.push(product_id);
      q += ` AND sm.product_id = $${params.length}`;
    }
    if (action) {
      params.push(action);
      q += ` AND sm.action = $${params.length}`;
    }
    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;
    
    q += ` ORDER BY sm.created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    
    const result = await query(q, params);
    res.status(200).json({ success: true, movements: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /admin/product-performance
router.get('/product-performance', async (req, res) => {
  try {
    const productsRes = await query('SELECT * FROM products');
    const products = productsRes.rows;

    const totalOrdersRes = await query("SELECT COUNT(*) as count FROM orders WHERE status != 'Cancelled'");
    const totalOrdersCount = parseInt(totalOrdersRes.rows[0].count) || 1;

    const salesRes = await query(`
      SELECT item->>'pid' as pid,
        SUM((item->>'quantity')::int) as units_sold,
        SUM((item->>'price')::numeric * (item->>'quantity')::int) as revenue,
        COUNT(DISTINCT orders.id) as orders_containing
      FROM orders, jsonb_array_elements(items) as item  
      WHERE status != 'Cancelled'
      GROUP BY item->>'pid'
    `);
    
    const salesData = {};
    salesRes.rows.forEach(r => {
      salesData[r.pid] = {
        units_sold: parseInt(r.units_sold) || 0,
        revenue: parseFloat(r.revenue) || 0,
        orders_containing: parseInt(r.orders_containing) || 0
      };
    });

    let performance = products.map(p => {
      const s = salesData[p.pid] || { units_sold: 0, revenue: 0, orders_containing: 0 };
      const profit = s.revenue - (s.units_sold * (parseFloat(p.price) || 0));
      const conversionRate = (s.orders_containing / totalOrdersCount) * 100;
      
      const stockObj = parseSizeStock(p.size_stock);
      const sizes = Object.values(stockObj);
      let pHealthy = true, pLow = false, pOut = false, pOver = false;
      for (let q of sizes) {
        if (q === 0) pOut = true;
        else if (q >= 1 && q <= 5) pLow = true;
        else if (q > 50) pOver = true;
      }
      let stockStatus = 'healthy';
      if (pOut) stockStatus = 'out_of_stock';
      else if (pLow) stockStatus = 'low_stock';
      else if (pOver) stockStatus = 'overstock';

      return {
        pid: p.pid,
        title: p.title,
        category: p.category,
        brand: p.brand,
        image_url: p.image_url,
        price: p.price,
        mrp: p.mrp,
        size_stock: p.size_stock,
        created_at: p.created_at,
        units_sold: s.units_sold,
        revenue: s.revenue,
        profit,
        conversionRate,
        stockStatus
      };
    });

    const { category, brand, stockStatus, minPrice, maxPrice, dateAdded, salesPerformance } = req.query;
    if (category) performance = performance.filter(p => p.category === category);
    if (brand) performance = performance.filter(p => p.brand === brand);
    if (stockStatus) performance = performance.filter(p => p.stockStatus === stockStatus);
    if (minPrice) performance = performance.filter(p => p.price >= parseFloat(minPrice));
    if (maxPrice) performance = performance.filter(p => p.price <= parseFloat(maxPrice));
    
    if (dateAdded) {
      const now = new Date();
      performance = performance.filter(p => {
        const d = new Date(p.created_at);
        if (dateAdded === 'today') return d.toDateString() === now.toDateString();
        if (dateAdded === 'week') return (now - d) / (1000 * 60 * 60 * 24) <= 7;
        if (dateAdded === 'month') return (now - d) / (1000 * 60 * 60 * 24) <= 30;
        return true;
      });
    }

    if (salesPerformance) {
      if (salesPerformance === 'best') performance = performance.filter(p => p.units_sold > 5);
      if (salesPerformance === 'low') performance = performance.filter(p => p.units_sold > 0 && p.units_sold <= 5);
      if (salesPerformance === 'none') performance = performance.filter(p => p.units_sold === 0);
    }

    res.status(200).json({ success: true, performance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /admin/products/:id/restock
router.put('/products/:id/restock', async (req, res) => {
  const { id } = req.params;
  const { size, quantity, reason } = req.body;
  if (!size || quantity === undefined) {
    return res.status(400).json({ success: false, error: 'Size and quantity required.' });
  }

  try {
    const checkProduct = await query('SELECT pid, size_stock FROM products WHERE pid = $1;', [id]);
    if (checkProduct.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }
    const p = checkProduct.rows[0];
    const stockObj = parseSizeStock(p.size_stock);
    const oldQty = stockObj[size] || 0;
    const newQty = oldQty + parseInt(quantity);
    stockObj[size] = newQty;

    const newStockStr = sizeStockToString(stockObj);
    const updateRes = await query('UPDATE products SET size_stock = $1 WHERE pid = $2 RETURNING *', [newStockStr, id]);

    await query(
      `INSERT INTO stock_movements (product_id, action, size, quantity_changed, quantity_before, quantity_after, reason, changed_by)
       VALUES ($1, 'stock_increased', $2, $3, $4, $5, $6, $7)`,
      [id, size, parseInt(quantity), oldQty, newQty, reason || 'Restock', req.userId]
    );

    res.status(200).json({ success: true, product: updateRes.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
