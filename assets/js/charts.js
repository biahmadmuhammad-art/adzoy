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

  /* Faithful redraw of a published line figure: markers per series, dashed lines, a separate
     end column ("End Point" / "Worst"), a reference line, significance symbols and a legend.
     No values are written on the lines. */
  const MARK = {
    circle: (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`,
    open: (x, y, r) => `<circle class="open" cx="${x}" cy="${y}" r="${r}"/>`,
    square: (x, y, r) => `<rect x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}"/>`,
    triangle: (x, y, r) => `<path d="M${x} ${y - r * 1.15}L${x + r * 1.1} ${y + r * 0.8}L${x - r * 1.1} ${y + r * 0.8}Z"/>`,
    diamond: (x, y, r) => `<path d="M${x} ${y - r * 1.25}L${x + r * 1.1} ${y}L${x} ${y + r * 1.25}L${x - r * 1.1} ${y}Z"/>`,
  };
  function plot(el, cfg) {
    const W = cfg.w || 720, H = cfg.h || 470, p = { l: 78, r: 24, t: 16, b: 78, ...cfg.pad };
    const iw = W - p.l - p.r, ih = H - p.t - p.b, ext = cfg.extra ? (cfg.extraGap || 96) : 0, aw = iw - ext;
    const yMin = cfg.yMin || 0, X = (v) => p.l + ((v - cfg.xMin) / (cfg.xMax - cfg.xMin)) * aw, XE = p.l + aw + ext * 0.62;
    const Y = (v) => p.t + ih - ((v - yMin) / (cfg.yMax - yMin)) * ih, R = cfg.r || 6;
    const at = (x) => (x === 'extra' ? XE : X(x));
    let s = `<svg viewBox="0 0 ${W} ${H}" class="chart fig" role="img" aria-label="${cfg.label || ''}"><g class="axes">`;
    s += `<line x1="${p.l}" x2="${p.l}" y1="${p.t}" y2="${p.t + ih}"/><line x1="${p.l}" x2="${p.l + aw}" y1="${p.t + ih}" y2="${p.t + ih}"/>`;
    cfg.yTicks.forEach((v) => { s += `<line x1="${p.l - 7}" x2="${p.l}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${p.l - 12}" y="${Y(v) + 6}" text-anchor="end">${cfg.yFmt ? cfg.yFmt(v) : v}</text>`; });
    cfg.xTicks.forEach((tk) => {
      const x = at(tk.v);
      if (tk.v !== 'extra') s += `<line x1="${x}" x2="${x}" y1="${p.t + ih}" y2="${p.t + ih + 7}"/>`;
      s += `<text class="tick" x="${x}" y="${p.t + ih + 28}" text-anchor="middle">${String(tk.label).split('\n').map((l, i) => `<tspan x="${x}" dy="${i ? 20 : 0}">${l}</tspan>`).join('')}</text>`;
    });
    if (cfg.yTitle) s += `<text class="axis-title" transform="translate(18 ${p.t + ih / 2}) rotate(-90)" text-anchor="middle">${cfg.yTitle}</text>`;
    if (cfg.xTitle) s += `<text class="axis-title" x="${p.l + aw / 2}" y="${H - 6}" text-anchor="middle">${cfg.xTitle}</text>`;
    s += '</g>';
    if (cfg.ref) s += `<g class="refg"><line class="ref" x1="${p.l}" x2="${p.l + iw}" y1="${Y(cfg.ref.y)}" y2="${Y(cfg.ref.y)}"/><text class="ref-label" x="${X(cfg.ref.x ?? cfg.xMin)}" y="${Y(cfg.ref.y) - 14}">${cfg.ref.label}</text></g>`;
    cfg.series.forEach((se, i) => {
      const pts = se.values.map((v, j) => (v == null ? null : [X(cfg.x[j]), Y(v)])).filter(Boolean);
      s += `<g class="series s${i} m-${se.marker}" style="--c:${se.color};--c2:${se.line || se.color}">`;
      s += `<path class="ln ${se.dash ? 'dash' : ''}" d="M${pts.map((q) => q.join(' ')).join('L')}"/>`;
      pts.forEach((q) => { s += `<g class="pt">${MARK[se.marker](q[0], q[1], R)}</g>`; });
      if (se.extra != null) s += `<g class="pt ex">${MARK[se.marker](XE, Y(se.extra), R)}</g>`;
      s += '</g>';
    });
    (cfg.notes || []).forEach((n) => { s += `<text class="sig" x="${at(n.x) + (n.dx || 0)}" y="${Y(n.y) + (n.dy ?? -14)}" text-anchor="${n.anchor || 'middle'}">${n.text}</text>`; });
    if (cfg.legend) {
      const L = cfg.legend, rowH = 30, w = L.w || 230;
      s += `<g class="legend" transform="translate(${L.x} ${L.y})">`;
      if (L.box) s += `<rect class="lbox" x="0" y="0" width="${w}" height="${cfg.series.length * rowH + 16}"/>`;
      cfg.series.forEach((se, i) => {
        const y = 8 + rowH * i + rowH / 2;
        s += `<g class="series m-${se.marker}" style="--c:${se.color};--c2:${se.line || se.color}"><path class="ln ${se.dash ? 'dash' : ''}" d="M14 ${y}H58"/><g class="pt">${MARK[se.marker](36, y, R)}</g></g><text class="lg" x="70" y="${y + 6}">${se.name}</text>`;
      });
      s += '</g>';
    }
    s += '</svg>';
    el.innerHTML = s;
    el.__enter = (tl, t) => {
      tl.from($$('.axes, .legend', el), { autoAlpha: 0, duration: 0.6, stagger: 0.1 }, t)
        .from($$('.refg', el), { autoAlpha: 0, duration: 0.5 }, t + 0.3);
      cfg.series.forEach((se, i) => {
        const g = $(`.s${i}`, el), tt = t + 0.4 + i * 0.25;
        // A dashed line keeps its dash pattern: it fades in instead of being drawn (DrawSVG uses the dash array).
        tl.from($('.ln', g), se.dash ? { autoAlpha: 0, duration: 1, ease: 'power1.inOut' } : { drawSVG: '0%', duration: 1.3, ease: 'power2.inOut' }, tt)
          .from($$('.pt', g), { scale: 0, transformOrigin: '50% 50%', duration: 0.35, stagger: 0.08, ease: 'back.out(2)' }, tt + 0.15);
      });
      tl.from($$('.sig', el), { autoAlpha: 0, y: 6, duration: 0.4, stagger: 0.08 }, t + 0.4 + cfg.series.length * 0.25 + 1);
    };
  }

  /* Gridded bar chart in the style of the deck's charts (no values on the bars) */
  function gbars(el, cfg) {
    const W = cfg.w || 720, H = cfg.h || 440, hz = cfg.dir === 'h';
    const p = { l: hz ? 300 : 78, r: 24, t: cfg.legend ? 46 : 14, b: hz ? 44 : 50, ...cfg.pad };
    const iw = W - p.l - p.r, ih = H - p.t - p.b, n = cfg.bars.length, max = cfg.max;
    const V = (v) => (hz ? p.l + (v / max) * iw : p.t + ih - (v / max) * ih);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="chart gbar ${hz ? 'hz' : 'vt'}" role="img" aria-label="${cfg.label || ''}"><g class="axes">`;
    if (cfg.legend) s += `<rect class="bar" x="0" y="4" width="18" height="18" rx="3"/><text class="lg" x="28" y="20">${cfg.legend}</text>`;
    cfg.ticks.forEach((v) => {
      s += hz
        ? `<line class="grid" x1="${V(v)}" x2="${V(v)}" y1="${p.t}" y2="${p.t + ih}"/><text class="tick" x="${V(v)}" y="${p.t + ih + 28}" text-anchor="middle">${cfg.fmt ? cfg.fmt(v) : v}</text>`
        : `<line class="grid" x1="${p.l}" x2="${p.l + iw}" y1="${V(v)}" y2="${V(v)}"/><text class="tick" x="${p.l - 12}" y="${V(v) + 6}" text-anchor="end">${cfg.fmt ? cfg.fmt(v) : v}</text>`;
    });
    s += hz ? `<line class="base" x1="${p.l}" x2="${p.l}" y1="${p.t}" y2="${p.t + ih}"/>` : `<line class="base" x1="${p.l}" x2="${p.l + iw}" y1="${p.t + ih}" y2="${p.t + ih}"/>`;
    if (cfg.title) s += `<text class="axis-title" transform="translate(18 ${p.t + ih / 2}) rotate(-90)" text-anchor="middle">${cfg.title}</text>`;
    s += '</g>';
    cfg.bars.forEach((b, i) => {
      const band = (hz ? ih : iw) / n, mid = (hz ? p.t : p.l) + band * (i + 0.5), th = band * (cfg.fill || 0.7);
      if (hz) s += `<text class="cat" x="${p.l - 14}" y="${mid + 6}" text-anchor="end">${b.label}</text><rect class="bar" x="${p.l}" y="${mid - th / 2}" width="${V(b.value) - p.l}" height="${th}" rx="3"/>`;
      else s += `<rect class="bar" x="${mid - th / 2}" y="${V(b.value)}" width="${th}" height="${p.t + ih - V(b.value)}" rx="3"/><text class="cat" x="${mid}" y="${p.t + ih + 30}" text-anchor="middle">${b.label}</text>`;
    });
    s += '</svg>';
    el.innerHTML = s;
    el.__enter = (tl, t) => {
      tl.from($('.axes', el), { autoAlpha: 0, duration: 0.6 }, t)
        .from($$('.cat', el), { autoAlpha: 0, duration: 0.4, stagger: 0.08 }, t + 0.2)
        .from($$('rect.bar', el).slice(cfg.legend ? 1 : 0), hz ? { scaleX: 0, transformOrigin: '0% 50%', duration: 0.9, stagger: 0.12, ease: 'power3.out' }
          : { scaleY: 0, transformOrigin: '50% 100%', duration: 0.9, stagger: 0.2, ease: 'power3.out' }, t + 0.3);
    };
  }

  return { line, barsH, barsV, range, ring, counter, plot, gbars };
})();
