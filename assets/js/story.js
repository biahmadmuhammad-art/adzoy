/* Patient story pages: frame sequence that follows the swipe, face hotspots,
   "what would you prescribe" decision, before/after mirror, parallax portrait. */
const Story = (() => {
  /* ---------- Frame sequence drawn on a canvas ---------- */
  function sequence(canvas, urls) {
    const ctx = canvas.getContext('2d');
    const imgs = urls.map((u) => { const i = new Image(); i.decoding = 'async'; i.src = u; return i; });
    let last = -1;
    const size = () => {
      const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d);
      last = -1;
    };
    const draw = (f) => {
      const i = Math.max(0, Math.min(imgs.length - 1, Math.round(f)));
      const img = imgs[i];
      if (i === last || !img.complete || !img.naturalWidth) return;
      last = i;
      // cover-fit
      const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };
    imgs[0].onload = () => draw(0);
    addEventListener('resize', size);
    size();
    return { draw, count: imgs.length };
  }

  /* ---------- Face hotspots ---------- */
  function hotspots(spots, hd) {
    const frame = $('.face-frame'), card = $('.spot-card');
    if (!frame) return;
    const ZOOM = 4;
    // The photo and lens are clipped in their own layer, so the card can sit outside the frame
    // (beside the photo) and never cover the other spots.
    const clip = document.createElement('div');
    clip.className = 'face-clip';
    frame.prepend(clip);
    clip.appendChild($('img', frame));
    const lens = document.createElement('i');
    lens.className = 'lens';
    lens.style.width = `${100 / ZOOM}%`;
    clip.appendChild(lens);
    const link = document.createElement('i');
    link.className = 'spot-link';
    frame.appendChild(link);
    const scene = frame.closest('.scene');
    gsap.set([card, lens, link], { autoAlpha: 0 });
    let open = null;
    $$('.spot', frame).forEach((b) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (open === b) { close(); return; }
      open = b;
      $$('.spot', frame).forEach((x) => x.classList.toggle('on', x === b));
      const s = spots[b.dataset.k];
      const x = +b.style.getPropertyValue('--x'), y = +b.style.getPropertyValue('--y');
      // Magnify the same photo: the card shows the patch under the lens at ZOOM×.
      const bp = (v) => clamp(((v / 100) * ZOOM - 0.5) / (ZOOM - 1) * 100, 0, 100);
      card.innerHTML = `<div class="zoom" style="background-image:url(${hd});background-size:${ZOOM * 100}%;background-position:${bp(x)}% ${bp(y)}%"></div>
        <div><small>${s.k}</small><b>${s.t}</b><span>${s.d}</span></div>`;
      lens.style.left = `${x}%`; lens.style.top = `${y}%`;
      gsap.fromTo(lens, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' });
      gsap.fromTo($('.zoom', card), { scale: 1.6 }, { scale: 1, duration: 0.7, ease: 'power3.out' });
      // Card beside the photo, level with the spot (kept inside the frame's height).
      const fh = frame.offsetHeight, ch = card.offsetHeight;
      card.style.top = `${clamp((y / 100) * fh - ch / 2, 0, fh - ch)}px`;
      link.style.top = `${y}%`;
      link.style.width = `calc(${x}% + var(--u) * 2.4)`;
      scene.classList.add('spot-open');
      gsap.fromTo(card, { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'power3.out' });
      gsap.fromTo(link, { autoAlpha: 0, scaleX: 0 }, { autoAlpha: 1, scaleX: 1, duration: 0.45, ease: 'power2.out', transformOrigin: '100% 50%' });
    }));
    const close = () => {
      open = null;
      $$('.spot', frame).forEach((x) => x.classList.remove('on'));
      scene.classList.remove('spot-open');
      gsap.to(card, { autoAlpha: 0, x: 24, duration: 0.25 });
      gsap.to([lens, link], { autoAlpha: 0, duration: 0.25 });
    };
    document.addEventListener('click', (e) => { if (open && !e.target.closest('.spot-card')) close(); });
  }

  /* ---------- "What would you prescribe?" ---------- */
  function decision(cfg) {
    const box = $('.choices'), out = $('.verdict'), card = $('.verdict-card');
    if (!box) return;
    $$('button', box).forEach((b) => b.addEventListener('click', () => {
      const ok = b.dataset.c === cfg.correct;
      $$('button', box).forEach((x) => {
        x.classList.toggle('picked', x === b);
        x.classList.toggle('right', x.dataset.c === cfg.correct);
        x.classList.toggle('wrong', x === b && !ok);
      });
      out.innerHTML = `<p class="fb ${ok ? 'ok' : 'no'}">${cfg.feedback[b.dataset.c]}</p>`;
      const first = !card.innerHTML;
      card.innerHTML = `
        <div class="why card">
          <h3>${cfg.title}</h3>
          <button class="cta" data-stop="recommended">Why this is recommended <em>→</em></button>
        </div>`;
      mount(card);
      gsap.from(out.children, { autoAlpha: 0, y: 12, duration: 0.45 });
      if (first) {
        // The recommendation card slides in over the right side of the photo.
        gsap.from(card, { autoAlpha: 0, x: 60, duration: 0.7, ease: 'power3.out' });
        gsap.from($$('.why li', card), { autoAlpha: 0, x: -14, duration: 0.4, stagger: 0.07, delay: 0.3 });
      }
    }));
  }

  /* ---------- Mirror: drag to compare before / after ---------- */
  function mirror() {
    const m = $('.mirror');
    if (!m) return;
    const set = (p) => m.style.setProperty('--p', clamp(p, 0.02, 0.98));
    set(0.5);
    let drag = false;
    const move = (e) => {
      if (!drag) return;
      const r = m.getBoundingClientRect();
      set((e.clientX - r.left) / r.width);
    };
    m.addEventListener('pointerdown', (e) => { drag = true; hint.kill(); m.setPointerCapture(e.pointerId); move(e); });
    m.addEventListener('pointermove', move);
    m.addEventListener('pointerup', () => { drag = false; });
    // A gentle back-and-forth until someone touches it.
    const o = { p: 0.5 };
    const hint = gsap.to(o, { p: 0.62, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut', onUpdate: () => set(o.p) });
  }

  /* ---------- Treatment history: tap a step, the picture and symptoms follow ---------- */
  function history() {
    const root = $('.hist');
    if (!root) return null;
    const scene = root.closest('.scene');
    const steps = $$('.hstep', root), pics = $$('.hist-pic', scene), chips = $$('.symptom', scene);
    let cur = -1, auto = null;
    gsap.set(pics, { autoAlpha: 0 });
    gsap.set(chips, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.4 });
    const show = (i) => {
      if (i === cur) return;
      cur = i;
      steps.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('done', k < i); });
      root.style.setProperty('--h', i / (steps.length - 1));
      const pic = +steps[i].dataset.pic;
      pics.forEach((p, k) => gsap.to(p, { autoAlpha: k === pic ? 1 : 0, duration: 0.6, overwrite: true }));
      gsap.fromTo(pics[pic], { scale: 1.06 }, { scale: 1, duration: 1.2, ease: 'power3.out' });
      // A chip shows on its own step (data-step), or on every step marked data-symptoms.
      const on = chips.filter((c) => (c.dataset.step != null ? +c.dataset.step === i : steps[i].hasAttribute('data-symptoms')));
      gsap.to(chips.filter((c) => !on.includes(c)), { autoAlpha: 0, scale: 0.4, duration: 0.25, overwrite: true });
      if (on.length) gsap.to(on, { autoAlpha: 1, scale: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(2)', delay: 0.3, overwrite: true });
      scene.classList.toggle('paused', steps[i].hasAttribute('data-paused'));
    };
    const stop = () => { if (auto) { auto.kill(); auto = null; } };
    steps.forEach((s, i) => s.addEventListener('click', () => { stop(); show(i); }));
    show(0);
    // Plays the four steps once when the scene arrives, until the rep taps a step.
    return {
      play() {
        stop(); show(0);
        auto = gsap.timeline();
        steps.slice(1).forEach((_, k) => auto.call(() => show(k + 1), null, 2.4 * (k + 1)));
      },
      reset() { stop(); show(0); },
    };
  }

  /* ---------- Parallax portrait (pointer on desktop, tilt on iPad) ---------- */
  function parallax() {
    const layers = $$('.hero-portrait .layer');
    if (!layers.length) return;
    const depth = (el) => (el.classList.contains('l-cut') ? 14 : el.classList.contains('l-hex') ? -10 : 26);
    const to = layers.map((el) => ({ x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3' }), d: depth(el) }));
    const apply = (nx, ny) => to.forEach((t) => { t.x(nx * t.d); t.y(ny * t.d); });
    addEventListener('pointermove', (e) => apply(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));
    addEventListener('deviceorientation', (e) => { if (e.gamma != null) apply(clamp(e.gamma / 30, -0.5, 0.5), clamp((e.beta - 45) / 30, -0.5, 0.5)); });
  }

  function run(cfg) {
    const seq = sequence($('.seq'), cfg.frames);
    const n = seq.count - 1, W = cfg.weeks;
    const st = { f: 0 };
    const count = $('.rail-count');
    const render = () => {
      seq.draw(st.f);
      const p = st.f / n;
      // Two videos of equal length: first half runs W0→W1, second half W1→W2.
      const week = p <= 0.5 ? W[0] + (W[1] - W[0]) * (p / 0.5) : W[1] + (W[2] - W[1]) * ((p - 0.5) / 0.5);
      $('.rail-week span').textContent = Math.round(week);
      $('.rail-fill').style.transform = `scaleY(${p})`;
      if (count) {
        // Countdown to the patient's event (Sara: graduation at the last week).
        const days = Math.round((W[2] - week) * 7);
        count.querySelector('b').textContent = days ? days : '';
        count.querySelector('span').textContent = days ? (days === 1 ? 'day to graduation' : 'days to graduation') : 'Graduation day';
      }
    };
    // Stops sit evenly on the rail (the weeks are not evenly spaced).
    $$('.rail-dot').forEach((d, i) => d.style.setProperty('--p', i / (W.length - 1)));
    const wk = W.map((w) => `week-${w}`);
    const hist = history();
    const histStop = hist && $('.hist').closest('.scene').dataset.stop;

    const hooks = {
      [cfg.id](tl, t) {
        const chars = SplitText.create('.s-hook .voice .q', { type: 'chars,words' }).chars;
        tl.from('.hero-portrait .l-hex', { scale: 0.6, autoAlpha: 0, rotation: -30, duration: 1.1, ease: 'back.out(1.4)' }, t)
          .from('.hero-portrait .l-cut', { yPercent: 25, autoAlpha: 0, duration: 1.1 }, t + 0.2)
          .from('.hero-portrait .facet', { scale: 0, autoAlpha: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(2)' }, t + 0.6)
          // Hook quote only: the outcome quote has its own entrance.
          .from('.s-hook .voice', { autoAlpha: 0, duration: 0.3 }, t + 0.8)
          .from(chars, { autoAlpha: 0, duration: 0.01, stagger: 0.018 }, t + 0.9);
      },
      [histStop || 'history'](tl, t) {
        tl.from('.hist-frame', { autoAlpha: 0, scale: 0.9, duration: 0.8, ease: 'power3.out' }, t)
          .call(() => hist && hist.play(), null, t + 1);
      },
      [wk[0]](tl, t) {
        tl.fromTo('.seq-wrap', { autoAlpha: 0, x: 60 }, { autoAlpha: 1, x: 0, duration: 0.9, ease: 'power3.out' }, t - 0.4)
          .from('.rail', { autoAlpha: 0, y: 20, duration: 0.6 }, t);
      },
      [wk[1]](tl, t) { tl.to(st, { f: n / 2, duration: 2.2, ease: 'none', onUpdate: render }, t - 0.5); },
      [wk[2]](tl, t) { tl.to(st, { f: n, duration: 2.2, ease: 'none', onUpdate: render }, t - 0.5); },
      mirror(tl, t) { tl.to('.seq-wrap', { autoAlpha: 0, x: 60, duration: 0.5, ease: 'power2.in' }, t - 0.6); },
    };
    render();
    hotspots(cfg.spots, cfg.zoomSrc);
    decision(cfg.decision);
    mirror();
    parallax();
    return Scenes.run({ hooks, charts: cfg.charts, world: cfg.world || '01' });
  }

  return { run };
})();
