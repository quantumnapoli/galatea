const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#navigation');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});
nav.addEventListener('click', event => {
  if (event.target.closest('a')) { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); }
});
document.querySelector('#year').textContent = new Date().getFullYear();
const dialog = document.querySelector('.lightbox');
const dialogImage = dialog.querySelector('img');
document.querySelectorAll('.gallery-item').forEach(item => item.addEventListener('click', () => {
  dialogImage.src = item.dataset.image;
  dialogImage.alt = item.dataset.alt;
  dialog.querySelector('p').textContent = item.dataset.alt;
  dialog.showModal();
}));
dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const video = document.querySelector('.hero video');
if (reducedMotion.matches) { video.pause(); video.removeAttribute('autoplay'); }
if (window.gsap && window.ScrollTrigger && !reducedMotion.matches) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.from('.hero-kicker, .hero h1, .hero-copy, .circle-link', { y: 35, opacity: 0, duration: 1.1, stagger: .16, ease: 'power3.out', delay: .2 });
  gsap.from('.hero-bottom', { opacity: 0, duration: 1, delay: 1 });
  gsap.utils.toArray('.reveal').forEach(element => gsap.from(element, { scrollTrigger: { trigger: element, start: 'top 88%', once: true }, y: 40, opacity: 0, duration: 1, ease: 'power3.out' }));
  gsap.utils.toArray('.reveal-image').forEach(element => gsap.from(element, { scrollTrigger: { trigger: element, start: 'top 88%', once: true }, y: 45, opacity: 0, duration: 1.1, ease: 'power3.out' }));
  gsap.to('.hero-media', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
}
