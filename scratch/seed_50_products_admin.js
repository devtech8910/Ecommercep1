const fetch = globalThis.fetch;

const API_BASE = 'http://localhost:5000';

// 50 High-Quality Curated Products
const productsData = [
  // ── MEN'S SHIRTS & T-SHIRTS ──
  {
    title: 'Oxford Cotton Button-Down Shirt',
    price: 3499,
    mrp: 4999,
    category: 'Men',
    brand: 'DevTech Classic',
    description: 'Crafted from 100% long-staple Egyptian cotton with a classic button-down collar and tailored slim fit.',
    imageUrl: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&q=80&fit=crop',
    fabric: '100% Cotton',
    pattern: 'Solid',
    fit: 'Slim Fit',
    suitableFor: 'Smart Casual',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:15, M:20, L:18, XL:10'
  },
  {
    title: 'French Linen Casual Shirt',
    price: 4299,
    mrp: 5999,
    category: 'Men',
    brand: 'DevTech Riviera',
    description: 'Lightweight and breathable pure French linen shirt, pre-washed for extra softness and relaxed summer style.',
    imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80&fit=crop',
    fabric: 'Pure Linen',
    pattern: 'Solid',
    fit: 'Regular Fit',
    suitableFor: 'Summer Wear',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:12, M:16, L:14, XL:8'
  },
  {
    title: 'Pima Cotton Pique Polo T-Shirt',
    price: 2499,
    mrp: 3499,
    category: 'Men',
    brand: 'DevTech Sport',
    description: 'Ultra-soft Pima cotton polo with rib-knit collar and mother-of-pearl buttons. Perfect for semi-formal events.',
    imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&q=80&fit=crop',
    fabric: 'Pima Cotton',
    pattern: 'Solid',
    fit: 'Slim Fit',
    suitableFor: 'Casual',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:20, M:25, L:20, XL:15'
  },
  {
    title: 'Heavyweight Graphic Oversized Tee',
    price: 1999,
    mrp: 2999,
    category: 'Men',
    brand: 'DevTech Urban',
    description: '280 GSM combed cotton oversized T-shirt with high-density minimalist chest print and drop-shoulder aesthetic.',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&q=80&fit=crop',
    fabric: '280 GSM Cotton',
    pattern: 'Graphic',
    fit: 'Oversized',
    suitableFor: 'Streetwear',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:10, M:30, L:25, XL:12'
  },
  {
    title: 'Striped Resort Cuban Collar Shirt',
    price: 3799,
    mrp: 5299,
    category: 'Men',
    brand: 'DevTech Resort',
    description: 'Silky smooth viscose blend resort shirt featuring vertical awning stripes and camp collar for beach luxury.',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80&fit=crop',
    fabric: 'Viscose Blend',
    pattern: 'Striped',
    fit: 'Relaxed Fit',
    suitableFor: 'Vacation Wear',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:10, M:15, L:12, XL:6'
  },

  // ── MEN'S PANTS & TROUSERS ──
  {
    title: 'Stretch Twill Chino Trousers',
    price: 3999,
    mrp: 5499,
    category: 'Men',
    brand: 'DevTech Executive',
    description: 'Versatile stretch cotton twill chinos designed with hidden flex waistband for all-day work comfort.',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80&fit=crop',
    fabric: 'Stretch Cotton',
    pattern: 'Solid',
    fit: 'Tailored Fit',
    suitableFor: 'Office / Casual',
    sizes: '30, 32, 34, 36',
    sizeStock: '30:10, 32:20, 34:18, 36:10'
  },
  {
    title: 'Japanese Selvedge Denim Jeans',
    price: 5999,
    mrp: 8499,
    category: 'Men',
    brand: 'DevTech Denim',
    description: '14 oz raw Japanese selvedge denim, dark indigo wash with custom brass hardware and reinforced chain stitching.',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80&fit=crop',
    fabric: 'Selvedge Cotton',
    pattern: 'Solid Indigo',
    fit: 'Straight Tapered',
    suitableFor: 'Everyday Wear',
    sizes: '30, 32, 34, 36',
    sizeStock: '30:8, 32:15, 34:12, 36:6'
  },
  {
    title: 'Pleated Wool Blend Formal Trousers',
    price: 4999,
    mrp: 6999,
    category: 'Men',
    brand: 'DevTech Tailoring',
    description: 'Single-pleated formal trousers woven from super 120s wool blend with side adjusters and clean front crease.',
    imageUrl: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&q=80&fit=crop',
    fabric: 'Super 120s Wool',
    pattern: 'Solid Charcoal',
    fit: 'Classic Fit',
    suitableFor: 'Formal',
    sizes: '30, 32, 34, 36',
    sizeStock: '30:5, 32:12, 34:10, 36:5'
  },
  {
    title: 'Tactical Utility Cargo Joggers',
    price: 3299,
    mrp: 4799,
    category: 'Men',
    brand: 'DevTech Urban',
    description: 'Multi-pocket cargo pants crafted from durable ripstop cotton with elastic cuffs and water-resistant finish.',
    imageUrl: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=600&q=80&fit=crop',
    fabric: 'Ripstop Cotton',
    pattern: 'Solid Olive',
    fit: 'Tapered Jogger',
    suitableFor: 'Casual / Outdoor',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:10, M:20, L:15, XL:8'
  },
  {
    title: 'Italian Linen Drawstring Pants',
    price: 4499,
    mrp: 6299,
    category: 'Men',
    brand: 'DevTech Riviera',
    description: 'Lightweight linen lounge pants with elasticated drawstring waist. Effortlessly stylish for warm weather.',
    imageUrl: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&q=80&fit=crop',
    fabric: '100% Linen',
    pattern: 'Solid Beige',
    fit: 'Relaxed Fit',
    suitableFor: 'Lounge / Beach',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:8, M:14, L:12, XL:6'
  },

  // ── MEN'S SUITS & JACKETS ──
  {
    title: 'Midnight Blue Velvet Dinner Jacket',
    price: 18999,
    mrp: 24999,
    category: 'Men',
    brand: 'DevTech Black Tie',
    description: 'Plush cotton velvet tux jacket with black silk satin shawl lapels and silk-lined interior for galas.',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80&fit=crop',
    fabric: 'Cotton Velvet',
    pattern: 'Solid Navy',
    fit: 'Slim Fit',
    suitableFor: 'Black Tie / Evening',
    sizes: '38, 40, 42, 44',
    sizeStock: '38:5, 40:8, 42:6, 44:3'
  },
  {
    title: 'Lambskin Biker Leather Jacket',
    price: 14999,
    mrp: 19999,
    category: 'Men',
    brand: 'DevTech Heritage',
    description: '100% genuine lambskin leather jacket with asymmetrical YKK zippers, quilted shoulder pads, and satin lining.',
    imageUrl: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600&q=80&fit=crop',
    fabric: 'Genuine Lambskin',
    pattern: 'Biker Solid',
    fit: 'Tailored Biker',
    suitableFor: 'Winter / Statement',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:6, M:12, L:10, XL:4'
  },
  {
    title: 'Double-Breasted Houndstooth Blazer',
    price: 12999,
    mrp: 17999,
    category: 'Men',
    brand: 'DevTech Tailoring',
    description: 'Italian wool blend double-breasted blazer with classic houndstooth weave and gold crest metal buttons.',
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&fit=crop',
    fabric: 'Wool Blend',
    pattern: 'Houndstooth',
    fit: 'Structured Fit',
    suitableFor: 'Business Formal',
    sizes: '38, 40, 42, 44',
    sizeStock: '38:4, 40:10, 42:8, 44:2'
  },
  {
    title: 'Suede Shearling Winter Bomber',
    price: 16999,
    mrp: 22999,
    category: 'Men',
    brand: 'DevTech Heritage',
    description: 'Faux shearling lined suede bomber jacket with plush collar, heavy brass hardware, and rib knit hem.',
    imageUrl: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&q=80&fit=crop',
    fabric: 'Suede & Faux Shearling',
    pattern: 'Tan Solid',
    fit: 'Regular Fit',
    suitableFor: 'Winter Wear',
    sizes: 'M, L, XL',
    sizeStock: 'M:8, L:8, XL:4'
  },
  {
    title: 'Waterproof Trench Coat with Belt',
    price: 11999,
    mrp: 15999,
    category: 'Men',
    brand: 'DevTech Outdoor',
    description: 'Double-breasted gabardine trench coat featuring storm flap, waist belt, and shoulder epaulettes.',
    imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=600&q=80&fit=crop',
    fabric: 'Cotton Gabardine',
    pattern: 'Solid Beige',
    fit: 'Overcoat Fit',
    suitableFor: 'Rain / Autumn',
    sizes: 'M, L, XL',
    sizeStock: 'M:10, L:10, XL:5'
  },

  // ── WOMEN'S DRESSES & GOWNS ──
  {
    title: 'Silk Satin Backless Evening Gown',
    price: 18499,
    mrp: 24999,
    category: 'Women',
    brand: 'DevTech Atelier',
    description: 'Floor-length pure silk satin gown with cowl neckline, subtle leg slit, and delicate criss-cross back straps.',
    imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80&fit=crop',
    fabric: '100% Pure Silk',
    pattern: 'Solid Emerald',
    fit: 'Slim A-Line',
    suitableFor: 'Gala / Red Carpet',
    sizes: 'XS, S, M, L',
    sizeStock: 'XS:4, S:10, M:12, L:6'
  },
  {
    title: 'Floral Chiffon Tiered Maxi Dress',
    price: 6999,
    mrp: 9999,
    category: 'Women',
    brand: 'DevTech Bloom',
    description: 'Flowy georgette chiffon maxi dress with romantic botanic print, ruffled tiers, and removable waist sash.',
    imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80&fit=crop',
    fabric: 'Georgette Chiffon',
    pattern: 'Floral Print',
    fit: 'Flared Maxi',
    suitableFor: 'Brunch / Wedding Guest',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:10, M:18, L:15, XL:8'
  },
  {
    title: 'Sequined Velvet Cocktail Mini Dress',
    price: 8999,
    mrp: 12999,
    category: 'Women',
    brand: 'DevTech Party',
    description: 'Shimmering micro-sequined stretch velvet dress with square neckline and bodycon silhouette for night parties.',
    imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80&fit=crop',
    fabric: 'Sequined Velvet',
    pattern: 'Sequin Solid',
    fit: 'Bodycon',
    suitableFor: 'Party Wear',
    sizes: 'XS, S, M, L',
    sizeStock: 'XS:6, S:12, M:10, L:4'
  },
  {
    title: 'Pleated Midi Wrap Dress',
    price: 5499,
    mrp: 7999,
    category: 'Women',
    brand: 'DevTech Elegance',
    description: 'Accordion pleated midi wrap dress with flattering tie waist and 3/4 blouson sleeves.',
    imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&q=80&fit=crop',
    fabric: 'Polyester Satin',
    pattern: 'Solid Rose Gold',
    fit: 'Wrap Fit',
    suitableFor: 'Cocktail / Work Event',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:8, M:15, L:12, XL:6'
  },
  {
    title: 'Linen Off-Shoulder Sundress',
    price: 4499,
    mrp: 6499,
    category: 'Women',
    brand: 'DevTech Summer',
    description: 'Breezy organic linen dress featuring elasticated off-shoulder neckline and smocked waist detailing.',
    imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80&fit=crop',
    fabric: 'Organic Linen',
    pattern: 'Solid White',
    fit: 'Smocked Fit',
    suitableFor: 'Resort / Casual',
    sizes: 'S, M, L',
    sizeStock: 'S:12, M:16, L:10'
  },

  // ── WOMEN'S TOPS & BLAZERS ──
  {
    title: 'Silk Crepe De Chine Wrap Blouse',
    price: 4299,
    mrp: 6199,
    category: 'Women',
    brand: 'DevTech Workwear',
    description: 'Elegant silk crepe drape top with V-neck wrap design and french cuffs. Perfect pairing for high-waist trousers.',
    imageUrl: 'https://images.unsplash.com/photo-1550614000-4b95d466f913?w=600&q=80&fit=crop',
    fabric: 'Silk Crepe',
    pattern: 'Solid Cream',
    fit: 'Regular Fit',
    suitableFor: 'Office / Formal',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:10, M:15, L:12, XL:5'
  },
  {
    title: 'Oversized Double-Breasted Power Blazer',
    price: 9999,
    mrp: 13999,
    category: 'Women',
    brand: 'DevTech Power',
    description: 'Tailored oversized blazer with sharp padded shoulders, horn buttons, and functional welt flap pockets.',
    imageUrl: 'https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?w=600&q=80&fit=crop',
    fabric: 'Viscose Blend',
    pattern: 'Solid Camel',
    fit: 'Oversized Power Fit',
    suitableFor: 'Formal / Chic',
    sizes: 'S, M, L',
    sizeStock: 'S:8, M:14, L:8'
  },
  {
    title: 'Ribbed Knit Cashmere Sweater',
    price: 7499,
    mrp: 10499,
    category: 'Women',
    brand: 'DevTech Knitwear',
    description: '100% Grade-A Mongolian cashmere crewneck sweater, incredibly soft and lightweight yet exceptionally warm.',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80&fit=crop',
    fabric: '100% Cashmere',
    pattern: 'Ribbed Knit',
    fit: 'Relaxed Fit',
    suitableFor: 'Winter Casual',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:6, M:12, L:10, XL:4'
  },
  {
    title: 'Embroidered Cotton Peasant Top',
    price: 3299,
    mrp: 4799,
    category: 'Women',
    brand: 'DevTech Boho',
    description: 'Intricate schiffli embroidery on breathable cotton gauze with tassel tie neck and voluminous balloon sleeves.',
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80&fit=crop',
    fabric: 'Cotton Gauze',
    pattern: 'Embroidered',
    fit: 'Loose Fit',
    suitableFor: 'Casual / Boho',
    sizes: 'S, M, L',
    sizeStock: 'S:10, M:15, L:8'
  },
  {
    title: 'Satin Sleeveless Camisole Top',
    price: 2199,
    mrp: 3199,
    category: 'Women',
    brand: 'DevTech Essentials',
    description: 'Silky bias-cut satin cami with adjustable thin spaghetti straps. Layer under blazers or wear on warm evenings.',
    imageUrl: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&q=80&fit=crop',
    fabric: 'Polyester Satin',
    pattern: 'Solid Champagne',
    fit: 'Slim Fit',
    suitableFor: 'Layering / Evening',
    sizes: 'XS, S, M, L',
    sizeStock: 'XS:8, S:15, M:12, L:6'
  },

  // ── WOMEN'S PANTS & SKIRTS ──
  {
    title: 'High-Waisted Wide-Leg Palazzo Pants',
    price: 4999,
    mrp: 6999,
    category: 'Women',
    brand: 'DevTech Studio',
    description: 'Drapey wide-leg pants with front pleats, slant side pockets, and flattering high-rise fitted waist.',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80&fit=crop',
    fabric: 'Crepe Polyester',
    pattern: 'Solid Ivory',
    fit: 'Wide Leg',
    suitableFor: 'Work / Formal',
    sizes: '26, 28, 30, 32',
    sizeStock: '26:5, 28:12, 30:15, 32:6'
  },
  {
    title: 'Vintage Mom Fit Denim Jeans',
    price: 3999,
    mrp: 5799,
    category: 'Women',
    brand: 'DevTech Denim',
    description: '100% rigid cotton 90s vintage wash jeans with flattering high-rise waist and tapered ankle leg.',
    imageUrl: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&q=80&fit=crop',
    fabric: 'Rigid Cotton Denim',
    pattern: 'Vintage Wash',
    fit: 'Mom Fit',
    suitableFor: 'Casual',
    sizes: '26, 28, 30, 32',
    sizeStock: '26:8, 28:18, 30:14, 32:6'
  },
  {
    title: 'Satin Bias-Cut Midi Skirt',
    price: 3799,
    mrp: 5299,
    category: 'Women',
    brand: 'DevTech Elegance',
    description: 'Fluid bias-cut satin skirt that contours gracefully over hips with an invisible elastic waistband.',
    imageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&q=80&fit=crop',
    fabric: 'Heavy Satin',
    pattern: 'Solid Black',
    fit: 'Bias Cut Midi',
    suitableFor: 'Evening / Brunch',
    sizes: 'S, M, L',
    sizeStock: 'S:10, M:14, L:8'
  },
  {
    title: 'Faux Leather Straight Pants',
    price: 4699,
    mrp: 6699,
    category: 'Women',
    brand: 'DevTech Edge',
    description: 'Butter-soft vegan polyurethane leather trousers with classic 5-pocket styling and smooth lining.',
    imageUrl: 'https://images.unsplash.com/photo-1551854838-212c50b4c184?w=600&q=80&fit=crop',
    fabric: 'Vegan PU Leather',
    pattern: 'Solid Black',
    fit: 'Straight Leg',
    suitableFor: 'Night Out',
    sizes: '26, 28, 30, 32',
    sizeStock: '26:4, 28:10, 30:8, 32:4'
  },
  {
    title: 'Tailored Ankle Tapered Trousers',
    price: 3699,
    mrp: 5199,
    category: 'Women',
    brand: 'DevTech Workwear',
    description: 'Clean ankle-length trousers with stretch woven fabric, belt loops, and crisp center leg crease.',
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&q=80&fit=crop',
    fabric: 'Stretch Rayon Blend',
    pattern: 'Solid Navy',
    fit: 'Tapered Ankle',
    suitableFor: 'Office',
    sizes: '26, 28, 30, 32',
    sizeStock: '26:6, 28:14, 30:12, 32:5'
  },

  // ── KIDS' WEAR (BOYS & GIRLS) ──
  {
    title: 'Floral Embroidered Cotton Summer Dress',
    price: 2499,
    mrp: 3499,
    category: 'Kids',
    brand: 'DevTech Junior',
    description: '100% soft breathable cotton dress with delicate hand embroidery, tie shoulder straps, and cotton lining.',
    imageUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&q=80&fit=crop',
    fabric: '100% Soft Cotton',
    pattern: 'Floral Embroidered',
    fit: 'A-Line Dress',
    suitableFor: 'Playday / Birthday',
    sizes: '2-3Y, 4-5Y, 6-7Y, 8-9Y',
    sizeStock: '2-3Y:10, 4-5Y:15, 6-7Y:12, 8-9Y:8'
  },
  {
    title: 'Adjustable Denim Dungaree Overalls',
    price: 3299,
    mrp: 4599,
    category: 'Kids',
    brand: 'DevTech Junior',
    description: 'Durable washed cotton denim overalls with metal buckle clasps, front bib pocket, and side snap buttons.',
    imageUrl: 'https://images.unsplash.com/photo-1522204538344-922f76ecc041?w=600&q=80&fit=crop',
    fabric: 'Washed Cotton Denim',
    pattern: 'Classic Indigo',
    fit: 'Relaxed Overall',
    suitableFor: 'Casual / Outdoor',
    sizes: '2-3Y, 4-5Y, 6-7Y, 8-9Y',
    sizeStock: '2-3Y:8, 4-5Y:12, 6-7Y:10, 8-9Y:6'
  },
  {
    title: 'Lightweight Mini Zip Bomber Jacket',
    price: 4499,
    mrp: 5999,
    category: 'Kids',
    brand: 'DevTech Junior',
    description: 'Sporty satin polyester bomber jacket for kids with contrast ribbed collar, cuffs, and smooth YKK zipper.',
    imageUrl: 'https://images.unsplash.com/photo-1621458055613-255e4e892cfa?w=600&q=80&fit=crop',
    fabric: 'Satin Polyester',
    pattern: 'Solid Navy/Red',
    fit: 'Regular Fit',
    suitableFor: 'Winter / Outing',
    sizes: '4-5Y, 6-7Y, 8-9Y, 10-11Y',
    sizeStock: '4-5Y:10, 6-7Y:12, 8-9Y:8, 10-11Y:5'
  },
  {
    title: 'Printed Organic Cotton T-Shirt Set (Pack of 3)',
    price: 1999,
    mrp: 2999,
    category: 'Kids',
    brand: 'DevTech Junior',
    description: 'Pack of 3 super-soft GOTS certified organic cotton tees with playful animal prints and tagless comfort.',
    imageUrl: 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=600&q=80&fit=crop',
    fabric: 'GOTS Organic Cotton',
    pattern: 'Animal Print',
    fit: 'Regular Fit',
    suitableFor: 'Daily Wear',
    sizes: '2-3Y, 4-5Y, 6-7Y, 8-9Y',
    sizeStock: '2-3Y:15, 4-5Y:20, 6-7Y:18, 8-9Y:10'
  },
  {
    title: 'Boys Linen Waistcoat & Short Suit Set',
    price: 4999,
    mrp: 6999,
    category: 'Kids',
    brand: 'DevTech Little Gentleman',
    description: 'Formal 3-piece linen suit set including buttoned waistcoat, matching shorts, and crisp white shirt.',
    imageUrl: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&q=80&fit=crop',
    fabric: 'Linen Blend',
    pattern: 'Solid Beige',
    fit: 'Tailored Mini Fit',
    suitableFor: 'Festive / Wedding',
    sizes: '2-3Y, 4-5Y, 6-7Y',
    sizeStock: '2-3Y:6, 4-5Y:10, 6-7Y:8'
  },

  // ── SHOES & FOOTWEAR ──
  {
    title: 'Handcrafted Calfskin Penny Loafers',
    price: 8999,
    mrp: 12499,
    category: 'Men',
    brand: 'DevTech Cordwainer',
    description: 'Goodyear welted Italian calfskin leather loafers with hand-burnished cognac finish and leather sole.',
    imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&q=80&fit=crop',
    fabric: 'Italian Calfskin Leather',
    pattern: 'Hand-Burnished',
    fit: 'Standard D Width',
    suitableFor: 'Formal / Business',
    sizes: '7 UK, 8 UK, 9 UK, 10 UK',
    sizeStock: '7 UK:4, 8 UK:10, 9 UK:8, 10 UK:4'
  },
  {
    title: 'Minimalist White Leather Court Sneakers',
    price: 6499,
    mrp: 8999,
    category: 'Men',
    brand: 'DevTech Urban Footwear',
    description: 'Clean low-top sneakers in full-grain Nappa leather with padded memory foam insoles and durable cupsole.',
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80&fit=crop',
    fabric: 'Full-Grain Nappa Leather',
    pattern: 'Monochrome White',
    fit: 'Low-Top Sneaker',
    suitableFor: 'Smart Casual',
    sizes: '7 UK, 8 UK, 9 UK, 10 UK',
    sizeStock: '7 UK:6, 8 UK:15, 9 UK:12, 10 UK:6'
  },
  {
    title: 'Suede Chelsea Ankle Boots',
    price: 7999,
    mrp: 10999,
    category: 'Men',
    brand: 'DevTech Cordwainer',
    description: 'Water-repellent Italian suede Chelsea boots with elastic side gussets and pull tabs.',
    imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600&q=80&fit=crop',
    fabric: 'Italian Suede Leather',
    pattern: 'Solid Tan',
    fit: 'Ankle Boot',
    suitableFor: 'Autumn / Casual',
    sizes: '7 UK, 8 UK, 9 UK, 10 UK',
    sizeStock: '7 UK:5, 8 UK:10, 9 UK:8, 10 UK:3'
  },
  {
    title: 'Pointed Toe Leather Stiletto Pumps',
    price: 9999,
    mrp: 13999,
    category: 'Women',
    brand: 'DevTech Luxury Heels',
    description: 'Classic 85mm pointed toe pumps in smooth Nappa leather with cushioned footbed and red leather lacquered sole.',
    imageUrl: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=600&q=80&fit=crop',
    fabric: 'Smooth Nappa Leather',
    pattern: 'Solid Black',
    fit: '85mm Stiletto',
    suitableFor: 'Evening / Formal',
    sizes: '4 UK, 5 UK, 6 UK, 7 UK',
    sizeStock: '4 UK:4, 5 UK:10, 6 UK:8, 7 UK:4'
  },
  {
    title: 'Strappy Metallic Heeled Sandals',
    price: 7499,
    mrp: 10499,
    category: 'Women',
    brand: 'DevTech Party Footwear',
    description: 'Delicate metallic gold leather straps with adjustable ankle buckle and 70mm block heel for dancing comfort.',
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80&fit=crop',
    fabric: 'Metallic Leather',
    pattern: 'Metallic Gold',
    fit: '70mm Block Heel',
    suitableFor: 'Party / Wedding',
    sizes: '4 UK, 5 UK, 6 UK, 7 UK',
    sizeStock: '4 UK:5, 5 UK:12, 6 UK:10, 7 UK:3'
  },

  // ── LUXURY ACCESSORIES & WATCHES ──
  {
    title: 'Automatic Skeleton Mechanical Watch',
    price: 24999,
    mrp: 32999,
    category: 'Men',
    brand: 'DevTech Horology',
    description: 'Self-winding automatic skeleton movement visible through front and back sapphire crystal glass. 50m water resistant.',
    imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80&fit=crop',
    fabric: '316L Stainless Steel',
    pattern: 'Skeleton Dial',
    fit: '42mm Case',
    suitableFor: 'Luxury / Collector',
    sizes: 'One Size',
    sizeStock: 'One Size:10'
  },
  {
    title: 'Chronograph Stainless Steel Watch',
    price: 8999,
    mrp: 12999,
    category: 'Men',
    brand: 'DevTech Timepieces',
    description: 'Precision Japanese quartz chronograph with stopwatch subdials, tachymeter bezel, and luminous hands.',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&q=80&fit=crop',
    fabric: 'Stainless Steel & Leather',
    pattern: 'Sunray Blue Dial',
    fit: '40mm Case',
    suitableFor: 'Everyday Luxury',
    sizes: 'One Size',
    sizeStock: 'One Size:15'
  },
  {
    title: 'Classic Saffiano Leather Tote Bag',
    price: 14999,
    mrp: 19999,
    category: 'Women',
    brand: 'DevTech Leather Goods',
    description: 'Structure scratch-resistant Saffiano leather tote with padded 14-inch laptop sleeve and gold-tone zip hardware.',
    imageUrl: 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=600&q=80&fit=crop',
    fabric: 'Saffiano Leather',
    pattern: 'Solid Tan',
    fit: 'Large Tote',
    suitableFor: 'Work / Travel',
    sizes: 'One Size',
    sizeStock: 'One Size:12'
  },
  {
    title: 'Quilted Chain Shoulder Bag',
    price: 11999,
    mrp: 16999,
    category: 'Women',
    brand: 'DevTech Leather Goods',
    description: 'Iconic diamond-quilted nappa leather bag with sliding woven chain strap and turn-lock closure.',
    imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&q=80&fit=crop',
    fabric: 'Quilted Nappa Leather',
    pattern: 'Diamond Quilted',
    fit: 'Crossbody / Shoulder',
    suitableFor: 'Evening / Chic',
    sizes: 'One Size',
    sizeStock: 'One Size:14'
  },
  {
    title: 'Polarized Aviator Sunglasses',
    price: 4999,
    mrp: 6999,
    category: 'Men',
    brand: 'DevTech Eyewear',
    description: 'Ultra-lightweight titanium frame aviator sunglasses with UV400 anti-glare polarized green lenses.',
    imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80&fit=crop',
    fabric: 'Titanium & Glass',
    pattern: 'Gold Frame / Green Lens',
    fit: 'Universal Fit',
    suitableFor: 'Outdoor / Driving',
    sizes: 'One Size',
    sizeStock: 'One Size:20'
  },
  {
    title: 'Pure Mulberry Silk Scarf',
    price: 3499,
    mrp: 4999,
    category: 'Women',
    brand: 'DevTech Atelier',
    description: 'Hand-rolled edges 100% Mulberry silk square scarf featuring artistic heritage baroque prints.',
    imageUrl: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=600&q=80&fit=crop',
    fabric: '100% Mulberry Silk',
    pattern: 'Baroque Print',
    fit: me => '90cm x 90cm Square',
    suitableFor: 'Styling / Gift',
    sizes: 'One Size',
    sizeStock: 'One Size:15'
  },

  // ── ADDITIONAL SHIRTS, TEES & CASUALS ──
  {
    title: 'Vintage Washed Denim Shirt',
    price: 3899,
    mrp: 5499,
    category: 'Men',
    brand: 'DevTech Denim',
    description: '100% cotton Western denim shirt with pearl snap buttons and twin chest flap pockets.',
    imageUrl: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?w=600&q=80&fit=crop',
    fabric: '100% Cotton Denim',
    pattern: 'Washed Blue',
    fit: 'Regular Fit',
    suitableFor: 'Casual Layering',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:10, M:15, L:12, XL:6'
  },
  {
    title: 'Merino Wool V-Neck Sweater',
    price: 6999,
    mrp: 9499,
    category: 'Men',
    brand: 'DevTech Knitwear',
    description: 'Fine 19.5-micron Italian Extra-fine Merino wool V-neck sweater. Breathable, odor-resistant, and pill-resistant.',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80&fit=crop',
    fabric: 'Extra-Fine Merino Wool',
    pattern: 'Solid Navy',
    fit: 'Slim Fit',
    suitableFor: 'Office Layering',
    sizes: 'S, M, L, XL',
    sizeStock: 'S:8, M:16, L:14, XL:6'
  },
  {
    title: 'Satin Button-Down Night Shirt & Short Set',
    price: 3999,
    mrp: 5499,
    category: 'Women',
    brand: 'DevTech Lounge',
    description: 'Luxurious silk-like satin sleepwear set with piped collar, notch neck, and comfortable elastic waist shorts.',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80&fit=crop',
    fabric: 'Silky Satin',
    pattern: 'Piped Solid',
    fit: 'Relaxed Lounge',
    suitableFor: 'Sleepwear / Lounge',
    sizes: 'S, M, L',
    sizeStock: 'S:12, M:18, L:10'
  },
  {
    title: 'Cropped Denim Trucker Jacket',
    price: 5499,
    mrp: 7499,
    category: 'Women',
    brand: 'DevTech Denim',
    description: 'Classic vintage-inspired cropped denim trucker jacket with chest flap pockets and adjustable hem tabs.',
    imageUrl: 'https://images.unsplash.com/photo-1543076447-215ad9ba6923?w=600&q=80&fit=crop',
    fabric: '100% Cotton Denim',
    pattern: 'Medium Wash',
    fit: 'Cropped Fit',
    suitableFor: 'Casual Layering',
    sizes: 'S, M, L',
    sizeStock: 'S:10, M:15, L:8'
  },
  {
    title: 'Kids Waterproof Hooded Raincoat',
    price: 2799,
    mrp: 3999,
    category: 'Kids',
    brand: 'DevTech Junior',
    description: 'Bright waterproof hooded jacket with reflective safety strips and soft jersey cotton inner lining.',
    imageUrl: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&q=80&fit=crop',
    fabric: 'Waterproof PU & Cotton',
    pattern: 'Yellow Solid',
    fit: 'Regular Fit',
    suitableFor: 'Rainy Days / Outing',
    sizes: '4-5Y, 6-7Y, 8-9Y',
    sizeStock: '4-5Y:10, 6-7Y:12, 8-9Y:8'
  },
  {
    title: 'Kids Comfy Fleece Tracksuit Set',
    price: 3499,
    mrp: 4999,
    category: 'Kids',
    brand: 'DevTech Junior',
    description: 'Warm 2-piece fleece hoodie and sweatpants set with ribbed cuffs and elastic drawcord waist.',
    imageUrl: 'https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&q=80&fit=crop',
    fabric: 'Cotton Fleece Blend',
    pattern: 'Colorblock',
    fit: 'Comfy Fit',
    suitableFor: 'Winter / Playtime',
    sizes: '2-3Y, 4-5Y, 6-7Y, 8-9Y',
    sizeStock: '2-3Y:10, 4-5Y:15, 6-7Y:12, 8-9Y:6'
  },
  {
    title: 'Minimalist Leather Bi-Fold Wallet',
    price: 2499,
    mrp: 3499,
    category: 'Men',
    brand: 'DevTech Leather Goods',
    description: 'RFID blocking full-grain leather wallet with 8 card slots, dual bill compartment, and sleek thin profile.',
    imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80&fit=crop',
    fabric: 'Full-Grain Leather',
    pattern: 'Solid Brown',
    fit: 'Slim Bi-Fold',
    suitableFor: 'Everyday / Gift',
    sizes: 'One Size',
    sizeStock: 'One Size:25'
  },
  {
    title: 'Handcrafted Genuine Leather Belt',
    price: 1999,
    mrp: 2999,
    category: 'Men',
    brand: 'DevTech Leather Goods',
    description: '35mm full-grain vegetable-tanned leather belt with solid brushed stainless steel pin buckle.',
    imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&q=80&fit=crop',
    fabric: 'Vegetable-Tanned Leather',
    pattern: 'Solid Black',
    fit: '35mm Width',
    suitableFor: 'Formal / Casual',
    sizes: '32, 34, 36, 38',
    sizeStock: '32:10, 34:15, 36:12, 38:8'
  },
  {
    title: 'Knit Beanie & Scarf Winter Set',
    price: 2999,
    mrp: 4199,
    category: 'Men',
    brand: 'DevTech Winter',
    description: 'Matching ribbed wool knit beanie hat and fringed scarf set with soft fleece inner lining.',
    imageUrl: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=600&q=80&fit=crop',
    fabric: 'Wool Blend Knit',
    pattern: 'Ribbed Grey',
    fit: 'One Size Stretch',
    suitableFor: 'Winter / Outdoor',
    sizes: 'One Size',
    sizeStock: 'One Size:18'
  },
  {
    title: 'Printed Canvas Weekend Duffle Bag',
    price: 6999,
    mrp: 9999,
    category: 'Men',
    brand: 'DevTech Luggage',
    description: 'Spacious 45L travel duffle crafted from heavy-duty waxed canvas with genuine leather trim and shoulder strap.',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80&fit=crop',
    fabric: 'Waxed Canvas & Leather',
    pattern: 'Solid Olive',
    fit: '45L Duffle',
    suitableFor: 'Travel / Gym',
    sizes: 'One Size',
    sizeStock: 'One Size:10'
  }
];

