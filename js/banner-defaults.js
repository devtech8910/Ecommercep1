(function (root) {
  'use strict';
  const revision = 'luxury-2026-10-08';
  const defaults = [
    { id: 'default_signature', title: 'Signature Collection', description: 'Refined clothing and leather accessories for every generation.', imageUrl: '/assets/banners/signature.webp', mobileImageUrl: '/assets/banners/signature-mobile.webp', linkUrl: 'pages/shop.html', badge: 'The Signature Edit', buttonText: 'Explore Collection', buttonLink: 'pages/shop.html' },
    { id: 'default_tailored', title: 'Tailored Essentials', description: 'Oxford shirts, fine knitwear and considered finishing touches.', imageUrl: '/assets/banners/tailored.webp', mobileImageUrl: '/assets/banners/tailored-mobile.webp', linkUrl: 'pages/mens-wear.html', badge: "Men's Collection", buttonText: 'Explore Men', buttonLink: 'pages/mens-wear.html' },
    { id: 'default_womens', title: "The Women's Edit", description: 'Signature dresses, soft layers and everyday elegance.', imageUrl: '/assets/banners/womens.webp', mobileImageUrl: '/assets/banners/womens-mobile.webp', linkUrl: 'pages/womens-wear.html', badge: "Women's Collection", buttonText: 'Explore Women', buttonLink: 'pages/womens-wear.html' }
  ];
  const legacyTitles = new Set(['Festival Fashion Sale', "Men's New Arrivals", "Women's Style Edit", 'Summer Collection 2026']);
  function buildDefaults() {
    return defaults.map((banner, order) => ({ ...banner, image_url: banner.imageUrl, mobile_image_url: banner.mobileImageUrl, active: true, isActive: true, isDefault: true, order, display_order: order, campaign_revision: revision }));
  }
  function upgradeDefaults(banners) {
    const custom = banners.filter(banner => !defaults.some(item => item.id === banner.id) && !legacyTitles.has(banner.title));
    return [...buildDefaults(), ...custom];
  }
  const api = { revision, buildDefaults, upgradeDefaults };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.dtfBannerDefaults = api;
})(typeof window !== 'undefined' ? window : null);
