/* Adzoy e-detailer core — shared by every page:
   page chrome (header, menu, pager, PI badge, panels), glossy icons, hexagon logo,
   stop-based navigation, triangle page wipe. */
gsap.registerPlugin(Observer, SplitText, CustomEase, DrawSVGPlugin);
CustomEase.create('adz', '0.65,0,0.1,1');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ---------- Chapters (menu, hub and "next chapter" links all read from here) ---------- */
const CHAPTERS = [
  { key: 'prevalence', href: 'prevalence.html', n: '01', title: 'Acne Prevalence', short: 'Prevalence', icon: 'globe', img: 'assets/img/menu/prevalence.jpg?v=2' },
  { key: 'pathophysiology', href: 'pathophysiology.html', n: '02', title: 'Pathophysiology', short: 'Pathophysiology', icon: 'follicle', img: 'assets/img/menu/follicle.jpg?v=2' },
  { key: 'qol', href: 'quality-of-life.html', n: '03', title: 'Impact on Quality of Life', short: 'Quality of life', icon: 'mirror', img: 'assets/img/menu/quality-of-life.jpg?v=2' },
  { key: 'guidelines', href: 'guidelines.html', n: '04', title: 'Guidelines & Treatment', short: 'Guidelines', icon: 'clipboard', img: 'assets/img/menu/treatment.jpg?v=2' },
  { key: 'dual', href: 'dual-action.html', n: '05', title: 'Dual-Action Formula', short: 'Dual action', icon: 'cube', img: 'assets/img/menu/dual-action.jpg?v=2' },
  { key: 'patients', href: 'index.html#patients', n: '06', title: 'Patient Profiles & Studies', short: 'Patients', icon: 'people', img: 'assets/img/menu/patients.jpg' },
  { key: 'howto', href: 'how-to-use.html', n: '07', title: 'How to Use Adzoy™ Gel', short: 'How to use', icon: 'tube', img: 'assets/img/menu/how-to-use.jpg?v=2' },
  { key: 'why', href: 'why-adzoy.html', n: '08', title: 'Why Adzoy™ Gel?', short: 'Why Adzoy', icon: 'shield', img: 'assets/img/menu/why.jpg' },
];

/* Stories that link out to evidence: ?from=<key> shows a pill back to the story. */
const RETURN = { majid: ['majid.html#outcome', 'Majid’s story'], sara: ['sara.html#outcome', 'Sara’s story'], omar: ['omar.html#outcome', 'Omar’s story'] };

