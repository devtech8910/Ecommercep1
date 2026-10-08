(function () {
  const section = document.getElementById('editorial');
  const accessories = document.getElementById('accessories-collection');
  if ((!section && !accessories) || !window.IntersectionObserver || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const panels = [...(section ? section.querySelectorAll('.editorial-main, .editorial-small') : []), ...(accessories ? [accessories] : [])];
  panels.forEach(panel => panel.classList.add('collection-reveal'));
  if (section) section.classList.add('motion-ready');
  if (accessories) accessories.classList.add('motion-ready');
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { threshold: .12, rootMargin: '0px 0px -20px 0px' });
  panels.forEach(panel => observer.observe(panel));
})();

(function () {
  document.querySelectorAll('.home-product-carousel').forEach(carousel => {
    const row = carousel.querySelector('.horizontal-scroll-grid');
    const previous = carousel.querySelector('[data-direction="-1"]');
    const next = carousel.querySelector('[data-direction="1"]');
    if (!row || !previous || !next) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

    function updateArrows() {
      const ready = !!row.querySelector('.product-card-wow');
      const limit = Math.max(0, row.scrollWidth - row.clientWidth);
      previous.disabled = !ready || row.scrollLeft <= 2;
      next.disabled = !ready || row.scrollLeft >= limit - 2;
    }

    function move(direction) {
      const card = row.querySelector('.product-card-wow');
      if (!card) return;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const step = card.getBoundingClientRect().width + gap;
      const visibleCards = Math.max(1, Math.floor(row.clientWidth / step));
      row.scrollBy({ left: direction * step * visibleCards, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }

    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    row.addEventListener('scroll', updateArrows, { passive: true });
    row.addEventListener('keydown', event => {
      if (event.target !== row) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        row.scrollTo({ left: event.key === 'Home' ? 0 : row.scrollWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
      }
    });
    new MutationObserver(updateArrows).observe(row, { childList: true });
    if (window.ResizeObserver) new ResizeObserver(updateArrows).observe(row);
    else window.addEventListener('resize', updateArrows);
    updateArrows();
  });
})();
