// Module 5: molar mass and mass percent from a formula; grams ⇄ moles ⇄ particles; empirical formula from mass %.

import { AW, parseFormula, molarMass, formulaHTML } from '../assets/formula.js';
import { sig, sci, parseNumber } from '../assets/format.js';

const $ = id => document.getElementById(id);
const NA = 6.02214076e23;

/* ---------- molar mass and the mole map ---------- */
const EX = ['H2O', 'CO2', 'NaCl', 'C6H12O6', 'Ca(NO3)2', 'CuSO4·5H2O'];
$('mm-ex').innerHTML = EX.map(f => `<button class="btn" type="button" data-f="${f}">${formulaHTML(f)}</button>`).join('');
$('mm-ex').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $('mm-f').value = b.dataset.f; renderMM(); });

function box(x, y, w, title, val, col) {
  return `<rect x="${x}" y="${y}" width="${w}" height="62" rx="10" fill="color-mix(in srgb, var(${col}) 14%, var(--surface))" stroke="var(${col})"/>` +
    `<text x="${x + w / 2}" y="${y + 22}" text-anchor="middle" font-size="13" fill="var(--text-muted)">${title}</text>` +
    `<text x="${x + w / 2}" y="${y + 47}" text-anchor="middle" font-size="17" font-weight="700" fill="var(--text)">${val}</text>`;
}
function arrows(x1, x2, y, top, bot) {
  const m = (x1 + x2) / 2;
  return `<line x1="${x1 + 4}" y1="${y - 8}" x2="${x2 - 6}" y2="${y - 8}" stroke="var(--text-muted)" stroke-width="1.5" marker-end="url(#mm-ah)"/>` +
    `<line x1="${x2 - 4}" y1="${y + 8}" x2="${x1 + 6}" y2="${y + 8}" stroke="var(--text-muted)" stroke-width="1.5" marker-end="url(#mm-ah)"/>` +
    `<text x="${m}" y="${y - 14}" text-anchor="middle" font-size="12" fill="var(--text)">${top}</text>` +
    `<text x="${m}" y="${y + 24}" text-anchor="middle" font-size="12" fill="var(--text)">${bot}</text>`;
}

function renderMM() {
  const f = $('mm-f').value;
  let counts;
  try { counts = parseFormula(f); } catch (err) {
    $('mm-table').innerHTML = ''; $('mm-map').innerHTML = '';
    $('mm-note').textContent = err.message; return;
  }
  const M = molarMass(counts);
  $('mm-table').innerHTML = Object.entries(counts).map(([el, n]) =>
    `<tr><td>${el}</td><td class="num">${n}</td><td class="num">× ${AW[el]}</td><td class="num">${(n * AW[el]).toFixed(2)}</td><td class="num">${(100 * n * AW[el] / M).toFixed(2)} %</td></tr>`
  ).join('') + `<tr><td><strong>M</strong></td><td></td><td></td><td class="num"><strong>${M.toFixed(2)}</strong></td><td class="num">100 %</td></tr>`;

  const a = parseNumber($('mm-amt').value), u = $('mm-unit').value;
  if (!(a > 0)) { $('mm-note').textContent = 'Type a positive amount.'; return; }
  const n = u === 'g' ? a / M : u === 'mol' ? a : a / NA;
  const m = n * M, N = n * NA;
  const W = 520;
  let s = `<svg viewBox="0 0 ${W} 110" xmlns="http://www.w3.org/2000/svg"><defs><marker id="mm-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--text-muted)"/></marker></defs>`;
  s += box(4, 24, 130, 'mass m', `${sig(m, 4)} g`, '--c0');
  s += box(195, 24, 130, 'amount n', `${sig(n, 4)} mol`, '--c1');
  s += box(386, 24, 130, 'particles N', sci(N, 4), '--c2');
  s += arrows(134, 195, 55, `÷ M`, `× M`);
  s += arrows(325, 386, 55, `× N<tspan baseline-shift="sub" font-size="9">A</tspan>`, `÷ N<tspan baseline-shift="sub" font-size="9">A</tspan>`);
  s += `<text x="${W / 2}" y="106" text-anchor="middle" font-size="12" fill="var(--text-muted)">M = ${M.toFixed(2)} g/mol · N<tspan baseline-shift="sub" font-size="9">A</tspan> = 6.022 × 10²³ mol⁻¹</text>`;
  $('mm-map').innerHTML = s + '</svg>';
  const atoms = Object.entries(counts).map(([el, k]) => `${sci(N * k, 3)} ${el}`).join(', ');
  $('mm-note').innerHTML = `One formula unit of ${formulaHTML(f)} weighs ${M.toFixed(2)} u, so one mole weighs ${M.toFixed(2)} g. ` +
    `${sig(m, 4)} g is ${sig(n, 4)} mol, or ${sci(N, 4)} formula units. They contain ${atoms} atoms.` +
    (f.includes('·') || f.includes('.') ? ' The water in a hydrate (·5H₂O) is part of the solid and counts in the molar mass.' : '');
}
['mm-f', 'mm-amt', 'mm-unit'].forEach(id => $(id).addEventListener('input', renderMM));
renderMM();