/* ---------- Icon set (24×24, stroke) ---------- */
const ICONS = {
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>',
  follicle: '<path d="M3 9h6M15 9h6M12 2v10M8 21c0-5 1.6-8 4-9 2.4 1 4 4 4 9"/>',
  mirror: '<ellipse cx="12" cy="10" rx="6" ry="7"/><path d="M12 17v4M9 21h6M10 8.5h.01M14 8.5h.01M10 12c1.2 1 2.8 1 4 0"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 11l2 2 4-4M9 17h6"/>',
  cube: '<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><path d="M12 12l7.8-4.5M12 12v9M12 12L4.2 7.5"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2c2.9.3 5.5 2.6 5.5 5.8"/>',
  tube: '<path d="M9 3h6l-.8 3H9.8zM9.5 6h5l1.2 13a2 2 0 0 1-2 2h-3.4a2 2 0 0 1-2-2z"/><path d="M12 10v5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  drop: '<path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  layers: '<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>',
  bacteria: '<rect x="4" y="9" width="12" height="6" rx="3" transform="rotate(-25 10 12)"/><path d="M15 6l2.5-2M17 11h3M5.5 17l-2 2.5"/><circle cx="18" cy="17" r="2"/>',
  flame: '<path d="M12 21c-4 0-6.5-2.7-6.5-6.2 0-3.3 2.4-5.4 3.6-8 .7 1.6 1.4 2.6 2.6 3.3.3-2.9 1.6-5.2 3.5-7.1.3 3 3.3 5.6 3.3 10.4C18.5 18 16 21 12 21z"/>',
  heal: '<rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-45 12 12)"/><path d="M10.5 12h.01M12 10.5h.01M13.5 12h.01M12 13.5h.01"/>',
  prevent: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M12 9v6M9 12h6"/>',
  sparkle: '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M9 15l2 2 4-4"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
  pill: '<path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l6-6a4.95 4.95 0 0 1 7 7z"/><path d="M8.5 8.5l7 7"/>',
  feather: '<path d="M20 4c-8 0-13 5-14 14l-2 2"/><path d="M6 18c6 0 11-4 12-10"/><path d="M10 14h6"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  face: '<circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M9 15c1.7 1.3 4.3 1.3 6 0"/>',
  eyeoff: '<path d="M3 3l18 18M10.6 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.2 6.2C4.3 7.5 2.8 9.6 2 12c1 2.5 5 7 10 7 1.8 0 3.4-.6 4.8-1.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  steps: '<path d="M3 20h5v-5h5v-5h5V5h3"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  infinity: '<path d="M7.5 15.5c-2 0-3.5-1.6-3.5-3.5S5.5 8.5 7.5 8.5c3.5 0 5.5 7 9 7 2 0 3.5-1.6 3.5-3.5s-1.5-3.5-3.5-3.5c-3.5 0-5.5 7-9 7z"/>',
  link: '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  cloud: '<path d="M7 17a4 4 0 0 1-.6-8A6 6 0 0 1 18 8.5a4.3 4.3 0 0 1-1 8.5z"/><path d="M9 21l1-2M13 21l1-2"/>',
  pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
  molecule: '<circle cx="6" cy="12" r="2.5"/><circle cx="17" cy="6" r="2.5"/><circle cx="17" cy="18" r="2.5"/><path d="M8.3 11l6.4-3.8M8.3 13l6.4 3.8"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h8"/>',
  wash: '<path d="M12 3c2.5 3.5 5 6 5 9a5 5 0 0 1-10 0c0-3 2.5-5.5 5-9z"/><path d="M4 21h16"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
  flakes: '<path d="M4 8.5c2.7-1.8 5.3 1.8 8 0s5.3-1.8 8 0M4 14c2.7-1.8 5.3 1.8 8 0s5.3-1.8 8 0"/><path d="M7 19.5l2.5-1.2M14 20l2.8-1"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  repeat: '<path d="M4 11a8 8 0 0 1 13.7-4.7L20 8.5M20 4v4.5h-4.5M20 13a8 8 0 0 1-13.7 4.7L4 15.5M4 20v-4.5h4.5"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M11 18.5h2M9.5 7h5M9.5 10h5M9.5 13h3"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/><path d="M18.5 16.5c.9 1.3 1.4 2.2 1.4 2.9a1.4 1.4 0 0 1-2.8 0c0-.7.5-1.6 1.4-2.9z"/>',
  cap: '<path d="M2 9.5L12 5l10 4.5L12 14z"/><path d="M6 11.5v4.5c3.3 2.3 8.7 2.3 12 0v-4.5M22 9.5v5.5"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

/* ---------- Hexagon logo: six triangles meeting in the middle, as on the pack ---------- */
const HEX_COLORS = ['#C9ECF7', '#9FCDE8', '#7E6F83', '#A33B9E', '#C86CBF', '#E095D0'];
function hexSVG(cls = '') {
  const w = 86.6, h = 100, cx = w / 2, cy = h / 2;
  const v = [[cx, 0], [w, 25], [w, 75], [cx, h], [0, 75], [0, 25]];
  const tris = v.map((p, i) => {
    const q = v[(i + 1) % 6];
    return `<path class="tri" fill="${HEX_COLORS[i]}" d="M${cx} ${cy}L${p[0]} ${p[1]}L${q[0]} ${q[1]}Z"/>`;
  }).join('');
  return `<svg class="hex ${cls}" viewBox="-4 -4 94.6 108" aria-hidden="true">${tris}
    <path class="hex-edge" fill="none" d="M${v.map((p) => p.join(' ')).join('L')}Z"/></svg>`;
}

/* ---------- Mount helpers: hexes, glossy icons, reference superscripts ---------- */
function mount(root = document) {
  $$('[data-hex]', root).forEach((el) => { el.outerHTML = hexSVG(el.dataset.hex); });
  // Set the pivot once; changing it later makes GSAP leave an offset behind.
  gsap.set($$('.hex .tri', root), { transformOrigin: '50% 50%' });
  $$('[data-icon]', root).forEach((el) => {
    el.classList.add('gi');
    el.innerHTML = icon(el.dataset.icon);
    el.removeAttribute('data-icon');
  });
  $$('sup[data-ref]', root).forEach((s) => {
    s.textContent = s.dataset.ref.split(',').map((n) => n.trim()).join(', ');
    s.setAttribute('role', 'button');
  });
}

/* Split a heading into masked words. Reference superscripts are lifted out first:
   inside a word mask they get clipped, which hid the reference numbers. */
function splitMasked(el) {
  const sups = $$('sup', el);
  sups.forEach((s) => s.remove());
  const words = SplitText.create(el, { type: 'words', mask: 'words', wordsClass: 'w' }).words;
  sups.forEach((s) => el.appendChild(s));
  return { words, sups };
}

/* ---------- Page chrome, injected so every page shares one menu ---------- */
function chromeHTML() {
  const here = location.pathname.split('/').pop() || 'index.html';
  const items = CHAPTERS.map((c) => `<li><a href="${c.href}" data-href="${c.href}" data-key="${c.key}" class="${c.href.startsWith(here) ? 'here' : ''}"><span class="t"><em>${c.n}</em>${c.title}</span></a></li>`).join('');
  const imgs = CHAPTERS.map((c) => `<img data-key="${c.key}" class="${c.contain ? 'contain' : ''}" src="${c.img}" alt="">`).join('');
  return `
  <div class="veil" aria-hidden="true"></div>
  <header class="hdr">
    <a class="brand" href="index.html" data-href="index.html" aria-label="Adzoy home"><span class="wm-sm">Adz<i data-hex></i>y<sup>™</sup></span></a>
    <button class="menu-btn" aria-label="Open menu"><span>Menu</span><b>+</b></button>
  </header>
  <nav class="pager" aria-label="Sections">
    <button class="up" aria-label="Previous"><svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg></button>
    <ul></ul>
    <button class="down" aria-label="Next">
      <svg class="ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" pathLength="100"/></svg>
      <svg viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>
    </button>
  </nav>
  ${document.body.dataset.next ? `<a class="next-pill" href="${document.body.dataset.next}" data-href="${document.body.dataset.next}"><small>Next</small>${document.body.dataset.nextLabel}<i data-icon="arrow"></i></a>` : ''}
  ${RETURN[new URLSearchParams(location.search).get('from')] ? `<a class="back-pill" href="${RETURN[new URLSearchParams(location.search).get('from')][0]}" data-href="${RETURN[new URLSearchParams(location.search).get('from')][0]}"><i data-icon="arrow"></i>Back to ${RETURN[new URLSearchParams(location.search).get('from')][1]}</a>` : ''}
  <button class="pi-badge" data-panel="pi" aria-label="Prescribing information and safety">
    <svg class="spin" viewBox="0 0 100 100" aria-hidden="true">
      <defs><path id="circ" d="M50 50m-38 0a38 38 0 1 1 76 0a38 38 0 1 1-76 0"/></defs>
      <text><textPath href="#circ">PRESCRIBING INFORMATION · SAFETY · </textPath></text>
    </svg>
    <span class="i">i</span>
  </button>
  <div class="menu" aria-hidden="true">
    <div class="menu-bg"></div>
    <div class="menu-inner">
      <div class="menu-visual"><div class="menu-window">${imgs}</div><div class="menu-hex"><i data-hex></i></div></div>
      <nav class="menu-list"><ol>${items}</ol></nav>
      <div class="menu-foot">
        <a href="index.html" data-href="index.html">Home</a>
        <a href="strength-01.html" data-href="strength-01.html">Adzoy™ 0.1%</a>
        <a href="strength-03.html" data-href="strength-03.html">Adzoy™ 0.3%</a>
        <a href="#" data-panel="refs">References</a>
        <a href="#" data-panel="pi">Prescribing information</a>
      </div>
    </div>
  </div>
  <div class="panel" aria-hidden="true">
    <div class="panel-dim"></div>
    <aside class="panel-card"><button class="panel-close" aria-label="Close">×</button><div class="panel-body"></div></aside>
  </div>
  <div class="lightbox" aria-hidden="true"><img alt=""><button class="panel-close" aria-label="Close">×</button></div>
  <div class="wipe" aria-hidden="true"></div>
  <div class="toast" role="status"></div>
  <div class="rotate-hint"><p>Turn the iPad to landscape</p></div>`;
}

/* ---------- Toast ---------- */
let toastTween;
function toast(msg) {
  const el = $('.toast');
  el.textContent = msg;
  toastTween && toastTween.kill();
  toastTween = gsap.timeline()
    .fromTo(el, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power3.out' })
    .to(el, { autoAlpha: 0, y: 10, duration: 0.3 }, '+=2.2');
}

/* ---------- Triangle wipe: covers the screen between pages ---------- */
const Wipe = {
  el: null, tris: [],
  build(covered) {
    this.el = $('.wipe');
    const W = innerWidth, H = innerHeight, s = Math.max(W, H) / 8, h = s * 0.866;
    const colors = ['#2B1738', '#351D46', '#3E2253', '#2F1A3D', '#462660'];
    let d = '', i = 0;
    for (let r = -1; r * h < H + h; r++) {
      for (let c = -1; c * s < W + s; c++) {
        const x = c * s + (r & 1 ? s / 2 : 0), y = r * h;
        d += `<path fill="${colors[i++ % 5]}" d="M${x} ${y}L${x + s} ${y}L${x + s / 2} ${y + h}Z"/>`;
        d += `<path fill="${colors[(i * 3) % 5]}" d="M${x + s / 2} ${y + h}L${x + s * 1.5} ${y + h}L${x + s} ${y}Z"/>`;
      }
    }
    this.el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${d}</svg>`;
    this.tris = $$('path', this.el);
    gsap.set(this.tris, { transformOrigin: '50% 50%', scale: covered ? 1.08 : 0 });
    gsap.set(this.el, { autoAlpha: covered ? 1 : 0 });
  },
  delays(x, y) {
    const max = Math.hypot(innerWidth, innerHeight);
    return this.tris.map((t) => {
      const b = t.getBBox();
      return Math.hypot(b.x + b.width / 2 - x, b.y + b.height / 2 - y) / max;
    });
  },
  cover(x = innerWidth / 2, y = innerHeight / 2) {
    const d = this.delays(x, y);
    gsap.set(this.el, { autoAlpha: 1 });
    return gsap.to(this.tris, { scale: 1.08, duration: 0.45, ease: 'power2.out', delay: (i) => d[i] * 0.55 });
  },
  reveal(x = innerWidth / 2, y = innerHeight / 2) {
    const d = this.delays(x, y);
    return gsap.to(this.tris, {
      scale: 0, duration: 0.5, ease: 'power2.in', delay: (i) => d[i] * 0.6,
      onComplete: () => gsap.set(this.el, { autoAlpha: 0 }),
    });
  },
};

/* ---------- Stops: one swipe = one story beat ---------- */
const Stops = {
  tl: null, names: [], cur: 0, busy: false, observer: null,
  init(tl, names, { playIn = false } = {}) {
    this.tl = tl; this.names = names;
    // "#end" opens the page on its last stop (arriving backwards from the next page).
    const start = location.hash === '#end' ? names.length - 1 : Math.max(0, names.indexOf(location.hash.slice(1)));
    this.cur = start;
    if (playIn && start === 0) {
      // First scene animates in on load, then the page waits at label s0.
      this.busy = true;
      tl.tweenTo('s0', { delay: 0.55, onComplete: () => { this.busy = false; } });
    } else tl.seek('s' + start, false);
    this.buildPager();
    this.observer = Observer.create({
      target: window, type: 'wheel,touch', wheelSpeed: -1, tolerance: 12, preventDefault: true, ignore: '[data-noswipe]',
      onUp: () => this.go(this.cur + 1), onDown: () => this.go(this.cur - 1),
    });
    addEventListener('keydown', (e) => {
      if (Menu.open || Panel.open) return;
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); this.go(this.cur + 1); }
      if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); this.go(this.cur - 1); }
      if (e.key === 'Home') this.go(0);
      if (e.key === 'End') this.go(names.length - 1);
    });
    this.sync();
  },
  go(i, fast) {
    // Swiping past the last stop continues to the next page; swiping back from the
    // first stop returns to the previous page, landing on its last stop.
    const { next, prev } = document.body.dataset;
    if (!this.busy && ((i > this.names.length - 1 && next) || (i < 0 && prev))) {
      const url = i < 0 ? (prev.includes('#') ? prev : prev + '#end') : next;
      this.pause(true);
      Wipe.cover(innerWidth / 2, i < 0 ? 0 : innerHeight).then(() => { location.href = url; });
      return;
    }
    i = clamp(i, 0, this.names.length - 1);
    if (i === this.cur || this.busy) return;
    const target = this.tl.labels['s' + i], dist = Math.abs(i - this.cur);
    const d = Math.abs(target - this.tl.time());
    this.busy = true;
    this.cur = i;
    this.sync();
    this.tl.tweenTo(target, {
      duration: dist > 1 || fast ? Math.min(d, 1.8) : d,
      ease: dist > 1 || fast ? 'power1.inOut' : 'none',
      onComplete: () => { setTimeout(() => { this.busy = false; }, 250); },
    });
  },
  buildPager() {
    const ul = $('.pager ul');
    ul.innerHTML = this.names.map((n, i) => `<li><button aria-label="Go to ${n}" data-i="${i}"></button></li>`).join('');
    $$('button', ul).forEach((b) => b.addEventListener('click', () => this.go(+b.dataset.i)));
    $('.pager .up').addEventListener('click', () => this.go(this.cur - 1));
    $('.pager .down').addEventListener('click', () => this.go(this.cur + 1));
  },
  sync() {
    $$('.pager li').forEach((li, i) => li.classList.toggle('on', i === this.cur));
    $('.pager .up').classList.toggle('off', this.cur === 0 && !document.body.dataset.prev);
    const last = this.cur === this.names.length - 1;
    $('.pager .down').classList.toggle('off', last && !document.body.dataset.next);
    const pill = $('.next-pill');
    pill && gsap.to(pill, { autoAlpha: last ? 1 : 0, x: last ? 0 : -16, duration: 0.5, delay: last ? 0.8 : 0 });
    const n = Math.max(1, this.names.length - 1);
    gsap.to('.pager .ring circle', { strokeDashoffset: 100 - (100 * this.cur) / n, duration: 0.8, ease: 'power2.inOut' });
    history.replaceState(null, '', '#' + this.names[this.cur]);
  },
  pause(on) { this.observer && (on ? this.observer.disable() : this.observer.enable()); },
};

/* ---------- Menu: full-screen, circle reveal, hexagon window that previews each chapter ---------- */
const Menu = {
  open: false, exploded: false,
  init() {
    const btn = $('.menu-btn');
    btn.addEventListener('click', () => (this.open ? this.hide() : this.show()));
    this.tris = $$('.menu-hex .tri');
    this.imgs = $$('.menu-window img');
    $$('.menu-list a').forEach((a) => {
      const preview = () => this.preview(a.dataset.key);
      a.addEventListener('mouseenter', preview);
      a.addEventListener('touchstart', preview, { passive: true });
    });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.open) this.hide(); });
  },
  origin() {
    const r = $('.menu-btn').getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  },
  show() {
    this.open = true;
    Stops.pause(true);
    const [x, y] = this.origin(), R = Math.hypot(innerWidth, innerHeight);
    document.body.classList.add('menu-open');
    $('.menu-btn span').textContent = 'Close';
    gsap.set('.menu', { autoAlpha: 1 });
    gsap.fromTo('.menu-bg', { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${R}px at ${x}px ${y}px)`, duration: 0.8, ease: 'power3.inOut' });
    gsap.fromTo('.menu-list .t', { yPercent: 115 }, { yPercent: 0, duration: 0.7, stagger: 0.045, delay: 0.3, ease: 'power3.out' });
    gsap.fromTo('.menu-foot > *', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, delay: 0.6 });
    this.assemble(0.35);
  },
  hide(then) {
    this.open = false;
    const [x, y] = this.origin();
    $('.menu-btn span').textContent = 'Menu';
    document.body.classList.remove('menu-open');
    gsap.to('.menu-list .t', { yPercent: -115, duration: 0.35, stagger: 0.02, ease: 'power2.in' });
    gsap.to('.menu-bg', {
      clipPath: `circle(0px at ${x}px ${y}px)`, duration: 0.6, delay: 0.2, ease: 'power3.inOut',
      onComplete: () => { gsap.set('.menu', { autoAlpha: 0 }); Stops.pause(false); then && then(); },
    });
  },
  assemble(delay = 0) {
    this.exploded = false;
    gsap.to(this.imgs, { autoAlpha: 0, duration: 0.3 });
    $$('.menu-list a').forEach((a) => a.classList.remove('on'));
    gsap.fromTo(this.tris,
      { x: () => gsap.utils.random(-60, 60), y: () => gsap.utils.random(-60, 60), rotation: () => gsap.utils.random(-90, 90), autoAlpha: 0 },
      { x: 0, y: 0, rotation: 0, scale: 1, autoAlpha: 1, duration: 0.8, stagger: 0.05, delay, ease: 'power3.out' });
  },
  preview(key) {
    const img = this.imgs.find((i) => i.dataset.key === key);
    $$('.menu-list a').forEach((a) => a.classList.toggle('on', a.dataset.key === key));
    if (!this.exploded) {
      this.exploded = true;
      // The logo facets fly outwards and keep floating around the window.
      this.tris.forEach((t, i) => {
        const a = (-60 + i * 60) * (Math.PI / 180);
        gsap.to(t, { x: Math.cos(a) * 30, y: Math.sin(a) * 30, rotation: gsap.utils.random(-40, 40), scale: 0.42, duration: 0.8, ease: 'power3.out' });
      });
    }
    this.imgs.forEach((i) => {
      if (i === img) gsap.fromTo(i, { autoAlpha: 0, scale: 1.18 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: 'power3.out', overwrite: true });
      else gsap.to(i, { autoAlpha: 0, duration: 0.4, overwrite: true });
    });
  },
};

