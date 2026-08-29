# Survey Investigation Report: Product Card Image Fixes (R1)

## 1. Observation

### 1.1 Affected Files & Exact Locations
1. **`css/mobile.css` (Lines 1251–1332)**:
   - Sets 2-column mobile grid on `#category-products-grid`, `#wishlist-grid`, `.category-products-grid`, `.products-grid`, `.shop-products-grid`.
   - Lines 1283–1293 apply conflicting CSS overrides to product images:
     ```css
     #category-products-grid img,
     #wishlist-grid img,
     .product-card img,
     .category-product-card img {
       aspect-ratio: 1 / 1.15 !important;
       object-fit: cover !important;
       width: 100% !important;
       border-radius: 12px !important;
       max-height: 200px !important;
     }
     ```
   - Lines 1266–1281 apply `padding: 10px !important;` to child elements.

2. **`pages/mens-wear.html` (Lines 40–54 & 620–656)**:
   - Head `<style>` tag defines:
     ```css
     .product-card-img-wrap {
       height: 260px;
       overflow: hidden;
       position: relative;
       background: #181826;
     }
     .product-card-img {
       width: 100%;
       height: 100%;
       object-fit: cover;
       transition: transform 0.4s ease;
     }
     ```
   - Dynamic render function (`renderGrid` lines 642–646) injects:
     ```html
     <div style="position: relative; width: 100%; padding-top: 110%; overflow: hidden; background: #0a0a14;">
       <a href="${detailsUrl}" style="position: absolute; inset: 0; display: block;">
         <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;" alt="${p.title}" class="product-card-img" />
       </a>
     ...
     ```

3. **`pages/womens-wear.html` (Lines 40–54 & 570–606)**:
   - Identical structure to Men's Wear with `<style>` `.product-card-img-wrap { height: 260px; }` and JS `padding-top: 110%` image wrapper.

4. **`pages/kids-wear.html` (Lines 40–54 & 554–590)**:
   - Identical structure to Men's Wear with `<style>` `.product-card-img-wrap { height: 260px; }` and JS `padding-top: 110%` image wrapper.

5. **`pages/shop.html` (Lines 570–605 & `css/style.css` Lines 4035–4052)**:
   - Dynamic card builder `createProductCard`:
     ```html
     <div style="position: relative; width: 100%; padding-top: 110%; overflow: hidden; background: #0a0a14;">
       <a href="${detailsUrl}" style="position: absolute; inset: 0; display: block;">
         <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease;" alt="${p.title}" class="product-card-img" />
       </a>
     ...
     ```
   - Card container defined in `style.css`: `.shop-carousel-card { flex: 0 0 280px; width: 280px; ... }`
   - Mobile override in `mobile.css` (Line 580): `.shop-carousel-card { flex: 0 0 min(78vw, 300px) !important; width: min(78vw, 300px) !important; }`

6. **`index.html` (Lines 1020–1052)**:
   - Home page dynamic catalog `createCard(p, badgeText)`:
     ```html
     <div style="position: relative; width: 100%; padding-top: 110%; overflow: hidden; background: #0a0a14;">
       <a href="${detailsUrl}" style="position: absolute; inset: 0; display: block;">
         <img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;" alt="${p.title || 'Product'}" />
       </a>
     ...
     ```

7. **`pages/wishlist.html` (Lines 180–186)**:
   - Fixed height wrapper:
     ```html
     <div style="height: 220px; overflow: hidden; background: #1e1e30; position: relative;">
       <img src="${item.image || '...'}" style="width: 100%; height: 100%; object-fit: cover;" alt="${escapeHtml(item.title || 'Product')}" />
     ...
     ```

8. **`pages/product-details.html` (Lines 720–729 & 1723–1730)**:
   - Recommendations / Similar Products Card:
     ```css
     .similar-product-image {
       aspect-ratio: 4 / 5;
       background: #0b0d18;
       padding: 10px;
     }
     .similar-product-image img {
       width: 100%;
       height: 100%;
       object-fit: contain;
       display: block;
     }
     ```

---

## 2. Logic Chain

1. **Failure Mode 1: `max-height: 200px !important` in `css/mobile.css` (Lines 1283–1293)**:
   - *Observation*: On mobile screens (up to 768px), `mobile.css` sets `max-height: 200px !important;` on `#category-products-grid img, #wishlist-grid img, .product-card img, .category-product-card img`.
   - *Logic*: The card markup uses a proportional container (`padding-top: 110%`, meaning height = 110% of card width). On any screen or tablet where column width is 200px–360px, the container height becomes 220px–396px. Because `img` is restricted to `max-height: 200px`, the image ceases expanding while the dark container keeps growing. This results in a massive 20px–196px empty dark gap below the image.
   - *Secondary Conflict*: Applying `aspect-ratio: 1 / 1.15 !important` directly on the `img` when the `img` is inside an absolutely-positioned `<a>` tag with `inset: 0` causes browsers to calculate dimensions asynchronously, leading to letterboxing and unaligned images.

