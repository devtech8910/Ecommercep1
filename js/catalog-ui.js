(function () {
  'use strict';
  window.dtfProductsUrl = function () {
    const local = ['localhost', '127.0.0.1'].includes(location.hostname);
    return local && !window.__dtfCatalogPreview
      ? 'https://fashion-company.netlify.app/.netlify/functions/products'
      : '/.netlify/functions/products';
  };
  window.dtfOrdersUrl = function (query = '') {
    const local = ['localhost', '127.0.0.1'].includes(location.hostname);
    const base = local && !window.__dtfCatalogPreview
      ? 'https://fashion-company.netlify.app/.netlify/functions/orders'
      : '/.netlify/functions/orders';
    return base + query;
  };
  window.dtfProductSizes = function (product) {
    const value = product.sizes || [];
    return (Array.isArray(value) ? value : String(value).split(',')).map(size => String(size).trim()).filter(Boolean);
  };
  window.dtfProductStock = function (product) {
    const value = product.size_stock ?? product.sizeStock;
    if (value && typeof value === 'object') return value;
    return Object.fromEntries(String(value || '').split(',').filter(Boolean).map(entry => {
      const separator = entry.lastIndexOf(':');
      return [entry.slice(0, separator).trim(), Math.max(0, Number(entry.slice(separator + 1)) || 0)];
    }));
  };
  window.dtfAddCatalogToCart = function (product) {
    const stock = window.dtfProductStock(product);
    const size = window.dtfProductSizes(product).find(value => stock[value] === undefined || Number(stock[value]) > 0);
    if (!size) {
      location.href = 'product-details.html?id=' + encodeURIComponent(product.id || product.pid);
      return false;
    }
    const key = window.getUserStorageKey('dtf_cart');
    const cart = JSON.parse(localStorage.getItem(key) || '[]');
    const id = product.id || product.pid;
    const color = Array.isArray(product.colors) ? product.colors[0] || '' : '';
    const existing = cart.find(item => String(item.id || item.pid) === String(id) && item.size === size && (item.color || '') === color);
    if (existing) existing.quantity = (Number(existing.quantity) || 1) + 1;
    else cart.push({ id, pid: product.pid || id, title: product.title, brand: product.brand, price: product.price, image: product.image || product.image_url || product.imageUrl, size, color, quantity: 1 });
    localStorage.setItem(key, JSON.stringify(cart));
    window.dispatchEvent(new Event('dtf:cart:updated'));
    return true;
  };
  window.dtfCatalogSubtitle = product => [product.productType || '', product.fit || ''].filter(Boolean).join(' / ');
  window.dtfPopulateProductFilters = function (products) {
    for (const [selector, values] of [
      ['fabric-cb', products.map(product => product.fabric)],
      ['fit-cb', products.map(product => product.fit)],
      ['size-cb', products.flatMap(window.dtfProductSizes)]
    ]) {
      const first = document.querySelector('.' + selector);
      const container = first && first.closest('.filter-checkbox-list');
      if (!container) continue;
      const selected = new Set(Array.from(container.querySelectorAll('input:checked'), input => input.value));
      container.replaceChildren();
      Array.from(new Set(values.filter(Boolean))).sort().forEach(value => {
        const label = document.createElement('label'); label.className = 'filter-checkbox-item';
        const input = document.createElement('input'); input.type = 'checkbox'; input.className = selector;
        input.value = value; input.checked = selected.has(value);
        label.append(input, document.createTextNode(' ' + value)); container.appendChild(label);
      });
    }
  };
  window.dtfCatalogRating = product => Number(product.reviewCount || product.review_count) > 0 && Number(product.rating) > 0
    ? `${Number(product.rating).toFixed(1)} / 5 (${Number(product.reviewCount || product.review_count)})`
    : 'No reviews yet';
  const colors = { navy: '#1f3052', white: '#fff', ivory: '#f1eee5', sage: '#91a68b', burgundy: '#783446', olive: '#69734a', rust: '#b56b4f', blue: '#658bb5', charcoal: '#45474a', cream: '#f1e9d7', grey: '#93989c', khaki: '#b4a47d', stone: '#c5c0b5', indigo: '#354a72', black: '#17191c', ecru: '#e7e0d0', tan: '#b18b60', sand: '#cebd9b', brown: '#79533b', rose: '#d29f9f', yellow: '#e2c45c', silver: '#c1c5ca', gold: '#c5a15b', maroon: '#713042', 'sky blue': '#98bbcf', 'light blue': '#a3c6dc', 'forest green': '#315d4a', 'rose gold': '#c99988', tortoiseshell: '#775234' };
  window.dtfRenderProductColors = function (values, element) {
    if (!element) return;
    element.replaceChildren();
    const choices = Array.isArray(values) ? values : String(values || '').split(',').filter(Boolean);
    element.hidden = !choices.length;
    choices.forEach((color, index) => {
      const name = String(color).trim();
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'catalog-color-swatch';
      button.style.backgroundColor = colors[name.toLowerCase()] || '#a0a4ab';
      button.title = name; button.setAttribute('aria-label', name);
      button.setAttribute('aria-pressed', String(index === 0));
      button.addEventListener('click', () => {
        element.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', 'false'));
        button.setAttribute('aria-pressed', 'true'); element.dataset.selectedColor = name;
      });
      element.appendChild(button);
      if (index === 0) element.dataset.selectedColor = name;
    });
  };
})();
