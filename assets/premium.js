(() => {
  const body = document.body;
  body.classList.add('premium-site');

  const ORIGINAL_LOGO = 'https://floreix.com/wp-content/uploads/2023/11/cropped-cropped-Logo_retallat-transformed-PhotoRoom.png-PhotoRoom.png';
  const MAITE_HOME = 'https://floreix.com/wp-content/uploads/2023/11/Terapia-a-la-natura-pagina-principal.webp';
  const COPC = 'https://floreix.com/wp-content/uploads/2024/02/Captura-de-pantalla-2024-02-17-a-las-17.43.10-1024x301.png';
  const UB = 'https://floreix.com/wp-content/uploads/2024/02/UB-LOGO.png';
  const UOC = 'https://floreix.com/wp-content/uploads/2024/02/uoc_masterbrand_2linies_posititiu.jpg';
  const BASE = 'https://maite-terapia.github.io/floreix-new/';

  const onScroll = () => body.classList.toggle('premium-scrolled', window.scrollY > 42);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Make copied WordPress content deterministic on the static site. */
  document.querySelectorAll('.e-con.e-parent').forEach(el => el.classList.add('e-lazyloaded'));
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.loading = 'eager';
    img.decoding = 'async';
  });

  /* Always use the original Floreix logo and its real colour. */
  document.querySelectorAll('header .custom-logo').forEach(img => {
    img.style.filter = 'none';
    img.style.borderRadius = '0';
  });

  /* Preserve key original photography and institutional artwork even if WP lazy-loading/srcset misbehaves. */
  const forceImage = (selector, src) => {
    const img = document.querySelector(selector);
    if (!img) return;
    img.src = src;
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.loading = 'eager';
    img.decoding = 'async';
    img.style.filter = 'none';
  };
  forceImage('.elementor-element[data-id="ec75349"] img', MAITE_HOME);
  forceImage('.elementor-element[data-id="3935f1d"] img', COPC);
  forceImage('.elementor-element[data-id="b906cc5"] img', UB);
  forceImage('.elementor-element[data-id="5495d3c"] img', UOC);

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

  /* Keep content visible and remove old experimental section classes. */
  document.querySelectorAll('.elementor-section').forEach(section => {
    section.classList.remove('premium-panel', 'premium-dark', 'premium-botanical', 'premium-quote');
  });

  document.querySelectorAll(
    '.elementor-widget-heading,.elementor-widget-text-editor,.elementor-widget-image,.elementor-widget-button,.elementor-widget-testimonial,.elementor-widget-image-box'
  ).forEach(el => el.classList.add('premium-reveal', 'is-visible'));

  /* One consistent footer on every page, independent from copied WordPress markup. */
  const isSpanish = document.documentElement.lang.toLowerCase().startsWith('es') || location.pathname.includes('/es/');
  const footerLinks = isSpanish
    ? [
        ['Contacto', BASE + 'es/contacto/'],
        ['Sobre nosotros', BASE + 'es/sobre-nosotros/'],
        ['Metodología', BASE + 'es/metodologia/'],
        ['Términos y condiciones', BASE + 'es/terminos-y-condiciones/']
      ]
    : [
        ['Contacte', BASE + 'contact/'],
        ['Sobre nosaltres', BASE + 'about/'],
        ['Metodologia', BASE + 'metodologia/'],
        ['Termes i condicions', BASE + 'privacy-policy/']
      ];

  let footer = document.querySelector('#colophon');
  if (!footer) {
    footer = document.createElement('footer');
    footer.id = 'colophon';
    footer.className = 'premium-footer';
    const page = document.querySelector('#page') || document.body;
    page.appendChild(footer);
  }
  footer.classList.add('premium-footer');
  footer.innerHTML = `
    <div class="premium-footer-inner">
      <a class="premium-footer-brand" href="${isSpanish ? BASE + 'es/' : BASE}" aria-label="Floreix">
        <img src="${ORIGINAL_LOGO}" alt="Floreix" width="150" height="62">
      </a>
      <nav class="premium-footer-nav" aria-label="${isSpanish ? 'Navegación del pie' : 'Navegació del peu'}">
        ${footerLinks.map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}
      </nav>
      <div class="premium-footer-meta">
        <span>Floreix · Psicologia · Mindfulness · Natura</span>
        <span>© ${new Date().getFullYear()} Floreix</span>
      </div>
    </div>`;

  /* Smooth in-page navigation only for real targets. */
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
