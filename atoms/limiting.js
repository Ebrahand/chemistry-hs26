// Module 6: limiting reactant, first with countable molecules, then with grams; theoretical and percent yield.

import { molarMass, formulaHTML } from '../assets/formula.js';
import { sig } from '../assets/format.js';

const $ = id => document.getElementById(id);

/* ---------- molecule pictures ---------- */
// atoms of each molecule: [element, dx, dy] in units of the atom radius
const MOL = {
  H2: [['H', -0.8, 0], ['H', 0.8, 0]],
  O2: [['O', -0.85, 0], ['O', 0.85, 0]],
  N2: [['N', -0.85, 0], ['N', 0.85, 0]],
  H2O: [['O', 0, 0], ['H', -1.25, 0.8], ['H', 1.25, 0.8]],
  NH3: [['N', 0, 0], ['H', -1.35, 0.7], ['H', 1.35, 0.7], ['H', 0, -1.45]],
  CH4: [['C', 0, 0], ['H', -1.3, -0.75], ['H', 1.3, -0.75], ['H', -1.3, 0.85], ['H', 1.3, 0.85]],
  CO2: [['O', -1.7, 0], ['C', 0, 0], ['O', 1.7, 0]],
};
const SIZE = { H: 0.75, O: 1, N: 1, C: 1 };
const R = 7;
function molSVG(f, x, y) {
  return MOL[f].map(([el, dx, dy]) => `<circle cx="${(x + dx * R).toFixed(1)}" cy="${(y + dy * R).toFixed(1)}" r="${(R * SIZE[el]).toFixed(1)}" fill="var(--atom-${el})" stroke="var(--text)" stroke-width=".7"/>`).join('');
}

const PIC = [
  { re: [['H2', 2], ['O2', 1]], pr: [['H2O', 2]] },
  { re: [['N2', 1], ['H2', 3]], pr: [['NH3', 2]] },
  { re: [['CH4', 1], ['O2', 2]], pr: [['CO2', 1], ['H2O', 2]] },
];
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const uni = f => f.replace(/\d/g, d => SUB[d]);
const eqText = r => r.re.map(([f, n]) => `${n > 1 ? n + ' ' : ''}${uni(f)}`).join(' + ') + ' → ' + r.pr.map(([f, n]) => `${n > 1 ? n + ' ' : ''}${uni(f)}`).join(' + ');
$('lr-rxn').innerHTML = PIC.map((r, i) => `<option value="${i}">${eqText(r)}</option>`).join('');

function renderPic() {
  const r = PIC[+$('lr-rxn').value];
  const [[fa, va], [fb, vb]] = r.re;
  const a = +$('lr-a').value, b = +$('lr-b').value;
  $('lr-a-label').innerHTML = `${formulaHTML(fa)} molecules`; $('lr-b-label').innerHTML = `${formulaHTML(fb)} molecules`;
  $('lr-a-out').textContent = a; $('lr-b-out').textContent = b;
  const x = Math.min(Math.floor(a / va), Math.floor(b / vb));   // how many times the reaction runs
  const before = [[fa, a], [fb, b]];
  const after = [[fa, a - va * x], [fb, b - vb * x], ...r.pr.map(([f, v]) => [f, v * x])];
  const W = 540, colW = 250, cell = 40, perRow = 6;
  const rowsOf = list => list.reduce((t, [, n]) => t + Math.max(1, Math.ceil(n / perRow)), 0);
  const H = 40 + Math.max(rowsOf(before), rowsOf(after)) * cell + list2gap(before, after);
  function list2gap(p, q) { return Math.max(p.length, q.length) * 16; }
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  const panel = (x0, title, list) => {
    s += `<text x="${x0}" y="16" font-size="13" font-weight="700" fill="var(--text)">${title}</text>`;
    let y = 36;
    for (const [f, n] of list) {
      s += `<text x="${x0}" y="${y + 4}" font-size="12" fill="var(--text-muted)">${n} ${uni(f)}</text>`;
      y += 16;
      for (let i = 0; i < n; i++) s += molSVG(f, x0 + 18 + (i % perRow) * cell, y + Math.floor(i / perRow) * cell + 8);
      y += Math.max(1, Math.ceil(n / perRow)) * cell;
    }
  };
  panel(4, 'Before', before);
  s += `<text x="${colW + 14}" y="${H / 2}" font-size="26" fill="var(--text-muted)">⟶</text>`;
  panel(colW + 44, 'After', after.filter(([, n]) => n > 0).length ? after : [[fa, 0]]);
  $('lr-diagram').innerHTML = s + '</svg>';

  let note = `The reaction needs ${va} ${fa} for every ${vb} ${fb}. It can run ${x} time${x === 1 ? '' : 's'}. `;
  const leftA = a - va * x, leftB = b - vb * x;
  if (!a || !b) note = 'With one reactant missing, nothing happens.';
  else if (!leftA && !leftB) note += 'Both reactants are used up exactly: you mixed them in the ratio of the equation (a <em>stoichiometric</em> mixture).';
  else {
    const lim = Math.floor(a / va) <= Math.floor(b / vb) ? fa : fb;
    note += `<strong>${formulaHTML(lim)} is the limiting reactant</strong>; ${leftA ? `${leftA} ${formulaHTML(fa)}` : `${leftB} ${formulaHTML(fb)}`} ${leftA + leftB === 1 ? 'is' : 'are'} left over, unused.`;
    if ((lim === fa && a > b) || (lim === fb && b > a)) note += ' Notice: the limiting reactant is the one you have <em>more</em> of here. What counts is the amount per reaction.';
  }
  $('lr-note').innerHTML = note;
}
['lr-rxn', 'lr-a', 'lr-b'].forEach(id => $(id).addEventListener('input', renderPic));
renderPic();

