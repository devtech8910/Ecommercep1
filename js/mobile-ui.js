/* ============================================================
   DEVTECH FASHION - MOBILE PRESENTATION HELPER
   Adds viewport presentation hooks and a shared bottom nav.
   No API, auth, cart, checkout, or product logic is duplicated.
   ============================================================ */

'use strict';

(function initMobilePresentationLayer() {
  const MOBILE_QUERY = '(max-width: 768px)';
  const mediaQuery = window.matchMedia(MOBILE_QUERY);

  const navItems = [
    {
      key: 'home',
      label: 'Home',
      path: '../index.html',
      homePath: 'index.html',
      match: (path) => /\/(?:index\.html)?$/.test(path) || path.endsWith('/Ecom/'),
      icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'
    },
    {
      key: 'shop',
      label: 'Shop',
      path: 'shop.html',
      homePath: 'pages/shop.html',
      match: (path) => /\/(shop|product-details)\.html$/.test(path),
      icon: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>'
    },
    {
      key: 'categories',
      label: 'Categories',
      path: '#',
      homePath: '#',
      isModal: true,
      match: (path) => /\/(mens-wear|womens-wear|kids-wear)\.html$/.test(path),
      icon: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>'
    },
    {
      key: 'orders',
      label: 'My Orders',
      path: 'orders.html',
      homePath: 'pages/orders.html',
      match: (path) => /\/orders\.html$/.test(path),
      icon: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'
    },
    {
      key: 'account',
      label: 'Account',
      path: 'profile.html',
      homePath: 'pages/profile.html',
      match: (path) => /\/(profile|settings|login|signup|admin)\.html$/.test(path),
      icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
    }
  ];

  function isInsidePagesDirectory() {
    return /\/pages\//.test(window.location.pathname.replace(/\\/g, '/'));
  }

  function getHref(item) {
    if (item.isModal) return '#';
    return isInsidePagesDirectory() ? item.path : item.homePath;
  }

  function setViewportHooks() {
    const width = window.innerWidth || document.documentElement.clientWidth;
    const root = document.documentElement;

    root.style.setProperty('--app-vh', `${window.innerHeight * 0.01}px`);
    root.dataset.viewportClass = width <= 480 ? 'mobile' : width <= 768 ? 'tablet' : 'desktop';
    root.dataset.mobileUi = mediaQuery.matches ? 'true' : 'false';
  }

  function syncBodyMenuState() {
    const menu = document.getElementById('mobile-menu');
    document.body.classList.toggle('mobile-menu-open', Boolean(menu && menu.classList.contains('open')));
  }

  function ensureCategoryModal() {
    // Do NOT render mobile category modal on Login or Signup pages
    if (document.body.classList.contains('auth-page') || window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
      const existingModal = document.getElementById('mobile-categories-modal');
      if (existingModal) existingModal.remove();
      return;
    }

    if (document.getElementById('mobile-categories-modal')) return;

    const inPages = isInsidePagesDirectory();
    const mensUrl = inPages ? 'mens-wear.html' : 'pages/mens-wear.html';
    const womensUrl = inPages ? 'womens-wear.html' : 'pages/womens-wear.html';
    const kidsUrl = inPages ? 'kids-wear.html' : 'pages/kids-wear.html';
    const accUrl = inPages ? 'shop.html?category=Accessories' : 'pages/shop.html?category=Accessories';

    const modal = document.createElement('div');
    modal.id = 'mobile-categories-modal';
    modal.className = 'mobile-categories-modal';
    modal.innerHTML = `
      <div class="mobile-categories-backdrop" id="close-cat-backdrop"></div>
      <div class="mobile-categories-sheet">
        <div class="mobile-sheet-handle"></div>
        <div class="mobile-sheet-header">
          <h3>📂 Select Category</h3>
          <button type="button" class="mobile-sheet-close" id="close-cat-sheet">&times;</button>
        </div>
        <div class="mobile-categories-grid">
          <a href="${mensUrl}" class="category-choice-card">
            <span class="choice-icon">♂️</span>
            <div class="choice-info">
              <strong>Men's Wear</strong>
              <span>Suits, Shirts, Jackets & Tailored Pants</span>
            </div>
            <span class="choice-arrow">→</span>
          </a>
          <a href="${womensUrl}" class="category-choice-card">
            <span class="choice-icon">♀️</span>
            <div class="choice-info">
              <strong>Women's Wear</strong>
              <span>Dresses, Tops, Gowns & Luxury Sets</span>
            </div>
            <span class="choice-arrow">→</span>
          </a>
          <a href="${kidsUrl}" class="category-choice-card">
            <span class="choice-icon">★</span>
            <div class="choice-info">
              <strong>Kids Wear</strong>
              <span>Playful & Premium Outfits for Juniors</span>
            </div>
            <span class="choice-arrow">→</span>
          </a>
          <a href="${accUrl}" class="category-choice-card">
            <span class="choice-icon">💎</span>
            <div class="choice-info">
              <strong>Accessories</strong>
              <span>Watches, Sunglasses, Bags & Fine Jewelry</span>
            </div>
            <span class="choice-arrow">→</span>
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeModal = () => modal.classList.remove('active');
    document.getElementById('close-cat-backdrop')?.addEventListener('click', closeModal);
    document.getElementById('close-cat-sheet')?.addEventListener('click', closeModal);
  }

  function openCategoryModal() {
    ensureCategoryModal();
    const modal = document.getElementById('mobile-categories-modal');
    if (modal) modal.classList.add('active');
  }

  function getCurrentNavKey() {
    const fullUrl = (window.location.href + ' ' + window.location.pathname).toLowerCase().replace(/\\/g, '/');
    const search = window.location.search.toLowerCase();

    // Check Categories first if category parameter or category page
    if (fullUrl.includes('mens-wear') || fullUrl.includes('womens-wear') || fullUrl.includes('kids-wear') || search.includes('category=')) {
      return 'categories';
    }

    // Check Shop & Product Details
    if (fullUrl.includes('shop') || fullUrl.includes('product-details') || fullUrl.includes('product_details')) {
      return 'shop';
    }

    // Check Orders
    if (fullUrl.includes('orders') || fullUrl.includes('order')) {
      return 'orders';
    }

    // Check Account / Profile / Settings / Login / Signup / Admin / Wishlist / Cart
    if (fullUrl.includes('profile') || fullUrl.includes('settings') || fullUrl.includes('login') || fullUrl.includes('signup') || fullUrl.includes('admin') || fullUrl.includes('wishlist') || fullUrl.includes('account')) {
      return 'account';
    }

    // Default: Home page (index.html or root /)
    return 'home';
  }

  function ensureBottomNav() {
    let nav = document.getElementById('mobile-bottom-nav');

    // Do NOT render or display mobile bottom nav on Login or Signup auth pages
    if (document.body.classList.contains('auth-page') || window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
      if (nav) nav.style.setProperty('display', 'none', 'important');
      return;
    }

    const activeKey = getCurrentNavKey();

    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'mobile-bottom-nav';
      nav.className = 'mobile-bottom-nav';
      nav.setAttribute('aria-label', 'Mobile Bottom Navigation');
      document.body.appendChild(nav);
    }

    nav.innerHTML = navItems.map((item) => {
      const active = (item.key === activeKey) ? ' active' : '';
      return `
        <a href="${getHref(item)}" class="mobile-bottom-nav-item${active}" data-mobile-nav="${item.key}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">${item.icon}</svg>
          <span>${item.label}</span>
        </a>
      `;
    }).join('');

    // Explicitly sync active class state across all nav buttons
    nav.querySelectorAll('.mobile-bottom-nav-item').forEach((itemBtn) => {
      const key = itemBtn.getAttribute('data-mobile-nav');
      if (key === activeKey) {
        itemBtn.classList.add('active');
      } else {
        itemBtn.classList.remove('active');
      }

      itemBtn.addEventListener('click', (e) => {
        // Shift active class to clicked button immediately upon click
        nav.querySelectorAll('.mobile-bottom-nav-item').forEach((b) => b.classList.remove('active'));
        itemBtn.classList.add('active');

        if (key === 'categories') {
          e.preventDefault();
          openCategoryModal();
        }
      });
    });
  }

  function enhanceTouchCarousels() {
    document.querySelectorAll('.shop-carousel-row').forEach((row) => {
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-label', row.getAttribute('aria-label') || 'Swipe products');
    });
  }

  function initMobileScrollControls() {
    let lastScrollY = window.scrollY;
    let ticking = false;
    const SCROLL_THRESHOLD = 4;
    const MIN_SCROLL_TOP = 60;

    function isHomeScreen() {
      const path = window.location.pathname.replace(/\\/g, '/');
      return /\/(?:index\.html)?$/.test(path) || path.endsWith('/Ecom/') || path === '/' || path.endsWith('/');
    }

    function showHeaderAndControls() {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        navbar.classList.remove('mobile-nav-hidden');
      }
      document.querySelectorAll('.location-subbar').forEach((bar) => {
        bar.classList.remove('mobile-controls-hidden');
      });
      document.querySelectorAll('.cat-controls-bar').forEach((bar) => {
        bar.classList.remove('mobile-controls-hidden');
      });
    }

    function hideHeaderAndControls() {
      // Don't hide if a menu or modal drawer is currently open
      if (document.body.classList.contains('mobile-menu-open') || document.body.classList.contains('filter-modal-open')) {
        return;
      }
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        navbar.classList.add('mobile-nav-hidden');
      }
      document.querySelectorAll('.location-subbar').forEach((bar) => {
        bar.classList.add('mobile-controls-hidden');
      });
      document.querySelectorAll('.cat-controls-bar').forEach((bar) => {
        bar.classList.add('mobile-controls-hidden');
      });
    }

    function update() {
      const currentScrollY = window.scrollY;

      if (window.innerWidth > 768) {
        showHeaderAndControls();
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      // On Home Screen: ALWAYS keep header section & location bar fixed and visible at the top of the viewport!
      if (isHomeScreen()) {
        showHeaderAndControls();
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      // If near top of page, keep visible
      if (currentScrollY <= MIN_SCROLL_TOP) {
        showHeaderAndControls();
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      const delta = currentScrollY - lastScrollY;

      // Scroll DOWN -> Immediately HIDE search bar, location bar & controls
      if (delta > SCROLL_THRESHOLD) {
        hideHeaderAndControls();
      }
      // Scroll UP -> Immediately SHOW controls on non-home screens
      else if (delta < -SCROLL_THRESHOLD) {
        showHeaderAndControls();
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        showHeaderAndControls();
      }
    }, { passive: true });
  }

  function boot() {
    setViewportHooks();
    ensureBottomNav();
    ensureCategoryModal();
    enhanceTouchCarousels();
    syncBodyMenuState();
    initMobileScrollControls();

    const menu = document.getElementById('mobile-menu');
    if (menu) {
      const observer = new MutationObserver(syncBodyMenuState);
      observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
    }
  }

  window.addEventListener('resize', setViewportHooks, { passive: true });
  window.addEventListener('orientationchange', setViewportHooks, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
