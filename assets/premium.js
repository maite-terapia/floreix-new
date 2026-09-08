(() => {
  const body = document.body;
  body.classList.add('premium-site');

  const BASE = 'https://maite-terapia.github.io/floreix-new/';
  const ASSET_BASE = ['127.0.0.1','localhost'].includes(location.hostname) ? '/' : BASE;
  const ORIGINAL_LOGO = ASSET_BASE + 'assets/logo-floreix-clean.png';
  const MAITE_HOME = ASSET_BASE + 'assets/maite-sobre-nosotros.webp';
  const COPC = 'https://floreix.com/wp-content/uploads/2024/02/Captura-de-pantalla-2024-02-17-a-las-17.43.10-1024x301.png';
  const UB = 'https://floreix.com/wp-content/uploads/2024/02/UB-LOGO.png';
  const UOC = 'https://floreix.com/wp-content/uploads/2024/02/uoc_masterbrand_2linies_posititiu.jpg';
  const THERAPY_INDIVIDUAL = 'https://floreix.com/wp-content/uploads/2026/03/Terapia-individual-ros.webp';
  const THERAPY_COUPLE = 'https://floreix.com/wp-content/uploads/2026/03/ChatGPT-Image-Mar-11-2026-12_54_39-PM.webp';
  const THERAPY_FAMILY = 'https://floreix.com/wp-content/uploads/2026/03/Sesion-de-terapia-familiar-sonriente.webp';
  const MAITE_ABOUT = ASSET_BASE + 'assets/maite-sobre-nosotros.webp';
  const FEATF_LOGO = ASSET_BASE + 'assets/logo-featf.jpg';
  const KINE_LOGO = ASSET_BASE + 'assets/logo-kine.jpg';

  const rawPath = location.pathname.replace(/^\/floreix-new/, '') || '/';
  const isSpanish = document.documentElement.lang.toLowerCase().startsWith('es') || rawPath.startsWith('/es/');
  const normalizedPath = rawPath.replace(/\/index\.html$/, '').replace(/\/+$/, '') || '/';

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

  /* Correct legacy Spanish navigation typo in both desktop and mobile menus. */
  if (isSpanish) {
    document.querySelectorAll('header a, #ast-mobile-header a').forEach(link => {
      if (link.textContent.trim().toLowerCase() === 'inicioo') link.textContent = 'Inicio';
    });
  }

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
    img.src = ORIGINAL_LOGO;
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
    img.alt = 'Floreix';
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


  /* Ensure testimonial contrast regardless of copied Elementor inline styles. */
  const testimonial = document.querySelector('.elementor-element[data-id="2d8ba58"]');
  if (testimonial) {
    testimonial.querySelectorAll('p,.elementor-heading-title,.elementor-widget-text-editor,.elementor-widget-text-editor *').forEach(el => {
      el.style.setProperty('color', '#ffffff', 'important');
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('text-shadow', 'none', 'important');
    });
    const quoteIcon = testimonial.querySelector('.elementor-element[data-id="f914229"] img');
    if (quoteIcon) quoteIcon.style.setProperty('filter', 'brightness(0) invert(1)', 'important');
  }

  /* Modern homepage service cards, retaining all original content. */
  if (body.classList.contains('floreix-home')) {
    ['fd27b31', 'e6971ee', 'b809155'].forEach(id => {
      const col = document.querySelector('.elementor-element[data-id="' + id + '"]');
      if (!col) return;
      col.classList.add('floreix-service-card');
      col.removeAttribute('data-index');
    });

    const credentials = document.querySelector('.elementor-element[data-id="a5f07c6"] > .e-con-inner');
    if (credentials && !credentials.querySelector('.floreix-extra-credential')) {
      const degree = document.createElement('a');
      degree.className = 'floreix-extra-credential floreix-degree-credential';
      degree.href = 'https://www.kine.org/';
      degree.target = '_blank';
      degree.rel = 'noopener noreferrer';
      degree.title = isSpanish ? 'Máster en Terapia Familiar · KINE' : 'Màster en Teràpia Familiar · KINE';
      degree.setAttribute('aria-label', degree.title);
      degree.innerHTML =
        '<img class="floreix-credential-logo floreix-kine-logo" src="' + KINE_LOGO + '" alt="KINE - Centro de Terapia Familiar y de Pareja">';

      const featf = document.createElement('a');
      featf.className = 'floreix-extra-credential floreix-featf-credential';
      featf.href = 'https://www.featf.org/';
      featf.target = '_blank';
      featf.rel = 'noopener noreferrer';
      featf.title = isSpanish ? 'FEATF · Solicitud de incorporación' : 'FEATF · Sol·licitud d\'incorporació';
      featf.setAttribute('aria-label', featf.title);
      featf.innerHTML =
        '<img class="floreix-credential-logo floreix-featf-logo" src="' + FEATF_LOGO + '" alt="FEATF - Federación Española de Asociaciones de Terapia Familiar">';

      credentials.append(degree, featf);
    }
  }

  /* About page: use the portrait supplied by the client beside the existing introduction text. */
  if (body.classList.contains('floreix-about') || (document.querySelector('.elementor-element[data-id="bcb05fa"]') && document.querySelector('.elementor-element[data-id="855140f"]'))) {
    const oldIntro = document.querySelector('.elementor-element[data-id="bcb05fa"]');
    const introWidget = oldIntro?.querySelector('.elementor-element[data-id="5bf1d4d"] .elementor-widget-container') || oldIntro?.querySelector('.elementor-element[data-id="5bf1d4d"]');
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


  /* Floating WhatsApp contact on every route. */
  if (!document.querySelector('.floreix-whatsapp')) {
    const whatsapp = document.createElement('a');
    whatsapp.className = 'floreix-whatsapp';
    whatsapp.href = 'https://wa.me/34689056569';
    whatsapp.target = '_blank';
    whatsapp.rel = 'noopener noreferrer';
    whatsapp.setAttribute('aria-label', isSpanish ? 'Contactar por WhatsApp' : 'Contactar per WhatsApp');
    whatsapp.title = isSpanish ? 'Contactar por WhatsApp' : 'Contactar per WhatsApp';
    whatsapp.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3.2a8.6 8.6 0 0 0-7.35 13.08L3.5 20.5l4.33-1.13A8.6 8.6 0 1 0 12 3.2Zm0 15.6a7 7 0 0 1-3.57-.98l-.25-.15-2.57.67.69-2.5-.17-.26A7 7 0 1 1 12 18.8Zm3.84-5.23c-.21-.1-1.24-.61-1.43-.68-.19-.07-.33-.1-.47.1-.14.21-.54.68-.66.82-.12.14-.24.16-.45.05-.21-.1-.88-.32-1.67-1.03-.62-.55-1.04-1.23-1.16-1.44-.12-.21-.01-.32.09-.42.09-.09.21-.24.31-.36.1-.12.14-.21.21-.35.07-.14.04-.26-.02-.36-.05-.1-.47-1.13-.64-1.55-.17-.4-.34-.35-.47-.36h-.4c-.14 0-.36.05-.55.26-.19.21-.72.7-.72 1.71 0 1 .74 1.98.84 2.12.1.14 1.45 2.22 3.51 3.11.49.21.87.34 1.17.43.49.16.94.13 1.29.08.39-.06 1.24-.51 1.41-1 .17-.49.17-.91.12-1-.05-.09-.19-.14-.4-.24Z"/>
      </svg>`;
    document.body.appendChild(whatsapp);
  }

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
