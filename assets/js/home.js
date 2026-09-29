/* Home page: the intro plus one master timeline with a label per stop.
   Each swipe tweens the timeline to the next label, so every scene is fully reversible. */
const STOPS = ['intro', 'actives', 'prevalence', 'strengths', 'patients', 'chapters'];
const DUR = [1.8, 2.1, 2.3, 2.5, 2.3]; // length of each transition, in seconds
const AT = DUR.reduce((a, d) => [...a, a[a.length - 1] + d], [0]); // start time of each stop

function splitWords(sel) {
  return $$(sel).flatMap((el) => splitMasked(el).words);
}

function introTimeline() {
  const M = Mosaic.state;
  const tl = gsap.timeline({ delay: 0.15 });
  tl.add(Wipe.reveal(), 0)
    .to(M, { reveal: 1, duration: 2.2, ease: 'power2.out' }, 0.2)
    .from('.s-intro .wordmark .tri', {
      x: () => gsap.utils.random(-140, 140), y: () => gsap.utils.random(-140, 140),
      rotation: () => gsap.utils.random(-180, 180), scale: 0.2, autoAlpha: 0,
      duration: 1.1, stagger: 0.07, ease: 'power3.out',
    }, 0.55)
    .from('.s-intro .wm-letter', { yPercent: 110, duration: 0.9, stagger: 0.07, ease: 'power4.out' }, 0.9)
    .from('.s-intro .wordmark sup, .s-intro .intro-sub, .s-intro .hint', { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.1 }, 1.4)
    .from('.hdr .menu-btn, .pager, .pi-badge', { autoAlpha: 0, duration: 0.8, stagger: 0.1 }, 1.6);
  return tl;
}

