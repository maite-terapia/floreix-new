(() => {
  const body = document.body;
  body.classList.add('premium-site');

  const ORIGINAL_LOGO = 'https://floreix.com/wp-content/uploads/2023/11/cropped-cropped-Logo_retallat-transformed-PhotoRoom.png-PhotoRoom.png';
  const MAITE_HOME = 'https://floreix.com/wp-content/uploads/2023/11/Terapia-a-la-natura-pagina-principal.webp';
  const COPC = 'https://floreix.com/wp-content/uploads/2024/02/Captura-de-pantalla-2024-02-17-a-las-17.43.10-1024x301.png';
  const UB = 'https://floreix.com/wp-content/uploads/2024/02/UB-LOGO.png';
  const UOC = 'https://floreix.com/wp-content/uploads/2024/02/uoc_masterbrand_2linies_posititiu.jpg';
  const THERAPY_INDIVIDUAL = 'https://floreix.com/wp-content/uploads/2026/03/Terapia-individual-ros.webp';
  const THERAPY_COUPLE = 'https://floreix.com/wp-content/uploads/2026/03/ChatGPT-Image-Mar-11-2026-12_54_39-PM.webp';
  const THERAPY_FAMILY = 'https://floreix.com/wp-content/uploads/2026/03/Sesion-de-terapia-familiar-sonriente.webp';
  const BASE = 'https://maite-terapia.github.io/floreix-new/';
  const MAITE_ABOUT = BASE + 'assets/maite-sobre-nosotros.webp';

  const rawPath = location.pathname.replace(/^\/floreix-new/, '') || '/';
  const isSpanish = document.documentElement.lang.toLowerCase().startsWith('es') || rawPath.startsWith('/es/');
  const normalizedPath = rawPath.replace(/\/+$/, '') || '/';

  const routeClasses = [
    ['floreix-home', normalizedPath === '/' || normalizedPath === '/es'],
    ['floreix-about', normalizedPath === '/about' || normalizedPath === '/es/sobre-nosotros'],
    ['floreix-psychotherapy', normalizedPath === '/psicoterapia' || normalizedPath === '/es/psicoterapia'],
    ['floreix-nature', normalizedPath === '/terapia-a-la-natura' || normalizedPath === '/es/terapia-en-la-naturaleza'],
    ['floreix-method', normalizedPath === '/metodologia' || normalizedPath === '/es/metodologia'],
    ['floreix-contact', normalizedPath === '/contact' || normalizedPath === '/es/contacto'],
    ['floreix-legal', normalizedPath === '/privacy-policy' || normalizedPath === '/es/terminos-y-condiciones']
  ];
  routeClasses.forEach(([name, active]) => active && body.classList.add(name));

  const onScroll = () => body.classList.toggle('premium-scrolled', window.scrollY > 36);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Make copied WordPress/Elementor content deterministic on the static site. */
  document.querySelectorAll('.e-con.e-parent').forEach(el => el.classList.add('e-lazyloaded'));
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.loading = 'eager';
    img.decoding = 'async';
  });

  /* Tag the real first Elementor section on every route as the hero. */
  const pageRoot = document.querySelector('[data-elementor-type="wp-page"]');
  const hero = pageRoot?.querySelector(':scope > section.elementor-top-section');
  if (hero) hero.classList.add('floreix-hero');

  /* Always use the original Floreix logo and its real colour. */
  document.querySelectorAll('header .custom-logo').forEach(img => {
    img.style.filter = 'none';
    img.style.borderRadius = '0';
  });

  const forceImage = (selector, src, alt) => {
    const img = document.querySelector(selector);
    if (!img) return null;
    img.src = src;
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.loading = 'eager';
    img.decoding = 'async';
    img.style.filter = 'none';
    if (alt) img.alt = alt;
    return img;
  };

  /* Preserve key original photography and institutional artwork. */
  forceImage('.elementor-element[data-id="ec75349"] img', MAITE_HOME);
  forceImage('.elementor-element[data-id="3935f1d"] img', COPC);
  forceImage('.elementor-element[data-id="b906cc5"] img', UB);
  forceImage('.elementor-element[data-id="5495d3c"] img', UOC);
  forceImage('.elementor-element[data-id="559f9e3"] img', THERAPY_INDIVIDUAL);
  forceImage('.elementor-element[data-id="b794155"] img', THERAPY_COUPLE);
  forceImage('.elementor-element[data-id="04d75c5"] img', THERAPY_FAMILY);

  /* Modern homepage service cards, retaining all original content. */
  if (body.classList.contains('floreix-home')) {
    ['fd27b31', 'e6971ee', 'b809155'].forEach((id, index) => {
      const col = document.querySelector('.elementor-element[data-id="' + id + '"]');
      if (!col) return;
      col.classList.add('floreix-service-card');
      col.dataset.index = String(index + 1).padStart(2, '0');
    });
  }

  /* About page: use the portrait supplied by the client beside the existing introduction text. */
  if (body.classList.contains('floreix-about')) {
    const oldIntro = document.querySelector('.elementor-element[data-id="bcb05fa"]');
    const introWidget = oldIntro?.querySelector('.elementor-element[data-id="5bf1d4d"] .elementor-widget-container');
    const oldPortrait = document.querySelector('.elementor-element[data-id="fe1a261"]');
    const missionBlock = document.querySelector('.elementor-element[data-id="855140f"]');

    if (oldIntro && introWidget && missionBlock && !document.querySelector('.floreix-about-intro')) {
      const section = document.createElement('section');
      section.className = 'floreix-about-intro';
      const title = isSpanish ? 'Psicóloga' : 'Psicòloga';
      const photoAlt = isSpanish ? 'Maite Tacias, psicóloga y fundadora de Floreix' : 'Maite Tacias, psicòloga i fundadora de Floreix';
      section.innerHTML = `
        <div class="floreix-about-photo">
          <img src="${MAITE_ABOUT}" alt="${photoAlt}" width="480" height="679" loading="eager" decoding="async">
        </div>
        <div class="floreix-about-copy">
          <p class="floreix-about-eyebrow">Maite Tacias</p>
          <h2>${title}</h2>
          <div class="floreix-about-original-copy"></div>
        </div>`;
      section.querySelector('.floreix-about-original-copy').innerHTML = introWidget.innerHTML;
      missionBlock.parentNode.insertBefore(section, missionBlock);
      oldIntro.classList.add('floreix-source-hidden');
      if (oldPortrait) oldPortrait.classList.add('floreix-source-hidden');
    }
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

  /* Keep all content visible; the design must never depend on a reveal library. */
  document.querySelectorAll('.elementor-section').forEach(section => {
    section.classList.remove('premium-panel', 'premium-dark', 'premium-botanical', 'premium-quote');
  });
  document.querySelectorAll(
    '.elementor-widget-heading,.elementor-widget-text-editor,.elementor-widget-image,.elementor-widget-button,.elementor-widget-testimonial,.elementor-widget-image-box'
  ).forEach(el => el.classList.add('premium-reveal', 'is-visible'));

  /* One consistent footer on every page. */
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
    (document.querySelector('#page') || document.body).appendChild(footer);
  }
  footer.classList.add('premium-footer');
  footer.innerHTML = `
    <div class="premium-footer-inner">
      <a class="premium-footer-brand" href="${isSpanish ? BASE + 'es/' : BASE}" aria-label="Floreix">
        <img src="${ORIGINAL_LOGO}" alt="Floreix" width="126" height="52">
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
