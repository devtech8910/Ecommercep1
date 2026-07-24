// backend/list_mens.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { query } from './db.js';

async function listProducts() {
  try {
    const res = await query("SELECT id, title, price, brand, fabric, pattern, fit FROM products WHERE category = 'mens' ORDER BY id DESC;");
    console.log(`Total Men's products found in database: ${res.rows.length}`);
    
    const keywords = ['jacket', 'shirt', 'tee', 'polo', 'trousers', 'suit', 'blazer', 'sweater', 'chinos'];
    for (const kw of keywords) {
      const match = res.rows.filter(p => p.title.toLowerCase().includes(kw));
      console.log(`Keyword "${kw}": ${match.length} matches. Sample:`);
      match.slice(0, 3).forEach(p => {
        console.log(`  - Title: ${p.title} | Brand: ${p.brand}`);
      });
    }
  } catch (err) {
    console.error("Failed to query products:", err.message);
  }
  process.exit(0);
}

listProducts();
