/* Scene engine for chapter pages.
   Each <section class="scene" data-stop="name"> is one swipe. Elements inside animate in by
   their data-a type, in DOM order. Scene attributes set the background:
     data-dark="1"  plum mosaic + light header      data-veil="0..1"  blur layer strength
   Page hooks (Scenes.run({ hooks: { name: (tl, t, scene) => {} } })) add custom motion. */
const Scenes = (() => {
  const GAP = 0.12;
  const ENTER = {
    rise(tl, el, t) {
      const { words, sups } = splitMasked(el);
      tl.from(words, { yPercent: 110, duration: 0.8, stagger: 0.035, ease: 'power3.out' }, t);
      if (sups.length) tl.from(sups, { autoAlpha: 0, y: 6, duration: 0.4 }, t + 0.5 + words.length * 0.035);
      return 0.25 + words.length * 0.02;
    },
    up: (tl, el, t) => { tl.from(el, { autoAlpha: 0, y: 30, duration: 0.7, ease: 'power3.out' }, t); },
    fade: (tl, el, t) => { tl.from(el, { autoAlpha: 0, duration: 0.8 }, t); },
    left: (tl, el, t) => { tl.from(el, { autoAlpha: 0, x: -50, duration: 0.8, ease: 'power3.out' }, t); },
    right: (tl, el, t) => { tl.from(el, { autoAlpha: 0, x: 50, duration: 0.8, ease: 'power3.out' }, t); },
    pop: (tl, el, t) => { tl.from(el, { autoAlpha: 0, scale: 0.5, duration: 0.7, ease: 'back.out(1.7)' }, t); },
    zoom: (tl, el, t) => { tl.from(el, { autoAlpha: 0, scale: 1.15, duration: 1.1, ease: 'power3.out' }, t); },
    each(tl, el, t) {
      const kids = [...el.children];
      tl.from(kids, { autoAlpha: 0, y: 30, duration: 0.65, stagger: 0.1, ease: 'power3.out' }, t);
      return kids.length * 0.1;
    },
    'each-pop'(tl, el, t) {
      const kids = [...el.children];
      tl.from(kids, { autoAlpha: 0, scale: 0.4, duration: 0.7, stagger: 0.09, ease: 'back.out(1.6)' }, t);
      return kids.length * 0.09;
    },
    'each-left'(tl, el, t) {
      const kids = [...el.children];
      tl.from(kids, { autoAlpha: 0, x: -40, duration: 0.65, stagger: 0.1, ease: 'power3.out' }, t);
      return kids.length * 0.1;
    },
    count(tl, el, t) {
      Charts.counter(tl, el, +el.dataset.to, t, 1.2, +(el.dataset.dec ?? 1), '');
    },
    draw(tl, el, t) {
      tl.from($$('path, line, polyline, circle, ellipse, rect', el).filter((p) => getComputedStyle(p).stroke !== 'none'),
        { drawSVG: '0%', duration: 1.2, stagger: 0.05, ease: 'power2.inOut' }, t);
    },
    clip: (tl, el, t) => { tl.fromTo(el, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.inOut' }, t); },
    grow(tl, el, t) {
      tl.fromTo(el, { clipPath: 'inset(50% 50% 50% 50% round 6vmin)' }, { clipPath: 'inset(0% 0% 0% 0% round 3vmin)', duration: 1.1, ease: 'adz' }, t);
      tl.fromTo(el.firstElementChild, { scale: 1.25 }, { scale: 1, duration: 1.4, ease: 'power2.out' }, t);
    },
    hex(tl, el, t) {
      tl.from($$('.tri', el), {
        x: () => gsap.utils.random(-120, 120), y: () => gsap.utils.random(-120, 120), rotation: () => gsap.utils.random(-180, 180),
        scale: 0.2, autoAlpha: 0, duration: 1, stagger: 0.06, ease: 'power3.out',
      }, t);
      return 0.3;
    },
    chart(tl, el, t) { el.__enter && el.__enter(tl, t); return 0.3; },
    fill(tl, el, t) {
      // Hexagon that fills like a glass of liquid up to data-pct, with a counter.
      const pct = +el.dataset.pct;
      tl.from(el, { autoAlpha: 0, scale: 0.6, duration: 0.7, ease: 'back.out(1.6)' }, t)
        .fromTo($('.liq', el), { scaleY: 0 }, { scaleY: pct / 100, duration: 1.4, ease: 'power2.out' }, t + 0.3);
      Charts.counter(tl, $('.num', el), pct, t + 0.3, 1.4, pct % 1 ? 1 : 0, '');
    },
    none() {},
  };

  const top = (sc) => $$('[data-a]', sc).filter((el) => el.parentElement.closest('[data-a], .scene') === sc);

  function build(hooks) {
    const M = Mosaic.state, root = document.documentElement;
    const scenes = $$('.scene');
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    scenes.forEach((sc, i) => {
      const t0 = tl.duration();
      const dark = +(sc.dataset.dark || 0), veil = +(sc.dataset.veil ?? 1);
      if (i > 0) {
        const prev = scenes[i - 1];
        tl.to(top(prev), { autoAlpha: 0, y: -26, duration: 0.45, stagger: 0.03, ease: 'power2.in' }, t0)
          .to(prev, { autoAlpha: 0, duration: 0.3 }, t0 + 0.35);
      }
      const tm = i > 0 ? t0 + 0.1 : 0;
      tl.to(M, { dark, shift: `+=${i > 0 ? 1 : 0}`, duration: i > 0 ? 1.2 : 0.01, ease: 'power2.inOut' }, tm)
        .to('.veil', { autoAlpha: veil, duration: i > 0 ? 0.8 : 0.01, ease: 'none' }, tm)
        .to(root, {
          '--hdr': dark ? '#F3EDFB' : '#2B1738', '--hdr-bg': dark ? 'rgba(243,237,251,.12)' : 'rgba(255,255,255,.7)',
          '--veil-tint': dark ? 'rgba(33,16,44,.42)' : 'rgba(248,244,253,.46)', duration: i > 0 ? 0.6 : 0.01, ease: 'none',
        }, tm);
      const tIn = i > 0 ? t0 + 0.6 : 0.05;
      tl.set(sc, { autoAlpha: 1 }, tIn - 0.02);
      let c = tIn;
      $$('[data-a]', sc).forEach((el) => {
        const at = el.dataset.at != null ? tIn + +el.dataset.at : c;
        const extra = ENTER[el.dataset.a](tl, el, at) || 0;
        if (el.dataset.at == null) c = at + GAP + (+el.dataset.gap || 0) + extra * 0.5;
      });
      hooks[sc.dataset.stop] && hooks[sc.dataset.stop](tl, tIn, sc);
      tl.addLabel('s' + i, tl.duration() + 0.05);
    });
    return tl;
  }

  async function run({ hooks = {}, charts, world } = {}) {
    coreInit();
    if (world) document.body.classList.add('w' + world);
    Mosaic.init($('#mosaic'));
    Mosaic.world(world);
    Mosaic.state.reveal = 1;
    charts && charts();
    await document.fonts.ready;
    // GSAP reads each element's resting state while the timeline is built; a CSS transition
    // running at that moment would be read as the resting state, so transitions pause meanwhile.
    document.documentElement.classList.add('building');
    const tl = build(hooks);
    requestAnimationFrame(() => document.documentElement.classList.remove('building'));
    Stops.init(tl, $$('.scene').map((s) => s.dataset.stop), { playIn: true });
    Wipe.reveal();
    gsap.from('.hdr, .pager, .pi-badge', { autoAlpha: 0, duration: 0.8, delay: 0.4 });
    // Wrapped: a GSAP timeline is thenable, so returning it bare would make this promise
    // wait for the whole timeline to finish.
    return { tl };
  }

  return { run, ENTER };
})();
