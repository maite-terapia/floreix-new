(() => {
  const body = document.body;
  body.classList.add('premium-site');

  const onScroll = () => body.classList.toggle('premium-scrolled', window.scrollY > 42);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* The copied Elementor markup includes lazy-loading behaviours intended for WordPress.
     Make the static version deterministic so all preserved photography is present immediately. */
  document.querySelectorAll('.e-con.e-parent').forEach(el => el.classList.add('e-lazyloaded'));
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.loading = 'eager';
    img.decoding = 'async';
  });

  const sections = [...document.querySelectorAll('.elementor-section')];
  sections.forEach((section, index) => {
    if (index > 0) section.classList.add('premium-botanical');
    const text = (section.innerText || '').trim().toLowerCase();
    if (text.includes('recomanat') || text.includes('recomendado') || section.querySelector('blockquote,.elementor-testimonial-content')) {
      section.classList.add('premium-quote');
    } else if (index > 0 && index % 3 === 1) {
      section.classList.add('premium-panel');
    }
  });

  document.querySelectorAll(
    '.elementor-widget-heading,.elementor-widget-text-editor,.elementor-widget-image,.elementor-widget-button,.elementor-widget-testimonial,.elementor-widget-image-box'
  ).forEach(el => {
    el.classList.add('premium-reveal','is-visible');
  });

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
