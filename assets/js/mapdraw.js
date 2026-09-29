/* Draws the baked Middle East map (MEMAP) into an <svg>: neighbouring countries get different light
   tints, the five countries with prevalence data get their own colour. */
const MapDraw = {
  TINTS: ['#FBF9FE', '#EFE9FA', '#F8EDF6', '#E9EFFA', '#F3F0FB'],
  COLORS: { tr: '#D46AB9', lb: '#EDB2D9', iq: '#7C3FA8', sa: '#B03A93', ae: '#4A8FD4' },
  draw(svg) {
    const { w, h } = MEMAP, ns = 'http://www.w3.org/2000/svg';
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const land = svg.querySelector('.mm-land'), data = svg.querySelector('.mm-data');
    MEMAP.countries.forEach((c) => {
      const el = document.createElementNS(ns, 'path');
      el.setAttribute('d', c.d);
      if (c.id) {
        el.dataset.c = c.id;
        el.style.setProperty('--fill', this.COLORS[c.id]);
        data.appendChild(el);
      } else {
        el.style.fill = this.TINTS[c.t % this.TINTS.length];
        land.appendChild(el);
      }
    });
    return { w, h };
  },
};
