// Module 6: ΔH°rxn from enthalpies of formation, with the "via the elements" diagram (lecture 4, p. 26).

import { SPECIES, byId, eqText, sgn } from '../assets/thermo.js';

const $ = id => document.getElementById(id);
const IDS = ['propane', 'methane', 'hydrogen', 'glucose', 'thermite', 'haber', 'lime', 'no2', 'vapwater'];
const sel = $('hf-rxn');
sel.innerHTML = IDS.map(id => `<option value="${id}">${byId(id).name}</option>`).join('');

const fmt = (x, d = 2) => (x < 0 ? '−' : '') + Math.abs(x).toFixed(d);

function render() {
  const r = byId(sel.value);
  $('hf-eq').textContent = eqText(r.eq);
  let sR = 0, sP = 0;
  const rows = [];
  for (const [sp, c] of Object.entries(r.eq)) {
    const d = SPECIES[sp], contrib = c * d.H;
    if (c < 0) sR += -contrib; else sP += contrib;
    rows.push(`<tr${d.H === 0 ? ' class="off"' : ''}><td>${c < 0 ? 'reactant' : 'product'}: ${d.f}</td>` +
      `<td class="num">${fmt(d.H)}</td><td class="num">${c > 0 ? '+' : '−'} ${Math.abs(c)} × (${fmt(d.H)}) = ${sgn(contrib, 2)}</td></tr>`);
  }
  const dH = sP - sR;
  rows.push(`<tr><td><strong>ΔH°<sub>rxn</sub></strong> = Σ products − Σ reactants</td><td></td><td class="num"><strong>${sgn(dH, 2)} kJ</strong></td></tr>`);
  $('hf-table').innerHTML = rows.join('');
  $('hf-note').innerHTML = `Σ products − Σ reactants = (${fmt(sP)}) − (${fmt(sR)}) = <strong>${sgn(dH, 1)} kJ</strong>, ` +
    `${dH < 0 ? 'exothermic' : 'endothermic'}. ${r.note}${Object.keys(r.eq).some(sp => SPECIES[sp].H === 0) ? ' Greyed rows are elements in their standard state (ΔH°f = 0).' : ''}`;

  // levels: reactants at sR, elements at 0, products at sP
  const vals = [sR, 0, sP];
  const lo = Math.min(...vals), hi = Math.max(...vals), span = Math.max(hi - lo, 40);
  const W = 420, H = 300, top = 46, bot = 30;
  const Y = v => top + (hi + span * 0.04 - v) / (span * 1.08) * (H - top - bot);
  const lhs = eqText(r.eq).split(' → ');
  const lvl = (x1, x2, v, label, col = '--text') =>
    `<line x1="${x1}" y1="${Y(v)}" x2="${x2}" y2="${Y(v)}" stroke="var(${col})" stroke-width="3"/>` +
    `<text x="${(x1 + x2) / 2}" y="${Y(v) + (v === lo && v !== hi ? 17 : -8)}" font-size="12" text-anchor="middle" fill="var(--text)">${label}</text>`;
  const arrow = (x, v1, v2, col, label) => {
    const y1 = Y(v1), y2 = Y(v2), up = y2 < y1;
    if (Math.abs(y2 - y1) < 10) return '';
    return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2 + (up ? 9 : -9)}" stroke="var(${col})" stroke-width="3"/>` +
      `<path d="M${x - 6},${y2 + (up ? 10 : -10)} L${x},${y2} L${x + 6},${y2 + (up ? 10 : -10)} z" fill="var(${col})"/>` +
      `<text x="${x + 7}" y="${(y1 + y2) / 2 + 4}" font-size="12" font-weight="600" fill="var(${col})">${label}</text>`;
  };
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<text x="4" y="14" font-size="12" fill="var(--text-muted)">enthalpy ↑</text>`;
  s += lvl(10, 140, sR, lhs[0].length > 22 ? 'reactants' : lhs[0]);
  s += lvl(140, 280, 0, 'elements', '--plot-axis');
  s += lvl(280, 410, sP, lhs[1].length > 22 ? 'products' : lhs[1]);
  s += arrow(150, sR, 0, '--c1', sgn(-sR, 1));
  s += arrow(268, 0, sP, '--c0', sgn(sP, 1));
  s += arrow(400, sR, sP, dH < 0 ? '--bad' : '--good', '');
  s += `<text x="${W - 4}" y="14" font-size="13" font-weight="700" text-anchor="end" fill="var(${dH < 0 ? '--bad' : '--good'})">ΔH°rxn = ${sgn(dH, 1)} kJ</text>`;
  s += `<text x="4" y="${H - 6}" font-size="11" fill="var(--text-muted)"><tspan fill="var(--c1)">■</tspan> take apart  <tspan fill="var(--c0)">■</tspan> form products</text>`;
  s += '</svg>';
  $('hf-diagram').innerHTML = s;
}
sel.addEventListener('change', render);
render();