/* ---------- Side panel: prescribing information, references, study designs ---------- */
const PI_HTML = `
  <p class="eyebrow">Adzoy™ Gel 0.1%/2.5% · 0.3%/2.5%</p>
  <h3>Abbreviated Prescribing Information</h3>
  <div class="placeholder">
    <p><b>Placeholder.</b> This panel will carry the summary of the SFDA-approved SPC for Adzoy™. Fields still needed:</p>
    <ul>
      <li>Composition and indication</li>
      <li>Posology and method of administration</li>
      <li>Contraindications, including pregnancy</li>
      <li>Special warnings: sun exposure, eyes and mucous membranes, bleaching of hair and fabrics</li>
      <li>Undesirable effects</li>
      <li>Registration number, marketing authorisation holder (Jamjoom Pharma), address</li>
      <li>Pharmacovigilance contact</li>
    </ul>
  </div>`;

function refsHTML(highlight = []) {
  const rows = Object.entries(REFS).map(([n, url]) => {
    const u = url.split('#')[0];
    const host = u.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
    return `<li id="ref-${n}" class="${highlight.includes(+n) ? 'hl' : ''}"><b>${n}</b><span><em>${host}</em><a href="${url}" target="_blank" rel="noopener">${u.replace(/^https?:\/\//, '')}</a></span></li>`;
  }).join('');
  return `<p class="eyebrow">Adzoy™ Gel E-Detailer</p><h3>References</h3><ol class="refs">${rows}</ol>`;
}

