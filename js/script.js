/* ============================================================
   DEVTECH FASHION — MAIN JAVASCRIPT
   Author: DevTech Solutions (Purna Sai & Prabhas)
   Version: 1.0.0
   ============================================================ */

'use strict';

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
   MOBILE MENU — HAMBURGER TOGGLE
   ============================================================ */
(function initMobileMenu() {
  const hamburger  = $('#hamburger');
  const mobileMenu = $('#mobile-menu');
  if (!hamburger || !mobileMenu) return;

  let isOpen = false;

  function openMenu() {
    isOpen = true;
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    // Trap focus inside mobile menu
    mobileMenu.querySelector('a, button')?.focus();
  }

  function closeMenu() {
    isOpen = false;
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    if (isOpen) closeMenu();
    else openMenu();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) closeMenu();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (isOpen && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
      closeMenu();
    }
  });

  // Close when a mobile link is clicked
  $$('.mobile-link, .mobile-actions .btn', mobileMenu).forEach((link) => {
    link.addEventListener('click', closeMenu);
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
  function getCount(key) {
    try {
      const data = JSON.parse(localStorage.getItem(key));
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
    '%c DevTech Fashion %c v1.0.0 ',
    'background: #1a1a2e; color: #4f8ef7; padding: 4px 8px; border-radius: 4px 0 0 4px; font-weight: bold;',
    'background: #4f8ef7; color: white; padding: 4px 8px; border-radius: 0 4px 4px 0;'
  );
}

/* ============================================================
   THEME TOGGLER (Light / Dark / System)
   ============================================================ */
(function initThemeToggler() {
  const themeBtns = document.querySelectorAll('.theme-toggle-btn');
  if (!themeBtns.length) return;

  const themes = ['light', 'dark', 'system'];
  
  function applyTheme(theme) {
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    // Update icons
    themeBtns.forEach(btn => {
      btn.setAttribute('data-current-theme', theme);
      btn.setAttribute('aria-label', `Toggle theme (current: ${theme})`);
      const icon = btn.querySelector('.theme-icon');
      if (icon) {
        if (theme === 'light') icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'; // Sun
        else if (theme === 'dark') icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'; // Moon
        else icon.innerHTML = '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>'; // Monitor
      }
    });
  }

  // Initial load
  let currentTheme = localStorage.getItem('dtf_theme') || 'system';
  applyTheme(currentTheme);

  // Toggle on click
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      let idx = themes.indexOf(currentTheme);
      idx = (idx + 1) % themes.length;
      currentTheme = themes[idx];
      localStorage.setItem('dtf_theme', currentTheme);
      applyTheme(currentTheme);
    });
  });

  // Watch system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (currentTheme === 'system') applyTheme('system');
  });
})();
