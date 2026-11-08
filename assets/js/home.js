/* Home page: the intro plus one master timeline with a label per stop.
   Each swipe tweens the timeline to the next label, so every scene is fully reversible. */
const STOPS = ['intro', 'actives'];
const DUR = [1.8]; // length of each transition, in seconds
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
    .from('.s-intro .wordmark sup, .s-intro .intro-sub, .s-intro .hint, .s-intro .slogan', { autoAlpha: 0, y: 18, duration: 0.7, stagger: 0.1 }, 1.4)
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
    .to('.s-intro .intro-sub, .s-intro .hint, .s-intro .slogan', { autoAlpha: 0, y: -16, duration: 0.4, ease: 'power2.in' }, t)
    .to(M, { shift: 1, duration: DUR[0], ease: 'power2.inOut' }, t)
    .to('.veil', { autoAlpha: 1, duration: 0.9, ease: 'none' }, t + 0.3)
    .fromTo('.hdr .brand', { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.6 }, t + 0.8)
    .set('.s-actives', { autoAlpha: 1 }, t + 0.5)
    .from(actWords, { yPercent: 110, duration: 0.8, stagger: 0.06 }, t + 0.7)
    .from('.s-actives .eyebrow, .s-actives .lead, .s-actives .chips, .s-actives .slogan', { autoAlpha: 0, y: 24, duration: 0.7, stagger: 0.1 }, t + 0.9)
    .from('.s-actives .pk-01', { yPercent: 130, rotation: -28, autoAlpha: 0, duration: 1.1 }, t + 0.55)
    .from('.s-actives .pk-03', { yPercent: 140, rotation: 22, autoAlpha: 0, duration: 1.1 }, t + 0.7);

  return tl;
}

/* Idle motion that runs on its own, outside the swipe timeline */
function idle() {
  gsap.to('.pk-01 img', { y: -14, rotation: -1.5, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.pk-03 img', { y: -18, rotation: 1.5, duration: 3.1, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.4 });
  gsap.to('.hint i', { y: 8, duration: 0.9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
}

(async function () {
  coreInit();
  Mosaic.init($('#mosaic'));
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
