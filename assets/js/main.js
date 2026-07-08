/* Brendan Whitaker — static site interactions */
(function () {
  'use strict';
  var doc = document;

  /* ---- Mobile nav ---- */
  var toggle = doc.getElementById('nav-toggle');
  var nav = doc.getElementById('mobile-nav');
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
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeNav(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }

  /* ---- Scroll reveal (progressive enhancement) ---- */
  var revealEls = Array.prototype.slice.call(doc.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Contact form → compose an email (static host, no backend) ---- */
  var form = doc.getElementById('contact-form');
  if (form) {
    var note = doc.getElementById('form-note');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (doc.getElementById('f-name').value || '').trim();
      var company = (doc.getElementById('f-company').value || '').trim();
      var email = (doc.getElementById('f-email').value || '').trim();
      var message = (doc.getElementById('f-message').value || '').trim();
      var news = doc.getElementById('f-news').checked;

      if (!name) { doc.getElementById('f-name').focus(); if (note) note.textContent = 'Please add your name.'; return; }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        doc.getElementById('f-email').focus();
        if (note) note.textContent = 'Please enter a valid email address.';
        return;
      }

      var body = [
        'Name: ' + name,
        company ? 'Company / Organization: ' + company : '',
        'Email: ' + email,
        '',
        message || '(no message)',
        '',
        news ? 'I would also like to receive emails and newsletters from Brendan.' : ''
      ].filter(function (l, i, a) { return !(l === '' && a[i - 1] === ''); }).join('\n');

      var href = 'mailto:hello@brendanwhitaker.com'
        + '?subject=' + encodeURIComponent('Hello from brendanwhitaker.com — ' + name)
        + '&body=' + encodeURIComponent(body);

      if (note) note.textContent = 'Opening your email app…';
      window.location.href = href;
    });
  }
})();
