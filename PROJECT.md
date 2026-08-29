# Project: E-Commerce Storefront Product Image Display & Responsiveness Fix

## Architecture
The storefront is an HTML5/CSS3/JavaScript Multi-Page Application (MPA) with a dark theme (`#0a0a14` base, `#0d0f1d` cards, `#6366f1` Indigo accents).
- Frontend Storefront: Static HTML pages (`index.html`, `pages/shop.html`, `pages/mens-wear.html`, `pages/womens-wear.html`, `pages/kids-wear.html`, `pages/wishlist.html`, `pages/product-details.html`).
- Styling Engine: Modular CSS files (`css/style.css`, `css/mobile.css`, `css/responsive.css`, `css/animations.css`, `css/filters.css`).
- Companion React Location Module: `frontend/` (React 19 + TypeScript + Vite 8).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1. Listing Cards Image Sizing & Aspect Ratio | Remove disruptive `max-height: 200px !important;` in `css/mobile.css`; standardize card image wrappers (`aspect-ratio: 3 / 4;`), `object-fit: cover`, `object-position: center top;` in `shop.html`, `mens-wear.html`, `womens-wear.html`, `kids-wear.html`, `wishlist.html`, `index.html`. | M1 | ORIGINAL_REQUEST §R1, Survey 1, Survey 3 |
| 2 | R2. Product Details Main Image Viewer & Carousel | Fix `.gallery-slide` to `flex: 0 0 100%; width: 100%; max-width: 100%; flex-shrink: 0;` so `translateX` slide steps align accurately with zero partial slide clipping; update `#image-carousel-container img` to `object-fit: cover; width: 100%; height: 100%;` without dark void bars. | M2 | ORIGINAL_REQUEST §R2, Survey 2, Survey 3 |
| 3 | R2. Product Details Thumbnails & Recommendations | Update `.thumb-btn img` to `object-fit: cover; border-radius: 4px;`; remove `padding: 10px;` and set `object-fit: cover;` on `.similar-product-image img`. Preserve `object-fit: contain;` on `#lightbox-img` for HD zoom inspection. | M2 | ORIGINAL_REQUEST §R2, Survey 2, Survey 3 |
| 4 | R3. Responsive Multi-Device Layout Verification | Fluid grid in `.product-main-layout` (`minmax(0, 1fr) minmax(0, 1.05fr)`); full verification across Mobile (375px / 390px), Tablet (768px / 820px), and Desktop (1280px / 1440px). | M3 | ORIGINAL_REQUEST §Acceptance Criteria, Survey 1, 2, 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Listing Cards Image Styling (R1) | `css/mobile.css`, `css/style.css`, `pages/shop.html`, `pages/mens-wear.html`, `pages/womens-wear.html`, `pages/kids-wear.html`, `pages/wishlist.html`, `index.html` | None | DONE |
| 2 | Product Details Gallery & Thumbnails (R2) | `pages/product-details.html` (carousel slides, main image viewer, thumbnail strip, similar products, lightbox) | None | DONE |
| 3 | E2E Responsive Verification & Polish (R3) | Comprehensive validation across Desktop (1280px), Tablet (768px), and Mobile (375px) viewports; frontend build & lint verification. | M1, M2 | DONE |

## Interface Contracts
### Product Card Image Wrapper Standard
- Container: `position: relative; width: 100%; aspect-ratio: 3 / 4; overflow: hidden; background: #0d0e1a; border-radius: 14px 14px 0 0;`
- Image: `width: 100%; height: 100%; object-fit: cover; object-position: center top; display: block;`

### Product Details Carousel & Gallery Standard
- Slide Container (`#image-carousel-container`): `position: absolute; inset: 0; display: flex; width: 100%; height: 100%; transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);`
- Slide Element (`.gallery-slide`): `flex: 0 0 100%; width: 100%; max-width: 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;`
- Slide Image: `width: 100%; height: 100%; object-fit: cover; object-position: center center; display: block;`
- Thumbnail Button Image (`.thumb-btn img`): `width: 100%; height: 100%; object-fit: cover; border-radius: 4px; display: block;`
- Lightbox HD Zoom Image (`#lightbox-img`): `max-width: 90vw; max-height: 85vh; object-fit: contain;`

## Code Layout
- `pages/product-details.html`: Primary product view, gallery carousel, thumbnail strip, lightbox, recommendations.
- `pages/shop.html`, `pages/mens-wear.html`, `pages/womens-wear.html`, `pages/kids-wear.html`, `pages/wishlist.html`: Category & listing pages.
- `index.html`: Home page featured products.
- `css/style.css`: Global base styles, card components, default layouts.
- `css/mobile.css`: Mobile and responsive overrides (<768px).
- `css/responsive.css`: Breakpoint definitions (1280px, 1024px, 768px, 600px, 400px, 320px).
- `frontend/`: React 19 / TypeScript companion app.