async function seedProducts() {
  console.log('🚀 Starting admin authentication and 50 product seeding...');

  try {
    // 1. Admin Login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@devtech.com', password: 'password' })
    });

    const loginData = await loginRes.json();
    const token = loginData.data ? loginData.data.token : loginData.token;
    if (!loginRes.ok || !loginData.success || !token) {
      console.error('❌ Admin login failed:', loginData);
      process.exit(1);
    }
    console.log('✅ Admin login successful! Token received.');

    // 2. Insert 50 products one by one via Admin POST /admin/products API
    let successCount = 0;
    for (let i = 0; i < productsData.length; i++) {
      const p = productsData[i];
      const res = await fetch(`${API_BASE}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: p.title,
          price: p.price,
          mrp: p.mrp,
          imageUrl: p.imageUrl,
          category: p.category,
          description: p.description,
          brand: p.brand,
          titleDescription: p.description,
          sizes: p.sizes || 'S, M, L, XL',
          sizeStock: p.sizeStock || 'S:10, M:10, L:10',
          fabric: p.fabric || 'Cotton',
          pattern: p.pattern || 'Solid',
          fit: p.fit || 'Regular Fit',
          suitableFor: p.suitableFor || 'Casual',
          replacementAllowed: true,
          replacementDays: 7,
          codAvailable: true,
          couponApplicable: true
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        successCount++;
        console.log(`  [${i + 1}/50] Added: "${p.title}" (${p.category}) — ₹${p.price}`);
      } else {
        console.warn(`  [${i + 1}/50] Warning adding "${p.title}":`, data.error || data);
      }
    }

    console.log(`\n🎉 Successfully added ${successCount} products via Admin Dashboard API!`);

    // 3. Verify total product count from GET /products
    const prodRes = await fetch(`${API_BASE}/products?_t=` + Date.now());
    const prodData = await prodRes.json();
    console.log(`📊 Total products now in database: ${prodData.products ? prodData.products.length : 0}`);

  } catch (err) {
    console.error('❌ Error during product seeding:', err);
  }
}

seedProducts();