const Panel = {
  open: false,
  show(html) {
    $('.panel-body').innerHTML = html;
    this.open = true; Stops.pause(true);
    $('.panel-card').scrollTop = 0;
    gsap.set('.panel', { autoAlpha: 1 });
    gsap.fromTo('.panel-card', { xPercent: 105 }, { xPercent: 0, duration: 0.7, ease: 'power3.out' });
    gsap.fromTo('.panel-dim', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
    const hl = $('.panel-body .hl');
    hl && setTimeout(() => hl.scrollIntoView({ block: 'center', behavior: 'smooth' }), 450);
  },
  hide() {
    this.open = false;
    gsap.to('.panel-card', { xPercent: 105, duration: 0.5, ease: 'power3.in' });
    gsap.to('.panel-dim', { autoAlpha: 0, duration: 0.4, delay: 0.1, onComplete: () => { gsap.set('.panel', { autoAlpha: 0 }); Stops.pause(false); } });
  },
  init() {
    document.addEventListener('click', (e) => {
      const p = e.target.closest('[data-panel]'), sup = e.target.closest('sup[data-ref]'), d = e.target.closest('[data-design]');
      if (!p && !sup && !d) return;
      e.preventDefault();
      const open = (html) => (Menu.open ? Menu.hide(() => this.show(html)) : this.show(html));
      if (sup) open(refsHTML(sup.dataset.ref.split(',').map((n) => +n)));
      else if (d) open(`<p class="eyebrow">${d.dataset.title || 'Clinical study'}</p><h3>Study design</h3><p class="design">${DESIGNS[d.dataset.design]}</p>`);
      else if (p.dataset.panel === 'refs') open(refsHTML());
      else open(PI_HTML);
    });
    $$('.panel .panel-close, .panel-dim').forEach((b) => b.addEventListener('click', () => this.hide()));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.open) this.hide(); });
  },
};

