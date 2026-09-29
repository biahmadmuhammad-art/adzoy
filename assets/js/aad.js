/* AAD 2024 "Management of Acne Vulgaris" algorithm, rebuilt from the guideline figure.
   Recommendation strength per item: s = strong for, c = conditional for, ca = conditional against. */
const AAD = {
  topical: {
    title: 'Topical treatments', icon: 'layers',
    note: 'Multimodal therapy combining multiple mechanisms of action is recommended.',
    items: [
      ['s', 'Topical retinoids'],
      ['s', 'BP'],
      ['s', 'Topical antibiotics', 'Monotherapy is not recommended.'],
      ['s', 'Topical antibiotic & BP', null, 'fdc'],
      ['s', 'Topical retinoid & BP', null, 'fdc hl'],
      ['s', 'Topical retinoid & antibiotic', 'Concomitant use of BP can prevent the development of antibiotic resistance.', 'fdc'],
      ['c', 'Clascoterone'],
      ['c', 'Salicylic acid'],
      ['c', 'Azelaic acid'],
    ],
  },
  systemic: {
    title: 'Systemic antibiotics', icon: 'pill',
    note: 'Limit systemic antibiotic use when possible to reduce the development of antibiotic resistance and other antibiotic-associated complications. Use concomitant BP and other topical treatment.',
    items: [['s', 'Doxycycline'], ['c', 'Minocycline'], ['c', 'Sarecycline'], ['c', 'Doxycycline over azithromycin']],
  },
  hormonal: {
    title: 'Hormonal agents', icon: 'molecule',
    items: [
      ['c', 'Combined oral contraceptives'],
      ['c', 'Spironolactone', 'Potassium monitoring is of low usefulness in patients without risk factors for hyperkalemia (e.g., older age, medical comorbidities, medications).'],
      ['s', 'Intralesional corticosteroids', 'Adjuvant treatment for larger acne papules or nodules at risk of acne scarring or for rapid improvement in inflammation and pain.'],
    ],
  },
  iso: {
    title: 'Isotretinoin', icon: 'shield',
    items: [
      ['s', 'Isotretinoin', [
        'Patients with psychosocial burden or scarring should be considered candidates for isotretinoin.',
        'We recommend monitoring only LFT and lipids.',
        'Population-based studies have not identified increased risk of neuropsychiatric conditions or inflammatory bowel disease with isotretinoin.',
        'For persons of pregnancy potential, pregnancy prevention is mandatory.',
      ]],
      ['c', 'Daily dosing over intermittent dosing'],
      ['c', 'Either lidose-isotretinoin or standard isotretinoin'],
    ],
  },
  physical: {
    title: 'Physical modalities', icon: 'sparkle',
    items: [['ca', 'Pneumatic broadband light added to adapalene']],
  },
};
const AAD_KEY = { s: 'Strong recommendation in favor', c: 'Conditional recommendation in favor', ca: 'Conditional recommendation against' };

function aadBox(key) {
  const b = AAD[key];
  let fdcOpen = false;
  const rows = b.items.map(([r, name, notes, cls = '']) => {
    let pre = '';
    if (cls.includes('fdc') && !fdcOpen) { fdcOpen = true; pre = '<li class="grp">Fixed-dose combinations</li>'; }
    // Notes sit right under their treatment, as in the guideline figure.
    const nts = notes ? (Array.isArray(notes) ? notes : [notes]).map((n) => `<li class="nt">${n}</li>`).join('') : '';
    return `${pre}<li class="${r} ${cls}"><i class="dot"></i><span>${name}</span></li>${nts}`;
  }).join('');
  const note = b.note ? `<p class="bnote">${b.note}</p>` : '';
  return `<button class="abox abox-${key}" data-box="${key}"><h4><i data-icon="${b.icon}"></i>${b.title}</h4>${note}<ul>${rows}</ul></button>`;
}

