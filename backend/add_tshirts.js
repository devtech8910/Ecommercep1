// backend/add_tshirts.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { query } from './db.js';

const tshirts = [
  {
    title: "Premium Cotton Crewneck T-Shirt",
    price: 1800.00,
    mrp: 1800.00,
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80&fit=crop",
    category: "mens",
    description: "Classic crewneck t-shirt crafted from 100% long-staple organic cotton. Super soft, breathable, and pre-shrunk for the perfect fit.",
    brand: "Fashion Company Luxe",
    titleDescription: "Classic white crewneck t-shirt in organic cotton.",
    sizes: "S, M, L, XL",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: true,
    fabric: "100% Organic Cotton",
    pattern: "Solid",
    fit: "Regular Fit",
    suitableFor: "Casual / Daily Wear",
    sizeStock: "S:20, M:30, L:25, XL:15",
    couponApplicable: true
  },
  {
    title: "Luxury Mercerized V-Neck T-Shirt",
    price: 2500.00,
    mrp: 2800.00,
    imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80&fit=crop",
    category: "mens",
    description: "High-end V-neck t-shirt in mercerized cotton for a silky sheen and enhanced durability. Perfect for layering under blazers.",
    brand: "Zegna",
    titleDescription: "Black V-neck t-shirt in premium mercerized cotton.",
    sizes: "M, L, XL",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: true,
    fabric: "100% Mercerized Cotton",
    pattern: "Solid",
    fit: "Slim Fit",
    suitableFor: "Smart Casual / Layering",
    sizeStock: "M:15, L:20, XL:10",
    couponApplicable: true
  },
  {
    title: "Oversized Heavyweight Cotton T-Shirt",
    price: 2200.00,
    mrp: 2200.00,
    imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80&fit=crop",
    category: "mens",
    description: "Durable heavyweight cotton t-shirt with a modern oversized fit, dropped shoulders, and a thick ribbed collar.",
    brand: "Levi's Premium",
    titleDescription: "Oversized fit heavyweight street wear t-shirt in charcoal.",
    sizes: "S, M, L",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: true,
    fabric: "100% Heavyweight Cotton",
    pattern: "Solid",
    fit: "Oversized Fit",
    suitableFor: "Streetwear / Casual",
    sizeStock: "S:12, M:18, L:15",
    couponApplicable: true
  }
];

async function addTshirts() {
  console.log("Starting insertion of premium T-Shirts...");
  let count = 0;
  for (const item of tshirts) {
    try {
      const q = `
        INSERT INTO products (
          title, price, image_url, category, description,
          brand, title_description, mrp, sizes,
          replacement_allowed, replacement_days, cod_available,
          fabric, pattern, fit, suitable_for,
          size_stock, coupon_applicable
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);
      `;
      await query(q, [
        item.title, item.price, item.imageUrl, item.category, item.description,
        item.brand, item.titleDescription, item.mrp, item.sizes,
        item.replacementAllowed, item.replacementDays, item.codAvailable,
        item.fabric, item.pattern, item.fit, item.suitableFor,
        item.sizeStock, item.couponApplicable
      ]);
      count++;
    } catch (err) {
      console.error(`Error inserting t-shirt "${item.title}":`, err.message);
    }
  }
  console.log(`Successfully added ${count} T-Shirts to Men's Wear.`);
  process.exit(0);
}

addTshirts();
