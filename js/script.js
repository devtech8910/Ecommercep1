/* ============================================================
   FASHIONCOMPANY FASHION — MAIN JAVASCRIPT
   Author: Fashion Company (Purna Sai & Prabhas)
   Version: 1.0.0
   ============================================================ */

'use strict';

window.dtfNormalizeImageUrl = function dtfNormalizeImageUrl(url) {
  if (!url) return '';
  const raw = String(url).trim();
  return raw.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/uploads\//i, '/uploads/');
};

window.dtfSplitImages = function dtfSplitImages(str) {
  if (!str) return [];
  const parts = String(str).split(',');
  const results = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (part.startsWith('data:image/') && part.includes(';base64')) {
      const next = parts[i + 1] ? parts[i + 1].trim() : '';
      results.push(part + ',' + next);
      i++;
    } else {
      results.push(part);
    }
  }
  return results.filter(Boolean);
};

window.dtfApiBase = function dtfApiBase() {
  const host = window.location.hostname;
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:5000`;
  }
  return 'http://localhost:5000';
};

window.dtfApiUrl = function dtfApiUrl(path) {
  return `${window.dtfApiBase()}${path}`;
};

const dtfEscapeHtml = window.escapeHtml || function escapeHtmlFallback(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
};

(function routeLocalApiFetchesForLan() {
  if (window.__dtfApiFetchPatched) return;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function dtfFetch(resource, options) {
    if (typeof resource === 'string' && resource.startsWith('http://localhost:5000')) {
      resource = resource.replace('http://localhost:5000', window.dtfApiBase());
    }
    return nativeFetch(resource, options);
  };
  window.__dtfApiFetchPatched = true;
})();

/* ============================================================
   DOM UTILITY HELPERS
   ============================================================ */

/**
 * Query selector shorthand
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {Element|null}
 */
const $ = (selector, context = document) => context.querySelector(selector);

/**
 * Query selector all shorthand
 * @param {string} selector
 * @param {Element} [context=document]
 * @returns {NodeListOf<Element>}
 */
const $$ = (selector, context = document) => context.querySelectorAll(selector);

/* ============================================================
   SCROLL PROGRESS BAR
   ============================================================ */
(function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-label', 'Page scroll progress');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  document.body.prepend(bar);

  function updateProgress() {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${scrollPercent}%`;
    bar.setAttribute('aria-valuenow', Math.round(scrollPercent));
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
})();

/* ============================================================
   NAVBAR — SCROLL BLUR EFFECT
   ============================================================ */
(function initNavbarScroll() {
  const navbar = $('#navbar');
  if (!navbar) return;



  // Set initial transparent state
  navbar.classList.add('nav-transparent');

  const SCROLL_THRESHOLD = 60;

  function onScroll() {
    if (window.scrollY > SCROLL_THRESHOLD) {
      navbar.classList.remove('nav-transparent');
      navbar.classList.add('nav-scrolled');
    } else {
      navbar.classList.remove('nav-scrolled');
      navbar.classList.add('nav-transparent');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // Run on load
})();

/* ============================================================
   GLOBAL AUTH CHECK & PROTECTION FOR CART / WISHLIST
   ============================================================ */
window.isUserLoggedIn = function() {
  try {
    const rawUser = localStorage.getItem('dtf_user') || localStorage.getItem('user');
    const token = localStorage.getItem('token') || localStorage.getItem('dtf_token');
    if (token) return true;
    if (rawUser && JSON.parse(rawUser)) return true;
  } catch (e) {}
  return false;
};

(function initCartWishlistAuthProtection() {
  function getLoginUrl() {
    const isPagesDir = /\/pages\//i.test(window.location.pathname.replace(/\\/g, '/'));
    return isPagesDir ? 'login.html' : 'pages/login.html';
  }

  document.addEventListener('click', (e) => {
    const wishlistTrigger = e.target.closest(
      '.wishlist-btn, .btn-wishlist, .btn-add-wishlist, .add-wishlist, .product-card-wishlist, [data-action="wishlist"], .product-wishlist-btn, .add-to-wishlist'
    );

    const cartTrigger = e.target.closest(
      '.buy-now-btn, .btn-add-cart, .add-to-cart-btn, #add-to-cart-cta, #buy-now-cta, [data-action="add-to-cart"], [data-action="buy-now"]'
    );

    const trigger = wishlistTrigger || cartTrigger;

    if (trigger) {
      if (!window.isUserLoggedIn || !window.isUserLoggedIn()) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const isWishlist = !!wishlistTrigger;
        const msg = isWishlist
          ? 'Please sign in or create an account to save items to your wishlist.'
          : 'Please sign in or create an account to add items to your cart.';

        if (window.showToast) {
          window.showToast(msg, 'warning');
        } else {
          alert(msg);
        }

        setTimeout(() => {
          window.location.href = getLoginUrl();
        }, 800);

        return false;
      }
    }
  }, true);
})();

/* ============================================================
   AUTH UI & NAVBAR USER STATE CONTROLLER
   ============================================================ */
function updateAuthUI() {
  const nameEl = document.getElementById('mobile-user-name');
  const mobileLinksList = document.querySelector('.mobile-links');
  let adminItem = document.getElementById('mobile-admin-item');

  // Desktop Navbar Auth Elements
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const navActions = document.querySelector('.nav-actions');
  let desktopUserContainer = document.getElementById('desktop-user-container');

  const isInPages = window.location.pathname.includes('/pages/');
  const adminUrl = isInPages ? 'admin.html' : 'pages/admin.html';
  const ordersUrl = isInPages ? 'orders.html' : 'pages/orders.html';

  try {
    const rawUser = localStorage.getItem('dtf_user') || localStorage.getItem('user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      const name = user.full_name || user.name || user.username || user.first_name || user.email?.split('@')[0] || 'User';

      // 1. Mobile Greeting & Auth Buttons Toggle
      const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
      const mobileAuthBtns = document.getElementById('mobile-auth-btns');
      if (nameEl) nameEl.textContent = `Hey ${name}`;

      if (mobileLogoutBtn) mobileLogoutBtn.style.setProperty('display', 'flex', 'important');
      if (mobileAuthBtns) mobileAuthBtns.style.setProperty('display', 'none', 'important');

      // Check Admin role
      const isAdmin = (user.role && user.role.toLowerCase() === 'admin') ||
                      user.is_admin === true ||
                      (user.email && user.email.toLowerCase().includes('admin')) ||
                      (user.username && user.username.toLowerCase() === 'admin');

      // 2. Mobile Admin Link
      if (isAdmin) {
        if (!adminItem && mobileLinksList) {
          adminItem = document.createElement('li');
          adminItem.id = 'mobile-admin-item';
          adminItem.innerHTML = `<a href="${adminUrl}" class="mobile-link" style="color: #fbbf24; font-weight: 800; background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 10px 14px; margin-top: 6px; display: block; text-decoration: none;">🛠️ Admin Dashboard</a>`;
          mobileLinksList.appendChild(adminItem);
        } else if (adminItem) {
          adminItem.style.display = 'block';
          const a = adminItem.querySelector('a');
          if (a) a.href = adminUrl;
        }
      } else if (adminItem) {
        adminItem.style.display = 'none';
      }

      // 3. Desktop Header Navigation (Hide Login/Signup, Show User Pill)
      if (loginBtn) loginBtn.style.display = 'none';
      if (signupBtn) signupBtn.style.display = 'none';

      if (navActions) {
        if (!desktopUserContainer) {
          desktopUserContainer = document.createElement('div');
          desktopUserContainer.id = 'desktop-user-container';
          desktopUserContainer.style.display = 'inline-flex';
          desktopUserContainer.style.alignItems = 'center';
          desktopUserContainer.style.gap = '8px';

          const hamburger = document.getElementById('hamburger');
          if (hamburger) {
            navActions.insertBefore(desktopUserContainer, hamburger);
          } else {
            navActions.appendChild(desktopUserContainer);
          }
        }

        desktopUserContainer.style.display = 'inline-flex';
        desktopUserContainer.innerHTML = `
          ${isAdmin ? `<a href="${adminUrl}" class="desktop-admin-link" aria-label="Open admin dashboard">Admin</a>` : ''}
          <a href="${ordersUrl}" class="desktop-orders-link" aria-label="Open my orders" title="${dtfEscapeHtml(name)}">My Orders</a>
          <button type="button" id="desktop-logout-btn" class="desktop-logout-btn" title="Logout">Logout</button>
        `;

        const desktopLogout = document.getElementById('desktop-logout-btn');
        if (desktopLogout) {
          desktopLogout.onclick = () => {
            try { fetch('http://localhost:5000/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
            localStorage.removeItem('dtf_user');
            localStorage.removeItem('dtf_token');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            alert('Logged out successfully!');
            window.location.reload();
          };
        }
      }
      return;
    }
  } catch (err) {
    console.warn('Auth UI update error:', err);
  }

  // Fallback for unauthenticated guest state
  if (nameEl) nameEl.textContent = 'Hey Guest';

  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  const mobileAuthBtns = document.getElementById('mobile-auth-btns');
  if (mobileLogoutBtn) mobileLogoutBtn.style.setProperty('display', 'none', 'important');
  if (mobileAuthBtns) mobileAuthBtns.style.setProperty('display', 'flex', 'important');

  if (adminItem) adminItem.style.display = 'none';
  if (loginBtn) loginBtn.style.display = '';
  if (signupBtn) signupBtn.style.display = '';
  if (desktopUserContainer) desktopUserContainer.style.display = 'none';
}

/* Run Auth UI update on script load & DOM ready */
updateAuthUI();
document.addEventListener('DOMContentLoaded', updateAuthUI);

/* ============================================================
   MOBILE MENU — HAMBURGER TOGGLE
   ============================================================ */
(function initMobileMenu() {
  function toggleMenu(e) {
    const hamburger = e.target.closest('#hamburger');
    if (!hamburger) return;

    e.preventDefault();
    e.stopPropagation();

    const mobileMenu = document.getElementById('mobile-menu');
    if (!mobileMenu) return;

    const isOpen = mobileMenu.classList.contains('open');

    if (isOpen) {
      hamburger.classList.remove('open');
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-menu-open');
      document.body.style.overflow = '';
    } else {
      updateAuthUI();
      hamburger.classList.add('open');
      mobileMenu.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('mobile-menu-open');
      document.body.style.overflow = 'hidden';
    }
  }

  document.addEventListener('click', toggleMenu);

  // Logout button handler in mobile menu
  document.addEventListener('click', (e) => {
    const logoutBtn = e.target.closest('#mobile-logout-btn');
    if (logoutBtn) {
      try { fetch('http://localhost:5000/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
      localStorage.removeItem('dtf_user');
      localStorage.removeItem('dtf_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      updateAuthUI();
      const hamburger = document.getElementById('hamburger');
      const mobileMenu = document.getElementById('mobile-menu');
      hamburger?.classList.remove('open');
      mobileMenu?.classList.remove('open');
      hamburger?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-menu-open');
      document.body.style.overflow = '';
      alert('Logged out successfully!');
      window.location.reload();
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    const mobileMenu = document.getElementById('mobile-menu');
    const hamburger = document.getElementById('hamburger');
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      if (!mobileMenu.contains(e.target) && (!hamburger || !hamburger.contains(e.target))) {
        hamburger?.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger?.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('mobile-menu-open');
        document.body.style.overflow = '';
      }
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const hamburger = document.getElementById('hamburger');
      const mobileMenu = document.getElementById('mobile-menu');
      if (mobileMenu && mobileMenu.classList.contains('open')) {
        hamburger?.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger?.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('mobile-menu-open');
        document.body.style.overflow = '';
      }
    }
  });

  // Close when a mobile link is clicked
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.mobile-link, .mobile-actions .btn');
    if (link) {
      const hamburger = document.getElementById('hamburger');
      const mobileMenu = document.getElementById('mobile-menu');
      if (mobileMenu && mobileMenu.classList.contains('open')) {
        hamburger?.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger?.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('mobile-menu-open');
        document.body.style.overflow = '';
      }
    }
  });

  // Initial greeting update
  updateAuthUI();
})();

(function initMobileCategoryAccordion() {
  const categoryHeaders = document.querySelectorAll('.mobile-category-header');
  categoryHeaders.forEach(header => {
    header.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const block = header.closest('.mobile-category-block');
      if (block) {
        block.classList.toggle('expanded');
      }
    });
  });
})();

/* ============================================================
   HEADER SEARCH BAR HANDLER
   ============================================================ */
(function initHeaderSearch() {
  document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.target && e.target.id === 'nav-search-input') {
      const query = e.target.value.trim();
      if (query) {
        window.location.href = `pages/mens-wear.html?search=${encodeURIComponent(query)}`;
      }
    }
  });

  document.addEventListener('click', (e) => {
    const searchBtn = e.target.closest('#nav-search-btn');
    if (searchBtn) {
      const input = document.getElementById('nav-search-input');
      if (input) {
        const query = input.value.trim();
        if (query) {
          window.location.href = `pages/mens-wear.html?search=${encodeURIComponent(query)}`;
        }
      }
    }
  });
})();

