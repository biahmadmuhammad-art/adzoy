/* Adzoy mosaic — the triangle pattern from the pack, drawn live on a canvas.
   Every visual state is a plain number on Mosaic.state, so GSAP timelines can tween it
   and the background moves in lock-step with each swipe. */
(function () {
  const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const PALETTES = {
    lav:  ['#F5F0FC', '#ECE3F8', '#F8EAF4', '#E8EFFA', '#FBF5FA', '#E7DEF5'],
    dark: ['#2B1738', '#341C45', '#3C2151', '#27132F', '#43255C', '#311A40'],
    pink: ['#FDE8F3', '#F7CDE5', '#EFB2DA', '#FFDCD6', '#FAEBF6', '#EBBCE1'],
    cyan: ['#E1F3FB', '#C4E8F7', '#A6DBF2', '#E8E0F7', '#D0ECF9', '#95D0EF'],
  };
  const P = Object.fromEntries(Object.entries(PALETTES).map(([k, v]) => [k, v.map(hex2rgb)]));

  // Seeded random so the pattern is identical on every load.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const state = { reveal: 0, dark: 0, split: 0, seam: 1.15, shift: 0, still: 0 };
  let canvas, ctx, W = 0, H = 0, dpr = 1, tris = [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function build() {
    W = innerWidth; H = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    seed = 7; tris = [];
    const s = Math.max(W, H) / 7.2, h = s * 0.866, j = s * 0.2;
    const rows = Math.ceil(H / h) + 4, cols = Math.ceil(W / s) + 4;
    const pts = [];
    for (let r = -2; r < rows; r++) {
      const row = [];
      for (let c = -2; c < cols; c++) {
        row.push([c * s + (r & 1) * s / 2 + (rand() - 0.5) * j, r * h + (rand() - 0.5) * j]);
      }
      pts.push(row);
    }
    const cx0 = W / 2, cy0 = H / 2, maxD = Math.hypot(cx0, cy0);
    const add = (a, b, c) => {
      const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3;
      tris.push({
        p: [a[0], a[1], b[0], b[1], c[0], c[1]], cx, cy,
        d: Math.hypot(cx - cx0, cy - cy0) / maxD,
        k: rand(), i: Math.floor(rand() * 6), depth: 0.6 + rand() * 0.4,
      });
    };
    for (let r = 0; r < pts.length - 1; r++) {
      const A = pts[r], B = pts[r + 1], even = ((r - 2) & 1) === 0;
      for (let c = 0; c < A.length - 1; c++) {
        if (even) { add(A[c], A[c + 1], B[c]); add(B[c], B[c + 1], A[c + 1]); }
        else { add(A[c], A[c + 1], B[c + 1]); add(B[c], B[c + 1], A[c]); }
      }
    }
  }

  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  function draw(now) {
    requestAnimationFrame(draw);
    if (document.hidden) return;
    const t = reduce || state.still ? 0 : now / 1000;
    const S = state;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Base fill: parallax opens thin gaps between facets; they read as darker seams, not holes.
    const base = (pal) => mix(mix(P.lav[1], pal, S.split), P.dark[3], S.dark).map((v) => v * 0.94 | 0);
    const b1 = base(P.pink[2]), b2 = base(P.cyan[2]), sx = S.split > 0 ? S.seam * W : W;
    ctx.fillStyle = `rgb(${b1})`; ctx.fillRect(0, 0, Math.min(W, sx), H);
    if (sx < W) { ctx.fillStyle = `rgb(${b2})`; ctx.fillRect(sx, 0, W - sx, H); }
    const edge = 0.26 * (1 - S.dark) + 0.07;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    for (const tr of tris) {
      const a = Math.min(1, Math.max(0, (S.reveal * 1.4 - tr.d - tr.k * 0.35) / 0.3));
      if (a <= 0) continue;
      const sc = 1 - Math.pow(1 - a, 3);
      const oy = -S.shift * tr.depth * H * 0.035;
      let col = P.lav[tr.i];
      if (S.split > 0) col = mix(col, (tr.cx < S.seam * W ? P.pink : P.cyan)[tr.i], S.split);
      if (S.dark > 0) col = mix(col, P.dark[tr.i], S.dark);
      const l = (0.5 + 0.5 * Math.sin(t * 0.7 - (tr.cx + tr.cy) * 0.0035 + tr.k * 6)) * (0.11 - S.dark * 0.05);
      col = mix(col, [255, 255, 255], l);
      const p = tr.p, x = tr.cx, y = tr.cy;
      ctx.beginPath();
      ctx.moveTo(x + (p[0] - x) * sc, y + (p[1] - y) * sc + oy);
      ctx.lineTo(x + (p[2] - x) * sc, y + (p[3] - y) * sc + oy);
      ctx.lineTo(x + (p[4] - x) * sc, y + (p[5] - y) * sc + oy);
      ctx.closePath();
      ctx.fillStyle = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${edge * a})`;
      ctx.stroke();
    }
  }

  window.Mosaic = {
    state,
    // Strength pages live in their pack colour: 0.1% pink, 0.3% cyan.
    world(w) {
      if (w === '01') Object.assign(state, { split: 1, seam: 1.15 });
      if (w === '03') Object.assign(state, { split: 1, seam: -0.15 });
    },
    init(el) {
      canvas = el; ctx = canvas.getContext('2d');
      build();
      let raf;
      addEventListener('resize', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(build); });
      requestAnimationFrame(draw);
    },
  };
})();