/* ---------- empirical formula ---------- */
const EMP = [
  { name: 'Sugar (glucose)', el: [['C', 40.0], ['H', 6.71], ['O', 53.3]], M: 180.16 },
  { name: 'Vitamin C', el: [['C', 40.92], ['H', 4.58], ['O', 54.50]], M: 176.12 },
  { name: 'Iron oxide (rust)', el: [['Fe', 69.94], ['O', 30.06]], M: null },
  { name: 'Caffeine', el: [['C', 49.48], ['H', 5.19], ['N', 28.85], ['O', 16.48]], M: 194.19 },
];
let cur = EMP[0];
const pct = [];
$('emp-ex').innerHTML = EMP.map((e, i) => `<button class="btn${i ? '' : ' primary'}" type="button" data-i="${i}">${e.name}</button>`).join('');
$('emp-ex').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('emp-ex').querySelectorAll('button').forEach(x => x.classList.toggle('primary', x === b));
  load(EMP[+b.dataset.i]);
});
function load(e) {
  cur = e;
  pct.length = 0; e.el.forEach(([, p]) => pct.push(p));
  $('emp-M').value = e.M ?? '';
  renderEmp(true);
}
function renderEmp(rebuild) {
  const mol = cur.el.map(([el], i) => pct[i] / AW[el]);
  const small = Math.min(...mol);
  const ratio = mol.map(x => x / small);
  let k = 1;
  for (; k <= 8; k++) if (ratio.every(r => Math.abs(r * k - Math.round(r * k)) < 0.1)) break;
  if (k > 8) k = 1;
  const whole = ratio.map(r => Math.round(r * k));
  $('emp-k').textContent = k;
  const rows = cur.el.map(([el], i) =>
    `<tr><td>${el}</td><td><input class="text-input" style="width:5.5em;padding:3px 6px" data-i="${i}" type="text" inputmode="decimal" value="${pct[i]}" aria-label="mass percent of ${el}"></td>` +
    `<td class="num">${pct[i]} g</td><td class="num">${pct[i]} / ${AW[el]} = ${mol[i].toFixed(4)}</td><td class="num">${ratio[i].toFixed(3)}</td><td class="num"><strong>${whole[i]}</strong></td></tr>`);
  if (rebuild || !$('emp-table').querySelector('input')) $('emp-table').innerHTML = rows.join('');
  else cur.el.forEach((_, i) => {   // update every cell except the inputs, so typing is not interrupted
    const tr = $('emp-table').rows[i];
    const tmp = document.createElement('tbody'); tmp.innerHTML = rows[i];
    for (let c = 2; c < 6; c++) tr.cells[c].innerHTML = tmp.rows[0].cells[c].innerHTML;
  });
  const emp = cur.el.map(([el], i) => el + (whole[i] > 1 ? whole[i] : '')).join('');
  const Memp = molarMass(emp);
  const sum = pct.reduce((a, b) => a + b, 0);
  let note = `Empirical formula <strong>${formulaHTML(emp)}</strong> (${Memp.toFixed(2)} g/mol).`;
  if (k > 1) note += ` Dividing by the smallest gave a ratio with ${k === 2 ? 'a half' : k === 3 ? 'a third' : `1/${k}`}, so everything was multiplied by ${k}. Do not round 1.5 to 2!`;
  const M = parseNumber($('emp-M').value);
  if (M > 0) {
    const mult = M / Memp;
    const r = Math.round(mult);
    if (Math.abs(mult - r) < 0.05 && r >= 1) {
      const molf = cur.el.map(([el], i) => el + (whole[i] * r > 1 ? whole[i] * r : '')).join('');
      note += ` The molar mass is ${M} g/mol = ${r} × ${Memp.toFixed(2)}, so the molecular formula is <strong>${formulaHTML(molf)}</strong>.`;
    } else note += ` ${M} g/mol is not a whole multiple of ${Memp.toFixed(2)} g/mol: check the numbers.`;
  }
  if (Math.abs(sum - 100) > 0.5) note += ` <span style="color:var(--bad)">The percentages add up to ${sum.toFixed(2)} %, not 100 %.</span>`;
  $('emp-note').innerHTML = note;
}
$('emp-table').addEventListener('input', e => {
  const i = e.target.dataset.i; if (i === undefined) return;
  const v = parseNumber(e.target.value);
  if (v > 0) { pct[+i] = v; renderEmp(false); }
});
$('emp-M').addEventListener('input', () => renderEmp(false));
load(EMP[0]);
