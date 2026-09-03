(() => {
  const body = document.body;
  body.classList.add('premium-site');

  const ORIGINAL_LOGO = 'https://floreix.com/wp-content/uploads/2023/11/cropped-cropped-Logo_retallat-transformed-PhotoRoom.png-PhotoRoom.png';

  const onScroll = () => body.classList.toggle('premium-scrolled', window.scrollY > 42);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Make imported WordPress lazy-loading deterministic on the static site. */
  document.querySelectorAll('.e-con.e-parent').forEach(el => el.classList.add('e-lazyloaded'));
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.loading = 'eager';
    img.decoding = 'async';
  });

  /* Keep the original Floreix identity and colours. */
  document.querySelectorAll('header .custom-logo').forEach(img => {
    img.style.filter = 'none';
  });

  const footerBrand = document.querySelector('#colophon .ast-footer-html-1 img');
  if (footerBrand) {
    footerBrand.src = ORIGINAL_LOGO;
    footerBrand.removeAttribute('srcset');
    footerBrand.removeAttribute('sizes');
    footerBrand.alt = 'Floreix';
    footerBrand.width = 160;
    footerBrand.height = 66;
    footerBrand.style.width = '160px';
    footerBrand.style.height = 'auto';
    footerBrand.style.margin = '0 auto';
    footerBrand.style.filter = 'none';
  }

  /* Self-contained mobile navigation. */
  const mobileToggle = document.querySelector('#ast-mobile-header .main-header-menu-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', e => {
      e.preventDefault();
      const open = body.classList.toggle('premium-mobile-open');
      mobileToggle.setAttribute('aria-expanded', String(open));
    });
  }

  document.querySelectorAll('#ast-mobile-header .menu-item-has-children').forEach(item => {
    const toggle = item.querySelector(':scope > .ast-menu-toggle');
    if (toggle) {
      toggle.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const open = item.classList.toggle('premium-submenu-open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    }
  });

  document.querySelectorAll('#ast-mobile-header a.menu-link').forEach(link => {
    const parent = link.closest('.menu-item-has-children');
    if (parent && (link.getAttribute('href') === '#' || link.getAttribute('href') === '#pll_switcher')) {
      link.addEventListener('click', e => {
        e.preventDefault();
        const open = parent.classList.toggle('premium-submenu-open');
        const toggle = parent.querySelector(':scope > .ast-menu-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', String(open));
      });
    } else {
      link.addEventListener('click', () => body.classList.remove('premium-mobile-open'));
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 921) body.classList.remove('premium-mobile-open');
  });

  /* Do not inject arbitrary rounded/card treatments into content sections. */
  const sections = [...document.querySelectorAll('.elementor-section')];
  sections.forEach(section => {
    section.classList.remove('premium-panel', 'premium-dark', 'premium-botanical');
    const text = (section.innerText || '').trim().toLowerCase();
    if (text.includes('recomanat') || text.includes('recomendado') || section.querySelector('blockquote,.elementor-testimonial-content')) {
      section.classList.add('premium-quote');
    }
  });

  /* Keep all preserved content visible and reliable on every device. */
  document.querySelectorAll(
    '.elementor-widget-heading,.elementor-widget-text-editor,.elementor-widget-image,.elementor-widget-button,.elementor-widget-testimonial,.elementor-widget-image-box'
  ).forEach(el => {
    el.classList.add('premium-reveal', 'is-visible');
  });

  /* Smooth in-page navigation only when a real target exists. */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (!id || id === '#' || id === '#pll_switcher') return;
      let target;
      try { target = document.querySelector(id); } catch { return; }
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  document.querySelectorAll('a[target="_blank"]').forEach(a => {
    const rel = new Set((a.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
    rel.add('noopener');
    rel.add('noreferrer');
    a.setAttribute('rel', [...rel].join(' '));
  });
})();