/* ---------- grams ---------- */
const RX = [
  { re: [['H2', 2], ['O2', 1]], pr: [['H2O', 2]], main: 0, a: 10, b: 40 },
  { re: [['N2', 1], ['H2', 3]], pr: [['NH3', 2]], main: 0, a: 50, b: 8 },
  { re: [['CH4', 1], ['O2', 2]], pr: [['CO2', 1], ['H2O', 2]], main: 0, a: 16, b: 50 },
  { re: [['Al', 2], ['Cl2', 3]], pr: [['AlCl3', 2]], main: 0, a: 10, b: 30 },
  { re: [['Fe2O3', 1], ['CO', 3]], pr: [['Fe', 2], ['CO2', 3]], main: 0, a: 80, b: 40 },
];
$('lg-rxn').innerHTML = RX.map((r, i) => `<option value="${i}">${eqText(r)}</option>`).join('');

function renderG() {
  const r = RX[+$('lg-rxn').value];
  const [[fa, va], [fb, vb]] = r.re, [fp, vp] = r.pr[r.main];
  const ma = +$('lg-a').value, mb = +$('lg-b').value;
  const Ma = molarMass(fa), Mb = molarMass(fb), Mp = molarMass(fp);
  const na = ma / Ma, nb = mb / Mb;
  const xa = na / va, xb = nb / vb, x = Math.min(xa, xb);
  const limA = xa <= xb;
  const theo = x * vp * Mp;
  const excessLeft = limA ? (nb - x * vb) * Mb : (na - x * va) * Ma;
  const yPct = +$('lg-y').value, actual = theo * yPct / 100;
  $('lg-a-label').innerHTML = `Mass of ${formulaHTML(fa)}`; $('lg-b-label').innerHTML = `Mass of ${formulaHTML(fb)}`;
  $('lg-a-out').textContent = `${ma} g`; $('lg-b-out').textContent = `${mb} g`;
  $('lg-y-out').textContent = `${sig(actual, 3)} g`;

  // bars: how many "moles of reaction" each reactant could support
  const W = 520, H = 120, x0 = 120, bw = W - x0 - 70;
  const mx = Math.max(xa, xb) * 1.05;
  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  s += `<text x="0" y="14" font-size="12" fill="var(--text-muted)">mol of reaction each reactant could run (n ÷ coefficient)</text>`;
  [[fa, xa, '--c0', 40], [fb, xb, '--c1', 76]].forEach(([f, v, c, y]) => {
    s += `<text x="${x0 - 8}" y="${y + 15}" text-anchor="end" font-size="14" fill="var(--text)">${formulaHTML(f).replace(/<sub>(\d+)<\/sub>/g, '<tspan baseline-shift="sub" font-size="10">$1</tspan>')}</text>`;
    s += `<rect x="${x0}" y="${y}" width="${(v / mx) * bw}" height="22" rx="4" fill="var(${c})" opacity="${v === x ? 1 : 0.55}"/>`;
    s += `<text x="${x0 + (v / mx) * bw + 6}" y="${y + 16}" font-size="12" fill="var(--text)">${sig(v, 3)} mol</text>`;
  });
  s += `<line x1="${x0 + (x / mx) * bw}" y1="32" x2="${x0 + (x / mx) * bw}" y2="104" stroke="var(--text)" stroke-dasharray="4 3"/>`;
  $('lg-diagram').innerHTML = s + '</svg>';

  const rows = [
    [`n(${formulaHTML(fa)}) = m / M`, `${ma} g ÷ ${Ma.toFixed(2)} g/mol = ${sig(na, 3)} mol`],
    [`n(${formulaHTML(fb)}) = m / M`, `${mb} g ÷ ${Mb.toFixed(2)} g/mol = ${sig(nb, 3)} mol`],
    ['Limiting reactant', `<strong>${formulaHTML(limA ? fa : fb)}</strong>`],
    [`Theoretical yield of ${formulaHTML(fp)}`, `${sig(limA ? na : nb, 3)} mol × ${vp}/${limA ? va : vb} × ${Mp.toFixed(2)} g/mol = <strong>${sig(theo, 3)} g</strong>`],
    [`${formulaHTML(limA ? fb : fa)} left over`, `${sig(Math.max(0, excessLeft), 3)} g`],
    ['Percent yield', `${sig(actual, 3)} g ÷ ${sig(theo, 3)} g × 100 % = ${yPct} %`],
  ];
  $('lg-readout').innerHTML = rows.map(([a, b]) => `<tr><td>${a}</td><td class="num" style="white-space:normal">${b}</td></tr>`).join('');
  const lighter = ma < mb ? fa : fb;
  let note = `Compare moles divided by coefficients, never grams. `;
  if ((limA ? fa : fb) !== lighter && Math.abs(ma - mb) > 0.5) note += `Here ${formulaHTML(limA ? fa : fb)} is limiting even though you put in more grams of it: its molar mass is larger${(limA ? va : vb) > 1 ? ' and each reaction needs ' + (limA ? va : vb) : ''}. `;
  note += `Mass is conserved: the ${sig((limA ? ma : mb) + (limA ? mb - excessLeft : ma - excessLeft), 3)} g that react give ${sig((limA ? ma : mb) + (limA ? mb - excessLeft : ma - excessLeft), 3)} g of products.`;
  $('lg-note').innerHTML = note;
}
function loadG() { const r = RX[+$('lg-rxn').value]; $('lg-a').value = r.a; $('lg-b').value = r.b; renderG(); }
$('lg-rxn').addEventListener('change', loadG);
['lg-a', 'lg-b', 'lg-y'].forEach(id => $(id).addEventListener('input', renderG));
loadG();