/* ============================================================
   DROPDOWN MENU — KEYBOARD & TOUCH SUPPORT
   ============================================================ */
(function initDropdown() {
  const dropdowns = $$('.nav-dropdown');

  dropdowns.forEach((dropdown) => {
    const trigger = dropdown.querySelector('.dropdown-trigger');
    const menu    = dropdown.querySelector('.dropdown-menu');
    if (!trigger || !menu) return;

    // Touch support — toggle on tap
    trigger.addEventListener('click', (e) => {
      if (window.matchMedia('(hover: none)').matches) {
        e.preventDefault();
        const isVisible = menu.classList.contains('open');
        // Close all other dropdowns
        $$('.dropdown-menu').forEach(m => m.classList.remove('open'));
        if (!isVisible) menu.classList.add('open');
        trigger.setAttribute('aria-expanded', !isVisible);
      }
    });

    // Keyboard navigation
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', !isExpanded);
        menu.classList.toggle('open');
      }
      if (e.key === 'Escape') {
        trigger.setAttribute('aria-expanded', 'false');
        menu.classList.remove('open');
        trigger.focus();
      }
    });
  });

  // Close all dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) {
      $$('.dropdown-menu').forEach(m => m.classList.remove('open'));
      $$('.dropdown-trigger').forEach(t => t.setAttribute('aria-expanded', 'false'));
    }
  });
})();

/* ============================================================
   MOUSE GLOW EFFECT
   ============================================================ */
(function initMouseGlow() {
  const glow = $('#mouse-glow');
  if (!glow) return;

  // Only enable on non-touch devices
  if (window.matchMedia('(hover: none)').matches) {
    glow.style.display = 'none';
    return;
  }

  let mouseX = 0;
  let mouseY = 0;
  let glowX  = 0;
  let glowY  = 0;
  let rafId  = null;
  const LERP = 0.08; // Smoothing factor

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  function animate() {
    glowX += (mouseX - glowX) * LERP;
    glowY += (mouseY - glowY) * LERP;
    glow.style.transform = `translate(${glowX}px, ${glowY}px) translate(-50%, -50%)`;
    rafId = requestAnimationFrame(animate);
  }

  animate();

  // Cleanup on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      animate();
    }
  });
})();

/* ============================================================
   BUTTON RIPPLE EFFECT
   ============================================================ */
