(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let smoother = null;

  /* ---------- basics ---------- */
  $('#year').textContent = new Date().getFullYear();

  const menu = $('.menu-toggle');
  const nav = $('#navigation');
  const setMenu = open => {
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    if (smoother) smoother.paused(open);
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));

  // anchor links (work with or without the smoother)
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? $('#top') : $(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    if (smoother) smoother.scrollTo(target, true, 'top top');
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  }));

  // footer logo = clone of the loader logo
  const logoSvg = $('.loader-logo svg');
  const footerLogo = logoSvg.cloneNode(true);
  $('.footer-logo').appendChild(footerLogo);


  /* ---------- booking bar ---------- */
  const bForm = $('#booking-form');
  const bStart = $('#b-start'), bEnd = $('#b-end'), bGuests = $('#b-guests');
  const bError = $('.booking-error');
  const iso = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const today = iso(new Date());
  [bStart, bEnd, $('#f-start'), $('#f-end')].forEach(i => { i.min = today; });
  const markEmpty = i => i.toggleAttribute('data-empty', !i.value);
  [bStart, bEnd].forEach(i => { markEmpty(i); i.addEventListener('input', () => markEmpty(i)); });
  bStart.addEventListener('change', () => {
    bEnd.min = bStart.value || today;
    if (bEnd.value && bEnd.value < bStart.value) { bEnd.value = bStart.value; markEmpty(bEnd); }
    bError.textContent = '';
  });
  const clampGuests = v => Math.min(+bGuests.max, Math.max(+bGuests.min, Number.isFinite(v) ? v : 1));
  const syncSteps = () => $$('.step', bForm).forEach(b => { b.disabled = (+b.dataset.step < 0 && +bGuests.value <= +bGuests.min) || (+b.dataset.step > 0 && +bGuests.value >= +bGuests.max); });
  $$('.step', bForm).forEach(b => b.addEventListener('click', () => {
    bGuests.value = clampGuests(+bGuests.value + +b.dataset.step);
    syncSteps();
    if (window.gsap && !reduced) gsap.fromTo(bGuests, { y: +b.dataset.step * -8, opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: 'power3.out' });
  }));
  bGuests.addEventListener('change', () => { bGuests.value = clampGuests(parseInt(bGuests.value, 10)); syncSteps(); });
  syncSteps();
  bForm.addEventListener('submit', e => {
    e.preventDefault();
    if (!bStart.value) {
      bError.textContent = 'Please choose a starting date.';
      bStart.focus();
      if (window.gsap && !reduced) gsap.fromTo(bStart.parentElement, { x: -8 }, { x: 0, duration: .6, ease: 'elastic.out(1, .3)' });
      return;
    }
    bError.textContent = '';
    $('#f-start').value = bStart.value;
    $('#f-end').value = bEnd.value || bStart.value;
    $('#f-guests').value = bGuests.value;
    const target = $('#enquire');
    const focusName = () => $('#f-name').focus({ preventScroll: true });
    if (smoother) {
      smoother.scrollTo(target, true, 'top top');
      setTimeout(() => {
        focusName();
        gsap.fromTo('.enquire-form', { boxShadow: '0 0 0 0 rgba(201,164,106,.9)' }, { boxShadow: '0 0 0 18px rgba(201,164,106,0)', duration: 1.4, ease: 'power2.out' });
      }, 1300);
    } else {
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(focusName, 800);
    }
  });

  /* ---------- lightbox ---------- */
  const dialog = $('.lightbox');
  const dImg = $('img', dialog);
  $$('.g-item').forEach(item => item.addEventListener('click', () => {
    dImg.src = item.dataset.image;
    dImg.alt = item.dataset.alt;
    $('p', dialog).textContent = item.dataset.alt;
    dialog.showModal();
    if (smoother) smoother.paused(true);
    if (window.gsap && !reduced) gsap.fromTo(dImg, { scale: .92, opacity: 0, clipPath: 'inset(10% 10% 10% 10%)' }, { scale: 1, opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'expo.out' });
  }));
  dialog.addEventListener('close', () => smoother && smoother.paused(false));
  $('.lightbox-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

  /* ---------- enquiry form (Netlify Forms) ---------- */
  const form = $('.enquire-form');
  const note = $('.form-note', form);
  if (new URLSearchParams(location.search).has('sent')) note.textContent = 'Thank you — we will be in touch within 24 hours.';
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btnText = $('.btn-text', form);
    btnText.textContent = 'Sending…';
    try {
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      note.textContent = 'Thank you — we will be in touch within 24 hours.';
      btnText.textContent = 'Request sent';
    } catch {
      note.textContent = 'Something went wrong. Please try again in a moment.';
      btnText.textContent = 'Request availability';
    }
  });

  const video = $('.hero video');
  if (reduced) { video.pause(); video.removeAttribute('autoplay'); }

  /* ---------- no animation path ---------- */
  if (reduced || !window.gsap || !window.ScrollTrigger) {
    $('.loader').remove();
    return;
  }

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText, CustomEase);
  CustomEase.create('silk', '0.16, 1, 0.3, 1');
  CustomEase.create('swell', 'M0,0 C0.5,0 0.1,1 1,1');

  smoother = ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.25, effects: true, smoothTouch: 0.1 });
  smoother.paused(true);

  /* ---------- helpers ---------- */
  const prepareDraw = svg => {
    const boat = $('.logo-boat', svg);
    const len = boat.getTotalLength();
    gsap.set(boat, { fillOpacity: 0, stroke: 'currentColor', strokeWidth: .7, strokeDasharray: len, strokeDashoffset: len });
    return { boat, letters: $$('.logo-letter', svg) };
  };

  /* ---------- PRELOADER + INTRO ---------- */
  const loader = $('.loader');
  const L = prepareDraw(logoSvg);
  gsap.set(L.letters, { yPercent: 60, opacity: 0, transformOrigin: '50% 100%' });

  const heroLines = $$('.ht-line').map(l => SplitText.create(l, { type: 'chars', mask: 'chars' }));
  const heroChars = heroLines.flatMap(s => s.chars);
  gsap.set(heroChars, { yPercent: 115, rotate: 6 });
  gsap.set('.hero-kicker, .hero-copy, .hero-actions .btn, .hero-bottom', { opacity: 0, y: 30 });
  gsap.set('.site-header', { yPercent: -100 });
  gsap.set('.booking-card', { y: 90, opacity: 0 });
  gsap.set('.hero-frame', { clipPath: 'inset(22% 26% 22% 26% round 8px)' });
  gsap.set('.hero-media', { scale: 1.45 });

  const count = { v: 0 };
  const countEl = $('.loader-count');
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'silk' } });
  intro
    .to(L.boat, { strokeDashoffset: 0, duration: 2.1, ease: 'power2.inOut' }, 0)
    .to(count, { v: 100, duration: 2.6, ease: 'power2.inOut', onUpdate: () => { countEl.textContent = String(Math.round(count.v)).padStart(3, '0'); } }, 0)
    .to('.loader-bar span', { scaleX: 1, duration: 2.6, ease: 'power2.inOut' }, 0)
    .to(L.letters, { yPercent: 0, opacity: 1, duration: 1.1, stagger: .07 }, 1.1)
    .to(L.boat, { fillOpacity: 1, strokeWidth: 0, duration: .8, ease: 'power1.out' }, 1.9)
    .addLabel('out', 2.9)
    .to('.loader-logo', { scale: .9, y: -30, opacity: 0, duration: .9, ease: 'power3.in' }, 'out')
    .to('.loader-meta, .loader-bar', { opacity: 0, duration: .5 }, 'out')
    .to(loader, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.3, ease: 'expo.inOut' }, 'out+=.5')
    .to('.hero-frame', { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.8, ease: 'expo.inOut' }, 'out+=.6')
    .to('.hero-media', { scale: 1, duration: 2.4, ease: 'expo.out' }, 'out+=.8')
    .to(heroChars, { yPercent: 0, rotate: 0, duration: 1.4, stagger: .035, ease: 'expo.out' }, 'out+=1.3')
    .to('.hero-kicker', { opacity: 1, y: 0, duration: 1 }, 'out+=1.5')
    .to('.hero-copy, .hero-actions .btn', { opacity: 1, y: 0, duration: 1.2, stagger: .1 }, 'out+=1.8')
    .to('.hero-bottom', { opacity: 1, y: 0, duration: 1 }, 'out+=2')
    .to('.site-header', { yPercent: 0, duration: 1.2 }, 'out+=1.8')
    .to('.booking-card', { y: 0, opacity: 1, duration: 1.4, ease: 'expo.out' }, 'out+=2.1')
    .from('.booking-fields > *', { y: 24, opacity: 0, duration: 1, stagger: .08 }, 'out+=2.3')
    .add(() => { loader.remove(); smoother.paused(false); ScrollTrigger.refresh(); }, 'out+=1.9');

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => intro.play());

  /* ---------- HEADER ---------- */
  const header = $('.site-header');
  ScrollTrigger.create({
    start: 'top -80',
    end: 'max',
    onUpdate: self => {
      header.classList.toggle('scrolled', self.scroll() > 80);
      header.classList.toggle('hidden', self.direction === 1 && self.scroll() > 600 && !nav.classList.contains('open'));
    },
    onLeaveBack: () => header.classList.remove('scrolled', 'hidden')
  });

  /* ---------- HERO on scroll ---------- */
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero-frame', { clipPath: 'inset(4% 3% 14% 3% round 22px)', ease: 'none' }, 0)
    .to('.hero-media', { yPercent: 12, scale: 1.08, ease: 'none' }, 0)
    .to('.hero-content', { yPercent: -35, opacity: 0, ease: 'none' }, 0)
    .to('.hero-bottom', { opacity: 0, ease: 'none' }, 0);

  /* ---------- MARQUEE (velocity reactive) ---------- */
  const marquee = gsap.to('.marquee-track', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
  const skewTo = gsap.quickTo('.marquee-track', 'skewX', { duration: .6, ease: 'power3' });
  ScrollTrigger.create({
    trigger: '.marquee', start: 'top bottom', end: 'bottom top',
    onUpdate: self => {
      const v = self.getVelocity();
      const dir = v < 0 ? -1 : 1;
      gsap.to(marquee, { timeScale: dir * Math.min(1 + Math.abs(v) / 300, 6), duration: .3, overwrite: true, onComplete: () => gsap.to(marquee, { timeScale: dir, duration: 1.2 }) });
      skewTo(gsap.utils.clamp(-12, 12, v / -120));
    },
    onLeave: () => skewTo(0), onLeaveBack: () => skewTo(0)
  });
  ScrollTrigger.addEventListener('scrollEnd', () => skewTo(0));

  /* ---------- section labels ---------- */
  $$('.section-label').forEach(el => {
    gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%' } })
      .from($$('span:not(.label-line)', el), { yPercent: 100, opacity: 0, duration: 1, stagger: .08, ease: 'silk' })
      .from($('.label-line', el), { scaleX: 0, duration: 1.6, ease: 'expo.inOut' }, 0);
  });

  /* ---------- headings: masked line reveal ---------- */
  $$('.split-h').forEach(h => {
    SplitText.create(h, {
      type: 'lines', mask: 'lines', autoSplit: true,
      onSplit: self => gsap.from(self.lines, { yPercent: 110, rotate: 2, duration: 1.4, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } })
    });
  });

  /* ---------- manifesto: words light up as you scroll ---------- */
  SplitText.create('.manifesto-text', {
    type: 'words', autoSplit: true,
    onSplit: self => gsap.fromTo(self.words, { opacity: .12, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0px)', stagger: .1, ease: 'none', scrollTrigger: { trigger: '.manifesto-text', start: 'top 80%', end: 'bottom 45%', scrub: 1 } })
  });

  /* ---------- image curtain reveals ---------- */
  $$('.m-img').forEach(fig => {
    gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%' } })
      .from(fig, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
      .from($('img', fig), { scale: 1.4, duration: 2.2, ease: 'expo.out' }, .2);
  });
  gsap.from('.m-copy > *:not(h2)', { y: 40, opacity: 0, duration: 1.2, stagger: .1, ease: 'silk', scrollTrigger: { trigger: '.m-copy', start: 'top 80%' } });

  gsap.from('.pillar', { y: 60, opacity: 0, duration: 1.3, stagger: .12, ease: 'silk', scrollTrigger: { trigger: '.pillars', start: 'top 85%' } });

  /* ---------- horizontal spaces ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const pin = $('.spaces-pin');
    const track = $('.spaces-track');
    const amount = () => {
      const cs = getComputedStyle(pin);
      return $('.spaces-intro').offsetWidth + parseFloat(cs.columnGap) + track.scrollWidth + parseFloat(cs.paddingLeft) - window.innerWidth;
    };
    const tween = gsap.to(track, {
      x: () => -amount(),
      ease: 'none',
      scrollTrigger: { trigger: '.spaces', start: 'top top', end: () => '+=' + amount(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    gsap.to('.spaces-intro', { x: () => -$('.spaces-intro').offsetWidth * .5, opacity: 0, filter: 'blur(6px)', ease: 'power1.in', scrollTrigger: { trigger: '.spaces', start: 'top top', end: () => '+=' + window.innerWidth * .45, scrub: 1, invalidateOnRefresh: true } });
    gsap.to('.spaces-progress span', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.spaces', start: 'top top', end: () => '+=' + amount(), scrub: true, invalidateOnRefresh: true } });
    $$('.space-card').forEach(card => {
      gsap.fromTo($('img', card), { xPercent: -23 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      gsap.from(card, { rotate: 4, y: 80, opacity: 0, transformOrigin: '0% 100%', ease: 'power2.out', scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left 105%', end: 'left 60%', scrub: true } });
    });
  });
  mm.add('(max-width: 860px)', () => {
    $$('.space-card').forEach(card => gsap.from(card, { y: 60, opacity: 0, duration: 1.2, ease: 'silk', scrollTrigger: { trigger: card, start: 'top 88%' } }));
  });

  /* ---------- zoom quote ---------- */
  const zoomTitle = SplitText.create('.zoom-title', { type: 'lines,chars', mask: 'lines' });
  gsap.timeline({ scrollTrigger: { trigger: '.zoom', start: 'top top', end: '+=160%', pin: true, scrub: 1, anticipatePin: 1 } })
    .fromTo('.zoom-media', { clipPath: 'inset(24% 32% 24% 32% round 8px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
    .fromTo('.zoom-media img', { scale: 1.5 }, { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
    .fromTo('.zoom-shade', { opacity: 0 }, { opacity: 1, duration: .5 }, .5)
    .from('.zoom-content .overline', { opacity: 0, y: 20, duration: .3 }, .65)
    .from(zoomTitle.chars, { yPercent: 120, opacity: 0, stagger: .012, duration: .4, ease: 'power3.out' }, .7)
    .to({}, { duration: .3 });

  /* ---------- gallery ---------- */
  ScrollTrigger.batch('.g-item', {
    start: 'top 90%',
    onEnter: els => {
      gsap.fromTo(els, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, stagger: .12, ease: 'expo.inOut' });
      gsap.fromTo(els.map(e => $('img', e)), { scale: 1.45 }, { scale: 1.04, duration: 2.2, stagger: .12, ease: 'expo.out', clearProps: 'transform' });
    },
    once: true
  });
  gsap.set('.g-item', { clipPath: 'inset(100% 0% 0% 0%)' });
  gsap.from('.gallery-head p', { y: 30, opacity: 0, duration: 1.2, ease: 'silk', scrollTrigger: { trigger: '.gallery-head', start: 'top 85%' } });

  /* ---------- enquire ---------- */
  gsap.from('.enquire-copy > p, .enquire-list li', { y: 30, opacity: 0, duration: 1.2, stagger: .08, ease: 'silk', scrollTrigger: { trigger: '.enquire-copy', start: 'top 75%' } });
  gsap.from('.enquire-form', { y: 80, opacity: 0, rotateX: 8, transformPerspective: 1200, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.enquire-form', start: 'top 85%' } });
  gsap.from('.enquire-form .field, .enquire-form .field-row, .enquire-form .btn', { y: 26, opacity: 0, duration: 1, stagger: .07, ease: 'silk', delay: .25, scrollTrigger: { trigger: '.enquire-form', start: 'top 85%' } });

  /* ---------- footer: logo draws itself ---------- */
  const F = prepareDraw(footerLogo);
  gsap.timeline({ scrollTrigger: { trigger: '.footer-logo', start: 'top 95%', end: 'bottom bottom', scrub: 1 } })
    .to(F.boat, { strokeDashoffset: 0, duration: 1, ease: 'none' })
    .to(F.boat, { fillOpacity: 1, strokeWidth: 0, duration: .3 }, .8)
    .from(F.letters, { yPercent: 80, opacity: 0, duration: .5, stagger: .06, ease: 'power3.out' }, .45);
  gsap.from('.footer-tag', { y: 40, opacity: 0, duration: 1.2, ease: 'silk', scrollTrigger: { trigger: '.site-footer', start: 'top 85%' } });

  /* ---------- custom cursor ---------- */
  if (finePointer) {
    const cursor = $('.cursor');
    const label = $('.cursor-label');
    const xTo = gsap.quickTo(cursor, 'x', { duration: .45, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); });
    const grow = (size, text) => {
      gsap.to(cursor, { width: size, height: size, margin: -size / 2, duration: .5, ease: 'expo.out' });
      gsap.to(label, { opacity: text ? 1 : 0, scale: text ? 1 : .4, duration: .4 });
      if (text) label.textContent = text;
    };
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => grow(92, el.dataset.cursor));
      el.addEventListener('pointerleave', () => grow(12));
    });
    $$('a, button:not([data-cursor])').forEach(el => {
      el.addEventListener('pointerenter', () => gsap.to(cursor, { scale: .4, duration: .3 }));
      el.addEventListener('pointerleave', () => gsap.to(cursor, { scale: 1, duration: .3 }));
    });
    document.addEventListener('pointerleave', () => gsap.to(cursor, { opacity: 0 }));
    document.addEventListener('pointerenter', () => gsap.to(cursor, { opacity: 1 }));

    /* magnetic buttons */
    $$('.magnetic').forEach(btn => {
      const inner = $('.btn-text', btn);
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, { x: dx * .25, y: dy * .4, duration: .6, ease: 'power3' });
        if (inner) gsap.to(inner, { x: dx * .1, y: dy * .15, duration: .6, ease: 'power3' });
      });
      btn.addEventListener('pointerleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, .35)' });
        if (inner) gsap.to(inner, { x: 0, y: 0, duration: 1.1, ease: 'elastic.out(1, .35)' });
      });
    });

    /* space cards tilt */
    $$('.space-img').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { rotateY: ((e.clientX - r.left) / r.width - .5) * 6, rotateX: -((e.clientY - r.top) / r.height - .5) * 6, transformPerspective: 900, duration: .8, ease: 'power3' });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 1.2, ease: 'elastic.out(1, .4)' }));
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
