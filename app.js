const $ = selector => document.querySelector(selector);
const canvas = $('#world');
const ctx = canvas.getContext('2d');
const media = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (n, min = 0, max = 1) => Math.max(min, Math.min(max, n));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const form = $('#form'), work = $('#work'), exit = $('#exit');
const pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 };
let width, height, scroll = scrollY, reduced = media.matches;
let rotation = .4, manualTurn = 0, material = 'surface', dirty = true;
let last = 0, clock = 0, bounds = {}, menuOpen = false;
const progress = $('#progress'), xLabel = $('#coord-x'), yLabel = $('#coord-y');
const menu = $('#navigation'), menuButton = $('#menu-button'), motionButton = $('#motion-toggle');
const main = $('main');
function resize() {
  width = innerWidth; height = innerHeight;
  const ratio = Math.min(devicePixelRatio || 1, 1.75);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  bounds = { form: form.offsetTop, work: work.offsetTop, exit: exit.offsetTop,
    end: document.documentElement.scrollHeight - height };
  dirty = true;
}
addEventListener('resize', resize);
new ResizeObserver(resize).observe(main);
addEventListener('scroll', () => { scroll = scrollY; dirty = true; }, { passive: true });
addEventListener('pointermove', event => {
  if (event.pointerType === 'touch') return;
  pointer.x = event.clientX / width * 2 - 1;
  pointer.y = event.clientY / height * 2 - 1;
  xLabel.textContent = String(Math.round(event.clientX)).padStart(3, '0');
  yLabel.textContent = String(Math.round(event.clientY)).padStart(3, '0');
}, { passive: true });
function setMenu(open) {
  menuOpen = open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.lastElementChild.textContent = open ? '−' : '+';
  menu.classList.toggle('open', open); menu.inert = !open;
  main.inert = open; $('footer').inert = open;
  document.body.classList.toggle('menu-open', open);
  dirty = true;
}
menuButton.addEventListener('click', () => setMenu(!menuOpen));
menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuOpen) { setMenu(false); menuButton.focus(); }
  if (event.key === 'Tab' && menuOpen) {
    const links = [...document.querySelectorAll('header a, header button, #navigation a')];
    const index = links.indexOf(document.activeElement);
    event.preventDefault();
    links[(index + (event.shiftKey ? -1 : 1) + links.length) % links.length].focus();
  }
});
function motionState() {
  document.body.classList.toggle('reduced', reduced);
  motionButton.setAttribute('aria-pressed', String(reduced));
  motionButton.innerHTML = `MOTION ${reduced ? 'OFF' : 'ON'} <span>●</span>`;
  dirty = true;
}
motionButton.addEventListener('click', () => { reduced = !reduced; motionState(); });
media.addEventListener('change', event => { reduced = event.matches; motionState(); });
motionState();
$('#year').textContent = new Date().getFullYear();
function setMaterial(value) {
  material = value;
  document.querySelectorAll('[data-material]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.material === value));
  });
  $('#scene-description').textContent = { surface: 'PLATINUM SURFACE', wire: 'CONTOUR STUDY', points: 'INDIVIDUAL PARTICLES' }[value];
  dirty = true;
}
document.querySelectorAll('[data-material]').forEach(button => button.addEventListener('click', () => setMaterial(button.dataset.material)));
$('#turn-object').addEventListener('click', () => { manualTurn += Math.PI / 2; dirty = true; });
document.querySelectorAll('[data-experiment]').forEach(button => button.addEventListener('click', () => {
  setMaterial(button.dataset.experiment);
  window.scrollTo({ top: form.offsetTop + height * .25, behavior: reduced ? 'instant' : 'smooth' });
  $('#turn-object').focus({ preventScroll: true });
}));
document.querySelectorAll('.experiment').forEach(item => item.addEventListener('toggle', () => {
  if (item.open) document.querySelectorAll('.experiment').forEach(other => { if (other !== item) other.open = false; });
  resize();
}));
const sections = [...document.querySelectorAll('main section')];
const sectionObserver = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) {
    document.querySelectorAll('footer a, #navigation a').forEach(link => {
      if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-35% 0px -45% 0px' });
sections.forEach(section => sectionObserver.observe(section));
// The full-body WebGL renderer consumes this shared scene state.
window.deformatScene = {};
const textLines = [
 'THERE IS NO SINGLE WAY TO SEE A HUMAN.', 'SOMEWHERE BETWEEN THE REAL AND THE RENDERED.',
 'WE ARE MORE THAN THE SHAPE WE TAKE.', 'A BODY IS A PLACE FOR AN IDEA TO BEGIN.',
 'LOOK LONG ENOUGH AND THE SURFACE CHANGES.', 'THE SAME PERSON. ANOTHER PERSPECTIVE.',
 'NOT AN AVATAR. NOT AN ANSWER.', 'A QUESTION TAKING HUMAN FORM.',
 'LIGHT FINDS A WAY THROUGH EVERYTHING.', 'THE SPACE BETWEEN WORDS IS NEVER EMPTY.',
 'YOU BRING YOUR OWN POINT OF VIEW.', 'THAT IS WHERE THE EXPERIMENT STARTS.',
 'WHAT YOU SEE IS ALREADY MOVING.', 'WHAT YOU KNOW IS ALREADY CHANGING.',
 'A THOUSAND VERSIONS OF THE SAME MOMENT.', 'NONE OF THEM COMPLETELY STILL.',
 'THERE IS SOMETHING HUMAN IN THE ERROR.', 'THERE IS SOMETHING NEW IN THE FAMILIAR.',
 'WE BUILD WORLDS TO GET A LITTLE CLOSER.', 'WE BREAK RULES TO FIND ANOTHER WAY.',
 'THIS IS A STUDY IN NOT STANDING STILL.', 'THIS IS A PORTRAIT WITHOUT A FRAME.',
 'EVERY PIXEL REMEMBERS THE LIGHT.', 'EVERY MOVEMENT LEAVES A POSSIBILITY.',
 'COME A LITTLE CLOSER.', 'THERE IS ALWAYS SOMETHING ELSE TO SEE.',
 'NOT EVERYTHING NEEDS AN EXPLANATION.', 'SOME THINGS JUST NEED TO BE FELT.',
 'SOMEWHERE BETWEEN ORDER AND INSTINCT.', 'SOMEWHERE BETWEEN YOU AND THE SCREEN.',
 'LET THE ORDINARY BECOME UNFAMILIAR.', 'LET THE FAMILIAR BECOME SOMETHING ELSE.',
 'WE ARE STILL BECOMING.', 'WE ARE STILL HERE.'
];
for (const [side, offset] of [['left', 0], ['right', 7]]) {
 const column = document.querySelector(`.passage-${side}`);
 textLines.forEach((_, index) => {
  const line = document.createElement('span');
  line.textContent = textLines[(index + offset) % textLines.length];
  line.style.setProperty('--indent', `${Math.round(8 + Math.sin(index / 33 * Math.PI) * 34)}px`);
  column.append(line);
 });
}
function render(now) {
  requestAnimationFrame(render);
  if (document.hidden || now - last < 32) return;
  const dt = Math.min((now - last) / 1000, .05); last = now;
  if (!reduced) {
    clock += dt; rotation += dt * .15;
    eased.x = mix(eased.x, pointer.x, .07); eased.y = mix(eased.y, pointer.y, .07);
  } else if (!dirty) return;
  dirty = false;
  const introProgress = clamp(scroll / (height * 1.4));
  const p = smooth((scroll - height * .6) / (height * .85));
  const workFade = smooth((scroll - bounds.work + height * .4) / (height * .6));
  const q = smooth((scroll - bounds.exit + height * .65) / (height * .8));
  const bg = q > 0 ? `rgb(${mix(242,226,q)},${mix(242,25,q)},${mix(239,34,q)})` : `rgb(${mix(9,242,p)},${mix(9,242,p)},${mix(9,239,p)})`;
  document.body.style.backgroundColor = bg; document.body.style.color = p > .5 ? '#090909' : '#e9e9e4';
  progress.textContent = String(Math.round(clamp(scroll / Math.max(1,bounds.end)) * 100)).padStart(3, '0') + '%';
  ctx?.clearRect(0, 0, width, height);
  window.deformatScene = { reduced, rotation, manualTurn, material, pointerX: eased.x, pointerY: eased.y,
    intro: introProgress, form: clamp((scroll - bounds.form) / (height * .9)),
    white: p, visibility: 1 - workFade, width, height, scroll };
  document.documentElement.style.setProperty('--passage-spread', `${smooth(introProgress) * 100}px`);
  document.documentElement.style.setProperty('--passage-color', `rgb(${mix(198,42,p)},${mix(199,42,p)},${mix(192,42,p)})`);
  document.documentElement.style.setProperty('--front-visibility', p * smooth((introProgress - .28) / .5) * (1 - smooth((introProgress - .85) / .15)));
  if (!ctx) return;
  ctx.globalAlpha = (.24 + p * .16) * (1 - q * .5); ctx.strokeStyle = p > .5 ? '#8c8c88' : '#48484a'; ctx.lineWidth = .6;
  for (let row = 0; row < 22; row++) {
    ctx.beginPath();
    for (let x = 0; x <= width; x += 15) {
      const n = x / width, wave = Math.sin(n * 13 + row * .15 + clock * .15) * Math.sin(n * 7 - row * .08) * 35;
      const y = height * .88 + row * 7 + wave * (1 + row * .035) - p * 45;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
resize(); requestAnimationFrame(render);
