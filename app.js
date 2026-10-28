// Change the name here to update every brand mention and the browser title.
const SITE_NAME = 'DEFORMAT';
for (const element of document.querySelectorAll('[data-brand]')) element.textContent = SITE_NAME;
document.title = `${SITE_NAME} — A different way to see type`;

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('#menu');
function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('open', open);
  menu.inert = !open;
  document.body.classList.toggle('menu-open', open);
}
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); }
  if (event.key === 'Tab' && menuButton.getAttribute('aria-expanded') === 'true') {
    const links = [...menu.querySelectorAll('a')];
    if (event.shiftKey && document.activeElement === menuButton) { event.preventDefault(); links.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); menuButton.focus(); }
  }
});
for (const button of document.querySelectorAll('.principle')) {
  button.addEventListener('click', () => {
    const wasOpen = button.getAttribute('aria-expanded') === 'true';
    for (const other of document.querySelectorAll('.principle')) {
      const expanded = other === button && !wasOpen;
      other.setAttribute('aria-expanded', String(expanded));
      other.classList.toggle('active', expanded);
      other.querySelector('.plus').textContent = expanded ? '−' : '+';
      document.getElementById(other.getAttribute('aria-controls')).hidden = !expanded;
    }
  });
}
const input = document.querySelector('#type-input');
const size = document.querySelector('#size');
const spacing = document.querySelector('#spacing');
const font = document.querySelector('#font-select');
const canvas = document.querySelector('.type-canvas');
const fonts = { sans:'Arial, Helvetica, sans-serif', serif:'Georgia, serif', mono:'"Courier New", monospace' };
let sizeChanged = false;
function updateType() {
  input.style.fontFamily = fonts[font.value];
  if (sizeChanged) input.style.fontSize = `${size.value}px`;
  input.style.letterSpacing = `${spacing.value}px`;
  document.querySelector('#size-output').value = size.value;
  document.querySelector('#spacing-output').value = spacing.value.replace('-', '−');
}
size.addEventListener('input', () => { sizeChanged = true; updateType(); });
spacing.addEventListener('input', updateType);
font.addEventListener('change', updateType);
function setColor(color) {
  canvas.dataset.color = color;
  for (const button of document.querySelectorAll('.swatch')) {
    const selected = button.dataset.color === color;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
}
for (const button of document.querySelectorAll('.swatch')) button.addEventListener('click', () => setColor(button.dataset.color));
document.querySelector('#reset-type').addEventListener('click', () => {
  input.value = 'Stay curious.'; size.value = 140; spacing.value = -4; font.value = 'sans';
  sizeChanged = false; input.style.fontSize = ''; updateType(); setColor('paper');
});
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.body.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
  }, { threshold:.15 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
}
let ticking = false;
function updateProgress() {
  const height = document.documentElement.scrollHeight - innerHeight;
  document.querySelector('.scroll-progress').style.transform = `scaleX(${height > 0 ? scrollY / height : 0})`;
  ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; } }, { passive:true });
addEventListener('resize', updateProgress);
updateProgress();
