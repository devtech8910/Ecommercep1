/* ============================================================
   FASHIONCOMPANY FASHION - MOBILE PRESENTATION HELPER
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
          <h3>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            Select Category
          </h3>
          <button type="button" class="mobile-sheet-close" id="close-cat-sheet">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="mobile-categories-grid">
          <a href="${mensUrl}" class="category-choice-card">
            <span class="choice-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <div class="choice-info">
              <strong>Men's Wear</strong>
              <span>Suits, Shirts, Jackets & Tailored Pants</span>
            </div>
            <span class="choice-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
          </a>
          <a href="${womensUrl}" class="category-choice-card">
            <span class="choice-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 12v10M9 15h6"/></svg>
            </span>
            <div class="choice-info">
              <strong>Women's Wear</strong>
              <span>Dresses, Tops, Gowns & Luxury Sets</span>
            </div>
            <span class="choice-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
          </a>
          <a href="${kidsUrl}" class="category-choice-card">
            <span class="choice-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </span>
            <div class="choice-info">
              <strong>Kids Wear</strong>
              <span>Playful & Premium Outfits for Juniors</span>
            </div>
            <span class="choice-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
          </a>
          <a href="${accUrl}" class="category-choice-card">
            <span class="choice-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3 8 9l4 13 4-13-3-6"/></svg>
            </span>
            <div class="choice-info">
              <strong>Accessories</strong>
              <span>Watches, Sunglasses, Bags & Fine Jewelry</span>
            </div>
            <span class="choice-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
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
    let idleTimeout = null;
    const SCROLL_THRESHOLD = 4;
    const MIN_SCROLL_TOP = 60;

    function isHomeScreen() {
      const path = window.location.pathname.replace(/\\/g, '/');
      return /\/(?:index\.html)?$/.test(path) || path.endsWith('/Ecom/') || path === '/' || path.endsWith('/');
    }

    function resetIdleTimer() {
      if (idleTimeout) {
        clearTimeout(idleTimeout);
        idleTimeout = null;
      }

      // If we are near the top, do not auto-hide (always show)
      if (window.scrollY <= MIN_SCROLL_TOP) {
        return;
      }

      // If home screen, do not auto-hide
      if (isHomeScreen()) {
        return;
      }

      // If a menu is currently open, do not auto-hide
      if (document.body.classList.contains('mobile-menu-open') || document.body.classList.contains('filter-modal-open')) {
        return;
      }

      // Hide controls after 7.5 seconds of no interaction
      idleTimeout = setTimeout(() => {
        if (window.scrollY > MIN_SCROLL_TOP) {
          hideHeaderAndControls();
        }
      }, 7500);
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
      resetIdleTimer();
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

      if (idleTimeout) {
        clearTimeout(idleTimeout);
        idleTimeout = null;
      }
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

    // Scroll resets idle timer
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
      resetIdleTimer();
    }, { passive: true });

    // Interaction events reset idle timer
    const interactionEvents = ['touchstart', 'touchend', 'click', 'mousemove'];
    interactionEvents.forEach(evt => {
      document.addEventListener(evt, resetIdleTimer, { passive: true });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        showHeaderAndControls();
      }
    }, { passive: true });
  }

  function enhanceMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;

    // Define SVGs for links
    const iconMap = {
      'home': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      'shop': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
      'orders': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>',
      'men': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      'women': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 12v10M9 15h6"/></svg>',
      'kids': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      'accessories': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3 8 9l4 13 4-13-3-6"/></svg>',
      'settings': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      'admin': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="18" y1="9" x2="21" y2="9"/><line x1="18" y1="15" x2="21" y2="15"/></svg>'
    };

    const chevronSvg = '<svg class="mobile-link-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

    // Process link item
    const processLink = (link) => {
      if (link.dataset.enhanced) return;
      link.dataset.enhanced = "true";
      
      let text = link.textContent.trim();
      // Remove any emojis or symbols
      text = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]|\u2642|\u2640|\u2605/g, '').trim();
      
      let key = 'home';
      const textLower = text.toLowerCase();
      if (textLower.includes('shop')) key = 'shop';
      else if (textLower.includes('order')) key = 'orders';
      else if (textLower.includes('men')) key = 'men';
      else if (textLower.includes('women')) key = 'women';
      else if (textLower.includes('kid')) key = 'kids';
      else if (textLower.includes('access')) key = 'accessories';
      else if (textLower.includes('setting')) key = 'settings';
      else if (textLower.includes('admin')) key = 'admin';

      const icon = iconMap[key] || iconMap['home'];
      
      link.innerHTML = `
        <span class="mobile-link-left">
          ${icon}
          <span class="mobile-link-text">${text}</span>
        </span>
        ${chevronSvg}
      `;
    };

    // Process all existing links
    menu.querySelectorAll('.mobile-link').forEach(processLink);

    // Process category headers (strip emojis)
    const categoryHeaders = menu.querySelectorAll('.mobile-category-header');
    categoryHeaders.forEach(header => {
      if (header.dataset.enhanced) return;
      header.dataset.enhanced = "true";
      let text = header.textContent.trim();
      text = text.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, '').trim();
      header.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        <span>${text}</span>
      `;
    });

    // Generate initials for the avatar badge instead of standard emoji
    const avatarBadge = menu.querySelector('.user-avatar-badge');
    const nameEl = document.getElementById('mobile-user-name');
    if (avatarBadge && nameEl) {
      const updateAvatar = () => {
        const nameText = nameEl.textContent.replace('Hey', '').trim();
        let initials = 'U';
        if (nameText.toLowerCase().includes('guest')) {
          initials = 'G';
        } else if (nameText) {
          const parts = nameText.split(/\s+/);
          if (parts.length >= 2 && parts[0] && parts[1]) {
            initials = (parts[0][0] + parts[1][0]).toUpperCase();
          } else if (parts[0] && parts[0][0]) {
            initials = parts[0].substring(0, 2).toUpperCase();
          }
        }
        avatarBadge.textContent = initials;
      };
      updateAvatar();
      
      // Observe name changes to keep it updated when auth state changes
      const nameObserver = new MutationObserver(updateAvatar);
      nameObserver.observe(nameEl, { childList: true, characterData: true, subtree: true });
    }

    // Monitor for dynamically added admin links or user state mutations
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('mobile-link')) {
              processLink(node);
            } else {
              node.querySelectorAll('.mobile-link').forEach(processLink);
            }
          }
        });
      });
    });
    observer.observe(menu, { childList: true, subtree: true });
  }

  function convertNativeSelects() {
    document.querySelectorAll('select.sort-select').forEach((select) => {
      if (select.dataset.converted) return;
      select.dataset.converted = "true";

      // Hide native select
      select.style.display = 'none';

      // Create container
      const container = document.createElement('div');
      container.className = 'custom-dropdown-container';

      // Get options
      const options = Array.from(select.querySelectorAll('option'));
      const activeOption = options.find(opt => opt.selected) || options[0];

      // Chevron icon SVG
      const chevronSvg = '<svg class="dropdown-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';

      // Trigger button
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'custom-dropdown-trigger';
      trigger.innerHTML = `
        <span class="selected-value">${activeOption.textContent}</span>
        ${chevronSvg}
      `;

      // Menu dropdown
      const menu = document.createElement('div');
      menu.className = 'custom-dropdown-menu';

      // Populate options
      options.forEach((opt) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = `custom-dropdown-option ${opt.selected ? 'active' : ''}`;
        optionDiv.textContent = opt.textContent;
        optionDiv.dataset.value = opt.value;

        optionDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          // Update selected
          menu.querySelectorAll('.custom-dropdown-option').forEach(el => el.classList.remove('active'));
          optionDiv.classList.add('active');
          trigger.querySelector('.selected-value').textContent = opt.textContent;

          // Update native select value and trigger change event
          select.value = opt.value;
          select.dispatchEvent(new Event('change'));

          // Close dropdown
          container.classList.remove('open');
        });

        menu.appendChild(optionDiv);
      });

      // Toggle dropdown on trigger click
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close other custom dropdowns
        document.querySelectorAll('.custom-dropdown-container').forEach(c => {
          if (c !== container) c.classList.remove('open');
        });

        container.classList.toggle('open');
      });

      // Assemble
      container.appendChild(trigger);
      container.appendChild(menu);
      select.parentNode.insertBefore(container, select);
    });

    // Close all open custom dropdowns when clicking outside
    document.addEventListener('click', () => {
      document.querySelectorAll('.custom-dropdown-container').forEach(c => c.classList.remove('open'));
    });
  }

  function enhanceFilterDrawerClose() {
    document.querySelectorAll('.filter-drawer-close').forEach((btn) => {
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    });
  }

  function boot() {
    setViewportHooks();
    ensureBottomNav();
    ensureCategoryModal();
    enhanceTouchCarousels();
    syncBodyMenuState();
    initMobileScrollControls();
    enhanceMobileMenu();
    convertNativeSelects();
    enhanceFilterDrawerClose();

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