(function initRipple() {
  function createRipple(e) {
    const button = e.currentTarget;
    const rect   = button.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
    `;

    button.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove());
  }

  $$('.ripple-btn').forEach((btn) => {
    btn.addEventListener('click', createRipple);
  });
})();

/* ============================================================
   SCROLL REVEAL — ADD CLASSES THEN OBSERVE
   (Must add classes first, then observe — order matters)
   ============================================================ */
(function initRevealSystem() {

  /* ── Step 1: Add reveal classes to below-fold elements ── */

  // Cat-cards are above the fold — NO reveal, always visible
  // (no class added here intentionally)

  // Bento cards — stagger
  $$('.bento-card').forEach((card, i) => {
    card.classList.add('reveal');
    card.style.transitionDelay = `${i * 0.07}s`;
  });

  // Section headers — skip first (categories, above fold)
  $$('.section-header').forEach((el, i) => {
    if (i === 0) return;
    el.classList.add('reveal');
  });

  // Editorial blocks
  $('#editorial-main')?.classList.add('reveal-left');
  $$('.editorial-small').forEach((el, i) => {
    el.classList.add('reveal-right');
    el.style.transitionDelay = `${i * 0.15}s`;
  });

  // Newsletter
  $('.newsletter-glass')?.classList.add('reveal-scale');

  // Footer columns
  $$('.footer-col').forEach((col, i) => {
    col.classList.add('reveal');
    col.style.transitionDelay = `${i * 0.08}s`;
  });

  /* ── Step 2: Now observe all elements that have reveal classes ── */
  const revealEls = $$('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px -20px 0px',
    }
  );

  revealEls.forEach((el) => {
    // Already in viewport on page load? Reveal immediately.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('revealed');
    } else {
      observer.observe(el);
    }
  });

})();


/* ============================================================
   BACK TO TOP BUTTON
   ============================================================ */
(function initBackToTop() {
  const btn = $('#back-to-top');
  if (!btn) return;

  const SHOW_THRESHOLD = 400;

  function toggleVisibility() {
    if (window.scrollY > SHOW_THRESHOLD) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility();
})();

/* ============================================================
   FOOTER — DYNAMIC YEAR
   ============================================================ */
(function setFooterYear() {
  const el = $('#footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ============================================================
   NEWSLETTER FORM
   ============================================================ */
(function initNewsletterForm() {
  const form    = $('#newsletter-form');
  const input   = $('#newsletter-email');
  const msgEl   = $('#newsletter-msg');
  const submitBtn = $('#newsletter-submit');
  if (!form || !input || !msgEl) return;

  function showMsg(text, type) {
    msgEl.textContent = text;
    msgEl.className   = `form-message ${type}`;
    setTimeout(() => {
      msgEl.textContent = '';
      msgEl.className   = 'form-message';
    }, 5000);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = input.value.trim();

    if (!validateEmail(email)) {
      showMsg('Please enter a valid email address.', 'error');
      input.focus();
      return;
    }

    // Simulate async subscribe (replace with real API call later)
    submitBtn.disabled = true;
    submitBtn.textContent = 'Subscribing...';

    setTimeout(() => {
      showMsg('🎉 Welcome to the Inner Circle! Check your inbox.', 'success');
      input.value = '';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Subscribe';

      // Persist subscription flag (demo)
      localStorage.setItem('dtf_subscribed', 'true');
    }, 1200);
  });
})();

/* ============================================================
   CART & WISHLIST COUNT — localStorage sync
   ============================================================ */
(function initCartWishlistCounts() {
  function getUserStorageKey(base) {
    try {
      const user = JSON.parse(localStorage.getItem('dtf_user') || 'null');
      return user && user.email ? `${base}_${user.email.toLowerCase()}` : base;
    } catch {
      return base;
    }
  }

  function getCount(key) {
    try {
      const data = JSON.parse(localStorage.getItem(getUserStorageKey(key)));
      return Array.isArray(data) ? data.length : 0;
    } catch {
      return 0;
    }
  }

  function updateBadge(id, key) {
    const badge = $(`#${id}`);
    if (!badge) return;
    const count = getCount(key);
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

  function updateAll() {
    updateBadge('cart-count', 'dtf_cart');
    updateBadge('wishlist-count', 'dtf_wishlist');
  }

  // Update on load
  updateAll();

  // Listen for changes from other tabs
  window.addEventListener('storage', updateAll);

  // Custom event for same-page updates
  window.addEventListener('dtf:cart:updated',    updateAll);
  window.addEventListener('dtf:wishlist:updated', updateAll);
})();

/* ============================================================
   SMOOTH ANCHOR SCROLL (for # links)
   ============================================================ */
(function initAnchorScroll() {
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = $(targetId);
      if (!target) return;

      e.preventDefault();

      const navHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-height') || '80',
        10
      );

      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();

/* ============================================================
   IMAGE LAZY LOAD — Error fallback
   ============================================================ */
(function initImageFallback() {
  const FALLBACK = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop';

  $$('img').forEach((img) => {
    img.addEventListener('error', function() {
      if (this.src !== FALLBACK) {
        this.src = FALLBACK;
      }
    });
  });
})();

/* ============================================================
   CARD SHINE EFFECT — add class
   ============================================================ */
(function initCardShine() {
  $$('.category-card, .bento-card').forEach((card) => {
    card.classList.add('card-shine');
  });
})();

/* ============================================================
   HERO PARALLAX (subtle — only on desktop)
   ============================================================ */
(function initHeroParallax() {
  const heroImg = $('.hero-img');
  if (!heroImg) return;
  if (window.matchMedia('(hover: none)').matches) return;

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const maxShift = 60;
        const shift = Math.min(scrollY * 0.25, maxShift);
        heroImg.style.transform = `scale(1.08) translateY(${shift}px)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ============================================================
   BENTO CARD — MOUSE TILT EFFECT (desktop only)
   ============================================================ */
(function initBentoTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  $$('.bento-card').forEach((card) => {
    const INTENSITY = 8; // degrees

    card.addEventListener('mousemove', (e) => {
      const rect   = card.getBoundingClientRect();
      const x      = e.clientX - rect.left;
      const y      = e.clientY - rect.top;
      const centerX = rect.width  / 2;
      const centerY = rect.height / 2;
      const rotX   = ((y - centerY) / centerY) * -INTENSITY;
      const rotY   = ((x - centerX) / centerX) *  INTENSITY;
      card.style.transform = `translateY(-4px) perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

/* ============================================================
   ACTIVE NAV LINK HIGHLIGHTING (based on scroll position)
   ============================================================ */
(function initActiveNavHighlight() {
  const sections = $$('section[id]');
  const navLinks = $$('.nav-link');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            const href = link.getAttribute('href');
            if (href === `#${id}`) {
              navLinks.forEach(l => l.classList.remove('active'));
              link.classList.add('active');
            }
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((section) => observer.observe(section));
})();

/* ============================================================
   INITIALIZATION LOG (development only)
   ============================================================ */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.info(
    '%c Fashion Company %c v1.0.0 ',
    'background: #1a1a2e; color: #4f8ef7; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;',
    'background: #4f8ef7; color: white; padding: 4px 8px; border-radius: 0 4px 4px 0;'
  );
}

/* ============================================================
   THEME INITIALIZER — STANDARDIZED DARK THEME
   ============================================================ */
(function initThemeToggler() {
  document.documentElement.setAttribute('data-theme', 'dark');
})();

/* ============================================================
   LOCATION SUBBAR & BOTTOM SHEET DRAWER
   ============================================================ */
(function initLocationSubbar() {
  // 1. State
  let savedAddresses = JSON.parse(localStorage.getItem('dtf_saved_addresses') || '[]');
  let savedLoc = JSON.parse(localStorage.getItem('dtf_user_location') || 'null');

  function renderSubbarText() {
    if (savedLoc && savedLoc.name && savedLoc.pin) return `📍 ${savedLoc.name} ${savedLoc.pin}`;
    if (savedAddresses.length > 0) {
      const first = savedAddresses[0];
      return `📍 ${first.name || first.label} ${first.pin || ''}`;
    }
    return '📍 Select Delivery Location';
  }

  // 2. Inject Subbar HTML into location-subbar container
  const subbarRoot = document.getElementById('react-address-picker-root');
  if (!subbarRoot) return;
  subbarRoot.style.width = '100%';
  subbarRoot.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; font-family: 'Inter', sans-serif;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; font-weight: 700;">Deliver to:</span>
        <span id="subbar-location-text" style="font-size: 12.5px; font-weight: 700; color: #a5b4fc; cursor: pointer; background: rgba(165,180,252,0.1); padding: 4px 10px; border-radius: 8px;">${renderSubbarText()}</span>
      </div>
      <button id="subbar-change-location-btn" style="background: rgba(165,180,252,0.1); border: 1px solid rgba(165,180,252,0.25); color: #a5b4fc; padding: 5px 14px; border-radius: 99px; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;">Change</button>
    </div>
  `;

  // Fetch Database Addresses Sync
  async function fetchDatabaseAddresses() {
    try {
      const res = await fetch('http://localhost:5000/address');
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        savedAddresses = data.data.map(item => ({
          id: item.id || 'db-' + Date.now(),
          label: (item.address_type || 'HOME').toUpperCase(),
          typeIcon: item.address_type === 'WORK' ? '🏢' : item.address_type === 'OTHER' ? '📍' : '🏠',
          name: item.city || item.area || 'Location',
          personName: item.full_name || 'Customer',
          phone: item.mobile || '',
          fullAddress: `${item.house_number ? item.house_number + ', ' : ''}${item.street ? item.street + ', ' : ''}${item.area || item.city || ''}, ${item.state || ''} - ${item.pincode || ''}`,
          pin: item.pincode || '',
          state: item.state || '',
          district: item.city || '',
          house: item.house_number || '',
          street: item.street || ''
        }));
        localStorage.setItem('dtf_saved_addresses', JSON.stringify(savedAddresses));
        if (!savedLoc && savedAddresses.length > 0) {
          savedLoc = savedAddresses[0];
          document.querySelectorAll('#subbar-location-text, #desktop-location-text, .desktop-location-text').forEach(el => {
            el.textContent = renderSubbarText();
          });
        }
        // Initial sync of desktop location text
        document.querySelectorAll('#desktop-location-text, .desktop-location-text').forEach(el => {
          el.textContent = renderSubbarText();
        });
      }
    } catch {}
  }
  fetchDatabaseAddresses();

  // 3. Inject Bottom Sheet Backdrop & Drawer HTML
  if (!document.getElementById('location-bottom-sheet-backdrop')) {
    const sheetHTML = `
      <div id="location-bottom-sheet-backdrop" class="location-bottom-sheet-backdrop">
        <div class="location-bottom-sheet">
          <div class="sheet-drag-handle"></div>

          <!-- ── VIEW 1: SAVED LOCATIONS & ADD NEW LOCATION ── -->
          <div id="loc-view-saved" style="padding: 16px 24px 28px; display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 14px;">
              <div>
                <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: #111827;">Select Delivery Location</h3>
                <span style="font-size: 12px; color: #6b7280; font-weight: 500;">Choose a saved address or set a new delivery location</span>
              </div>
              <button id="close-loc-sheet" style="background: #f3f4f6; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 18px; font-weight: bold; color: #4b5563; display: flex; align-items: center; justify-content: center;">&times;</button>
            </div>

            <!-- ➕ ADD NEW LOCATION DASHED BUTTON -->
            <button id="btn-goto-add-choice" class="btn-add-location-dashed">
              <span>➕</span> Add New Location
            </button>

            <!-- SAVED LOCATIONS LIST -->
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Saved Locations</span>
                <span style="font-size: 12px; font-weight: 700; color: #6366f1;" id="saved-count-badge">0 saved</span>
              </div>
              <div id="saved-addresses-container" style="display: flex; flex-direction: column; gap: 14px; max-height: 320px; overflow-y: auto;">
                <!-- Dynamically populated -->
              </div>
            </div>
          </div>

          <!-- ── VIEW 2: METHOD SELECTION (GPS vs MANUAL) ── -->
          <div id="loc-view-choice" style="display: none; padding: 20px 24px 28px; flex-direction: column; gap: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 14px;">
              <button id="btn-back-to-saved" style="background: #f3f4f6; border: none; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; color: #4b5563; cursor: pointer;">← Back</button>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #111827;">Add New Location</h3>
              <div style="width: 50px;"></div>
            </div>

            <p style="font-size: 13.5px; color: #6b7280; margin: 0; text-align: center; font-weight: 500;">
              Please set your delivery address to proceed with order:
            </p>

            <div id="gps-status-box" style="display: none; padding: 10px 16px; border-radius: 10px; font-size: 12.5px; font-weight: 600; text-align: center;"></div>

            <div class="method-choice-card" id="option-gps-detect">
              <div style="font-size: 32px;">📍</div>
              <div>
                <div style="font-size: 14px; font-weight: 700; color: #111827;">Use Current Location</div>
                <div style="font-size: 12px; color: #6b7280; font-weight: 500;">Auto-detect via GPS with interactive map</div>
              </div>
            </div>

            <div class="method-choice-card" id="option-away-manual">
              <div style="font-size: 32px;">🏠</div>
              <div>
                <div style="font-size: 14px; font-weight: 700; color: #111827;">Away from Delivery Location</div>
                <div style="font-size: 12px; color: #6b7280; font-weight: 500;">Enter pincode, state, district manually</div>
              </div>
            </div>
          </div>

          <!-- ── VIEW 3: GPS MAP + CONTACT DETAILS ── -->
          <div id="loc-view-gps-map" style="display: none; padding: 20px 24px 28px; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 14px;">
              <button id="btn-back-from-gps" style="background: #f3f4f6; border: none; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; color: #4b5563; cursor: pointer;">← Back</button>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #111827;">Confirm Location</h3>
              <div style="width: 50px;"></div>
            </div>

            <!-- Interactive Map -->
            <div id="gps-interactive-map" style="width: 100%; height: 220px; border-radius: 16px; border: 1.5px solid #e5e7eb; overflow: hidden;"></div>

            <!-- Auto-detected Location Summary -->
            <div style="background: #f8fafc; border-radius: 14px; padding: 14px 18px; border: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 6px;">
              <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 4px;">📍 Detected Location</div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #6b7280; font-size: 12.5px;">Country</span><span id="gps-summary-country" style="font-weight: 700; font-size: 13px; color: #111827;">India 🇮🇳</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #6b7280; font-size: 12.5px;">Pincode</span><span id="gps-summary-pincode" style="font-weight: 700; font-size: 13px; color: #111827;">—</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #6b7280; font-size: 12.5px;">State</span><span id="gps-summary-state" style="font-weight: 700; font-size: 13px; color: #111827;">—</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #6b7280; font-size: 12.5px;">District</span><span id="gps-summary-district" style="font-weight: 700; font-size: 13px; color: #111827;">—</span></div>
              <div style="display: flex; justify-content: space-between;"><span style="color: #6b7280; font-size: 12.5px;">Village / Locality</span><span id="gps-summary-locality" style="font-weight: 700; font-size: 13px; color: #111827;">—</span></div>
            </div>

            <!-- Contact & House Details Form -->
            <form id="gps-contact-form" style="display: flex; flex-direction: column; gap: 12px;">
              <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Contact & Delivery Details</div>
              <input type="text" id="gps-fullname" placeholder="Full Name *" class="manual-form-input" required />
              <input type="tel" id="gps-mobile" placeholder="Mobile Number * (10 digits)" class="manual-form-input" required pattern="[0-9]{10}" maxlength="10" />
              <input type="tel" id="gps-alt-mobile" placeholder="Alternative Mobile Number (optional)" class="manual-form-input" maxlength="10" />
              <input type="text" id="gps-house" placeholder="House No. / Flat / Building *" class="manual-form-input" required />
              <input type="text" id="gps-street" placeholder="Street / Landmark (optional)" class="manual-form-input" />

              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" class="chip-type-btn active" data-type="HOME" data-icon="🏠">🏠 HOME</button>
                <button type="button" class="chip-type-btn" data-type="WORK" data-icon="🏢">🏢 WORK</button>
                <button type="button" class="chip-type-btn" data-type="OTHER" data-icon="📍">📍 OTHER</button>
              </div>

              <button type="submit" style="width: 100%; padding: 14px; background: #6366f1; color: white; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s ease;">Save & Deliver Here 🚀</button>
            </form>
          </div>

          <!-- ── VIEW 4: MANUAL ADDRESS ENTRY ── -->
          <div id="loc-view-manual" style="display: none; padding: 20px 24px 28px; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f3f4f6; padding-bottom: 14px;">
              <button id="btn-back-to-choice" style="background: #f3f4f6; border: none; padding: 6px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; color: #4b5563; cursor: pointer;">← Back</button>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: #111827;">Enter Delivery Details</h3>
              <div style="width: 50px;"></div>
            </div>

            <form id="manual-address-form" style="display: flex; flex-direction: column; gap: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em;">🇮🇳 Country: India (Fixed)</div>

              <input type="text" id="manual-pincode" placeholder="Enter 6-digit Pincode *" class="manual-form-input" required maxlength="6" pattern="[0-9]{6}" />
              <div id="manual-pincode-status" style="font-size: 11.5px; color: #6b7280; font-weight: 500;">Type 6 digits to auto-detect State & District</div>

              <input type="text" id="manual-state" placeholder="State *" class="manual-form-input" required />
              <input type="text" id="manual-district" placeholder="District *" class="manual-form-input" required />

              <select id="manual-locality-select" class="manual-form-input" style="display: none;">
                <option value="">Select Post Office / Locality</option>
              </select>
              <input type="text" id="manual-locality-input" placeholder="e.g. Mylavaram / Gachibowli" class="manual-form-input" required />

              <input type="text" id="manual-house" placeholder="House No. / Flat / Building *" class="manual-form-input" required />
              <input type="text" id="manual-street" placeholder="Street / Landmark (optional)" class="manual-form-input" />

              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button type="button" class="chip-type-btn active" data-type="HOME" data-icon="🏠">🏠 HOME</button>
                <button type="button" class="chip-type-btn" data-type="WORK" data-icon="🏢">🏢 WORK</button>
                <button type="button" class="chip-type-btn" data-type="OTHER" data-icon="📍">📍 OTHER</button>
              </div>

              <button type="submit" style="width: 100%; padding: 14px; background: #6366f1; color: white; border: none; border-radius: 14px; font-size: 15px; font-weight: 700; cursor: pointer;">Save & Deliver Here 🚀</button>
            </form>
          </div>

        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', sheetHTML);
  }

  // 4. Element References & State Management
  const backdrop = document.getElementById('location-bottom-sheet-backdrop');
  const closeSheetBtn = document.getElementById('close-loc-sheet');
  const changeBtn = document.getElementById('subbar-change-location-btn');
  const textEl = document.getElementById('subbar-location-text');
  const savedContainer = document.getElementById('saved-addresses-container');
  const savedBadge = document.getElementById('saved-count-badge');

  const viewSaved = document.getElementById('loc-view-saved');
  const viewChoice = document.getElementById('loc-view-choice');
  const viewGpsMap = document.getElementById('loc-view-gps-map');
  const viewManual = document.getElementById('loc-view-manual');

  const gotoAddBtn = document.getElementById('btn-goto-add-choice');
  const backToSavedBtn = document.getElementById('btn-back-to-saved');
  const backFromGpsBtn = document.getElementById('btn-back-from-gps');
  const backToChoiceBtn = document.getElementById('btn-back-to-choice');

  const optionGps = document.getElementById('option-gps-detect');
  const optionAwayManual = document.getElementById('option-away-manual');
  const gpsStatusBox = document.getElementById('gps-status-box');

  const gpsContactForm = document.getElementById('gps-contact-form');
  const gpsSummaryCountry = document.getElementById('gps-summary-country');
  const gpsSummaryPincode = document.getElementById('gps-summary-pincode');
  const gpsSummaryState = document.getElementById('gps-summary-state');
  const gpsSummaryDistrict = document.getElementById('gps-summary-district');
  const gpsSummaryLocality = document.getElementById('gps-summary-locality');

  const manualForm = document.getElementById('manual-address-form');
  const pinInput = document.getElementById('manual-pincode');
  const pinStatus = document.getElementById('manual-pincode-status');
  const stateInput = document.getElementById('manual-state');
  const districtInput = document.getElementById('manual-district');
  const localitySelect = document.getElementById('manual-locality-select');
  const localityInput = document.getElementById('manual-locality-input');
  const houseInput = document.getElementById('manual-house');
  const streetInput = document.getElementById('manual-street');

  let leafletMap = null;
  let leafletMarker = null;
  let detectedGpsData = null;
  let selectedGpsAddressType = { label: 'HOME', icon: '🏠' };
  let selectedAddressType = { label: 'HOME', icon: '🏠' };
  let editingAddressId = null;

  // View Switcher Helper
  function showView(targetView) {
    [viewSaved, viewChoice, viewGpsMap, viewManual].forEach(v => {
      if (v) v.style.display = 'none';
    });
    if (targetView) targetView.style.display = 'flex';
  }

  // Render Saved Addresses List
  function renderSavedAddresses() {
    if (!savedContainer) return;
    savedContainer.innerHTML = '';
    if (savedBadge) savedBadge.textContent = `${savedAddresses.length} saved`;

    if (savedAddresses.length === 0) {
      savedContainer.innerHTML = `
        <div style="text-align: center; padding: 28px 16px; background: #f8fafc; border-radius: 16px; border: 1.5px dashed #cbd5e1;">
          <div style="font-size: 32px; margin-bottom: 8px;">📍</div>
          <h4 style="margin: 0 0 4px; font-size: 14px; font-weight: 700; color: #334155;">No Saved Locations Yet</h4>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Click "Add New Location" above to add your delivery address.</p>
        </div>
      `;
      return;
    }

    savedAddresses.forEach(addr => {
      const isSelected = (savedLoc && (savedLoc.id === addr.id || (savedLoc.pin === addr.pin && savedLoc.name === addr.name)));
      const card = document.createElement('div');
      card.className = `saved-address-card ${isSelected ? 'selected' : ''}`;
      const addressText = addr.fullAddress || `${addr.name || ''}, ${addr.district || ''} - ${addr.pin || ''}`;
      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="type-pill-badge">${dtfEscapeHtml(addr.typeIcon || '📍')} ${dtfEscapeHtml(addr.label || 'HOME')}</span>
            ${isSelected ? '<span class="active-pill-badge">★ ACTIVE</span>' : ''}
          </div>
          <button type="button" class="btn-select-addr" style="padding: 6px 14px; background: ${isSelected ? '#6366f1' : 'rgba(99,102,241,0.08)'}; color: ${isSelected ? '#ffffff' : '#6366f1'}; border: none; border-radius: 8px; font-size: 11.5px; font-weight: 700; cursor: pointer;">
            ${isSelected ? 'Selected ✓' : 'Deliver Here ➔'}
          </button>
        </div>
        <div>
          <div style="font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 2px;">
            ${dtfEscapeHtml(addr.personName || 'Customer')} <span style="font-size: 12px; font-weight: 500; color: #6b7280;">• ${dtfEscapeHtml(addr.phone || '')}</span>
          </div>
          <p style="margin: 0; font-size: 12.5px; font-weight: 500; color: #4b5563; line-height: 1.4;">
            ${dtfEscapeHtml(addressText)}
          </p>
        </div>
        
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; border-top: 1px solid #f1f5f9; padding-top: 8px; margin-top: 4px;" onclick="event.stopPropagation();">
          <button type="button" class="btn-edit-addr" style="background: none; border: none; color: #6366f1; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px;">
            ✏️ Edit
          </button>
          <button type="button" class="btn-delete-addr" style="background: none; border: none; color: #ef4444; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 6px;">
            🗑️ Delete
          </button>
        </div>
      `;

      card.addEventListener('click', () => selectActiveAddress(addr));

      const editBtn = card.querySelector('.btn-edit-addr');
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openEditAddressForm(addr);
      });

      const deleteBtn = card.querySelector('.btn-delete-addr');
      deleteBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`Delete this ${addr.label || 'HOME'} address?`)) return;
        try {
          if (addr.id && !String(addr.id).startsWith('manual-')) {
            await fetch(`http://localhost:5000/address/${addr.id}`, { method: 'DELETE' });
          }
        } catch {}
        savedAddresses = savedAddresses.filter(a => a.id !== addr.id);
        localStorage.setItem('dtf_saved_addresses', JSON.stringify(savedAddresses));
        if (savedLoc && savedLoc.id === addr.id) {
          savedLoc = savedAddresses.length > 0 ? savedAddresses[0] : null;
          localStorage.setItem('dtf_user_location', JSON.stringify(savedLoc));
          if (textEl) textEl.textContent = renderSubbarText();
        }
        renderSavedAddresses();
      });

      savedContainer.appendChild(card);
    });
  }

  // Edit Address Form
  function openEditAddressForm(addr) {
    editingAddressId = addr.id;
    const formTitle = viewManual.querySelector('h3');
    const submitBtn = manualForm.querySelector('button[type="submit"]');
    if (formTitle) formTitle.textContent = 'Edit Delivery Details';
    if (submitBtn) submitBtn.textContent = 'Update Address ✏️';
    if (pinInput) pinInput.value = addr.pin || '';
    if (stateInput) stateInput.value = addr.state || '';
    if (districtInput) districtInput.value = addr.district || '';
    if (localityInput) localityInput.value = addr.name || '';
    if (houseInput) houseInput.value = addr.house || '';
    if (streetInput) streetInput.value = addr.street || '';
    showView(viewManual);
  }

  // Select Active Address
  function selectActiveAddress(addr) {
    savedLoc = { name: addr.name || addr.label, pin: addr.pin, id: addr.id, full: addr.fullAddress };
    localStorage.setItem('dtf_user_location', JSON.stringify(savedLoc));
    document.querySelectorAll('#subbar-location-text, #desktop-location-text, .desktop-location-text').forEach(el => {
      el.textContent = `📍 ${savedLoc.name} ${savedLoc.pin}`;
    });
    backdrop.classList.remove('active');
    renderSavedAddresses();
  }

  // Open Sheet Drawer
  function openSheet() {
    let activeBackdrop = document.getElementById('location-bottom-sheet-backdrop');
    if (!activeBackdrop) return;

    renderSavedAddresses();

    const viewSavedEl = document.getElementById('loc-view-saved');
    const viewChoiceEl = document.getElementById('loc-view-choice');
    const backBtn = document.getElementById('btn-back-to-saved');

    if (savedAddresses && savedAddresses.length > 0) {
      if (backBtn) backBtn.textContent = '← Back';
      showView(viewSavedEl);
    } else {
      if (backBtn) backBtn.textContent = '✕ Close';
      showView(viewChoiceEl);
    }

    activeBackdrop.classList.add('active');
    activeBackdrop.style.setProperty('display', 'flex', 'important');
    activeBackdrop.style.setProperty('opacity', '1', 'important');
    activeBackdrop.style.setProperty('visibility', 'visible', 'important');
    activeBackdrop.style.setProperty('pointer-events', 'auto', 'important');
    document.body.style.overflow = 'hidden';
  }

  // Close Sheet Drawer
  function closeSheet() {
    const activeBackdrop = document.getElementById('location-bottom-sheet-backdrop');
    if (activeBackdrop) {
      activeBackdrop.classList.remove('active');
      activeBackdrop.style.setProperty('display', 'none', 'important');
      activeBackdrop.style.setProperty('opacity', '0', 'important');
      activeBackdrop.style.setProperty('visibility', 'hidden', 'important');
      activeBackdrop.style.setProperty('pointer-events', 'none', 'important');
    }
    document.body.style.overflow = '';
  }

  // Expose globally for inline onclick handlers and external calls
  window.openLocationSheet = openSheet;
  window.closeLocationSheet = closeSheet;

  // Helper for triggering live GPS detection
  function triggerGpsDetection() {
    const viewGpsMapEl = document.getElementById('loc-view-gps-map');
    const viewManualEl = document.getElementById('loc-view-manual');
    const gpsStatusBoxEl = document.getElementById('gps-status-box');
    const gpsSummaryCountryEl = document.getElementById('gps-summary-country');
    const gpsSummaryPincodeEl = document.getElementById('gps-summary-pincode');
    const gpsSummaryStateEl = document.getElementById('gps-summary-state');
    const gpsSummaryDistrictEl = document.getElementById('gps-summary-district');
    const gpsSummaryLocalityEl = document.getElementById('gps-summary-locality');

    if (!navigator.geolocation) {
      alert('GPS Geolocation is not supported by your browser.');
      return;
    }

    showView(viewGpsMapEl);

    if (gpsSummaryCountryEl) gpsSummaryCountryEl.textContent = 'India 🇮🇳';
    if (gpsSummaryPincodeEl) gpsSummaryPincodeEl.textContent = '⏳ Detecting PIN...';
    if (gpsSummaryStateEl) gpsSummaryStateEl.textContent = '⏳ Detecting State...';
    if (gpsSummaryDistrictEl) gpsSummaryDistrictEl.textContent = '⏳ Detecting District...';
    if (gpsSummaryLocalityEl) gpsSummaryLocalityEl.textContent = '📡 Triangulating GPS...';

    if (gpsStatusBoxEl) {
      gpsStatusBoxEl.style.display = 'block';
      gpsStatusBoxEl.style.background = '#eff6ff';
      gpsStatusBoxEl.style.color = '#1d4ed8';
      gpsStatusBoxEl.textContent = '📡 Detecting exact GPS coordinates & location details...';
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          detectedGpsData = await resolveHighPrecisionAddress(lat, lon);

          const { country, area, state, district, pin } = detectedGpsData;

          if (gpsSummaryCountryEl) gpsSummaryCountryEl.textContent = `${country} 🇮🇳`;
          if (gpsSummaryPincodeEl) gpsSummaryPincodeEl.textContent = pin;
          if (gpsSummaryStateEl) gpsSummaryStateEl.textContent = state;
          if (gpsSummaryDistrictEl) gpsSummaryDistrictEl.textContent = district;
          if (gpsSummaryLocalityEl) gpsSummaryLocalityEl.textContent = area;

          setTimeout(() => {
            const mapDiv = document.getElementById('gps-interactive-map');
            if (mapDiv && window.L) {
              if (leafletMap) { leafletMap.remove(); leafletMap = null; }
              leafletMap = L.map(mapDiv).setView([lat, lon], 16);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19, attribution: '© OpenStreetMap'
              }).addTo(leafletMap);
              leafletMarker = L.marker([lat, lon], { draggable: true }).addTo(leafletMap);
              leafletMarker.bindPopup(`<b>📍 ${area}</b><br>${district}, ${state} - ${pin}`).openPopup();

              leafletMarker.on('dragend', async function() {
                const mPos = leafletMarker.getLatLng();
                try {
                  const rData = await resolveHighPrecisionAddress(mPos.lat, mPos.lng);
                  detectedGpsData.area = rData.area;
                  detectedGpsData.pin = rData.pin;
                  detectedGpsData.state = rData.state;
                  detectedGpsData.district = rData.district;

                  if (gpsSummaryLocalityEl) gpsSummaryLocalityEl.textContent = rData.area;
                  if (gpsSummaryPincodeEl) gpsSummaryPincodeEl.textContent = rData.pin;
                  if (gpsSummaryStateEl) gpsSummaryStateEl.textContent = rData.state;
                  if (gpsSummaryDistrictEl) gpsSummaryDistrictEl.textContent = rData.district;
                  leafletMarker.bindPopup(`<b>📍 ${rData.area}</b><br>${rData.district}, ${rData.state} - ${rData.pin}`).openPopup();
                } catch {}
              });
            }
          }, 200);

        } catch (err) {
          console.error('GPS reverse geocoding failed:', err);
          alert('⚠️ Unable to fetch location details. Please enter manually.');
          showView(viewManualEl);
        } finally {
          if (gpsStatusBoxEl) gpsStatusBoxEl.style.display = 'none';
        }
      },
      (err) => {
        alert('⚠️ GPS Access Permission Denied. Please enter details manually.');
        if (gpsStatusBoxEl) gpsStatusBoxEl.style.display = 'none';
        showView(viewManualEl);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  // Helper for opening manual form
  function openManualForm() {
    editingAddressId = null;
    const viewManualEl = document.getElementById('loc-view-manual');
    const manualFormEl = document.getElementById('manual-address-form');
    const formTitle = viewManualEl ? viewManualEl.querySelector('h3') : null;
    const submitBtn = manualFormEl ? manualFormEl.querySelector('button[type="submit"]') : null;
    if (formTitle) formTitle.textContent = 'Enter Delivery Details';
    if (submitBtn) submitBtn.textContent = 'Save & Deliver Here 🚀';
    if (manualFormEl) manualFormEl.reset();
    showView(viewManualEl);
  }

  // Master Document-level click handler for all location triggers & controls
  document.addEventListener('click', (e) => {
    // 1. If click is inside location sheet drawer
    if (e.target.closest('#location-bottom-sheet-backdrop')) {
      const closeBtn = e.target.closest('#close-loc-sheet');
      if (closeBtn || e.target.id === 'location-bottom-sheet-backdrop') {
        e.preventDefault();
        closeSheet();
        return;
      }

      const optionGpsCard = e.target.closest('#option-gps-detect');
      if (optionGpsCard) {
        e.preventDefault();
        triggerGpsDetection();
        return;
      }

      const optionAwayCard = e.target.closest('#option-away-manual');
      if (optionAwayCard) {
        e.preventDefault();
        openManualForm();
        return;
      }

      const gotoAdd = e.target.closest('#btn-goto-add-choice');
      if (gotoAdd) {
        e.preventDefault();
        showView(document.getElementById('loc-view-choice'));
        return;
      }

      const backToSaved = e.target.closest('#btn-back-to-saved');
      if (backToSaved) {
        e.preventDefault();
        if (savedAddresses && savedAddresses.length > 0) {
          showView(document.getElementById('loc-view-saved'));
        } else {
          closeSheet();
        }
        return;
      }

      const backFromGps = e.target.closest('#btn-back-from-gps');
      const backToChoice = e.target.closest('#btn-back-to-choice');
      if (backFromGps || backToChoice) {
        e.preventDefault();
        showView(document.getElementById('loc-view-choice'));
        return;
      }
      return;
    }

    // 2. Open trigger from subbar or desktop location button
    const openTrigger = e.target.closest('.location-subbar, #react-address-picker-root, #subbar-change-location-btn, #subbar-location-text, .desktop-location-btn, #desktop-location-btn, #desktop-location-text');
    if (openTrigger) {
      e.preventDefault();
      e.stopPropagation();
      openSheet();
    }
  });

  // High-Precision Geocoding & Pincode Resolver (Direct Nominatim + India Post API Fallback)
  async function resolveHighPrecisionAddress(lat, lon) {
    let country = 'India';
    let state = 'State';
    let district = 'District';
    let area = 'Detected Location';
    let road = '';
    let pin = '';
    let rawData = {};

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
      if (res.ok) {
        rawData = await res.json();
        const addr = rawData.address || {};

        country = addr.country || 'India';
        state = addr.state || 'State';
        district = addr.state_district || addr.district || addr.administrative_area_level_2 || addr.county || addr.city_district || 'District';
        area = addr.suburb || addr.neighbourhood || addr.village || addr.residential || addr.city || addr.town || addr.quarter || addr.hamlet || 'Detected Location';
        road = addr.road || addr.street || addr.pedestrian || area;

        // Clean 6-digit PIN code extraction
        const rawPostcode = (addr.postcode || addr.postal_code || '').toString();
        const pinMatch = rawPostcode.match(/\d{6}/);
        if (pinMatch) {
          pin = pinMatch[0];
        }
      }
    } catch (err) {
      console.warn('Nominatim reverse geocode attempt error:', err);
    }

    // Helper to check district match, supporting new AP district mappings to historical records
    function isDistrictMatch(poDistrict, resolvedDistrict) {
      if (!poDistrict || !resolvedDistrict) return false;
      const poDist = poDistrict.toLowerCase().replace(/[^a-z0-9]/g, '');
      const resDist = resolvedDistrict.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (poDist.includes(resDist) || resDist.includes(poDist)) return true;
      
      const apDistrictMap = {
        'ntr': ['krishna'],
        'anakapalli': ['visakhapatnam'],
        'kakinada': ['eastgodavari', 'godavari'],
        'konaseema': ['eastgodavari', 'godavari'],
        'eluru': ['westgodavari', 'godavari'],
        'palnadu': ['guntur'],
        'bapatla': ['guntur', 'prakasam'],
        'nandyal': ['kurnool'],
        'sri sathya sai': ['anantapur'],
        'tirupati': ['chittoor'],
        'annamayya': ['cuddapah', 'kadapa', 'ysr']
      };

      for (const [newDist, origDists] of Object.entries(apDistrictMap)) {
        const cleanNew = newDist.replace(/[^a-z0-9]/g, '');
        if (resDist.includes(cleanNew)) {
          if (origDists.some(orig => poDist.includes(orig) || orig.includes(poDist))) {
            return true;
          }
        }
      }
      return false;
    }

    // Apply district formatting with historical mapping
    const apDistrictFormatMap = {
      'ntr': 'Krishna',
      'anakapalli': 'Visakhapatnam',
      'kakinada': 'East Godavari',
      'konaseema': 'East Godavari',
      'eluru': 'West Godavari',
      'palnadu': 'Guntur',
      'bapatla': 'Guntur',
      'nandyal': 'Kurnool',
      'sri sathya sai': 'Anantapur',
      'tirupati': 'Chittoor',
      'annamayya': 'Cuddapah'
    };

    const normDist = district.toLowerCase();
    for (const [newDist, origDist] of Object.entries(apDistrictFormatMap)) {
      if (normDist.includes(newDist)) {
        district = `${district} (${origDist})`;
        break;
      }
    }

    // India Post Office API Validation (Verify if Nominatim postcode matches the resolved place)
    if (pin && pin.length === 6 && country.toLowerCase().includes('india')) {
      try {
        const valRes = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        if (valRes.ok) {
          const valData = await valRes.json();
          if (Array.isArray(valData) && valData[0] && valData[0].Status === 'Success' && Array.isArray(valData[0].PostOffice)) {
            const isMatch = valData[0].PostOffice.some(po => 
              (state && po.State && po.State.toLowerCase() === state.toLowerCase()) &&
              isDistrictMatch(po.District, district)
            );
            if (!isMatch) {
              console.warn(`[Fashion Company Geo] Pincode ${pin} does not match state "${state}" & district "${district}". Invalidating pin.`);
              pin = ''; // Mismatched pincode — mark invalid to trigger fallback search
            }
          }
        }
      } catch (e) {
        console.warn('Pincode verification failed:', e);
      }
    }

    // India Post Office API Fallback (If Pincode missing or invalidated by check)
    if ((!pin || pin.length !== 6) && country.toLowerCase().includes('india')) {
      const searchPlaces = [area, district].filter(Boolean);
      for (const place of searchPlaces) {
        try {
          const cleanToken = place.split(',')[0].split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').trim();
          if (cleanToken.length < 3) continue;

          const ipRes = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(cleanToken)}`);
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            if (Array.isArray(ipData) && ipData[0] && ipData[0].Status === 'Success' && Array.isArray(ipData[0].PostOffice)) {
              const matchedPO = ipData[0].PostOffice.find(po => 
                (state && po.State && po.State.toLowerCase() === state.toLowerCase()) &&
                isDistrictMatch(po.District, district)
              ) || ipData[0].PostOffice.find(po => 
                state && po.State && po.State.toLowerCase() === state.toLowerCase()
              ) || ipData[0].PostOffice[0];

              if (matchedPO && matchedPO.Pincode) {
                pin = matchedPO.Pincode;
                console.log(`[Fashion Company Geo] Resolved verified pincode ${pin} for place "${cleanToken}"`);
                if (area === 'Detected Location') area = matchedPO.Name;
                break;
              }
            }
          }
        } catch (e) {
          console.warn('India Post API fallback failed:', e);
        }
      }
    }

    if (!pin) pin = '500001';

    return { lat, lon, country, state, district, area, road, pin, rawData };
  }

  // Option 1: GPS Live Geolocation Detection + Interactive Leaflet Map
  if (optionGps) {
    optionGps.addEventListener('click', () => {
      if (!navigator.geolocation) return alert('GPS Geolocation is not supported by your browser.');
      
      // Immediately move to GPS map view page and display live detecting state
      showView(viewGpsMap);

      if (gpsSummaryCountry) gpsSummaryCountry.textContent = 'India 🇮🇳';
      if (gpsSummaryPincode) gpsSummaryPincode.textContent = '⏳ Detecting PIN...';
      if (gpsSummaryState) gpsSummaryState.textContent = '⏳ Detecting State...';
      if (gpsSummaryDistrict) gpsSummaryDistrict.textContent = '⏳ Detecting District...';
      if (gpsSummaryLocality) gpsSummaryLocality.textContent = '📡 Triangulating GPS...';

      if (gpsStatusBox) {
        gpsStatusBox.style.display = 'block';
        gpsStatusBox.style.background = '#eff6ff';
        gpsStatusBox.style.color = '#1d4ed8';
        gpsStatusBox.textContent = '📡 Detecting exact GPS coordinates & location details...';
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            detectedGpsData = await resolveHighPrecisionAddress(lat, lon);

            const { country, area, state, district, pin } = detectedGpsData;

            if (gpsSummaryCountry) gpsSummaryCountry.textContent = `${country} 🇮🇳`;
            if (gpsSummaryPincode) gpsSummaryPincode.textContent = pin;
            if (gpsSummaryState) gpsSummaryState.textContent = state;
            if (gpsSummaryDistrict) gpsSummaryDistrict.textContent = district;
            if (gpsSummaryLocality) gpsSummaryLocality.textContent = area;

            setTimeout(() => {
              const mapDiv = document.getElementById('gps-interactive-map');
              if (mapDiv && window.L) {
                if (leafletMap) { leafletMap.remove(); leafletMap = null; }
                leafletMap = L.map(mapDiv).setView([lat, lon], 16);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  maxZoom: 19, attribution: '© OpenStreetMap'
                }).addTo(leafletMap);
                leafletMarker = L.marker([lat, lon], { draggable: true }).addTo(leafletMap);
                leafletMarker.bindPopup(`<b>📍 ${area}</b><br>${district}, ${state} - ${pin}`).openPopup();
                
                leafletMarker.on('dragend', async function() {
                  const mPos = leafletMarker.getLatLng();
                  try {
                    const rData = await resolveHighPrecisionAddress(mPos.lat, mPos.lng);
                    detectedGpsData.area = rData.area;
                    detectedGpsData.pin = rData.pin;
                    detectedGpsData.state = rData.state;
                    detectedGpsData.district = rData.district;

                    if (gpsSummaryLocality) gpsSummaryLocality.textContent = rData.area;
                    if (gpsSummaryPincode) gpsSummaryPincode.textContent = rData.pin;
                    if (gpsSummaryState) gpsSummaryState.textContent = rData.state;
                    if (gpsSummaryDistrict) gpsSummaryDistrict.textContent = rData.district;
                    leafletMarker.bindPopup(`<b>📍 ${rData.area}</b><br>${rData.district}, ${rData.state} - ${rData.pin}`).openPopup();
                  } catch {}
                });
              }
            }, 200);

          } catch (err) {
            console.error('GPS reverse geocoding failed:', err);
            alert('⚠️ Unable to fetch location details. Please enter manually.');
            showView(viewManual);
          } finally {
            if (gpsStatusBox) gpsStatusBox.style.display = 'none';
          }
        },
        (err) => {
          alert('⚠️ GPS Access Permission Denied. Please enter details manually.');
          if (gpsStatusBox) gpsStatusBox.style.display = 'none';
          showView(viewManual);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }

  // GPS Contact Form Submit
  if (gpsContactForm) {
    gpsContactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('gps-fullname').value.trim();
      const mobile = document.getElementById('gps-mobile').value.trim();
      const altMobile = document.getElementById('gps-alt-mobile').value.trim();
      const house = document.getElementById('gps-house').value.trim();
      const street = document.getElementById('gps-street').value.trim();

      if (!fullName || !mobile || mobile.length !== 10 || !house) {
        return alert('Please fill all mandatory fields (Full Name, Mobile 10 digits, House No.)');
      }

      const gpsData = detectedGpsData || {};
      const fullAddr = `${house}, ${street ? street + ', ' : ''}${gpsData.area || ''}, ${gpsData.district || ''}, ${gpsData.state || ''} - ${gpsData.pin || ''}`;

      const newAddr = {
        id: 'gps-' + Date.now(),
        label: selectedGpsAddressType.label,
        typeIcon: selectedGpsAddressType.icon,
        name: gpsData.area || 'Location',
        personName: fullName,
        phone: mobile,
        fullAddress: fullAddr,
        pin: gpsData.pin || '',
        state: gpsData.state || '',
        district: gpsData.district || '',
        house: house,
        street: street
      };

      try {
        await fetch('http://localhost:5000/address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName, mobile: mobile, house_number: house, street: street,
            area: gpsData.area || '', city: gpsData.district || '', state: gpsData.state || '',
            pincode: gpsData.pin || '', address_type: selectedGpsAddressType.label, is_default: true
          })
        });
      } catch {}

      savedAddresses.unshift(newAddr);
      localStorage.setItem('dtf_saved_addresses', JSON.stringify(savedAddresses));
      selectActiveAddress(newAddr);
      gpsContactForm.reset();
    });
  }

  // Option 2: Away from Location -> Manual Entry
  if (optionAwayManual) {
    optionAwayManual.addEventListener('click', () => {
      editingAddressId = null;
      const formTitle = viewManual.querySelector('h3');
      const submitBtn = manualForm.querySelector('button[type="submit"]');
      if (formTitle) formTitle.textContent = 'Enter Delivery Details';
      if (submitBtn) submitBtn.textContent = 'Save & Deliver Here 🚀';
      manualForm.reset();
      showView(viewManual);
    });
  }

  // Pincode Auto Lookup for Manual Form
  if (pinInput) {
    pinInput.addEventListener('input', async () => {
      const val = pinInput.value.trim();
      if (/^\d{6}$/.test(val)) {
        pinStatus.textContent = '🔄 Fetching State & District for pincode ' + val + '...';
        pinStatus.style.color = '#6366f1';
        try {
          const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
          const data = await res.json();
          if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
            const poList = data[0].PostOffice;
            const first = poList[0];
            stateInput.value = first.State || '';
            districtInput.value = first.District || '';
            localitySelect.innerHTML = '<option value="">Select Post Office / Locality</option>';
            poList.forEach(po => {
              const opt = document.createElement('option');
              opt.value = po.Name;
              opt.textContent = `${po.Name} (${po.BranchType})`;
              localitySelect.appendChild(opt);
            });
            localitySelect.style.display = 'block';
            localityInput.placeholder = 'Or enter custom locality name';
            pinStatus.textContent = `✅ ${first.District}, ${first.State} detected!`;
            pinStatus.style.color = '#10b981';
          } else {
            pinStatus.textContent = '⚠️ Valid pincode entered. Please enter state & district below.';
            pinStatus.style.color = '#f59e0b';
          }
        } catch {
          pinStatus.textContent = 'Enter state and district details below.';
          pinStatus.style.color = '#6b7280';
        }
      } else {
        pinStatus.textContent = 'Type 6 digits to auto-detect State & District';
        pinStatus.style.color = '#6b7280';
      }
    });
  }

  // Type Chips handler (Home / Work / Other)
  document.querySelectorAll('.chip-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chip-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedAddressType = { label: btn.dataset.type || 'HOME', icon: btn.dataset.icon || '🏠' };
    });
  });

  // Manual Form Submission Handler
  if (manualForm) {
    manualForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pin = pinInput.value.trim();
      const st = stateInput.value.trim();
      const dist = districtInput.value.trim();
      const loc = localitySelect.value || localityInput.value.trim();
      const house = houseInput.value.trim();
      const street = streetInput.value.trim();

      if (!/^\d{6}$/.test(pin)) return alert('Please enter a valid 6-digit pincode');
      if (!st || !dist || !loc || !house) return alert('Please fill in all required address fields');

      const fullAddr = `${house}, ${street ? street + ', ' : ''}${loc}, ${dist}, ${st}`;

      if (editingAddressId) {
        const idx = savedAddresses.findIndex(a => a.id === editingAddressId);
        if (idx > -1) {
          savedAddresses[idx] = {
            ...savedAddresses[idx],
            label: selectedAddressType.label, typeIcon: selectedAddressType.icon,
            name: loc, fullAddress: fullAddr, pin: pin, state: st, district: dist, house: house, street: street
          };
          selectActiveAddress(savedAddresses[idx]);
          alert(`🎉 Address Updated Successfully!\nDelivering to ${loc} - ${pin}`);
        }
        editingAddressId = null;
      } else {
        const newAddr = {
          id: 'manual-' + Date.now(), label: selectedAddressType.label, typeIcon: selectedAddressType.icon,
          name: loc, personName: 'Customer', phone: '', fullAddress: fullAddr,
          pin: pin, state: st, district: dist, house: house, street: street
        };
        try {
          await fetch('http://localhost:5000/address', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: 'Customer', mobile: '', house_number: house, street: street,
              area: loc, city: dist, state: st, pincode: pin,
              address_type: selectedAddressType.label, is_default: true
            })
          });
        } catch {}
        savedAddresses.unshift(newAddr);
        selectActiveAddress(newAddr);
        alert(`🎉 Address Saved Successfully!\nDelivering to ${loc} - ${pin}`);
      }
      localStorage.setItem('dtf_saved_addresses', JSON.stringify(savedAddresses));
    });
  }

})();
