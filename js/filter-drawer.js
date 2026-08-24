/* ============================================================
   SHARED FILTER DRAWER UI MODULE
   Handles: accordion toggle, drawer open/close, body scroll lock,
   Escape key, overlay click-to-close.
   
   Loaded on: shop.html, mens-wear.html, womens-wear.html, kids-wear.html
   Each page keeps its own filter apply/reset/data logic.
   ============================================================ */
(function initFilterDrawer() {
  'use strict';

  function lockBodyScroll() {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockBodyScroll() {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  function openDrawer(overlay) {
    if (!overlay) return;
    overlay.classList.add('active');
    lockBodyScroll();
  }

  function closeDrawer(overlay) {
    if (!overlay || !overlay.classList.contains('active')) return;
    overlay.classList.remove('active');
    unlockBodyScroll();
  }

  function setup() {
    var overlay = document.getElementById('filter-drawer-overlay');
    if (!overlay) return;

    // Accordion toggle (delegated on the overlay for robustness)
    overlay.addEventListener('click', function(e) {
      var btn = e.target.closest('.filter-accordion-btn');
      if (btn) {
        var isOpening = !btn.classList.contains('active');
        
        // Close all other accordions
        var allBtns = overlay.querySelectorAll('.filter-accordion-btn');
        allBtns.forEach(function(b) {
          b.classList.remove('active');
          if (b.nextElementSibling) b.nextElementSibling.classList.remove('active');
        });

        // Open the clicked one if it was previously closed
        if (isOpening) {
          btn.classList.add('active');
          var content = btn.nextElementSibling;
          if (content) content.classList.add('active');
        }
      }
    });

    // Open button
    var openBtn = document.getElementById('open-filter-btn');
    if (openBtn) {
      openBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openDrawer(overlay);
      });
    }

    // Close button
    var closeBtn = document.getElementById('close-filter-drawer');
    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        closeDrawer(overlay);
      });
    }

    // Overlay background click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeDrawer(overlay);
      }
    });

    // Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeDrawer(overlay);
      }
    });

    // Expose close function globally so page-specific apply handlers can use it
    window.closeFilterDrawer = function() {
      closeDrawer(overlay);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
