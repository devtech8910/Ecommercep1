// backend/check_null_images.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { query } from './db.js';

async function check() {
  try {
    const res = await query("SELECT id, title, image_url, category FROM products WHERE image_url IS NULL OR image_url = '';");
    console.log(`Found ${res.rows.length} products with null or empty image_url.`);
    res.rows.forEach(p => {
      console.log(`- ID: ${p.id} | Title: ${p.title} | Category: ${p.category}`);
    });
  } catch (err) {
    console.error("Query failed:", err.message);
  }
  process.exit(0);
}

check();
