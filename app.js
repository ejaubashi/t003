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
  $('#scene-description').textContent = { surface: 'IRIDESCENT SURFACE', wire: 'UNDERLYING STRUCTURE', points: 'INDIVIDUAL PARTICLES' }[value];
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
// The portrait is an original parametric mesh. All geometry is created locally.
const rows = 64, columns = 48, vertices = [], faces = [];
const profile = [[-1, 0], [-.96, .16], [-.86, .29], [-.68, .34], [-.45, .33], [-.25, .28], [-.08, .18], [0, .12], [.2, .14], [.32, .27], [.55, .64], [.8, .82], [1, .86]];
function radius(y) {
  const index = profile.findIndex(pair => pair[0] >= y);
  if (index <= 0) return profile[0][1];
  const a = profile[index - 1], b = profile[index];
  return mix(a[1], b[1], (y - a[0]) / (b[0] - a[0]));
}
for (let row = 0; row < rows; row++) {
  const y = row / (rows - 1) * 2 - 1, r = radius(y);
  for (let column = 0; column < columns; column++) {
    const angle = column / columns * Math.PI * 2;
    const x = Math.sin(angle) * r;
    let z = Math.cos(angle) * r * .85;
    const front = Math.max(0, Math.cos(angle));
    const nose = .15 * Math.exp(-(((y + .43) / .13) ** 2)) * Math.exp(-((x / .065) ** 2));
    const eyes = -.055 * Math.exp(-(((y + .59) / .065) ** 2)) * Math.exp(-(((Math.abs(x) - .13) / .07) ** 2));
    const mouth = -.035 * Math.exp(-(((y + .23) / .026) ** 2)) * Math.exp(-((x / .12) ** 4));
    z += (nose + eyes + mouth) * front ** 8;
    vertices.push({ x, y, z, row, column });
    if (row < rows - 1) {
      const a = row * columns + column, b = row * columns + (column + 1) % columns;
      faces.push([a, b, b + columns, a + columns]);
    }
  }
}
const projected = vertices.map(() => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0 }));
const ordered = faces.map(indices => ({ indices, z: 0 }));
function portrait(angle, p, visibility) {
  const ca = Math.cos(angle), sa = Math.sin(angle), tilt = reduced ? 0 : eased.y * .16;
  const scale = Math.min(width * (width < 700 ? .54 : .30), height * .39) * mix(1, 1.14, p);
  const cx = width * (width < 700 ? .64 : .54), cy = height * .51;
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i], o = projected[i];
    const x = v.x * ca + v.z * sa, z = -v.x * sa + v.z * ca;
    o.ry = v.y * Math.cos(tilt) - z * Math.sin(tilt);
    o.z = v.y * Math.sin(tilt) + z * Math.cos(tilt);
    o.rx = x;
    const perspective = 3.5 / (3.5 - o.z);
    o.x = cx + x * scale * perspective; o.y = cy + o.ry * scale * perspective;
  }
  ctx.globalAlpha = visibility;
  if (material === 'points') {
    for (const v of projected) {
      const light = clamp((v.z + .5) / 1.1);
      ctx.fillStyle = p > .5 ? `rgba(30,30,30,${.15 + light * .7})` : `hsla(${190 + v.ry * 95 + light * 90},55%,${35 + light * 40}%,${.2 + light * .8})`;
      ctx.beginPath(); ctx.arc(v.x, v.y, .7 + light * 1.1, 0, Math.PI * 2); ctx.fill();
    }
    return;
  }
  for (const face of ordered) face.z = face.indices.reduce((sum, index) => sum + projected[index].z, 0) / 4;
  ordered.sort((a, b) => a.z - b.z);
  for (const face of ordered) {
    const [a, b, c, d] = face.indices.map(index => projected[index]);
    const ux = b.rx - a.rx, uy = b.ry - a.ry, uz = b.z - a.z;
    const vx = d.rx - a.rx, vy = d.ry - a.ry, vz = d.z - a.z;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const norm = Math.hypot(nx, ny, nz) || 1;
    const light = clamp((nx * -.4 + ny * -.6 + nz * .8) / norm * .5 + .5);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
    if (material === 'wire') {
      ctx.strokeStyle = p > .5 ? `rgba(15,15,15,${.08 + light * .45})` : `hsla(${180 + light * 130},45%,65%,${.08 + light * .55})`;
      ctx.lineWidth = .6; ctx.stroke();
    } else {
      ctx.fillStyle = p > .5 ? `hsl(50,5%,${mix(53,99,light)}%)` : `hsl(${190 + light * 135 + a.ry * 40},${35 + light * 25}%,${9 + light * 57}%)`;
      ctx.fill(); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = .5; ctx.stroke();
    }
  }
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
  const p = smooth((scroll - bounds.form + height * .65) / (height * .9));
  const workFade = smooth((scroll - bounds.work + height * .4) / (height * .6));
  const q = smooth((scroll - bounds.exit + height * .65) / (height * .8));
  const bg = q > 0 ? `rgb(${mix(242,226,q)},${mix(242,25,q)},${mix(239,34,q)})` : `rgb(${mix(9,242,p)},${mix(9,242,p)},${mix(9,239,p)})`;
  document.body.style.backgroundColor = bg; document.body.style.color = p > .5 ? '#090909' : '#e9e9e4';
  progress.textContent = String(Math.round(clamp(scroll / Math.max(1,bounds.end)) * 100)).padStart(3, '0') + '%';
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  const visibility = (1 - workFade) * (1 - q);
  const angle = rotation + manualTurn + (reduced ? 0 : eased.x * .5) + p * 1.2;
  if (p > 0 && visibility > .001) {
    ctx.save(); ctx.translate(width * .54, height * .51); ctx.rotate(-.1 + angle * .09);
    ctx.globalAlpha = p * visibility; ctx.fillStyle = '#e21922';
    ctx.fillRect(-width * .3, -height * .05, width * .6, height * .1);
    ctx.fillRect(-width * .025, -height * .47, width * .05, height * .94); ctx.restore();
  }
  if (visibility > .001) portrait(angle, p, visibility);
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
