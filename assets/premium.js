(() => {
  const body = document.body;
  body.classList.add('premium-site');

  const onScroll = () => body.classList.toggle('premium-scrolled', window.scrollY > 42);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

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

  const revealTargets = document.querySelectorAll(
    '.elementor-widget-heading,.elementor-widget-text-editor,.elementor-widget-image,.elementor-widget-button,.elementor-widget-testimonial'
  );
  revealTargets.forEach(el => el.classList.add('premium-reveal'));

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealTargets.forEach(el => observer.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

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
