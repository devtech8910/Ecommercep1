# Catalog Photographs

These are 200 original, AI-generated product photographs created for the Fashion Company catalog with the built-in image generation tool. No retailer or third-party brand photography was downloaded. The photographs contain no third-party brand marks.

Each stable product ID has an individual 800px WebP photograph and a 400px card thumbnail. Product definitions and the prompt set are in `js/catalog-seed-data.js`; the replacement shirt prompt is recorded in `assets/catalog-originals.json`. The photographs use a light grey studio background, soft lighting, full-product framing, and no models or props.

The four existing categories retain 50 generated products each. Accessory types include bags, footwear, watches, sunglasses, wallets, belts, scarves, and travel goods. The catalog uses Fashion Company branding. Ratings and review counts start at zero rather than invented customer feedback.

Production continues to use the existing `devtech-products` Netlify Blobs store. On the first read after deployment, only the known `seed_*` products are upgraded. The original catalog is backed up once in the same store. The revision marker prevents later reads from resetting admin edits. Custom admin products and deleted products are not recreated.

Deploy the static images and function changes together. The local preview reads the current production catalog and previews this migration without modifying it; product writes in the preview return a clear error until deployment.

Run `npm run test:catalog` for catalog, image, migration and CRUD checks. Run `npm run test:catalog:browser` with `CATALOG_PLAYWRIGHT_MODULE` pointing to Playwright and `CATALOG_QA_OUTPUT` set to a screenshot directory. Original generated source paths are recorded in `assets/catalog-originals.json`; `scripts/prepare-catalog-images.cjs` recompresses those sources with Sharp.