2. **Failure Mode 2: Inconsistent Fixed Heights vs Responsive Ratios**:
   - *Observation*: `pages/mens-wear.html`, `pages/womens-wear.html`, and `pages/kids-wear.html` define `.product-card-img-wrap { height: 260px; }` in CSS, while `wishlist.html` uses inline `height: 220px;`.
   - *Logic*: Hardcoded pixel heights do not scale proportionally when columns expand or shrink in dynamic CSS grids (`repeat(auto-fill, minmax(240px, 1fr))`). On larger screens (e.g. 1440px desktop), columns widen to 320px+, causing a 220px or 260px container to be very short and wide (landscape ratio), which forcefully crops the top (head/collar) and bottom (pants/shoes) of portrait apparel images when `object-fit: cover` is active.

3. **Failure Mode 3: Missing `object-position: center top` for Fashion Garments**:
   - *Observation*: `object-fit: cover` is used everywhere without specifying `object-position`.
   - *Logic*: Default CSS `object-position` is `50% 50%` (center center). For vertical apparel photography (suits, dresses, models, jackets), center cropping cuts off the upper neckline and face while focusing on the waist, giving a "half visible / truncated" appearance. Setting `object-position: center top;` or `center 20%;` anchors the garment from the collar downward, ensuring the full outfit is visible and centered.

4. **Failure Mode 4: Similar Product Cards `object-fit: contain` with padding (`product-details.html`)**:
   - *Observation*: `.similar-product-image` sets `object-fit: contain; padding: 10px; background: #0b0d18;`.
   - *Logic*: `contain` prevents images from filling their container when aspect ratios vary, and `padding: 10px` creates artificial black bands around the thumbnail, making cards look disjointed and empty.

---

## 3. Caveats

1. **Image Sources**:
   - Catalog images in the backend database and seed scripts (`v6_products_orders.js`, `add_mens_products.js`) come from Unsplash and user uploads with varying natural aspect ratios (predominantly 3:4 portrait, 4:5 portrait, or 1:1 square).
   - A unified aspect ratio container (such as standard `aspect-ratio: 3 / 4` or `1 / 1.15` / `4 / 5`) with `object-fit: cover` and `object-position: center top` is required to harmonize all product cards regardless of image source dimensions.
2. **Product Details Page Scope (R2)**:
   - Primary gallery and main image zoom on `product-details.html` are handled by Survey 2; however, the listing recommendations / similar product cards on `product-details.html` (lines 720–729) share listing card patterns and have been cataloged here.

---

## 4. Conclusion & Recommended Fix Strategy

### Core Fix Architecture:
1. **Sanitize `css/mobile.css`**:
   - Remove the disruptive `max-height: 200px !important;` from `#category-products-grid img, #wishlist-grid img, .product-card img, .category-product-card img`.
   - Ensure image styling on mobile inherits standard fluid 100% width and 100% height inside the aspect-ratio container:
     ```css
     #category-products-grid img,
     #wishlist-grid img,
     .product-card img,
     .category-product-card img,
     .product-card-img {
       width: 100% !important;
       height: 100% !important;
       object-fit: cover !important;
       object-position: center top !important;
       border-radius: 14px 14px 0 0 !important;
       max-height: none !important;
     }
     ```

2. **Standardize Global Product Card Image Containers (`css/style.css`)**:
   - Add/update standardized utility and card image wrapper classes:
     ```css
     .product-card-img-wrap,
     .shop-carousel-card-img-wrap,
     .wishlist-card-img-wrap {
       position: relative;
       width: 100%;
       aspect-ratio: 3 / 4; /* or 1 / 1.15 */
       overflow: hidden;
       background: #0d0e1a;
       border-radius: 16px 16px 0 0;
     }
     .product-card-img {
       width: 100%;
       height: 100%;
       object-fit: cover;
       object-position: center top;
       display: block;
       transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
     }
     ```

3. **Standardize Dynamic Card Builders across HTML Pages**:
   - In `pages/shop.html`, `pages/mens-wear.html`, `pages/womens-wear.html`, `pages/kids-wear.html`, `index.html`, and `pages/wishlist.html`:
     Ensure the image container uses `aspect-ratio: 3 / 4` (or `1 / 1.15` / `padding-top: 120%`) with `object-fit: cover; object-position: center top;` so images cleanly and fully fill the upper card area without any black gap or distortion.
   - In `pages/wishlist.html`: Replace fixed `height: 220px;` with responsive `aspect-ratio: 3 / 4;`.
   - In `pages/product-details.html`: Update `.similar-product-image` and its `img` to use `object-fit: cover; object-position: center top;` and remove `padding: 10px;`.

---

## 5. Verification Method

1. **Desktop Viewport Test (1280px–1920px)**:
   - Navigate to `index.html`, `pages/shop.html`, `pages/mens-wear.html`, `pages/womens-wear.html`, `pages/kids-wear.html`, `pages/wishlist.html`.
   - Verify product images fill the full top segment of the card with zero vertical/horizontal empty bars.
   - Verify apparel items (necklines, collars, full garments) are centered and clearly visible without awkward clipping.
2. **Mobile Viewport Test (375px–430px iPhone / Android)**:
   - Open browser DevTools device emulation at 375px width (iPhone SE / iPhone 13).
   - Confirm 2-column grid renders cleanly without truncated image heights or empty gaps between image bottom and card details.
3. **Tablet Viewport Test (768px iPad)**:
   - Confirm images scale dynamically to 240px+ column heights without hitting the 200px max-height cap.
4. **Wishlist & Recommendations Test**:
   - Verify `pages/wishlist.html` and similar products on `pages/product-details.html` display proportional cards without letterboxing.
