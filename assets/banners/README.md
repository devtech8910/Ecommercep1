# Store Campaigns

Nine original AI-generated photographs were created with the built-in image generation tool, using the existing catalog photographs as references. No retailer photography or brand marks were used.

- `signature`, `tailored`, and `womens`: desktop banners.
- Their `-mobile` variants: portrait compositions for small screens.
- `editorial-womens`, `editorial-accessories`, and `editorial-kids`: the three featured collection panels.
- `accessories-wide`: a shallow homepage collection strip, adapted from the existing accessories photograph with complete merchandise and generous framing margins. Mobile reuses `editorial-accessories`. The built-in tool prompts and final source path are recorded in `accessories-wide.json`.

Optimized WebP assets are stored in this directory. Exact prompts and generated source paths are recorded in `originals.json`.

The signature and women's desktop/mobile photos received a focused studio-background edit on 8 October 2026 to remove their hard vertical wall divisions. Their filenames stay the same so existing admin banner URLs continue to work. The built-in image generation tool was used; edit prompts and source paths are recorded in `seam-fix.json`. Previous WebPs are preserved outside the published site in the backup directory listed there.

`js/banner-defaults.js` defines the three default campaigns. The existing Netlify banner store backs up its previous list and upgrades recognized defaults once for the new campaign revision. Custom administrator banners remain intact, and subsequent edits or deletions are preserved. Deploy static images and functions together; no production data was changed while preparing this update.
