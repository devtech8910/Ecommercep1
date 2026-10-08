(function () {
  'use strict';
  const section = document.getElementById('ad-carousel');
  const track = document.getElementById('ad-carousel-track');
  const wrapper = section && section.querySelector('.ad-carousel-wrapper');
  const dotsContainer = document.getElementById('ad-dots');
  const previous = document.getElementById('ad-prev-btn');
  const next = document.getElementById('ad-next-btn');
  if (!wrapper || !track || !dotsContainer || !previous || !next) return;
  if (wrapper.dataset.controllerInitialized === 'true') return;
  wrapper.dataset.controllerInitialized = 'true';

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  let slides = [];
  let currentSlide = 0;
  let ready = false;
  let moving = false;
  let hovered = false;
  let focused = false;
  let touching = false;
  let autoTimer = null;
  let suppressClickUntil = 0;
  const animations = new Set();
  const AUTO_INTERVAL = 5000;
  const message = document.createElement('p');
  message.className = 'ad-carousel-message';
  message.setAttribute('role', 'status');
  message.hidden = true;
  wrapper.appendChild(message);
  wrapper.dataset.state = 'loading';
  section.setAttribute('aria-busy', 'true');

  if (!location.hash && performance.getEntriesByType('navigation')[0]?.type !== 'back_forward') {
    const restoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    scrollTo({ top: 0, behavior: 'instant' });
    window.addEventListener('pageshow', event => {
      if (!event.persisted) scrollTo({ top: 0, behavior: 'instant' });
    });
    window.addEventListener('pagehide', () => { history.scrollRestoration = restoration; }, { once: true });
  }

  function stopAuto() {
    clearTimeout(autoTimer);
    autoTimer = null;
  }

  function startAuto() {
    stopAuto();
    const image = slides[currentSlide]?.querySelector('img');
    if (!ready || moving || hovered || focused || touching || document.hidden || reducedMotion.matches || slides.length < 2 || !image?.complete || !image.naturalWidth) return;
    autoTimer = setTimeout(() => goToSlide(currentSlide + 1, 1), AUTO_INTERVAL);
  }

  function updateFocus() {
    const target = document.activeElement;
    focused = wrapper.contains(target) && (target.tagName === 'A' || target.matches(':focus-visible'));
    startAuto();
  }

  function updateLayout() {
    const headerBottom = ['#navbar', '.location-subbar'].reduce((bottom, selector) => {
      const element = document.querySelector(selector);
      if (!element || getComputedStyle(element).display === 'none') return bottom;
      return Math.max(bottom, (parseFloat(getComputedStyle(element).top) || 0) + element.offsetHeight);
    }, 0);
    const documentTop = section.getBoundingClientRect().top + scrollY;
    const bannerTop = Math.max(documentTop, headerBottom + 8);
    section.style.setProperty('--banner-header-space', Math.max(0, bannerTop - documentTop) + 'px');
    const mobile = innerWidth < 768;
    const landscape = mobile && innerWidth >= 480 && innerHeight <= 500;
    wrapper.style.removeProperty('--banner-caption-height');
    const captionHeight = mobile && !landscape ? Math.ceil(Math.max(innerHeight <= 650 ? 204 : 220, ...slides.map(slide => slide.querySelector('.ad-slide-content').getBoundingClientRect().height))) : 0;
    if (captionHeight) wrapper.style.setProperty('--banner-caption-height', captionHeight + 'px');
    const ticker = document.getElementById('announcement-bar');
    const tickerHeight = ticker ? ticker.getBoundingClientRect().height : 0;
    const dock = document.getElementById('mobile-bottom-nav');
    const dockVisible = dock && getComputedStyle(dock).display !== 'none' && dock.offsetHeight > 0;
    const viewportBottom = dockVisible ? (innerHeight - dock.offsetHeight - (parseFloat(getComputedStyle(dock).bottom) || 0) - 8) : innerHeight - (innerWidth <= 768 ? 86 : 12);
    const available = Math.max(0, viewportBottom - bannerTop - tickerHeight);
    const natural = mobile && !landscape ? wrapper.clientWidth * (innerHeight <= 650 ? .4 : 1.25) + captionHeight : wrapper.clientWidth * .4;
    const minimum = mobile && !landscape ? captionHeight + 80 : 210;
    wrapper.style.setProperty('--banner-height', Math.max(Math.min(minimum, available), Math.min(natural, available)) + 'px');
  }

  function waitForImage(image) {
    image.loading = 'eager';
    return new Promise((resolve, reject) => {
      let timeout;
      const finish = error => {
        clearTimeout(timeout);
        image.removeEventListener('load', loaded);
        image.removeEventListener('error', failed);
        if (error) reject(error); else resolve();
      };
      const loaded = () => {
        if (!image.naturalWidth) { failed(); return; }
        if (image.decode) image.decode().catch(() => {}).then(() => finish());
        else finish();
      };
      const failed = () => finish(new Error('The promotion image could not be loaded.'));
      timeout = setTimeout(failed, 15000);
      if (image.complete) { image.naturalWidth ? loaded() : failed(); }
      else {
        image.addEventListener('load', loaded, { once: true });
        image.addEventListener('error', failed, { once: true });
      }
    });
  }

  function showStatus(title, description) {
    stopAuto();
    ready = false;
    previous.disabled = next.disabled = true;
    dotsContainer.innerHTML = '';
    track.innerHTML = '<div class="ad-slide ad-slide--active ad-slide-loading"><div class="ad-slide-content"><span class="ad-slide-badge">Store sync</span><h2 class="ad-slide-title">' + escapeHtml(title) + '</h2><p class="ad-slide-desc">' + escapeHtml(description) + '</p></div></div>';
    wrapper.dataset.state = 'error';
    section.setAttribute('aria-busy', 'false');
  }

  function updateIndicators(index) {
    dotsContainer.querySelectorAll('.ad-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
      dot.setAttribute('aria-current', String(i === index));
    });
  }

  function setActive(index) {
    currentSlide = index;
    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('ad-slide--active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
    });
    updateIndicators(index);
    wrapper.dataset.currentSlide = String(index);
    extractHeaderColor(index);
  }

  async function goToSlide(index, direction = index > currentSlide ? 1 : -1) {
    if (!ready || moving) return;
    const target = ((index % slides.length) + slides.length) % slides.length;
    stopAuto();
    if (target === currentSlide) { startAuto(); return; }
    moving = true;
    wrapper.setAttribute('aria-busy', 'true');
    wrapper.dataset.state = 'loading-next';
    const outgoing = slides[currentSlide];
    const incoming = slides[target];
    const preserveLinkFocus = outgoing.contains(document.activeElement);
    message.hidden = true;
    try {
      await waitForImage(incoming.querySelector('img'));
      updateIndicators(target);
      wrapper.dataset.state = 'moving';
      outgoing.inert = true;
      if (!reducedMotion.matches && outgoing.animate) {
        incoming.classList.add('ad-slide--incoming');
        const timing = { duration: 600, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' };
        const outgoingMotion = outgoing.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + (-direction * 100) + '%)' }], timing);
        const incomingMotion = incoming.animate([{ transform: 'translateX(' + (direction * 100) + '%)' }, { transform: 'translateX(0)' }], timing);
        animations.add(outgoingMotion);
        animations.add(incomingMotion);
        await Promise.all([outgoingMotion.finished.catch(() => {}), incomingMotion.finished.catch(() => {})]);
        setActive(target);
        outgoingMotion.cancel();
        incomingMotion.cancel();
        animations.delete(outgoingMotion);
        animations.delete(incomingMotion);
        incoming.classList.remove('ad-slide--incoming');
      } else setActive(target);
      if (preserveLinkFocus) incoming.querySelector('a').focus({ preventScroll: true });
    } catch (error) {
      outgoing.inert = false;
      message.textContent = error.message + ' Please try again.';
      message.hidden = false;
    } finally {
      moving = false;
      wrapper.setAttribute('aria-busy', 'false');
      wrapper.dataset.state = 'ready';
      startAuto();
    }
  }

  async function buildSlides(banners) {
    stopAuto();
    section.hidden = false;
    section.classList.toggle('has-default-campaign', banners.some(banner => banner.isDefault));
    slides = banners.map((banner, i) => {
      const slide = document.createElement('div');
      slide.className = 'ad-slide' + (banner.isDefault ? ' ad-slide--default' : '');
      slide.dataset.link = banner.linkUrl || '#';
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', 'Promotion ' + (i + 1) + ' of ' + banners.length);
      slide.setAttribute('aria-hidden', 'true');
      slide.inert = true;
      slide.innerHTML = '<picture>' +
        (banner.mobileImageUrl ? '<source media="(max-width: 767px) and (min-height: 651px)" srcset="' + escapeHtml(banner.mobileImageUrl) + '">' : '') +
        '<img src="' + escapeHtml(banner.imageUrl) + '" alt="' + escapeHtml(banner.title || 'Promotion') + '" class="ad-slide-img" decoding="async" loading="' + (i === 0 ? 'eager' : 'lazy') + '">' +
        '</picture><div class="ad-slide-overlay"></div><div class="ad-slide-content">' +
        '<span class="ad-slide-badge">' + escapeHtml(banner.badge || '\u2726 Promotion') + '</span>' +
        '<h2 class="ad-slide-title">' + escapeHtml(banner.title || '') + '</h2>' +
        (banner.description ? '<p class="ad-slide-desc">' + escapeHtml(banner.description) + '</p>' : '') +
        '<a href="' + escapeHtml(banner.buttonLink || banner.linkUrl || '#') + '" class="ad-slide-cta">' + escapeHtml(banner.buttonText || 'Shop Now') + '</a></div>';
      slide.addEventListener('click', event => {
        if (moving || event.target.closest('.ad-slide-cta')) return;
        if (slide.dataset.link !== '#') location.href = slide.dataset.link;
      });
      slide.querySelector('img').addEventListener('load', () => {
        if (slide === slides[currentSlide]) startAuto();
      });
      return slide;
    });
    const fragment = document.createDocumentFragment();
    slides.forEach(slide => fragment.appendChild(slide));
    track.appendChild(fragment);
    updateLayout();
    await new Promise(requestAnimationFrame);
    try { await waitForImage(slides[0].querySelector('img')); }
    catch (error) { showStatus('Promotion unavailable', error.message + ' Please reload to try again.'); return; }
    track.querySelector('.ad-slide-loading')?.remove();
    dotsContainer.innerHTML = '';
    banners.forEach((banner, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ad-dot';
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      dot.title = banner.title || 'Promotion ' + (i + 1);
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    });
    previous.hidden = next.hidden = dotsContainer.hidden = slides.length < 2;
    previous.disabled = next.disabled = false;
    ready = true;
    setActive(0);
    wrapper.dataset.state = 'ready';
    section.setAttribute('aria-busy', 'false');
    updateLayout();
    if (slides[1]) slides[1].querySelector('img').loading = 'eager';
    if (slides.length > 2) slides.at(-1).querySelector('img').loading = 'eager';
    updateFocus();
    startAuto();
  }

  previous.addEventListener('click', () => goToSlide(currentSlide - 1, -1));
  next.addEventListener('click', () => goToSlide(currentSlide + 1, 1));
  wrapper.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse' && matchMedia('(hover: hover)').matches) { hovered = true; stopAuto(); }
  });
  wrapper.addEventListener('pointerleave', () => { hovered = false; startAuto(); });
  wrapper.addEventListener('focusin', updateFocus);
  wrapper.addEventListener('focusout', () => queueMicrotask(updateFocus));
  wrapper.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      goToSlide(currentSlide + (event.key === 'ArrowLeft' ? -1 : 1), event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  let touchStart = null;
  wrapper.addEventListener('touchstart', event => {
    const point = event.touches[0];
    touchStart = { x: point.clientX, y: point.clientY };
    touching = true;
    stopAuto();
  }, { passive: true });
  wrapper.addEventListener('touchend', event => {
    const point = event.changedTouches[0];
    touching = false;
    if (touchStart && Math.abs(touchStart.x - point.clientX) > 50 && Math.abs(touchStart.x - point.clientX) > Math.abs(touchStart.y - point.clientY)) {
      suppressClickUntil = Date.now() + 400;
      goToSlide(currentSlide + (touchStart.x > point.clientX ? 1 : -1), touchStart.x > point.clientX ? 1 : -1);
    } else startAuto();
    touchStart = null;
  }, { passive: true });
  wrapper.addEventListener('touchcancel', () => { touching = false; touchStart = null; startAuto(); }, { passive: true });
  wrapper.addEventListener('click', event => {
    if (Date.now() < suppressClickUntil && event.target.closest('.ad-slide')) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  document.addEventListener('visibilitychange', startAuto);
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) animations.forEach(animation => animation.finish());
    startAuto();
  });
  window.addEventListener('resize', () => { updateLayout(); startAuto(); });
  const layoutObserver = window.ResizeObserver ? new ResizeObserver(updateLayout) : null;
  function observeLayout() {
    ['#navbar', '.location-subbar', '#announcement-bar', '#mobile-bottom-nav'].forEach(selector => {
      const element = document.querySelector(selector);
      if (element && layoutObserver) layoutObserver.observe(element);
    });
    updateLayout();
  }
  observeLayout();
  document.addEventListener('DOMContentLoaded', observeLayout, { once: true });
  document.fonts?.ready.then(updateLayout);
  updateLayout();

  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const bannersUrl = isLocalhost ? 'https://fashion-company.netlify.app/.netlify/functions/banners?active=true' : '/.netlify/functions/banners?active=true';
  const mapBanner = banner => ({
    title: banner.title || '', description: banner.description || '',
    imageUrl: banner.imageUrl || banner.image_url || '',
    mobileImageUrl: banner.mobileImageUrl || banner.mobile_image_url || '',
    isDefault: banner.isDefault === true, linkUrl: banner.linkUrl || banner.link_url || '#',
    badge: banner.badge || '\u2726 Promotion', buttonText: banner.buttonText || banner.button_text || '',
    buttonLink: banner.buttonLink || banner.button_link || ''
  });
  async function loadBanners() {
    try {
      const response = await fetch(bannersUrl + '&t=' + Date.now(), { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (data?.success && Array.isArray(data.banners) && !data.banners.length && data.campaignRevision === window.dtfBannerDefaults.revision) {
        section.hidden = true;
        stopAuto();
        return;
      }
      if (data?.success && Array.isArray(data.banners)) {
        const banners = data.banners.map(mapBanner).filter(banner => banner.imageUrl);
        if (banners.length) { await buildSlides(banners); return; }
      }
    } catch (error) { console.warn('[AdCarousel] Cloud fetch failed:', error.message); }
    try {
      const cached = window.dtfBannerDefaults.upgradeDefaults(JSON.parse(localStorage.getItem('dtf_admin_banners') || '[]'));
      const banners = cached.filter(banner => banner.active !== false && banner.isActive !== false).sort((a, b) => (a.display_order || a.order || 0) - (b.display_order || b.order || 0)).map(mapBanner).filter(banner => banner.imageUrl);
      if (banners.length) { await buildSlides(banners); return; }
    } catch (error) { console.warn('[AdCarousel] Cached banners unavailable:', error.message); }
    await buildSlides(window.dtfBannerDefaults.buildDefaults());
  }
  loadBanners();

  function extractHeaderColor(slideIndex) {
    const slides = track.querySelectorAll('.ad-slide');
    if (!slides[slideIndex]) return;
    const img = slides[slideIndex].querySelector('.ad-slide-img');
    if (!img) return;

    function applyColor(imgEl) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 80;
        canvas.height = 40;
        ctx.drawImage(imgEl, 0, 0, 80, 40);
        // Sample top strip of the image (header region)
        const data = ctx.getImageData(0, 0, 80, 12).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 16) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Darken slightly for readability
        const dr = Math.round(r * 0.55);
        const dg = Math.round(g * 0.55);
        const db = Math.round(b * 0.55);

        const navContainer = document.querySelector('.nav-container');
        const subbar = document.querySelector('.location-subbar');
        const headerBg = `rgba(${dr}, ${dg}, ${db}, 0.88)`;
        const headerBorder = `rgba(${Math.min(255, dr + 40)}, ${Math.min(255, dg + 40)}, ${Math.min(255, db + 40)}, 0.35)`;

        if (navContainer) {
          navContainer.style.transition = 'background 0.8s ease, border-color 0.8s ease, box-shadow 0.8s ease';
          navContainer.style.background = headerBg;
          navContainer.style.backdropFilter = 'saturate(180%) blur(28px)';
          navContainer.style.borderColor = headerBorder;
          navContainer.style.boxShadow = `0 8px 32px rgba(${dr}, ${dg}, ${db}, 0.3), 0 2px 8px rgba(0,0,0,0.1)`;
          // Make nav text white for contrast on dark tinted bg
          navContainer.querySelectorAll('.nav-link, .dropdown-trigger').forEach(el => {
            el.style.color = '#ffffff';
          });
        }
      } catch (e) {
        console.warn('[HeaderColor] Could not extract color:', e.message);
      }
    }

    if (img.complete && img.naturalWidth > 0) {
      // Use a proxy if cross-origin
      const proxyImg = new Image();
      proxyImg.crossOrigin = 'anonymous';
      proxyImg.onload = function() { applyColor(proxyImg); };
      proxyImg.onerror = function() {
        console.warn('[HeaderColor] Cross-origin image load failed, using fallback tint.');
      };
      proxyImg.src = img.currentSrc || img.src;
    } else {
      img.addEventListener('load', function onLoad() {
        img.removeEventListener('load', onLoad);
        const proxyImg = new Image();
        proxyImg.crossOrigin = 'anonymous';
        proxyImg.onload = function() { applyColor(proxyImg); };
        proxyImg.src = img.currentSrc || img.src;
      });
    }
  }
})();
