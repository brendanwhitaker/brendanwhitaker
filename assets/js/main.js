/* Brendan Whitaker — static site interactions */
(function () {
  'use strict';

  var doc = document;

  /* ---- Current year in footer ---- */
  var yearEl = doc.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- Mobile nav toggle ---- */
  var toggle = doc.getElementById('nav-toggle');
  var nav = doc.getElementById('primary-nav');

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Close the menu after a nav link is tapped.
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });

    // Close on Escape.
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ---- Header shadow/border on scroll ---- */
  var header = doc.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Scroll reveal ---- */
  var revealEls = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Contact form (static host: compose an email) ---- */
  var form = doc.getElementById('contact-form');
  if (form) {
    var note = doc.getElementById('form-note');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailInput = doc.getElementById('email');
      var wantsNews = doc.getElementById('newsletter');
      var email = (emailInput && emailInput.value || '').trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (emailInput) emailInput.focus();
        if (note) note.textContent = 'Please enter a valid email address.';
        return;
      }

      var subject = 'Hello from brendanwhitaker.com';
      var lines = [
        'Hi Brendan,',
        '',
        "I'd love to connect. You can reach me at " + email + '.',
        '',
        (wantsNews && wantsNews.checked)
          ? 'Please also add me to your newsletter.'
          : '',
        ''
      ];
      var body = lines.join('\n');
      var href = 'mailto:hello@brendanwhitaker.com'
        + '?subject=' + encodeURIComponent(subject)
        + '&body=' + encodeURIComponent(body);

      if (note) note.textContent = 'Opening your email app…';
      window.location.href = href;
    });
  }
})();
