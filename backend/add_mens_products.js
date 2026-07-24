// backend/add_mens_products.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { query } from './db.js';

const mensWearItems = [
  {
    title: "Savile Row Double-Breasted Suit",
    price: 34999.00,
    mrp: 38999.00,
    imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80&fit=crop",
    category: "mens",
    description: "Impeccably tailored double-breasted suit crafted from premium Merino wool, featuring structured shoulders and a peak lapel.",
    brand: "Savile Row",
    titleDescription: "Premium double-breasted tailoring in pure charcoal wool.",
    sizes: "M, L, XL",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: true,
    fabric: "100% Merino Wool",
    pattern: "Solid",
    fit: "Tailored Fit",
    suitableFor: "Formal / Ceremonial",
    sizeStock: "M:12, L:15, XL:8",
    couponApplicable: true
  },
  {
    title: "Classic Italian Linen Shirt",
    price: 3800.00,
    mrp: 3800.00,
    imageUrl: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800&q=80&fit=crop",
    category: "mens",
    description: "Breathable pure Italian linen shirt with a soft mandarin collar and button-up front. Ideal for warm summer afternoons.",
    brand: "Loro Piana",
    titleDescription: "Relaxed linen shirt with breathable summer weave.",
    sizes: "S, M, L",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: true,
    fabric: "100% Linen",
    pattern: "Solid",
    fit: "Regular Fit",
    suitableFor: "Casual / Resort Wear",
    sizeStock: "S:20, M:25, L:18",
    couponApplicable: true
  },
  {
    title: "Premium Cashmere Crewneck Sweater",
    price: 12500.00,
    mrp: 14500.00,
    imageUrl: "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=800&q=80&fit=crop",
    category: "mens",
    description: "Luxuriously soft crewneck sweater knitted from high-grade Mongolian cashmere. Perfect layering piece for cold climates.",
    brand: "Zegna",
    titleDescription: "Ultra-soft Mongolian cashmere knit in heather grey.",
    sizes: "S, M, L, XL",
    replacementAllowed: true,
    replacementDays: 14,
    codAvailable: true,
    fabric: "100% Cashmere",
    pattern: "Solid",
    fit: "Classic Fit",
    suitableFor: "Smart Casual / Winter",
    sizeStock: "S:8, M:15, L:12, XL:6",
    couponApplicable: false
  },
  {
    title: "Raw Indigo Selvedge Denim Chinos",
    price: 4999.00,
    mrp: 5999.00,
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80&fit=crop",
    category: "mens",
    description: "Sturdy raw selvedge denim woven on traditional shuttle looms. Features contrast stitching and a tailored chino cut.",
    brand: "Levi's Premium",
    titleDescription: "Heavyweight indigo denim with iconic redline selvedge details.",
    sizes: "S, M, L",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: true,
    fabric: "100% Selvedge Cotton",
    pattern: "Solid",
    fit: "Slim Straight",
    suitableFor: "Casual / Daily wear",
    sizeStock: "S:10, M:18, L:14",
    couponApplicable: true
  },
  {
    title: "Modern Minimalist Trench Coat",
    price: 16800.00,
    mrp: 18500.00,
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80&fit=crop",
    category: "mens",
    description: "Water-resistant double-breasted trench coat with storm flaps, adjustable cuffs, and a waist tie belt.",
    brand: "Barbour",
    titleDescription: "Classic silhouette rainproof trench in classic beige.",
    sizes: "M, L, XL",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: false,
    fabric: "Polyester-Cotton Blend",
    pattern: "Solid",
    fit: "Relaxed Fit",
    suitableFor: "Outerwear / Rainy Season",
    sizeStock: "M:8, L:10, XL:5",
    couponApplicable: true
  },
  {
    title: "Premium Calfskin Bomber Jacket",
    price: 24999.00,
    mrp: 29999.00,
    imageUrl: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&q=80&fit=crop",
    category: "mens",
    description: "Buttery-soft full-grain calfskin leather bomber jacket with ribbed collar, cuffs, and hem. Features luxury YKK zippers.",
    brand: "Zegna",
    titleDescription: "Black calfskin flight jacket with ribbed trim.",
    sizes: "M, L, XL",
    replacementAllowed: true,
    replacementDays: 10,
    codAvailable: true,
    fabric: "100% Genuine Calfskin",
    pattern: "Solid",
    fit: "Slim Fit",
    suitableFor: "Casual / Outerwear",
    sizeStock: "M:5, L:7, XL:3",
    couponApplicable: false
  },
  {
    title: "Oxford Classic Button-Down Shirt",
    price: 3499.00,
    mrp: 3499.00,
    imageUrl: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80&fit=crop",
    category: "mens",
    description: "Traditional heavy Oxford cotton shirt with a button-down collar, chest pocket, and signature locker loop.",
    brand: "DevTech Luxe",
    titleDescription: "Crisp white Oxford cotton dress shirt.",
    sizes: "S, M, L, XL",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: true,
    fabric: "100% Cotton",
    pattern: "Solid",
    fit: "Tailored Fit",
    suitableFor: "Smart Casual / Business",
    sizeStock: "S:15, M:25, L:20, XL:10",
    couponApplicable: true
  },
  {
    title: "Silk-Blend Knitted Tie",
    price: 1800.00,
    mrp: 2200.00,
    imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80&fit=crop",
    category: "mens",
    description: "Textured silk-blend knit tie with a square bottom, ideal for adding a modern touch to tailoring.",
    brand: "Savile Row",
    titleDescription: "Forest green silk-blend knit necktie.",
    sizes: "Free Size",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: true,
    fabric: "70% Silk, 30% Polyester",
    pattern: "Knit Texture",
    fit: "Standard Width",
    suitableFor: "Formal Accents",
    sizeStock: "Free Size:50",
    couponApplicable: true
  },
  {
    title: "Belgian Loafers in Suede",
    price: 8500.00,
    mrp: 9500.00,
    imageUrl: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&q=80&fit=crop",
    category: "mens",
    description: "Elegant slip-on Belgian loafers crafted from water-repellent Italian calf suede. Features a classic matching bow accent.",
    brand: "Loro Piana",
    titleDescription: "Luxurious tan suede Belgian loafers with leather soles.",
    sizes: "M, L",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: true,
    fabric: "Calf Suede / Leather Sole",
    pattern: "Solid",
    fit: "Comfort Fit",
    suitableFor: "Smart Casual / Evening",
    sizeStock: "M:12, L:10",
    couponApplicable: true
  },
  {
    title: "Chunky Cable-Knit Cardigan",
    price: 6800.00,
    mrp: 7500.00,
    imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80&fit=crop",
    category: "mens",
    description: "Heavyweight shawl-collar cardigan knitted with traditional cable patterns. Finished with real wood buttons.",
    brand: "Barbour",
    titleDescription: "Chunky oatmeal cable knit cardigan with pockets.",
    sizes: "M, L, XL",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: true,
    fabric: "80% Wool, 20% Nylon",
    pattern: "Cable Knit",
    fit: "Relaxed Fit",
    suitableFor: "Winter Casual",
    sizeStock: "M:8, L:12, XL:6",
    couponApplicable: true
  }
];

