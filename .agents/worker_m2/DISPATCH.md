# Dispatch Assignment

## Role
teamwork_preview_worker (Milestone 2: Product Details Page Gallery & Thumbnails Fix)

## Working Directory
`c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\worker_m2\`

## Project Root
`c:\Users\Purna\OneDrive\Desktop\Ecom`

## Authoritative Inputs
- `c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\ORIGINAL_REQUEST.md`
- `c:\Users\Purna\OneDrive\Desktop\Ecom\PROJECT.md`
- `c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\explorer_survey_2\handoff.md`

## Write Boundaries (Exclusively Owned Files)
- `pages/product-details.html`

## Task Instructions
1. Read `ORIGINAL_REQUEST.md`, `PROJECT.md`, and `c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\explorer_survey_2\handoff.md`.
2. In `pages/product-details.html`:
   - Fix grid layout: Update `.product-main-layout` from `minmax(420px, ...)` to `minmax(0, 1fr) minmax(0, 1.05fr)` to prevent mid-viewport horizontal container overflow.
   - Fix Carousel & Slides:
     - Update `.image-viewer` to have clean `aspect-ratio: 4 / 5`, overflow hidden, background `#0d0f1d`.
     - Update `.gallery-slide` to `flex: 0 0 100%; width: 100%; max-width: 100%; height: 100%; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;` so carousel `translateX` steps align exactly with 100% of each slide without partial slide cropping.
     - Update `#image-carousel-container img` to `width: 100%; height: 100%; object-fit: cover; object-position: center center; display: block;` to eliminate large black empty void gaps.
   - Fix Thumbnail strip:
     - Update `.thumb-btn` and `.thumb-btn img` to `object-fit: cover; width: 100%; height: 100%; border-radius: 4px; display: block;` to eliminate letterboxed void spaces inside thumbnail buttons.
   - Fix Similar Products Section:
     - Update `.similar-product-image` to `padding: 0; overflow: hidden;` and `.similar-product-image img` to `width: 100%; height: 100%; object-fit: cover;` so cards fill completely with no black border gaps.
   - Preserve HD Lightbox Modal:
     - Ensure `#lightbox-img` preserves `object-fit: contain;` so uncropped full-resolution zoom inspection remains pristine.
   - Verify Mobile responsive styles for `.flipkart-gallery-shell`, `.thumb-btn`, and `.image-viewer`.
3. Run build / type checks / lint checks (`npm --prefix frontend run build`, `npm --prefix frontend run lint`) to ensure no regressions.
4. Record all changes, build results, and verification in `c:\Users\Purna\OneDrive\Desktop\Ecom\.agents\worker_m2\handoff.md`.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
