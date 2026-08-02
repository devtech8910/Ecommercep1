// ============================================================
// DEVTECH FASHION — NETLIFY SERVERLESS CLOUD PRODUCTS CATALOG
// Enables cross-device product sync for admin-added products
// ============================================================

const CLOUD_PRODUCTS_URL = process.env.CLOUD_PRODUCTS_URL || 'https://jsonblob.com/api/jsonBlob/019fc117-cf81-7c70-8559-16210c2b49ae';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

async function getCloudProducts() {
  try {
    const res = await fetch(CLOUD_PRODUCTS_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.warn('[Cloud Products] Fetch error:', err.message);
  }
  return [];
}

async function saveCloudProducts(products) {
  try {
    await fetch(CLOUD_PRODUCTS_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(products)
    });
  } catch (err) {
    console.warn('[Cloud Products] Save error:', err.message);
  }
}

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // GET — Return all products
  if (event.httpMethod === 'GET') {
    try {
      // Check if a specific product ID is requested via query string
      const productId = event.queryStringParameters && event.queryStringParameters.id;
      const category = event.queryStringParameters && event.queryStringParameters.category;
      
      const products = await getCloudProducts();
      
      if (productId) {
        const product = products.find(p => 
          String(p.id || p.pid) === String(productId) || 
          String(p.pid) === String(productId)
        );
        if (product) {
          return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({ success: true, product })
          };
        }
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'Product not found.' })
        };
      }
      
      let filtered = products;
      if (category) {
        filtered = products.filter(p => {
          const cat = (p.category || '').toLowerCase();
          return cat === category.toLowerCase();
        });
      }
      
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, products: filtered })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: err.message })
      };
    }
  }

  // POST — Add a new product
  if (event.httpMethod === 'POST') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const { title, price, category } = payload;
      const imgUrl = payload.imageUrl || payload.image_url || payload.image;

      if (!title || price === undefined || !imgUrl || !category) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'Please provide title, price, imageUrl, and category.' })
        };
      }

      const products = await getCloudProducts();
      
      const newId = payload.id || payload.pid || ('cloud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));
      const newPid = payload.pid || payload.id || newId;

      const newProduct = {
        id: newId,
        pid: newPid,
        title: payload.title,
        brand: payload.brand || 'DevTech Collection',
        category: payload.category,
        title_description: payload.titleDescription || payload.title_description || '',
        titleDescription: payload.titleDescription || payload.title_description || '',
        mrp: parseFloat(payload.mrp) || 0,
        price: parseFloat(payload.price) || 0,
        image_url: imgUrl,
        imageUrl: imgUrl,
        sizes: payload.sizes || 'S, M, L',
        replacement_allowed: payload.replacementAllowed !== false && payload.replacement_allowed !== false,
        replacementAllowed: payload.replacementAllowed !== false && payload.replacement_allowed !== false,
        replacement_days: payload.replacementDays || payload.replacement_days || 7,
        replacementDays: payload.replacementDays || payload.replacement_days || 7,
        cod_available: payload.codAvailable !== false && payload.cod_available !== false,
        codAvailable: payload.codAvailable !== false && payload.cod_available !== false,
        coupon_applicable: payload.couponApplicable !== false && payload.coupon_applicable !== false,
        couponApplicable: payload.couponApplicable !== false && payload.coupon_applicable !== false,
        fabric: payload.fabric || '',
        pattern: payload.pattern || '',
        fit: payload.fit || '',
        suitable_for: payload.suitableFor || payload.suitable_for || '',
        suitableFor: payload.suitableFor || payload.suitable_for || '',
        description: payload.description || '',
        size_stock: payload.sizeStock || payload.size_stock || 'S:10, M:10, L:10',
        sizeStock: payload.sizeStock || payload.size_stock || 'S:10, M:10, L:10',
        created_at: new Date().toISOString()
      };

      products.unshift(newProduct);
      await saveCloudProducts(products);

      return {
        statusCode: 201,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, product: newProduct })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: err.message })
      };
    }
  }

  // PUT — Update an existing product
  if (event.httpMethod === 'PUT') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const productId = payload.id || payload.pid;

      if (!productId) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'Product ID is required.' })
        };
      }

      const products = await getCloudProducts();
      const idx = products.findIndex(p => String(p.id || p.pid) === String(productId));

      if (idx === -1) {
        // If not found, add it as new (for syncing from local DB)
        const imgUrl = payload.imageUrl || payload.image_url || payload.image || '';
        const newProduct = { 
          ...payload, 
          id: productId, 
          pid: productId, 
          image_url: imgUrl,
          imageUrl: imgUrl,
          size_stock: payload.sizeStock || payload.size_stock || 'S:10, M:10, L:10',
          sizeStock: payload.sizeStock || payload.size_stock || 'S:10, M:10, L:10',
          updated_at: new Date().toISOString() 
        };
        products.unshift(newProduct);
        await saveCloudProducts(products);
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: true, product: newProduct })
        };
      }

      // Update existing product
      const imgUrl = payload.imageUrl || payload.image_url || payload.image || products[idx].imageUrl || products[idx].image_url;
      const sizeStockVal = payload.sizeStock || payload.size_stock || products[idx].sizeStock || products[idx].size_stock;
      const updated = { 
        ...products[idx], 
        ...payload, 
        image_url: imgUrl,
        imageUrl: imgUrl,
        size_stock: sizeStockVal,
        sizeStock: sizeStockVal,
        updated_at: new Date().toISOString() 
      };
      products[idx] = updated;
      await saveCloudProducts(products);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, product: updated })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: err.message })
      };
    }
  }

  // DELETE — Remove a product
  if (event.httpMethod === 'DELETE') {
    try {
      const payload = JSON.parse(event.body || '{}');
      const productId = payload.id || payload.pid;

      if (!productId) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ success: false, error: 'Product ID is required.' })
        };
      }

      let products = await getCloudProducts();
      products = products.filter(p => String(p.id || p.pid) !== String(productId));
      await saveCloudProducts(products);

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: true, message: 'Product deleted.' })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: err.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: JSON.stringify({ success: false, error: 'Method not allowed.' })
  };
};