function aadDetail(key) {
  const b = AAD[key];
  const rows = b.items.map(([r, name, notes]) => {
    const n = notes ? (Array.isArray(notes) ? notes : [notes]).map((x) => `<p>${x}</p>`).join('') : '';
    return `<li class="${r}"><i class="dot"></i><div><b>${name}</b><small>${AAD_KEY[r]}</small>${n}</div></li>`;
  }).join('');
  return `<p class="eyebrow">AAD Guidelines · Management of Acne Vulgaris (2024)</p><h3>${b.title}</h3>
    ${b.note ? `<p class="design" style="margin-bottom:1em">${b.note}</p>` : ''}<ul class="aad-detail">${rows}</ul>`;
}

function buildAAD(root) {
  root.querySelector('.atree-boxes').innerHTML =
    `<div class="col-l">${aadBox('topical')}${aadBox('physical')}</div><div class="col-r"><div class="trio">${aadBox('systemic')}${aadBox('hormonal')}${aadBox('iso')}</div></div>`;
  mount(root);
  $$('.abox', root).forEach((b) => b.addEventListener('click', () => Panel.show(aadDetail(b.dataset.box))));
  // Severity buttons light up the matching treatment path.
  $$('.sev', root).forEach((s) => s.addEventListener('click', () => {
    const on = root.dataset.sev === s.dataset.sev ? '' : s.dataset.sev;
    root.dataset.sev = on;
    $$('.sev', root).forEach((x) => x.classList.toggle('on', x.dataset.sev === on));
  }));
  const draw = () => aadLines(root);
  draw();
  document.fonts.ready.then(draw);
  addEventListener('resize', draw);
}

/* Connector lines from the severity nodes to the treatment boxes, measured from the layout. */
function aadLines(root) {
  // Layout offsets, not bounding boxes, so entrance transforms don't bend the lines.
  const wrap = root.closest('.wrap');
  const off = (el) => { let x = 0, y = 0; while (el && el !== wrap) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return [x, y]; };
  const [ox, oy] = off(root);
  const r = (sel, ctx = root) => { const el = $(sel, ctx), [x, y] = off(el); return { x: x - ox, y: y - oy, w: el.offsetWidth, h: el.offsetHeight }; };
  const mild = r('.sev-mild'), mod = r('.sev-mod'), top = r('.abox-topical'), base = r('.ab-main', wrap);
  const boxes = ['.abox-systemic', '.abox-hormonal', '.abox-iso'].map((s) => r(s));
  const mx = mild.x + mild.w / 2, my = mild.y + mild.h;
  const dx = mod.x + mod.w / 2, dy = mod.y + mod.h, jy = (dy + top.y) / 2 + 2;
  const tx = top.x + top.w * 0.78;
  // Baseline evaluation splits into the two severities.
  const bx = base.x + base.w / 2, by = base.y + base.h, sy = (by + mild.y) / 2;
  let d = `M${bx} ${by}V${sy} M${mx} ${sy}H${dx} M${mx} ${sy}V${mild.y} M${dx} ${sy}V${mod.y}`;
  d += ` M${mx} ${my}V${top.y}`;
  d += ` M${dx} ${dy}V${jy} M${tx} ${jy}H${boxes[2].x + boxes[2].w / 2} M${tx} ${jy}V${top.y}`;
  boxes.forEach((b) => { d += ` M${b.x + b.w / 2} ${jy}V${b.y}`; });
  $('.atree-lines', root).setAttribute('viewBox', `0 0 ${root.offsetWidth} ${root.offsetHeight}`);
  $$('.atree-lines path', root).forEach((p) => p.setAttribute('d', d));
  const dots = [[mx, mild.y], [dx, mod.y], [mx, top.y], [tx, top.y], ...boxes.map((b) => [b.x + b.w / 2, b.y])];
  $('.atree-lines g', root).innerHTML = dots.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5"/>`).join('');
}
