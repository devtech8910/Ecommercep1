// backend/check_null_prices.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { query } from './db.js';

async function check() {
  try {
    const res = await query("SELECT id, title, price, image_url, category FROM products;");
    console.log(`Checking ${res.rows.length} total products...`);
    let errors = 0;
    res.rows.forEach(p => {
      if (!p.title) {
        console.log(`Product ID ${p.id} has null/empty title`);
        errors++;
      }
      if (p.price === null || p.price === undefined || isNaN(parseFloat(p.price))) {
        console.log(`Product ID ${p.id} (${p.title}) has invalid price: ${p.price}`);
        errors++;
      }
      if (!p.image_url) {
        console.log(`Product ID ${p.id} (${p.title}) has null/empty image_url`);
        errors++;
      }
    });
    console.log(`Check complete. Found ${errors} invalid products.`);
  } catch (err) {
    console.error("Query failed:", err.message);
  }
  process.exit(0);
}

check();