// Generate remaining 40 items dynamically to reach exactly 50 total Men's Wear items
const subCategories = ["Shirt", "Suit", "Trousers", "Jacket", "Polos", "Sweater", "Blazer", "Chinos", "Tee"];
const fabrics = ["Cotton", "Linen", "Wool", "Denim", "Silk", "Corduroy", "Cashmere"];
const brands = ["Savile Row", "Loro Piana", "Zegna", "Barbour", "Levi's Premium", "DevTech Luxe"];
const fits = ["Slim Fit", "Regular Fit", "Tailored Fit", "Relaxed Fit"];
const colors = ["Navy Blue", "Charcoal Grey", "Olive Green", "Ivory White", "Oatmeal Beige", "Burgundy Red", "Classic Black", "Desert Sand"];

for (let i = 11; i <= 50; i++) {
  const brand = brands[i % brands.length];
  const subCat = subCategories[i % subCategories.length];
  const fabric = fabrics[i % fabrics.length];
  const fit = fits[i % fits.length];
  const color = colors[i % colors.length];
  
  const basePrice = 1200 + (i * 280);
  const discountPercent = (i % 3 === 0) ? 0.15 : 0;
  const mrp = Math.round(basePrice);
  const price = Math.round(mrp * (1 - discountPercent));

  mensWearItems.push({
    title: `${brand} ${color} ${fabric} ${subCat}`,
    price: price,
    mrp: mrp,
    imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80&fit=crop", // placeholder standard fashion image
    category: "mens",
    description: `A premium addition to your wardrobe. This ${fit.toLowerCase()} ${subCat.toLowerCase()} is crafted from high-grade ${fabric.toLowerCase()} in an elegant ${color.toLowerCase()} finish. Designed by ${brand} for maximum comfort and style.`,
    brand: brand,
    titleDescription: `${fit} ${subCat} in premium ${color.toLowerCase()} ${fabric.toLowerCase()}.`,
    sizes: "S, M, L, XL",
    replacementAllowed: true,
    replacementDays: 7,
    codAvailable: true,
    fabric: fabric,
    pattern: i % 4 === 0 ? "Checkered" : i % 5 === 0 ? "Striped" : "Solid",
    fit: fit,
    suitableFor: i % 2 === 0 ? "Casual Wear" : "Business Casual",
    sizeStock: "S:10, M:15, L:15, XL:8",
    couponApplicable: i % 6 !== 0
  });
}

async function addProducts() {
  console.log(`Starting insertion of ${mensWearItems.length} Men's Wear items into the database...`);
  let count = 0;
  for (const item of mensWearItems) {
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
      console.error(`Error inserting item "${item.title}":`, err.message);
    }
  }
  console.log(`🎉 DB Insertion Complete! Successfully added ${count} products to Men's Wear.`);
  process.exit(0);
}

addProducts();
