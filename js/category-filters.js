/* ============================================================
   CATEGORY FILTERS — Left Slide-In Panel Engine
   Single "Filter" button + left panel with accordion sections.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- State ---------- */
  let allProducts = [];
  let allCardElements = [];
  let filterState = {
    brands: [],
    fabrics: [],
    patterns: [],
    fits: [],
    priceMin: 0,
    priceMax: Infinity,
    sort: 'relevance'
  };
  let priceAbsMin = 0;
  let priceAbsMax = 50000;

  /* ---------- Bootstrap ---------- */
  window.initCategoryFilters = function (products, grid) {
    if (!products || products.length === 0 || !grid) return;

    allProducts = products;
    allCardElements = Array.from(grid.querySelectorAll('a'));

    allCardElements.forEach((el, i) => {
      if (products[i]) el._product = products[i];
    });

    const prices = products.map(p => parseFloat(p.price)).filter(n => !isNaN(n));
    if (prices.length > 0) {
      priceAbsMin = Math.floor(Math.min(...prices));
      priceAbsMax = Math.ceil(Math.max(...prices));
    }
    filterState.priceMin = priceAbsMin;
    filterState.priceMax = priceAbsMax;

    // Delegated click listener for "Buy Now" buttons
    if (!grid._buyNowHandlerAttached) {
      grid._buyNowHandlerAttached = true;
      grid.addEventListener('click', (e) => {
        const buyBtn = e.target.closest('.buy-now-btn');
        if (buyBtn) {
          e.preventDefault();
          e.stopPropagation();

          const title = buyBtn.getAttribute('data-title');
          const price = buyBtn.getAttribute('data-price');
          const image = buyBtn.getAttribute('data-image');

          const cart = JSON.parse(localStorage.getItem('dtf_cart')) || [];
          const existing = cart.findIndex(c => c.title === title);

          if (existing > -1) {
            cart[existing].quantity = (cart[existing].quantity || 1) + 1;
          } else {
            cart.push({
              title: title,
              price: price,
              image: image,
              quantity: 1
            });
          }

          localStorage.setItem('dtf_cart', JSON.stringify(cart));
          window.dispatchEvent(new Event('dtf:cart:updated'));
          window.location.href = 'cart.html';
        }
      });
    }

    buildFilterBar(grid);
    buildFilterPanel(grid);
    renderResultsCount(grid);
  };

  /* ==========================================================
     FILTER BAR (below hero)
     ========================================================== */
  function buildFilterBar(grid) {
    const hero = document.querySelector('.category-hero');
    const section = grid.closest('section') || grid.parentElement;

    // Remove existing
    const existing = document.querySelector('.filter-section-wrapper');
    if (existing) existing.remove();

    const bar = document.createElement('div');
    bar.className = 'filter-bar';

    // Filter toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'filter-toggle-btn';
    toggleBtn.id = 'filter-toggle-btn';
    toggleBtn.innerHTML = `
      <svg class="filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
        <circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="10" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="14" cy="18" r="2" fill="currentColor" stroke="none"/>
      </svg>
      Filters
      <span class="filter-toggle-badge"></span>
    `;
    toggleBtn.addEventListener('click', () => openPanel());
    bar.appendChild(toggleBtn);

    // Sort dropdown
    const sortSelect = document.createElement('select');
    sortSelect.className = 'filter-sort-select';
    sortSelect.innerHTML = `
      <option value="relevance">Sort: Relevance</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="name_asc">Name: A to Z</option>
      <option value="name_desc">Name: Z to A</option>
    `;
    sortSelect.addEventListener('change', () => {
      filterState.sort = sortSelect.value;
      applyFilters(grid);
    });
    bar.appendChild(sortSelect);

    // Results count
    const resultsCount = document.createElement('div');
    resultsCount.className = 'filter-results-count';
    bar.appendChild(resultsCount);

    // Active pills container
    const pills = document.createElement('div');
    pills.className = 'filter-active-pills';

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'filter-section-wrapper';
    const innerContainer = document.createElement('div');
    innerContainer.className = 'container';
    innerContainer.appendChild(bar);
    innerContainer.appendChild(pills);
    wrapper.appendChild(innerContainer);

    if (hero && hero.parentElement) {
      hero.parentElement.insertBefore(wrapper, hero.nextSibling);
    } else {
      section.parentElement.insertBefore(wrapper, section);
    }
  }

  /* ==========================================================
     LEFT SLIDE-IN PANEL
     ========================================================== */
  function buildFilterPanel(grid) {
    // Remove existing
    document.querySelectorAll('.filter-panel-overlay, .filter-panel').forEach(el => el.remove());

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'filter-panel-overlay';
    overlay.addEventListener('click', closePanel);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'filter-panel';
    panel.id = 'filter-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'filter-panel-header';
    header.innerHTML = `
      <div class="filter-panel-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
          <circle cx="6" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="10" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="14" cy="18" r="2" fill="currentColor" stroke="none"/>
        </svg>
        Filters
      </div>
    `;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'filter-panel-close';
    closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    closeBtn.addEventListener('click', closePanel);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'filter-panel-body';

    // Price section
    body.appendChild(createPriceSection(grid));

    // Checkbox sections
    const groups = [
      { label: 'Brand', key: 'brands', field: 'brand' },
      { label: 'Fabric', key: 'fabrics', field: 'fabric' },
      { label: 'Pattern', key: 'patterns', field: 'pattern' },
      { label: 'Fit', key: 'fits', field: 'fit' }
    ];

    groups.forEach(({ label, key, field }) => {
      const options = getUnique(field);
      if (options.length === 0) return;
      body.appendChild(createCheckboxSection(label, key, field, options, grid));
    });

    panel.appendChild(body);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'filter-panel-footer';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-panel-clear-btn';
    clearBtn.textContent = 'Clear All';
    clearBtn.addEventListener('click', () => {
      resetFilters();
      syncPanelFromState();
      applyFilters(grid);
      updateUI();
    });

    const applyBtn = document.createElement('button');
    applyBtn.className = 'filter-panel-apply-btn';
    applyBtn.textContent = 'Apply Filters';
    applyBtn.addEventListener('click', () => {
      applyFilters(grid);
      updateUI();
      closePanel();
    });

    footer.appendChild(clearBtn);
    footer.appendChild(applyBtn);
    panel.appendChild(footer);

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
  }

  /* ---------- Open / Close Panel ---------- */
  function openPanel() {
    const overlay = document.querySelector('.filter-panel-overlay');
    const panel = document.getElementById('filter-panel');
    if (overlay) overlay.classList.add('open');
    if (panel) panel.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    const overlay = document.querySelector('.filter-panel-overlay');
    const panel = document.getElementById('filter-panel');
    if (overlay) overlay.classList.remove('open');
    if (panel) panel.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ---------- Create Price Section ---------- */
  function createPriceSection(grid) {
    const section = document.createElement('div');
    section.className = 'filter-panel-section expanded';
    section.setAttribute('data-section', 'price');

    const header = document.createElement('div');
    header.className = 'filter-section-header';
    header.innerHTML = `
      <div style="display:flex;align-items:center;">
        <span class="filter-section-label">Price Range</span>
        <span class="filter-section-badge" data-badge="price"></span>
      </div>
      <svg class="filter-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    `;
    header.addEventListener('click', () => section.classList.toggle('expanded'));

    const content = document.createElement('div');
    content.className = 'filter-section-content';

    const priceRange = document.createElement('div');
    priceRange.className = 'filter-price-range';

    const display = document.createElement('div');
    display.className = 'filter-price-display';
    display.innerHTML = `
      <span class="filter-price-val" id="panel-price-min-val">${formatPrice(priceAbsMin)}</span>
      <span class="filter-price-separator">to</span>
      <span class="filter-price-val" id="panel-price-max-val">${formatPrice(priceAbsMax)}</span>
    `;
    priceRange.appendChild(display);

    const track = document.createElement('div');
    track.className = 'filter-range-track';
    track.innerHTML = `<div class="filter-range-fill" id="panel-price-fill"></div>`;
    priceRange.appendChild(track);

    const step = Math.max(1, Math.floor((priceAbsMax - priceAbsMin) / 100));
    const rangeDiv = document.createElement('div');
    rangeDiv.className = 'filter-range-inputs';
    rangeDiv.innerHTML = `
      <input type="range" id="panel-price-min" min="${priceAbsMin}" max="${priceAbsMax}" value="${priceAbsMin}" step="${step}" />
      <input type="range" id="panel-price-max" min="${priceAbsMin}" max="${priceAbsMax}" value="${priceAbsMax}" step="${step}" />
    `;
    priceRange.appendChild(rangeDiv);
    content.appendChild(priceRange);

    section.appendChild(header);
    section.appendChild(content);

    // Wire up range events after DOM insert (use setTimeout)
    setTimeout(() => {
      const rMin = document.getElementById('panel-price-min');
      const rMax = document.getElementById('panel-price-max');
      if (!rMin || !rMax) return;

      function updateSlider() {
        let min = parseInt(rMin.value);
        let max = parseInt(rMax.value);
        if (min > max) [min, max] = [max, min];
        filterState.priceMin = min;
        filterState.priceMax = max;
        const minValEl = document.getElementById('panel-price-min-val');
        const maxValEl = document.getElementById('panel-price-max-val');
        const fill = document.getElementById('panel-price-fill');
        if (minValEl) minValEl.textContent = formatPrice(min);
        if (maxValEl) maxValEl.textContent = formatPrice(max);
        if (fill) {
          const pctMin = ((min - priceAbsMin) / (priceAbsMax - priceAbsMin)) * 100;
          const pctMax = ((max - priceAbsMin) / (priceAbsMax - priceAbsMin)) * 100;
          fill.style.left = pctMin + '%';
          fill.style.right = (100 - pctMax) + '%';
        }
      }

      rMin.addEventListener('input', updateSlider);
      rMax.addEventListener('input', updateSlider);
    }, 50);

    return section;
  }

  /* ---------- Create Checkbox Section ---------- */
  function createCheckboxSection(label, stateKey, field, options, grid) {
    const section = document.createElement('div');
    section.className = 'filter-panel-section';
    section.setAttribute('data-section', stateKey);

    const header = document.createElement('div');
    header.className = 'filter-section-header';
    header.innerHTML = `
      <div style="display:flex;align-items:center;">
        <span class="filter-section-label">${label}</span>
        <span class="filter-section-badge" data-badge="${stateKey}"></span>
      </div>
      <svg class="filter-section-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    `;
    header.addEventListener('click', () => section.classList.toggle('expanded'));

    const content = document.createElement('div');
    content.className = 'filter-section-content';

    const list = document.createElement('div');
    list.className = 'filter-checkbox-list';
    list.setAttribute('data-panel-filter', stateKey);

    // Count products per option
    const counts = {};
    allProducts.forEach(p => {
      const val = (p[field] || '').trim();
      if (val) counts[val] = (counts[val] || 0) + 1;
    });

    options.forEach(opt => {
      const item = document.createElement('label');
      item.className = 'filter-checkbox-item';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = opt;
      cb.addEventListener('change', () => {
        if (cb.checked) {
          if (!filterState[stateKey].includes(opt)) filterState[stateKey].push(opt);
        } else {
          filterState[stateKey] = filterState[stateKey].filter(v => v !== opt);
        }
        // Live update section badge
        updateSectionBadges();
      });

      const box = document.createElement('span');
      box.className = 'filter-check-box';
      box.innerHTML = `<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`;

      const lbl = document.createElement('span');
      lbl.className = 'filter-checkbox-label';
      lbl.textContent = opt;

      const cnt = document.createElement('span');
      cnt.className = 'filter-checkbox-count';
      cnt.textContent = counts[opt] || 0;

      item.appendChild(cb);
      item.appendChild(box);
      item.appendChild(lbl);
      item.appendChild(cnt);
      list.appendChild(item);
    });

    content.appendChild(list);
    section.appendChild(header);
    section.appendChild(content);
    return section;
  }

  /* ==========================================================
     APPLY FILTERS
     ========================================================== */
  function applyFilters(grid) {
    let visible = [];
    let hidden = [];

    allCardElements.forEach(card => {
      const p = card._product;
      if (!p) { card.style.display = 'none'; return; }

      const price = parseFloat(p.price);
      const brand = (p.brand || '').trim();
      const fabric = (p.fabric || '').trim();
      const pattern = (p.pattern || '').trim();
      const fit = (p.fit || '').trim();

      let pass = true;
      if (!isNaN(price) && (price < filterState.priceMin || price > filterState.priceMax)) pass = false;
      if (filterState.brands.length > 0 && !filterState.brands.includes(brand)) pass = false;
      if (filterState.fabrics.length > 0 && !filterState.fabrics.includes(fabric)) pass = false;
      if (filterState.patterns.length > 0 && !filterState.patterns.includes(pattern)) pass = false;
      if (filterState.fits.length > 0 && !filterState.fits.includes(fit)) pass = false;

      if (pass) visible.push(card);
      else hidden.push(card);
    });

    visible = sortCards(visible, filterState.sort);

    hidden.forEach(card => { card.style.display = 'none'; });
    visible.forEach(card => {
      card.style.display = 'block';
      grid.appendChild(card);
    });

    // No results message
    let noRes = grid.querySelector('.filter-no-results');
    if (visible.length === 0) {
      if (!noRes) {
        noRes = document.createElement('div');
        noRes.className = 'filter-no-results';
        noRes.innerHTML = `
          <div style="font-size:48px;margin-bottom:16px;">🔍</div>
          <h3>No products match your filters</h3>
          <p>Try adjusting your filters or clearing them to see all products.</p>
        `;
        grid.appendChild(noRes);
      }
    } else if (noRes) {
      noRes.remove();
    }

    renderResultsCount(grid, visible.length);
    renderActivePills(grid);
  }

  function sortCards(cards, sortType) {
    switch (sortType) {
      case 'price_asc': return cards.sort((a, b) => parseFloat(a._product.price) - parseFloat(b._product.price));
      case 'price_desc': return cards.sort((a, b) => parseFloat(b._product.price) - parseFloat(a._product.price));
      case 'name_asc': return cards.sort((a, b) => a._product.title.localeCompare(b._product.title));
      case 'name_desc': return cards.sort((a, b) => b._product.title.localeCompare(a._product.title));
      default: return cards;
    }
  }

  /* ==========================================================
     UI UPDATES
     ========================================================== */
  function updateUI() {
    const btn = document.getElementById('filter-toggle-btn');
    if (!btn) return;

    const total = getTotalActiveFilters();
    const badge = btn.querySelector('.filter-toggle-badge');

    if (total > 0) {
      badge.textContent = total;
      badge.classList.add('visible');
      btn.classList.add('has-filters');
    } else {
      badge.classList.remove('visible');
      btn.classList.remove('has-filters');
    }

    updateSectionBadges();
  }

  function updateSectionBadges() {
    const keys = ['brands', 'fabrics', 'patterns', 'fits'];
    keys.forEach(key => {
      const badge = document.querySelector(`[data-badge="${key}"]`);
      if (!badge) return;
      const count = filterState[key].length;
      if (count > 0) {
        badge.textContent = count;
        badge.classList.add('visible');
      } else {
        badge.classList.remove('visible');
      }
    });

    // Price badge
    const priceBadge = document.querySelector('[data-badge="price"]');
    if (priceBadge) {
      if (filterState.priceMin > priceAbsMin || filterState.priceMax < priceAbsMax) {
        priceBadge.textContent = '1';
        priceBadge.classList.add('visible');
      } else {
        priceBadge.classList.remove('visible');
      }
    }
  }

  function syncPanelFromState() {
    // Price
    const rMin = document.getElementById('panel-price-min');
    const rMax = document.getElementById('panel-price-max');
    if (rMin) rMin.value = filterState.priceMin;
    if (rMax) rMax.value = filterState.priceMax;
    const minVal = document.getElementById('panel-price-min-val');
    const maxVal = document.getElementById('panel-price-max-val');
    if (minVal) minVal.textContent = formatPrice(filterState.priceMin);
    if (maxVal) maxVal.textContent = formatPrice(filterState.priceMax);
    const fill = document.getElementById('panel-price-fill');
    if (fill) {
      const pctMin = ((filterState.priceMin - priceAbsMin) / (priceAbsMax - priceAbsMin)) * 100;
      const pctMax = ((filterState.priceMax - priceAbsMin) / (priceAbsMax - priceAbsMin)) * 100;
      fill.style.left = pctMin + '%';
      fill.style.right = (100 - pctMax) + '%';
    }

    // Checkboxes
    ['brands', 'fabrics', 'patterns', 'fits'].forEach(key => {
      const list = document.querySelector(`[data-panel-filter="${key}"]`);
      if (!list) return;
      list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = filterState[key].includes(cb.value);
      });
    });

    updateSectionBadges();
  }

  function renderResultsCount(grid, count) {
    const wrapper = document.querySelector('.filter-section-wrapper');
    const el = wrapper ? wrapper.querySelector('.filter-results-count') : null;
    if (!el) return;

    if (count === undefined) {
      count = allCardElements.filter(c => c.style.display !== 'none').length;
    }

    const total = allProducts.length;
    if (getTotalActiveFilters() > 0) {
      el.innerHTML = `Showing <span>${count}</span> of ${total} products`;
    } else {
      el.innerHTML = `Showing all <span>${total}</span> products`;
    }
  }

  function renderActivePills(grid) {
    const wrapper = document.querySelector('.filter-section-wrapper');
    const container = wrapper ? wrapper.querySelector('.filter-active-pills') : null;
    if (!container) return;
    container.innerHTML = '';

    const makeRemover = (key, val) => () => {
      filterState[key] = filterState[key].filter(v => v !== val);
      syncPanelFromState();
      applyFilters(grid);
      updateUI();
    };

    filterState.brands.forEach(b => container.appendChild(createPill(`Brand: ${b}`, makeRemover('brands', b))));
    filterState.fabrics.forEach(b => container.appendChild(createPill(`Fabric: ${b}`, makeRemover('fabrics', b))));
    filterState.patterns.forEach(b => container.appendChild(createPill(`Pattern: ${b}`, makeRemover('patterns', b))));
    filterState.fits.forEach(b => container.appendChild(createPill(`Fit: ${b}`, makeRemover('fits', b))));

    if (filterState.priceMin > priceAbsMin || filterState.priceMax < priceAbsMax) {
      container.appendChild(createPill(`${formatPrice(filterState.priceMin)} – ${formatPrice(filterState.priceMax)}`, () => {
        filterState.priceMin = priceAbsMin;
        filterState.priceMax = priceAbsMax;
        syncPanelFromState();
        applyFilters(grid);
        updateUI();
      }));
    }
  }

  function createPill(text, onRemove) {
    const pill = document.createElement('span');
    pill.className = 'filter-pill';
    const label = document.createElement('span');
    label.textContent = text;
    const removeBtn = document.createElement('span');
    removeBtn.className = 'filter-pill-remove';
    removeBtn.innerHTML = `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    removeBtn.addEventListener('click', onRemove);
    pill.appendChild(label);
    pill.appendChild(removeBtn);
    return pill;
  }

  /* ==========================================================
     HELPERS
     ========================================================== */
  function getUnique(field) {
    const vals = new Set();
    allProducts.forEach(p => {
      const v = (p[field] || '').trim();
      if (v) vals.add(v);
    });
    return Array.from(vals).sort();
  }

  function formatPrice(n) {
    return '\u20B9' + parseInt(n).toLocaleString('en-IN');
  }

  function resetFilters() {
    filterState.brands = [];
    filterState.fabrics = [];
    filterState.patterns = [];
    filterState.fits = [];
    filterState.priceMin = priceAbsMin;
    filterState.priceMax = priceAbsMax;
  }

  function getTotalActiveFilters() {
    let count = filterState.brands.length + filterState.fabrics.length + filterState.patterns.length + filterState.fits.length;
    if (filterState.priceMin > priceAbsMin || filterState.priceMax < priceAbsMax) count++;
    return count;
  }

})();