/* ---------- Lightbox for full-size figures ---------- */
const Lightbox = {
  init() {
    document.addEventListener('click', (e) => {
      const z = e.target.closest('[data-zoom]');
      if (!z) return;
      $('.lightbox img').src = z.dataset.zoom;
      Stops.pause(true);
      gsap.set('.lightbox', { autoAlpha: 1 });
      gsap.fromTo('.lightbox img', { scale: 0.85, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'power3.out' });
    });
    $('.lightbox').addEventListener('click', () => gsap.to('.lightbox', { autoAlpha: 0, duration: 0.3, onComplete: () => Stops.pause(false) }));
  },
};

/* ---------- Links: in-page stops, other pages (with the wipe), unbuilt pages ---------- */
function wireLinks() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-stop], [data-href], [data-soon]');
    if (!a) return;
    e.preventDefault();
    const x = e.clientX || innerWidth / 2, y = e.clientY || innerHeight / 2;
    if (a.dataset.stop) {
      const go = () => Stops.go(Stops.names.indexOf(a.dataset.stop), true);
      Menu.open ? Menu.hide(go) : go();
      return;
    }
    if (a.dataset.soon) {
      Wipe.cover(x, y).then(() => {
        toast(`“${a.dataset.soon}” is the next build step`);
        setTimeout(() => Wipe.reveal(x, y), 350);
      });
      return;
    }
    // Same page with a hash → jump to that stop instead of reloading.
    const [file, hash] = a.dataset.href.split('#');
    const here = location.pathname.split('/').pop() || 'index.html';
    if (file === here && hash && Stops.names.includes(hash)) {
      const go = () => Stops.go(Stops.names.indexOf(hash), true);
      Menu.open ? Menu.hide(go) : go();
      return;
    }
    Stops.pause(true);
    Wipe.cover(x, y).then(() => { location.href = a.dataset.href; });
  });
}

/* Page returned from the back/forward cache: uncover it again. */
addEventListener('pageshow', (e) => { if (e.persisted) { Wipe.reveal(); Stops.pause(false); } });

function coreInit() {
  document.body.insertAdjacentHTML('beforeend', chromeHTML());
  mount();
  Wipe.build(true);
  Menu.init();
  Panel.init();
  Lightbox.init();
  wireLinks();
  let t;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => Wipe.build(false), 200); });
}
