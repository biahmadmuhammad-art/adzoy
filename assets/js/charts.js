/* Animated SVG charts. Each builder draws into an element and attaches el.__enter(tl, t),
   which the scene engine calls so the chart plays (and reverses) with the swipe. */
const Charts = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const fmt = (v, dec) => v.toFixed(dec);

  function counter(tl, el, to, t, dur = 1.1, dec = 1, suffix = '') {
    const o = { v: 0 };
    tl.fromTo(o, { v: 0 }, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v, dec) + suffix; } }, t);
  }

  /* Line chart: several series over the same x values */
  function line(el, cfg) {
    const W = cfg.w || 640, H = cfg.h || 420, p = { l: 62, r: 150, t: 24, b: 64, ...cfg.pad };
    const iw = W - p.l - p.r, ih = H - p.t - p.b;
    const xs = cfg.x, xMax = Math.max(...xs), X = (v) => p.l + (v / xMax) * iw, Y = (v) => p.t + ih - (v / cfg.yMax) * ih;
    let s = `<svg viewBox="0 0 ${W} ${H}" class="chart line-chart" role="img" aria-label="${cfg.label || ''}">`;
    for (let v = 0; v <= cfg.yMax + 1e-9; v += cfg.yStep) {
      s += `<line class="grid" x1="${p.l}" x2="${p.l + iw}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${p.l - 12}" y="${Y(v) + 6}" text-anchor="end">${cfg.yFmt ? cfg.yFmt(v) : v}</text>`;
    }
    (cfg.xTicks || xs).forEach((v) => { s += `<text class="tick" x="${X(v)}" y="${p.t + ih + 30}" text-anchor="middle">${cfg.xLabel ? cfg.xLabel(v) : v}</text>`; });
    if (cfg.xTitle) s += `<text class="axis-title" x="${p.l + iw / 2}" y="${H - 2}" text-anchor="middle">${cfg.xTitle}</text>`;
    if (cfg.ref) s += `<line class="ref" x1="${p.l}" x2="${p.l + iw}" y1="${Y(cfg.ref.y)}" y2="${Y(cfg.ref.y)}"/><text class="ref-label" x="${p.l + 8}" y="${Y(cfg.ref.y) - 8}">${cfg.ref.label}</text>`;
    cfg.series.forEach((se, i) => {
      const pts = se.values.map((v, j) => (v == null ? null : [X(xs[j]), Y(v)])).filter(Boolean);
      s += `<g class="series s${i} ${se.hero ? 'hero' : ''}" style="--c:${se.color}">`;
      s += `<path class="ln" d="M${pts.map((q) => q.join(' ')).join('L')}"/>`;
      pts.forEach((q) => { s += `<circle class="pt" cx="${q[0]}" cy="${q[1]}" r="${se.hero ? 5.5 : 4}"/>`; });
      const last = pts[pts.length - 1];
      if (se.endLabel !== false) s += `<text class="end" x="${last[0] + 12}" y="${last[1] + 5 + (se.nudge || 0)}"><tspan class="num">0</tspan><tspan class="nm" x="${last[0] + 12}" dy="19">${se.name}</tspan></text>`;
      s += '</g>';
    });
    if (cfg.marks) cfg.marks.forEach((m) => { s += `<text class="mark" x="${X(m.x)}" y="${Y(m.y) - 14}" text-anchor="middle">${m.text}</text>`; });
    s += '</svg>';
    el.innerHTML = s;
    el.__enter = (tl, t) => {
      tl.from($$('.grid', el), { scaleX: 0, transformOrigin: '0 50%', duration: 0.7, stagger: 0.04, ease: 'power2.out' }, t)
        .from($$('.tick, .axis-title, .ref, .ref-label', el), { autoAlpha: 0, duration: 0.5, stagger: 0.015 }, t + 0.1);
      const order = cfg.series.map((se, i) => i).sort((a, b) => (cfg.series[a].hero ? 1 : 0) - (cfg.series[b].hero ? 1 : 0));
      order.forEach((i, k) => {
        const g = $(`.s${i}`, el), tt = t + 0.5 + k * 0.35, se = cfg.series[i];
        tl.from($('.ln', g), { drawSVG: '0%', duration: 1.2, ease: 'power2.inOut' }, tt)
          .from($$('.pt', g), { scale: 0, transformOrigin: '50% 50%', duration: 0.35, stagger: 0.12, ease: 'back.out(2)' }, tt + 0.1);
        const end = $('.end', g);
        if (end) {
          tl.from(end, { autoAlpha: 0, x: -10, duration: 0.5 }, tt + 1);
          const last = se.values.filter((v) => v != null).pop();
          counter(tl, $('.num', end), last, tt + 1, 0.8, se.dec ?? 1, se.suffix ?? '%');
        }
      });
      tl.from($$('.mark', el), { autoAlpha: 0, y: 8, duration: 0.4, stagger: 0.1 }, t + 0.5 + order.length * 0.35 + 0.6);
    };
  }

  /* Horizontal bars with counters */
  function barsH(el, cfg) {
    el.innerHTML = `<div class="bars-h">${cfg.rows.map((r) => `
      <div class="bh ${r.hero ? 'hero' : ''}"><span class="lbl">${r.label}</span>
        <span class="track"><i style="width:${(r.value / (cfg.max || 100)) * 100}%"></i></span>
        <b><span class="num">0</span>${r.suffix ?? '%'}</b></div>`).join('')}</div>`;
    el.__enter = (tl, t) => {
      $$('.bh', el).forEach((row, i) => {
        const tt = t + i * 0.12, r = cfg.rows[i];
        tl.from($('.lbl', row), { autoAlpha: 0, x: -20, duration: 0.5 }, tt)
          .from($('.track i', row), { scaleX: 0, transformOrigin: '0 50%', duration: 1, ease: 'power3.out' }, tt + 0.1);
        counter(tl, $('.num', row), r.value, tt + 0.1, 1, r.dec ?? (r.value % 1 ? 1 : 0), '');
      });
    };
  }

  /* Vertical bars (e.g. baseline vs week 12) */
  function barsV(el, cfg) {
    const max = cfg.max;
    el.innerHTML = `<div class="bars-v">${cfg.bars.map((b) => `
      <div class="bv ${b.hero ? 'hero' : ''}"><b><span class="num">0</span>${b.suffix ?? ''}</b>
        <span class="col"><i style="height:${(b.value / max) * 100}%"></i></span><span class="lbl">${b.label}</span></div>`).join('')}</div>`;
    el.__enter = (tl, t) => {
      $$('.bv', el).forEach((c, i) => {
        const tt = t + i * 0.25, b = cfg.bars[i];
        tl.from($('.col i', c), { scaleY: 0, transformOrigin: '50% 100%', duration: 1, ease: 'power3.out' }, tt)
          .from($('.lbl', c), { autoAlpha: 0, y: 10, duration: 0.4 }, tt);
        counter(tl, $('.num', c), b.value, tt, 1, b.dec ?? 1, '');
      });
    };
  }

  /* Range bar: lowest → highest reported */
  function range(el, cfg) {
    el.innerHTML = `<div class="range">
      <div class="range-track"><i style="left:${cfg.lo}%;width:${cfg.hi - cfg.lo}%"></i></div>
      <div class="range-lbl lo" style="left:${cfg.lo}%"><b><span class="num">0</span>%</b><span>lowest reported</span></div>
      <div class="range-lbl hi" style="left:${cfg.hi}%"><b><span class="num">0</span>%</b><span>highest reported</span></div></div>`;
    el.__enter = (tl, t) => {
      tl.from($('.range-track', el), { scaleX: 0, transformOrigin: '0 50%', duration: 0.8, ease: 'power2.out' }, t)
        .from($('.range-track i', el), { scaleX: 0, transformOrigin: '0 50%', duration: 1.1, ease: 'power3.inOut' }, t + 0.4)
        .from($$('.range-lbl', el), { autoAlpha: 0, y: 12, duration: 0.5, stagger: 0.2 }, t + 0.6);
      counter(tl, $('.lo .num', el), cfg.lo, t + 0.6, 0.8);
      counter(tl, $('.hi .num', el), cfg.hi, t + 0.8, 1.1);
    };
  }

  /* Donut ring with a counter in the middle */
  function ring(el, cfg) {
    el.innerHTML = `<svg viewBox="0 0 120 120" class="ring-svg"><circle class="bg" cx="60" cy="60" r="50"/>
      <circle class="fg" cx="60" cy="60" r="50" transform="rotate(-90 60 60)"/></svg>
      <div class="ring-c"><b><span class="num">0</span>%</b><span>${cfg.label}</span></div>`;
    el.__enter = (tl, t) => {
      tl.fromTo($('.fg', el), { drawSVG: '0% 0%' }, { drawSVG: `0% ${cfg.pct}%`, duration: 1.4, ease: 'power2.inOut' }, t)
        .from($('.ring-c', el), { autoAlpha: 0, scale: 0.8, duration: 0.6 }, t + 0.2);
      counter(tl, $('.num', el), cfg.pct, t + 0.2, 1.2, cfg.pct % 1 ? 1 : 0);
    };
  }

  return { line, barsH, barsV, range, ring, counter };
})();