function masterTimeline() {
  const M = Mosaic.state, root = document.documentElement;
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  STOPS.forEach((n, i) => tl.addLabel('s' + i, AT[i]));

  /* 0 → 1  Two actives, one gel */
  let t = AT[0];
  const actWords = splitWords('.s-actives h2');
  tl.to('.s-intro .wordmark', { yPercent: -35, scale: 0.6, autoAlpha: 0, duration: 0.8, ease: 'power3.in' }, t)
    .to('.s-intro .intro-sub, .s-intro .hint', { autoAlpha: 0, y: -16, duration: 0.4, ease: 'power2.in' }, t)
    .to(M, { shift: 1, duration: DUR[0], ease: 'power2.inOut' }, t)
    .to('.veil', { autoAlpha: 1, duration: 0.9, ease: 'none' }, t + 0.3)
    .fromTo('.hdr .brand', { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, t + 0.8)
    .set('.s-actives', { autoAlpha: 1 }, t + 0.5)
    .from(actWords, { yPercent: 110, duration: 0.8, stagger: 0.06 }, t + 0.7)
    .from('.s-actives .eyebrow, .s-actives .lead, .s-actives .chips', { autoAlpha: 0, y: 24, duration: 0.7, stagger: 0.1 }, t + 0.9)
    .from('.s-actives .pk-01', { yPercent: 130, rotation: -28, autoAlpha: 0, duration: 1.1 }, t + 0.55)
    .from('.s-actives .pk-03', { yPercent: 140, rotation: 22, autoAlpha: 0, duration: 1.1 }, t + 0.7);

  /* 1 → 2  Prevalence statement, words light up on a dark mosaic */
  t = AT[1];
  const stWords = SplitText.create('.statement', { type: 'words' }).words;
  tl.to(actWords, { yPercent: -110, duration: 0.5, stagger: 0.025, ease: 'power2.in' }, t)
    .to('.s-actives .eyebrow, .s-actives .lead, .s-actives .chips', { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' }, t)
    .to('.s-actives .pk-01', { xPercent: -30, yPercent: -120, rotation: -30, autoAlpha: 0, duration: 0.9, ease: 'power2.in' }, t)
    .to('.s-actives .pk-03', { xPercent: 30, yPercent: -130, rotation: 26, autoAlpha: 0, duration: 0.9, ease: 'power2.in' }, t + 0.05)
    .set('.s-actives', { autoAlpha: 0 }, t + 1)
    .to(M, { dark: 1, shift: 2, duration: 1.2, ease: 'power2.inOut' }, t + 0.15)
    .to(root, { '--hdr': '#F3EDFB', '--hdr-bg': 'rgba(243,237,251,.12)', '--veil-tint': 'rgba(33,16,44,.42)', duration: 0.6, ease: 'none' }, t + 0.4)
    .set('.s-statement', { autoAlpha: 1 }, t + 0.6)
    .fromTo(stWords, { color: 'rgba(243,237,251,0.13)' }, {
      color: (i, el) => (el.closest('.hl') ? '#F4A9DA' : '#F3EDFB'), duration: 0.15, stagger: 0.03, ease: 'none',
    }, t + 0.65)
    .from('.s-statement .stat', { autoAlpha: 0, y: 30, duration: 0.6, stagger: 0.12 }, t + 1.25)
    .from('.s-statement .cta', { autoAlpha: 0, y: 20, duration: 0.5 }, t + 1.55);
  $$('.s-statement [data-count]').forEach((el) => {
    const o = { v: 0 }, end = +el.dataset.count;
    tl.to(o, { v: end, duration: 0.7, ease: 'power2.out', onUpdate: () => { el.textContent = o.v.toFixed(1); } }, t + 1.3);
  });

  /* 2 → 3  Choose the strength: the mosaic splits into the two pack worlds */
  t = AT[2];
  const strTitle = splitWords('.s-strengths h2');
  const nums = $$('.s-strengths .num').flatMap((el) => SplitText.create(el, { type: 'chars', mask: 'chars', charsClass: 'c' }).chars);
  tl.to('.s-statement .statement, .s-statement .stats, .s-statement .cta', { autoAlpha: 0, y: -40, duration: 0.6, stagger: 0.05, ease: 'power2.in' }, t)
    .set('.s-statement', { autoAlpha: 0 }, t + 0.7)
    .to(M, { dark: 0, split: 1, duration: 1.1, ease: 'power2.inOut' }, t + 0.2)
    .to(M, { seam: 0.5, duration: 1.3, ease: 'power3.inOut' }, t + 0.5)
    .to(root, { '--hdr': '#2B1738', '--hdr-bg': 'rgba(255,255,255,.7)', '--veil-tint': 'rgba(248,244,253,.3)', duration: 0.6, ease: 'none' }, t + 0.35)
    .set('.s-strengths', { autoAlpha: 1 }, t + 0.5)
    .from('.s-strengths .seam', { scaleY: 0, duration: 1, ease: 'power3.inOut' }, t + 0.6)
    .from('.s-strengths .seam-hex', { scale: 0, rotation: -120, duration: 0.8, ease: 'back.out(1.7)' }, t + 1.1)
    .from(strTitle, { yPercent: 110, duration: 0.7, stagger: 0.05 }, t + 0.7)
    .from(nums, { yPercent: 110, duration: 0.7, stagger: 0.04 }, t + 0.95)
    .from('.half-01 .rv', { autoAlpha: 0, x: -40, duration: 0.6, stagger: 0.07 }, t + 1.1)
    .from('.half-03 .rv', { autoAlpha: 0, x: 40, duration: 0.6, stagger: 0.07 }, t + 1.15)
    .from('.half-01 .spack', { yPercent: 60, rotation: -14, autoAlpha: 0, duration: 1, ease: 'back.out(1.3)' }, t + 1)
    .from('.half-03 .spack', { yPercent: 60, rotation: 14, autoAlpha: 0, duration: 1, ease: 'back.out(1.3)' }, t + 1.1);

  /* 3 → 4  Meet the patients: a small card grows to full screen */
  t = AT[3];
  const patTitle = splitWords('.s-patients h2');
  tl.to('.half-01', { xPercent: -25, autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, t)
    .to('.half-03', { xPercent: 25, autoAlpha: 0, duration: 0.6, ease: 'power2.in' }, t)
    .to('.s-strengths h2, .s-strengths .seam, .s-strengths .seam-hex', { autoAlpha: 0, duration: 0.4 }, t)
    .set('.s-strengths', { autoAlpha: 0 }, t + 0.6)
    .to(M, { split: 0, shift: 3, duration: 1, ease: 'power2.inOut' }, t + 0.3)
    .to(root, { '--veil-tint': 'rgba(248,244,253,.46)', duration: 0.6, ease: 'none' }, t + 0.3)
    .set(M, { seam: 1.15 }, t + 1.3)
    .set('.s-patients', { autoAlpha: 1 }, t + 0.4)
    .fromTo('.grow', { clipPath: 'inset(50% 50% 50% 50% round 9vmin)' }, { clipPath: 'inset(22% 36% 22% 36% round 9vmin)', duration: 0.6, ease: 'power2.out' }, t + 0.4)
    .to('.grow', { clipPath: 'inset(0% 0% 0% 0% round 0vmin)', duration: 1.1, ease: 'adz' }, t + 1.0)
    .fromTo('.grow-inner', { scale: 0.62 }, { scale: 1, duration: 1.7, ease: 'power2.inOut' }, t + 0.4)
    .from('.s-patients .pstage', { yPercent: 40, duration: 1.2, ease: 'power3.out' }, t + 0.8)
    .from('.s-patients .fig', { yPercent: 70, duration: 1.1, stagger: 0.12 }, t + 1.05)
    .from(patTitle, { yPercent: 110, duration: 0.7, stagger: 0.05 }, t + 1.35)
    .from('.s-patients .eyebrow, .s-patients .lead', { autoAlpha: 0, y: 18, duration: 0.5, stagger: 0.08 }, t + 1.5)
    .from('.s-patients .chip', { autoAlpha: 0, scale: 0.6, y: 20, duration: 0.6, stagger: 0.1, ease: 'back.out(1.8)' }, t + 1.7);

  /* 4 → 5  Chapters hub: icons fly out of the logo into orbit */
  t = AT[4];
  const hubTitle = splitWords('.s-hub h2');
  tl.to('.grow', { yPercent: -105, duration: 1, ease: 'power2.inOut' }, t)
    .set('.s-patients', { autoAlpha: 0 }, t + 1)
    .to(M, { shift: 4, duration: DUR[4], ease: 'power2.inOut' }, t)
    .set('.s-hub', { autoAlpha: 1 }, t + 0.3)
    .from('.hub-core', { yPercent: 70, scale: 0.5, autoAlpha: 0, duration: 1.1 }, t + 0.45)
    .from('.orbit-ring', { scale: 0.6, autoAlpha: 0, duration: 1.1, ease: 'power2.out' }, t + 0.8)
    .from('.orb', {
      xPercent: (i, el) => -parseFloat(el.style.getPropertyValue('--dx')) * 100 / 9.5,
      yPercent: (i, el) => -parseFloat(el.style.getPropertyValue('--dy')) * 100 / 9.5,
      scale: 0, autoAlpha: 0, duration: 0.9, stagger: 0.06, ease: 'back.out(1.4)',
    }, t + 0.9)
    .from('.orb .lbl', { autoAlpha: 0, y: 8, duration: 0.4, stagger: 0.05 }, t + 1.5)
    .from(hubTitle, { yPercent: 110, duration: 0.7, stagger: 0.05 }, t + 0.7);

  return tl;
}

/* Idle motion that runs on its own, outside the swipe timeline */
function idle() {
  gsap.to('.pk-01 img', { y: -14, rotation: -1.5, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.pk-03 img', { y: -18, rotation: 1.5, duration: 3.1, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.4 });
  gsap.to('.spack img', { y: -10, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.5 });
  gsap.to('.hub-core .hex', { y: -10, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.orb .dot', { y: -5, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.25, from: 'random' } });
  gsap.to('.hint i', { y: 8, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.s-patients .pod', { y: -8, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.7 });
}

function placeOrbit() {
  // Chapters sit on an ellipse around the logo (units of --u, so it scales with the screen).
  const orbs = $$('.orb'), n = orbs.length, rx = 34, ry = 21;
  orbs.forEach((o, i) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    o.style.setProperty('--dx', (Math.cos(a) * rx).toFixed(2));
    o.style.setProperty('--dy', (Math.sin(a) * ry).toFixed(2));
  });
}

function portraits() {
  // Silhouettes hold the place of the AI patient portraits. Drop a transparent PNG cut-out
  // at assets/img/patients/<name>.png and it replaces the silhouette automatically.
  const G = { majid: ['#9ED8F2', '#3F7DC4'], sara: ['#F6BCE0', '#B0579E'], omar: ['#C3A8E8', '#5A3486'] };
  $$('.portrait').forEach((p) => {
    const n = p.dataset.name, [a, b] = G[n];
    const body = n === 'omar'
      ? `<path fill="url(#g-${n})" d="M84 118h32v26c34 4 62 24 68 62l6 54H10l6-54c6-38 34-58 68-62z"/>
         <path fill="#fff" opacity=".9" d="M100 24c-34 0-50 24-50 52l-8 88c20-10 38-14 58-14s38 4 58 14l-8-88c0-28-16-52-50-52z"/>
         <ellipse cx="100" cy="90" rx="27" ry="35" fill="url(#g-${n})"/>
         <ellipse cx="100" cy="46" rx="40" ry="9" fill="none" stroke="#2B1738" stroke-width="6"/>`
      : n === 'sara'
      ? `<path fill="url(#g-${n})" d="M100 22c-38 0-54 30-54 64 0 24 7 42 18 54-26 8-46 30-52 64l-6 56h188l-6-56c-6-34-26-56-52-64 11-12 18-30 18-54 0-34-16-64-54-64z"/>
         <ellipse cx="100" cy="86" rx="29" ry="37" fill="#fff" opacity=".28"/>`
      : `<ellipse cx="100" cy="78" rx="40" ry="48" fill="url(#g-${n})"/>
         <path fill="url(#g-${n})" d="M84 118h32v26c34 4 62 24 68 62l6 54H10l6-54c6-38 34-58 68-62z"/>`;
    p.innerHTML = `<svg viewBox="0 0 200 260" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      <defs><linearGradient id="g-${n}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      ${body}
    </svg><img src="assets/img/patients/${n}.png" alt="">`;
    const img = p.querySelector('img');
    img.onload = () => p.querySelector('svg').remove();
    img.onerror = () => img.remove();
  });
}

(async function () {
  coreInit();
  Mosaic.init($('#mosaic'));
  placeOrbit();
  portraits();
  await document.fonts.ready;
  const tl = masterTimeline();
  Stops.init(tl, STOPS);
  if (Stops.cur === 0) {
    Stops.busy = true;
    introTimeline().eventCallback('onComplete', () => { Stops.busy = false; });
  } else {
    Mosaic.state.reveal = 1;
    Wipe.reveal();
  }
  idle();
})();
