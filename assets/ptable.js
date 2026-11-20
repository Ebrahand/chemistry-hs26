// Clickable periodic table (Z = 1–86) used by topics 6 and 7.
//
//   const t = periodicTable(container, {
//     value: e => number | null,        // shading (null = grey "no data")
//     label: e => string,               // small text under the symbol
//     colour: e => '--c1',              // optional fixed colour per element (overrides the shading colour)
//     onSelect: e => {},
//     selected: 'Na',
//   });
//   t.update({ value, label, ... });  t.select('Cl');

import { ELEMENTS, cell, BY_SYM } from './elements.js';

export function periodicTable(root, opts) {
  let o = Object.assign({ shade: '--c1', selected: null }, opts);
  root.classList.add('ptable');
  root.setAttribute('role', 'group');
  const cells = {};
  for (const e of ELEMENTS) {
    const { row, col } = cell(e);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pt-cell';
    b.style.gridRow = row + (row === 8 ? 1 : 0);   // leave a gap row before the f-block
    b.style.gridColumn = col;
    b.innerHTML = `<span class="pt-z">${e.Z}</span><span class="pt-sym">${e.sym}</span><span class="pt-val"></span>`;
    b.addEventListener('click', () => select(e.sym, true));
    root.appendChild(b);
    cells[e.sym] = b;
  }
  const gap = document.createElement('div');
  gap.className = 'pt-gap'; gap.style.gridRow = 8; gap.style.gridColumn = '1 / span 18';
  root.appendChild(gap);

  function paint() {
    const vals = ELEMENTS.map(e => o.value ? o.value(e) : null).filter(v => typeof v === 'number');
    const lo = o.min ?? Math.min(...vals), hi = o.max ?? Math.max(...vals);
    for (const e of ELEMENTS) {
      const b = cells[e.sym];
      const v = o.value ? o.value(e) : null;
      const col = o.colour ? o.colour(e) : o.shade;
      let bg = '', fg = '';
      if (typeof v === 'number' && hi > lo) {
        const f = Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
        const pct = Math.round(8 + 82 * (o.invert ? 1 - f : f));
        bg = `color-mix(in srgb, var(${col}) ${pct}%, var(--surface))`;
        fg = pct > 55 ? 'var(--bg)' : '';
      } else if (o.colour && v !== null) {
        bg = `color-mix(in srgb, var(${col}) 30%, var(--surface))`;
      }
      b.style.background = bg;
      b.style.color = fg;
      b.classList.toggle('nodata', o.value && v === null && !o.colour);
      b.querySelector('.pt-val').textContent = o.label ? o.label(e) ?? '' : '';
      b.setAttribute('aria-label', `${e.name}${o.label && o.label(e) ? ', ' + o.label(e) : ''}`);
    }
  }
  function select(sym, fire = false) {
    if (o.selected && cells[o.selected]) { cells[o.selected].classList.remove('sel'); cells[o.selected].setAttribute('aria-pressed', 'false'); }
    o.selected = sym;
    if (sym && cells[sym]) { cells[sym].classList.add('sel'); cells[sym].setAttribute('aria-pressed', 'true'); }
    if (fire && o.onSelect) o.onSelect(BY_SYM[sym]);
  }
  for (const b of Object.values(cells)) b.setAttribute('aria-pressed', 'false');
  paint();
  if (o.selected) select(o.selected);
  return {
    update(next) { o = Object.assign(o, next); paint(); },
    select,
    cells,
  };
}
