# Dispatch Assignment

## Role
teamwork_preview_worker (Milestone 1: Listing Cards Image Fix)

## Working Directory
`c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\worker_m1\`

## Project Root
`c:\Users\Purna\OneDrive\Desktop\Ecom`

## Authoritative Inputs
- `c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\ORIGINAL_REQUEST.md`
- `c:\Users\Purna\OneDrive\Desktop\Ecom\PROJECT.md`
- `c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\explorer_survey_1\handoff.md`

## Write Boundaries (Exclusively Owned Files)
- `css/mobile.css`
- `css/style.css`
- `pages/shop.html`
- `pages/mens-wear.html`
- `pages/womens-wear.html`
- `pages/kids-wear.html`
- `pages/wishlist.html`
- `index.html`

## Task Instructions
1. Read `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\explorer_survey_1\handoff.md`.
2. In `css/mobile.css`: Remove the disruptive `max-height: 200px !important;` (around lines 1283–1293) on `#category-products-grid img`, `#wishlist-grid img`, `.product-card img`, `.category-product-card img`. Ensure product card images have `width: 100% !important; height: 100% !important; object-fit: cover !important; object-position: center top !important; max-height: none !important; border-radius: 14px 14px 0 0 !important;`.
3. In `css/style.css`: Ensure standard product card image container and image classes (`.product-card-img-wrap`, `.product-card-img`, `.shop-carousel-card-img-wrap`, etc.) use responsive `aspect-ratio: 3 / 4;` (or `1 / 1.15`), `object-fit: cover; object-position: center top;` and have zero empty gaps.
4. In `pages/shop.html`, `pages/mens-wear.html`, `pages/womens-wear.html`, `pages/kids-wear.html`, `pages/wishlist.html`, `index.html`: Update card container templates so the image container uses clean responsive aspect-ratio (`padding-top: 120%` or `aspect-ratio: 3 / 4`) and the `img` uses `width: 100%; height: 100%; object-fit: cover; object-position: center top;`. Remove any hardcoded `height: 260px;` or `height: 220px;` that causes cropping.
5. Run build / type checks / lint checks (`npm --prefix frontend run build`, `npm --prefix frontend run lint`) to ensure no regressions.
6. Verify layout across pages.
7. Record all changes, build results, and verification in `c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\worker_m1\handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-08-24T16:16:26Z
You are Worker 1 for Milestone 1 (Listing Cards Image Fix).
Working Directory: c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\worker_m1\
Project Root: c:\Users\Purna\OneDrive\Desktop\Ecom
Authoritative Requirements: c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\ORIGINAL_REQUEST.md
Project Scope Document: c:\Users\Purna\OneDrive\Desktop\Ecom\PROJECT.md
Dispatch Instructions: c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\worker_m1\DISPATCH.md
Explorer 1 Findings: c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\explorer_survey_1\handoff.md

Your task:
1. Read ORIGINAL_REQUEST.md, PROJECT.md, and DISPATCH.md.
2. Implement the required CSS and markup updates for listing cards across your owned files:
   - `css/mobile.css`
   - `css/style.css`
   - `pages/shop.html`
   - `pages/mens-wear.html`
   - `pages/womens-wear.html`
   - `pages/kids-wear.html`
   - `pages/wishlist.html`
   - `index.html`
3. Verify builds and code syntax (`npm --prefix frontend run build`, `npm --prefix frontend run lint`).
4. Document all changes and verification in `c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\worker_m1\handoff.md`.
5. Maintain your `progress.md` with "Last visited" timestamp.
6. When complete, send a message to the orchestrator via send_message.

